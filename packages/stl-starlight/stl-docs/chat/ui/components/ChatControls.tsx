import type { Dispatch, SetStateAction } from 'react';
import { motion } from 'motion/react';

import { Button } from '@stainless-api/ui-primitives';
import { PictureInPictureIcon, PanelRightCloseIcon as PanelRightIcon, MinusIcon } from 'lucide-react';

import styles from '../AiChat.module.css';

export default function ChatControls({
  presentation,
  setPresentation,
  supportsPanel,
  setClosed,
}: {
  presentation: 'floating' | 'panel';
  setPresentation: Dispatch<SetStateAction<'floating' | 'panel'>>;
  supportsPanel: boolean;
  setClosed: (e: React.MouseEvent<HTMLElement>) => void;
}) {
  return (
    <motion.div layout className={styles['controls']}>
      {supportsPanel && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={{ panel: 'Switch to floating chat', floating: 'Switch to panel chat' }[presentation]}
          onClick={() => {
            setPresentation(presentation === 'floating' ? 'panel' : 'floating');
          }}
        >
          <Button.Icon
            icon={{ panel: PictureInPictureIcon, floating: PanelRightIcon }[presentation]}
            size={15}
          />
        </Button>
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label="Close chat"
        onClick={setClosed}
        data-ai-chat-hit-ignore
      >
        <Button.Icon icon={MinusIcon} size={15} />
      </Button>
    </motion.div>
  );
}
