import { use } from 'react';
import { motion } from 'motion/react';
import { BotMessageSquareIcon as BotIcon } from 'lucide-react';
import type { ExamplePrompt } from '../types';
import styles from '../AiChat.module.css';

export default function ChatEmpty({
  siteTitle,
  promptExamples: promptExamplesPromise,
  sendMessage,
}: {
  siteTitle?: string;
  promptExamples?: Promise<ExamplePrompt[] | undefined>;
  sendMessage: (question: string) => void;
}) {
  const promptExamples = promptExamplesPromise && use(promptExamplesPromise);

  return (
    <motion.div layout className={styles['chat-empty-state']}>
      <BotIcon />
      <h2>What can I help you with?</h2>

      {promptExamples?.length ? (
        <>
          <h3>Suggestions</h3>
          <ul>
            {promptExamples.map(({ shortPrompt, longPrompt, icon: Icon }) => (
              <li key={shortPrompt} className={styles['chat-example']}>
                <button type="button" onClick={() => sendMessage(longPrompt)}>
                  <Icon />
                  {shortPrompt}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>I can help answer questions about {siteTitle ?? 'this API'}. What do you want to build?</p>
      )}
    </motion.div>
  );
}
