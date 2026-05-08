import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { stainlessDocsSchemaExtension } from '@stainless-api/docs/schema-extension';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: stainlessDocsSchemaExtension,
    }),
  }),
};
