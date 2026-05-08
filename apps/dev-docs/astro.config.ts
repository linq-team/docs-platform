// @ts-check
import { generateAPIReferenceItems, ReferenceSidebarConfigItem, stainlessDocs } from '@stainless-api/docs';
import { defineConfig, fontProviders } from 'astro/config';
import remarkHeadingId from 'remark-custom-heading-id';
// SSR adapter example
// import cloudflare from '@astrojs/cloudflare';

const BASE_PATH = '/docs';

function walkSidebarConfigItems(
  sidebar: ReferenceSidebarConfigItem[],
  fn: (item: ReferenceSidebarConfigItem) => void,
) {
  for (const item of sidebar) {
    fn(item);
    if (item.kind === 'group') {
      walkSidebarConfigItems(item.entries, fn);
    }
  }
}

// https://astro.build/config
export default defineConfig({
  base: BASE_PATH,
  // SSR options
  // adapter: cloudflare(),
  // output: 'server',

  vite: {
    server: {
      allowedHosts: ['.trycloudflare.com'],
    },
    ssr: {
      noExternal: ['@stainless-api/docs', '@stainless-api/docs-ui', '@stainless-api/ui-primitives'],
    },
  },
  site: 'https://example.com/',
  redirects: {
    '/test2': {
      destination: '/',
      status: 302,
    },
    '/test3': 'https://apple.com',
  },
  integrations: [
    stainlessDocs({
      apiReference: {
        stainlessProject: 'stainless-v0',
        contentPanel: {
          layout: 'double-pane',
        },
        experimentalCollapsibleSnippets: true,
        experimentalCollapsibleMethodDescriptions: true,
        // experimentalPrerender: false,
      },
      // experimental: {
      //   starlightCompat: {
      //     prerender: true,
      //   },
      // },
      favicon: '/favicon.ico',
      disable404Route: false,
      editLink: {
        baseUrl: 'https://github.com/stainless-api/stl-api-docs/tree/main/apps/dev-docs',
      },
      lastUpdated: true,
      title: 'Stainless SDKs',
      fonts: {
        additional: [
          {
            cssVariable: '--custom-font',
            provider: fontProviders.google(),
            name: 'BBH Bartle',
            display: 'swap',
          },
        ],
      },
      logo: {
        light: './src/assets/logo-light.svg',
        dark: './src/assets/logo-dark.svg',
        replacesTitle: true,
        alt: 'Stainless',
      },
      header: {
        layout: 'default',
        links: [
          {
            label: 'Dashboard',
            link: 'https://app.stainless.com',
            attrs: {
              target: '_blank',
            },
          },
          {
            label: 'Get started',
            link: 'https://example.com',
            attrs: {
              target: '_blank',
            },
          },
        ],
      },
      head: [
        {
          tag: 'script',
          content: `
            console.log('Hello from Astro custom head');
          `,
        },
      ],
      pagination: true,
      customCss: ['./src/styles/global.css'],
      // social: [
      //   {
      //     icon: 'github',
      //     label: 'GitHub',
      //     href: 'https://github.com/withastro/starlight',
      //   },
      // ],
      tabs: [
        {
          label: 'Guides',
          link: '/',
          sidebar: [
            {
              label: 'Getting started',
              items: ['', 'guides/configure'],
            },
            {
              label: 'Example Pages',
              items: [{ autogenerate: { directory: 'examples' } }],
            },
            {
              label: 'Other links',
              items: [
                {
                  label: 'Twitter',
                  link: 'https://twitter.com',
                },
                {
                  label: 'Google',
                  link: 'https://google.com',
                },
                {
                  label: 'Blog',
                  link: '/blog',
                },
              ],
            },
            ...generateAPIReferenceItems((sidebar, language) => {
              // console.dir(sidebar, { depth: null });
              for (const entry of sidebar) {
                entry.label = `${entry.label.toUpperCase()} ${language}`;
              }
              return sidebar.filter((entry) => {
                if (entry.kind === 'group' && entry.resourceGroupKey === '#/resources/projects') {
                  return true;
                }
                return false;
              });
            }),
          ],
        },
        {
          label: 'Reference',
          link: '/api',
          sidebar: [
            'reference/config',
            {
              label: 'Reference folder',
              items: [{ autogenerate: { directory: 'reference' } }],
            },
            'test_paginate_0',
            {
              label: 'Basic reference',
              items: generateAPIReferenceItems((sidebar, language) => {
                walkSidebarConfigItems(sidebar, (entry) => {
                  entry.label = `${entry.label} ${language}`;
                  if (entry.kind === 'method_page') {
                    entry.label = `${entry.metadata.methodName} ${language}`;
                  }
                });
                // return sidebar;
              }),
            },
            {
              label: 'API Reference 2',
              items: generateAPIReferenceItems({ includeSharedModels: true }, (sidebar) => {
                for (const entry of sidebar) {
                  if (entry.kind === 'group') {
                    entry.collapsed = true;
                  }
                }
                return sidebar.filter((entry) => {
                  if (entry.kind === 'group') {
                    return entry.resourceGroupKey !== '#/resources/projects';
                  }
                  return true;
                });
              }),
            },
            {
              label: 'Deeply nested thing',
              items: [
                {
                  label: 'I am nested',
                  items: [
                    {
                      label: 'Blog',
                      link: '/blog',
                    },
                    {
                      label: 'Google',
                      link: 'https://google.com',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Stainless Home',
          link: 'https://stainless.com',
        },
        {
          label: 'Splash',
          link: '/splash',
        },
      ],
      ogImage: {
        logo: './src/assets/logo-dark.png',
        theme: 'dark',
        backgroundImage: {
          src: './src/assets/og-background-logo.png',
          style: {
            height: '450px',
            width: '450px',
            top: '-63px',
            right: '-115px',
            opacity: 0.1,
          },
        },
      },
    }),
  ],
  markdown: {
    remarkPlugins: [remarkHeadingId],
  },
});
