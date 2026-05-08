import z from 'zod';

export const responseChunk = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    text: z.string(),
  }),
  z.object({
    type: z.literal('tool_use'),
    name: z.string(),
    input: z.record(z.string(), z.unknown()).optional(),
  }),
  z.object({
    type: z.literal('tool_result'),
    tool_use_id: z.string(),
    content: z.string(),
  }),
  z.object({
    type: z.literal('done'),
    span_id: z.string(),
  }),
  z.object({
    type: z.literal('start_session'),
    session_id: z.string(),
  }),
]);
export type ResponseChunk = z.infer<typeof responseChunk>;
