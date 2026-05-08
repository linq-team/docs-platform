import { ResponseChunk } from './schemas';
export { responseChunk, type ResponseChunk } from './schemas';

export type DocsChatHandler = {
  generateResponse: (
    {
      query,
      priorMessages,
    }: {
      query: string;
      priorMessages: { role: 'user' | 'assistant'; content: string }[];
    },
    abortSignal: AbortSignal,
  ) => AsyncGenerator<ResponseChunk>;

  onRate?: (spanId: string, score: 0 | 1) => Promise<unknown>;
};
