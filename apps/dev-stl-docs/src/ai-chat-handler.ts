import type { DocsChatHandler } from '@stainless-api/docs/chat';

const handler: DocsChatHandler = {
  async *generateResponse({ query }) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    yield { type: 'text' as const, text: `YOU SAID: ${query}` };
  },
  onRate: (spanId, score) => {
    console.log('onRate', spanId, score);
    return Promise.resolve({ success: true });
  },
};

export default handler;
