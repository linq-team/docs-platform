import { motion } from 'motion/react';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useScrollToBottom } from './scroll-manager';
import { useChat } from '../hook';
import type { DocsChatHandler } from '../docs-chat-handler';

import ChatLog from './components/ChatLog';
import AiChatTrigger from './Trigger';
import ChatEmpty from './components/ChatEmpty';
import ChatControls from './components/ChatControls';
import { AI_CHAT_HANDLER } from 'virtual:stl-docs-ai-chat';

import styles from './AiChat.module.css';
import clsx from 'clsx';

const borderRadius = 16;

/** Remembers user preference but returns 'floating' if panel is not supported */
function usePresentation(supportsPanel: boolean) {
  const [presentation, setPresentation] = useState<'floating' | 'panel'>('floating');
  const appliedPresentation = supportsPanel ? presentation : 'floating';
  return [appliedPresentation, setPresentation] as const;
}

const examplesPromise = import('virtual:stl-docs-ai-chat-examples')
  .then((mod) => mod.examples)
  .catch(() => undefined);

export default function AiChat({ siteTitle }: { siteTitle?: string }) {
  if (!AI_CHAT_HANDLER) {
    return null;
  }
  return <AiChatInner siteTitle={siteTitle} handler={AI_CHAT_HANDLER} />;
}

function AiChatInner({ siteTitle, handler }: { siteTitle?: string; handler: DocsChatHandler }) {
  const { chatMessages, sendMessage, rateMessage } = useChat({
    handler,
  });

  // panel mode is supported only on larger viewports
  const supportsPanel = useSyncExternalStore(
    (cb) => {
      window.addEventListener('resize', cb);
      return () => window.removeEventListener('resize', cb);
    },
    () => window.innerWidth >= 968,
    () => false,
  );

  const baseRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  const [presentation, setPresentation] = usePresentation(supportsPanel);
  const expanded = focused || presentation === 'panel';

  // Manage “focus” state
  // prettier-ignore
  useEffect(() => {
    const ac = new AbortController();
    // “focus” in/out with click
    window.addEventListener('click', (e) => {
      if (!(e.target instanceof Element) || !baseRef.current || !document.contains(e.target)) return;
      // clicks on elements with this attribute shouldn’t change focus state
      // e.g. clicking minimize button shouldn’t cause the chat to _become_ focused
      if (e.target.closest('[data-ai-chat-hit-ignore]')) return;
      const hit = baseRef.current.contains(e.target);
      setFocused(hit);
    }, { signal: ac.signal });
    // leave with escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        setFocused(false);
        setPresentation('floating');
        inputRef.current?.blur(); // this is the one case where the input won’t have already lost focus
      }
    }, { signal: ac.signal });

    // record focus state when our chat elements receive focus
    // unfocus when another element outside of our component gets focus (incl. by keyboard)
    document.addEventListener('focusin', (e) => {
      if (!(e.target instanceof Element) || !baseRef.current || !document.contains(e.target)) return;
      setFocused(baseRef.current.contains(e.target));
    }, { signal: ac.signal });
    return () => ac.abort();
  }, [setPresentation]);

  const [pendingResponses, setPendingResponses] = useState(0);
  const handleSendMessage = useCallback(
    (q: string) => {
      setPendingResponses((p) => p + 1);
      sendMessage(q)
        .catch(() => {})
        .finally(() => {
          setPendingResponses((p) => p - 1);
        });
    },
    [sendMessage],
  );

  // scroll to bottom when new messages come in
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollContentsRef = useRef<HTMLDivElement>(null);
  useScrollToBottom(
    scrollAreaRef,
    scrollContentsRef,
    // deps to re-run scroll
    useMemo(() => [chatMessages, presentation], [chatMessages, presentation]),
  );

  return (
    <div className={clsx(styles['outer-wrapper'], styles[`presentation-${presentation}`])} ref={baseRef}>
      <AiChatTrigger
        expanded={expanded}
        updateFocused={setFocused}
        sendMessage={handleSendMessage}
        inputRef={inputRef}
        borderRadius={borderRadius}
      />

      <motion.div
        layout
        className={styles['chat-area-container']}
        variants={{
          floating: { borderRadius: borderRadius + 1, '--shadow-color': 'var(--base-shadow-color)' },
          panel: { borderRadius: 0, '--shadow-color': 'transparent' },
        }}
        animate={presentation}
        style={{
          display: expanded ? 'flex' : 'none',
          boxShadow: '0 8px 20px -8px var(--shadow-color)',
        }}
      >
        <motion.div
          layout
          className={clsx(styles['chat-area'], 'scrolls-up')}
          variants={{ floating: { borderRadius }, panel: { borderRadius: 0 } }}
          animate={presentation}
          ref={scrollAreaRef}
        >
          <div className={styles['chat-scroll-contents']} ref={scrollContentsRef}>
            <ChatControls
              presentation={presentation}
              setPresentation={(p) => {
                setPresentation(p);
                inputRef.current?.focus();
              }}
              supportsPanel={supportsPanel}
              setClosed={() => {
                setFocused(false);
                setPresentation('floating');
              }}
            />
            {chatMessages.length > 0 ? (
              <ChatLog
                messages={chatMessages}
                rateMessage={rateMessage}
                responsePending={pendingResponses > 0}
              />
            ) : (
              <Suspense fallback={null}>
                <ChatEmpty
                  siteTitle={siteTitle}
                  promptExamples={examplesPromise}
                  sendMessage={handleSendMessage}
                />
              </Suspense>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
