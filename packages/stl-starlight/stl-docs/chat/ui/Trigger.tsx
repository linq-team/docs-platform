// TODO: move to components
import React, { useState } from 'react';
import { ArrowUpIcon, BotMessageSquareIcon } from 'lucide-react';
import clsx from 'clsx';
import { Transition } from 'motion';
import styles from './AiChat.module.css';
import { motion } from 'motion/react';

const MotionBotIcon = motion.create(BotMessageSquareIcon);

export default function AiChatTrigger({
  expanded,
  updateFocused,
  sendMessage,
  inputRef,
  borderRadius,
}: {
  expanded: boolean;
  updateFocused: (focused: boolean) => void;
  sendMessage: (question: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  borderRadius: number;
}) {
  const [empty, setEmpty] = useState(true);
  const [resetKey, setResetKey] = useState(0);

  const layoutTransition = {
    type: 'spring',
    mass: 0.7,
    stiffness: 275,
    damping: 20,
  } satisfies Transition;

  const crossBlurTransition = {
    delay: expanded ? 0.07 : 0,
    duration: 0.1,
    ease: 'easeInOut',
  } satisfies Transition;

  const [willChange, setWillChange] = useState(false);
  const willChangeStyle = willChange ? { willChange: 'transform' as const } : {};

  return (
    <form
      style={{ display: 'contents' }}
      action={(formData) => {
        const question = formData.get('question');
        if (typeof question === 'string' && question.trim().length) {
          sendMessage(question);
          setResetKey((k) => k + 1);
          setEmpty(true);
        }
      }}
    >
      <motion.label
        layout
        transition={layoutTransition}
        className={styles['trigger-outer']}
        style={{
          borderRadius: borderRadius + 1,
          boxShadow: '0 4px 12px -4px var(--shadow-color)',
          ...willChangeStyle,
        }}
        // set will-change when hovering the collapsed trigger
        onMouseEnter={() => {
          setWillChange(!expanded);
        }}
        onMouseLeave={() => setWillChange(false)}
      >
        <motion.div
          layout
          transition={layoutTransition}
          className={clsx(styles.trigger, expanded && styles.expanded)}
          style={{ borderRadius: borderRadius, '--border-radius': `${borderRadius}px`, ...willChangeStyle }}
        >
          {/* Bot icon is visible while closed */}
          <MotionBotIcon
            layout
            className={styles['bot-icon']}
            animate={{
              opacity: expanded ? 0 : 1,
              scale: expanded ? 0.75 : 1,
              filter: expanded ? 'blur(4px)' : 'blur(0px)',
            }}
            style={willChange ? { willChange: 'filter, transform' } : {}}
            transition={crossBlurTransition}
            aria-label="AI chat"
          />

          {/* Input & send button are visible while open */}
          <motion.div
            layout
            className={styles['expanded-contents']}
            initial={{ opacity: 0 }}
            animate={{
              opacity: expanded ? 1 : 0,
              filter: expanded ? 'blur(0px)' : 'blur(4px)',
            }}
            style={willChange ? { willChange: 'filter, transform' } : {}}
            transition={crossBlurTransition}
          >
            <motion.textarea
              layout
              transition={layoutTransition}
              name="question"
              style={willChangeStyle}
              rows={1}
              placeholder="Ask a question"
              // Keep track of whether the question is submittable
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setEmpty(e.target.value.trim().length === 0);
              }}
              // Submit on Cmd+Enter
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              // Update textarea height to fit content as user types
              ref={(el: HTMLTextAreaElement | null) => {
                inputRef.current = el;
                if (!el) return;
                const updateSize = () => {
                  el.style.height = 'auto';
                  el.style.height = `${el.scrollHeight}px`;
                };
                const ac = new AbortController();
                el.addEventListener('input', updateSize, { signal: ac.signal });
                updateSize();
                // in case the user focused it before we mounted
                if (document.activeElement === el) updateFocused(true);
                // Re-focus after remount (e.g., after form submission resets the key)
                if (expanded) el.focus();
                return () => ac.abort();
              }}
              // make the ref re-mount so we get a fresh height measurement after reset
              key={resetKey}
            />
            <motion.button
              layout
              type="submit"
              disabled={empty}
              transition={layoutTransition}
              style={willChangeStyle}
            >
              <ArrowUpIcon aria-label="Send" />
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.label>
    </form>
  );
}
