import type { AssistantTextMessage, AssistantToolCallMessage, ChatMessage, UserMessage } from './ui/types';
import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { ResponseChunk } from './schemas';
import { DocsChatHandler } from './docs-chat-handler';

//
// Reducer
//

/**
 * Splice a new assistant message into a ChatMessage[] stream based on its respondingTo property.
 *
 * if two responses are streaming at once, we want to put all the responses to user Message A
 * before user message B
 */
function spliceNewMessage(messages: ChatMessage[], newMessage: Extract<ChatMessage, { role: 'assistant' }>) {
  // find the most recent assistant message that's responding to the same user message as we are
  let insertAfterIdx = messages.findLastIndex(
    (msg) =>
      (msg.role === 'assistant' && msg.respondingTo === newMessage.respondingTo) ||
      // if this is the first assistant message responding to this user message
      (msg.role === 'user' && msg.id === newMessage.respondingTo),
  );
  insertAfterIdx = insertAfterIdx === -1 ? messages.length - 1 : insertAfterIdx;
  return messages.toSpliced(insertAfterIdx + 1, 0, newMessage);
}

type ChatReducerAction =
  | { type: 'addUserMessage'; content: UserMessage['content']; id: string }
  | { type: 'beginAssistantMessage'; message: Omit<AssistantTextMessage, 'role' | 'isComplete'> }
  | { type: 'streamMessage'; id: string; newContent: string }
  | { type: 'completeMessage'; id: string }
  | { type: 'addAssistantToolCall'; message: Omit<AssistantToolCallMessage, 'role' | 'id'> }
  // a response potentially contains multiple messages / tool calls
  | { type: 'completeResponse'; respondingTo: UserMessage['id']; spanId: string }
  | { type: 'addError'; respondingTo: UserMessage['id']; errorMessage: string };

function chatReducer(state: ChatMessage[], action: ChatReducerAction) {
  if (action.type === 'addUserMessage') {
    return [...state, { role: 'user', content: action.content, id: action.id } satisfies ChatMessage];
  }

  if (action.type === 'beginAssistantMessage') {
    return spliceNewMessage(state, {
      role: 'assistant',
      id: action.message.id,
      respondingTo: action.message.respondingTo,
      messageType: action.message.messageType satisfies 'text',
      content: action.message.content,
      isComplete: false,
    });
  }

  if (action.type === 'streamMessage') {
    return state.map((msg) =>
      msg.id === action.id && 'content' in msg
        ? ({ ...msg, content: `${msg.content}${action.newContent}` } satisfies ChatMessage)
        : msg,
    );
  }

  if (action.type === 'completeMessage') {
    return state.map((msg) =>
      msg.id === action.id && msg.role === 'assistant' && msg.messageType === 'text'
        ? ({ ...msg, isComplete: true } satisfies ChatMessage)
        : msg,
    );
  }

  if (action.type === 'addAssistantToolCall') {
    return spliceNewMessage(state, {
      role: 'assistant',
      id: crypto.randomUUID(),
      messageType: action.message.messageType satisfies 'tool_use',
      respondingTo: action.message.respondingTo,
      toolName: action.message.toolName,
      input: action.message.input,
    });
  }

  if (action.type === 'completeResponse') {
    return spliceNewMessage(state, {
      role: 'assistant',
      id: crypto.randomUUID(),
      messageType: 'done',
      respondingTo: action.respondingTo,
      spanId: action.spanId,
    } satisfies Extract<ChatMessage, { role: 'assistant' }>);
  }

  if (action.type === 'addError') {
    return spliceNewMessage(state, {
      role: 'assistant',
      id: crypto.randomUUID(),
      messageType: 'error',
      respondingTo: action.respondingTo,
      errorMessage: action.errorMessage,
    });
  }

  return state;
}

//
// Consumable hook
//

export function useChat({ handler }: { handler: DocsChatHandler }) {
  // Used to clean up stray streaming requests on unmount (prevent setState on unmounted component)
  const abortControllerRef = useRef(new AbortController());
  useEffect(() => {
    abortControllerRef.current = abortControllerRef.current.signal.aborted
      ? new AbortController()
      : abortControllerRef.current;
    const ac = abortControllerRef.current;
    return () => ac.abort('Component unmounted');
  }, []);

  const [chatMessages, dispatch] = useReducer(chatReducer, []);

  /** Send a message and stream back the response in chat */
  const sendMessage = useCallback(
    async (question: string) => {
      const userMessageId = crypto.randomUUID();
      dispatch({ type: 'addUserMessage', content: question, id: userMessageId });

      let currentResponseId = crypto.randomUUID(); // for streaming text messages
      let lastChunkType: ResponseChunk['type'] | undefined = undefined;

      try {
        let chunk: ResponseChunk | undefined = undefined;
        let sawDone = false;
        for await (chunk of handler.generateResponse(
          {
            query: question,
            priorMessages: chatMessages.filter(
              (msg) => msg.role === 'user' || (msg.role === 'assistant' && msg.messageType === 'text'),
            ),
          },
          abortControllerRef.current.signal,
        )) {
          if (abortControllerRef.current.signal.aborted) break;

          // mark complete when text messages finish streaming
          if (lastChunkType === 'text' && chunk.type !== 'text') {
            dispatch({ type: 'completeMessage', id: currentResponseId });
          }

          if (chunk.type === 'done') {
            dispatch({ type: 'completeResponse', respondingTo: userMessageId, spanId: chunk.span_id });
            sawDone = true;
            // stop reading from the stream on done
            break;
          }

          if (chunk.type === 'text') {
            if (lastChunkType !== 'text') {
              // start a new text message
              currentResponseId = crypto.randomUUID();
              dispatch({
                type: 'beginAssistantMessage',
                message: {
                  content: chunk.text,
                  id: currentResponseId,
                  messageType: chunk.type,
                  respondingTo: userMessageId,
                },
              });
            } else {
              // continue the current message with the new content
              dispatch({ type: 'streamMessage', id: currentResponseId, newContent: chunk.text });
            }
          }

          if (chunk.type === 'tool_use') {
            dispatch({
              type: 'addAssistantToolCall',
              message: {
                respondingTo: userMessageId,
                messageType: chunk.type,
                toolName: chunk.name,
                input: chunk.input,
              },
            });
          }

          lastChunkType = chunk.type;
        }
        if (!chunk || lastChunkType === 'start_session') {
          dispatch({
            type: 'addError',
            respondingTo: userMessageId,
            errorMessage: 'No response received. Please try again.',
          });
        } else if (!sawDone && !abortControllerRef.current.signal.aborted) {
          // Generator exhausted without a `done` chunk — synthesize completion.
          if (lastChunkType === 'text') {
            dispatch({ type: 'completeMessage', id: currentResponseId });
          }
          dispatch({ type: 'completeResponse', respondingTo: userMessageId, spanId: crypto.randomUUID() });
        }
      } catch {
        dispatch({
          type: 'addError',
          respondingTo: userMessageId,
          errorMessage: 'Something went wrong. Please try again.',
        });
      }
    },
    [chatMessages, handler],
  );

  const rateMessage = handler.onRate
    ? async (spanId: string, rating: 'up' | 'down') => {
        try {
          await handler.onRate?.(spanId, { up: 1 as const, down: 0 as const }[rating]);
          return true;
        } catch {
          return false;
        }
      }
    : undefined;

  return { chatMessages, sendMessage, rateMessage };
}
