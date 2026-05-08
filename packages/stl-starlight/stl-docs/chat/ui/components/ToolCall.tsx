import { motion } from 'motion/react';

import type { AssistantToolCallMessage } from '../types';

import clsx from 'clsx';
import styles from '../AiChat.module.css';

export default function ToolCall({
  message,
}: {
  message: Pick<AssistantToolCallMessage, 'id' | 'toolName' | 'input'>;
}) {
  const firstStringArg = message.input
    ? Object.values(message.input).find((v): v is string => typeof v === 'string')
    : undefined;

  return (
    <motion.li
      layout="position"
      data-message-role="assistant"
      className={clsx(styles['chat-message'], styles['tool-use'])}
    >
      <p>
        Calling <code>{message.toolName}</code>
        {firstStringArg && (
          <>
            {' '}
            with <em>{firstStringArg}</em>
          </>
        )}
      </p>
    </motion.li>
  );
}
