import type { ChatMessage } from '../types';
import Message from './ChatMessage';
import MessageFeedbackButtons from './MessageFeedback';
import ToolCall from './ToolCall';

import { motion } from 'motion/react';

import styles from '../AiChat.module.css';
import { LoaderCircleIcon } from 'lucide-react';

export default function ChatLog({
  messages,
  rateMessage,
  responsePending = false,
}: {
  messages: ChatMessage[];
  rateMessage?: (spanId: string, rating: 'up' | 'down') => Promise<boolean>;
  responsePending?: boolean;
}) {
  const lastMessage = messages.at(-1);

  return (
    <motion.ul
      layout
      role="log"
      aria-live="polite"
      className={styles['message-log']}
      initial={{ opacity: 0, filter: `blur(4px)` }}
      animate={{ opacity: 1, filter: `blur(0px)` }}
    >
      {messages.map((msg) => {
        if (msg.role === 'user') {
          return (
            <Message key={msg.id} role="user">
              {msg.content}
            </Message>
          );
        }

        if (msg.role === 'assistant' && msg.messageType === 'text') {
          return (
            <Message key={msg.id} role={msg.role} isMarkdown isStreaming={!msg.isComplete}>
              {msg.content}
            </Message>
          );
        }

        if (msg.role === 'assistant' && msg.messageType === 'tool_use') {
          return <ToolCall key={msg.id} message={msg} />;
        }

        if (msg.role === 'assistant' && msg.messageType === 'done') {
          return (
            <MessageFeedbackButtons
              key={msg.id}
              spanId={msg.spanId}
              rateMessage={rateMessage}
              // all "text" responses to the given message
              messages={messages.flatMap((msg2) =>
                msg2.role === 'assistant' &&
                msg2.respondingTo === msg.respondingTo &&
                msg2.messageType === 'text'
                  ? msg2
                  : [],
              )}
            />
          );
        }

        if (msg.role === 'assistant' && msg.messageType === 'error') {
          return (
            <Message key={msg.id} role="error">
              {msg.errorMessage}
            </Message>
          );
        }

        return null;
      })}

      {lastMessage?.role === 'user' && responsePending && (
        <Message key={`${lastMessage.id}-response`} role="assistant">
          {'Thinking'.split('').map((char, i) => (
            <span key={i} className={styles['shimmer-letter']} style={{ '--i': i }}>
              {char}
            </span>
          ))}
          <LoaderCircleIcon className={styles['message-loader']} />
        </Message>
      )}
    </motion.ul>
  );
}
