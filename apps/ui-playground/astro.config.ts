import { defineConfig } from 'astro/config';
import { stainlessDocs } from '@stainless-api/docs';

export default defineConfig({
  vite: {
    ssr: {
      noExternal: ['@stainless-api/docs', '@stainless-api/docs-ui', '@stainless-api/ui-primitives'],
    },
  },
  integrations: [
    stainlessDocs({
      title: 'UI Playground',
      customCss: ['./src/styles/custom.css'],
      contextMenu: true,
      tabs: [
        {
          label: 'UI Elements',
          link: '/',
          sidebar: [
            {
              label: 'Getting Started',
              items: [''],
            },
            {
              label: 'Prose Elements',
              items: [{ autogenerate: { directory: 'prose' } }],
            },
            {
              label: 'Mintlify Compatibility',
              items: [{ autogenerate: { directory: 'mintlify-compat' } }],
            },
            {
              label: 'Docs UI',
              items: [{ autogenerate: { directory: 'docs-ui' } }],
            },
          ],
        },
      ],
    }),
  ],
});
