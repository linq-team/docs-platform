import { z } from 'astro/zod';

export const stainlessDocsSchemaExtension = z.object({
  ogImageOptions: z
    .object({
      logo: z.string().optional(),
      theme: z.enum(['light', 'dark']).default('light'),
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
});
