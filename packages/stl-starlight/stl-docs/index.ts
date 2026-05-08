import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import type { StarlightPlugin } from '@astrojs/starlight/types';
import { disableCalloutSyntaxStarlightPlugin } from './disableCalloutSyntax';

import type { AstroIntegration } from 'astro';

import { normalizeRedirects, type NormalizedRedirectConfig } from './redirects';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'fs';
import {
  parseStlDocsConfig,
  type Defined,
  type NormalizedStainlessDocsConfig,
  type StainlessDocsUserConfig,
  type StarlightConfigDefined,
  type StarlightSidebarConfig,
} from './loadStlDocsConfig';
import { buildVirtualModuleString } from '../shared/virtualModule';
import { resolveSrcFile } from '../resolveSrcFile';
import { stainlessDocsMarkdownRenderer } from './proseMarkdown/proseMarkdownIntegration';
import { setSharedLogger } from '../shared/getSharedLogger';
import { stainlessDocsVectorProseIndexing } from './proseDocSync';
import { stainlessStarlight } from '../plugin';
import { getFontRoles, flattenFonts } from './fonts';
import conditionalIntegration from '../shared/conditionalIntegration';
import { generateExamplesVirtualModule } from './aiChatExamples';
import { ogImageStarlightPlugin } from './og-image';

export * from '../plugin';

const COMPONENTS_FOLDER = '/stl-docs/components';

function stainlessDocsStarlightIntegration(config: NormalizedStainlessDocsConfig) {
  // We transform our tabs into a Starlight sidebar
  // This gives them all the built-in features of Starlight (eg. auto-generated entries by directory)
  // In our middleware, we pull the appropriate group for the current tab and remove the others
  let sidebar: Defined<StarlightSidebarConfig> = [];

  if (config.splitTabsEnabled) {
    config.tabs.forEach((tab, index) => {
      // force unwrap bc we know we have a sidebar
      sidebar.push({
        label: index.toString(),
        items: tab.sidebar ?? [],
      });
    });
  } else if (config.sidebar) {
    sidebar = config.sidebar;
  }

  type ComponentOverrides = StarlightConfigDefined['components'];
  const componentOverrides: ComponentOverrides = {
    Head: resolveSrcFile(COMPONENTS_FOLDER, './Head.astro'),

    PageFrame: resolveSrcFile(COMPONENTS_FOLDER, './PageFrame.astro'),
    TwoColumnContent: resolveSrcFile(COMPONENTS_FOLDER, './TwoColumnContent.astro'),

    Header: resolveSrcFile(COMPONENTS_FOLDER, './Header.astro'),
    ThemeProvider: resolveSrcFile(COMPONENTS_FOLDER, './ThemeProvider.astro'),
    ThemeSelect: resolveSrcFile(COMPONENTS_FOLDER, './ThemeSelect.astro'),

    Sidebar: resolveSrcFile(COMPONENTS_FOLDER, './sidebars/BaseSidebar.astro'),
    ContentPanel: resolveSrcFile(COMPONENTS_FOLDER, './ContentPanel.astro'),
    PageTitle: resolveSrcFile(COMPONENTS_FOLDER, './PageTitle.astro'),
    PageSidebar: resolveSrcFile(COMPONENTS_FOLDER, './PageSidebar.astro'),
    TableOfContents: resolveSrcFile(COMPONENTS_FOLDER, './TableOfContents.astro'),

    Footer: resolveSrcFile(COMPONENTS_FOLDER, './Footer.astro'),
    Pagination: resolveSrcFile(COMPONENTS_FOLDER, './pagination/Pagination.astro'),
  };

  const plugins: StarlightPlugin[] = [
    // Disable starlight callout syntax in favor of our own component
    disableCalloutSyntaxStarlightPlugin,
  ];

  if (config.apiReference) {
    plugins.push(
      stainlessStarlight({
        ...config.apiReference,
        contextMenu: config.contextMenu,
        experimentalPrerender:
          config.apiReference.experimentalPrerender === undefined
            ? config.starlightPassThrough.prerender
            : config.apiReference.experimentalPrerender,
      }),
    );
    componentOverrides.Sidebar = resolveSrcFile(COMPONENTS_FOLDER, './sidebars/SDKSelectSidebar.astro');
    componentOverrides.Search = resolveSrcFile('/plugin/components/search/Search.astro');
  }

  if (config.ogImage) {
    plugins.push(ogImageStarlightPlugin(config.ogImage, config));
  }

  plugins.push(...config.starlightCompat.plugins);

  // TODO: re-add once we figure out what to do with the client router
  // if (config.enableClientRouter) {
  //   // logger.info(`Client router is enabled`);
  //   componentOverrides.Head = '@stainless-api/docs/head';
  // } else {
  //   // logger.info(`Client router is disabled`);
  // }

  const userExpressiveCode = typeof config.expressiveCode === 'object' ? config.expressiveCode : {};

  return starlight({
    ...config.starlightPassThrough,
    pagefind: config.starlightCompat.pagefind,
    sidebar,
    components: {
      ...componentOverrides,
      ...config.starlightCompat.components,
    },
    head: [
      ...config.head,
      {
        tag: 'script',
        content: `
        function setupNavLinksInitial(){
          let mode = localStorage.getItem("stl-nav-links-mode");
          // initial guess
          if(mode === null){
            mode = window.innerWidth < 1000 ? "mobile" : "desktop";
          }
          document.documentElement.classList.add("stl-nav-links-mode-" + mode)
        }
        setupNavLinksInitial();
      `,
      },
    ],
    routeMiddleware: [
      ...config.starlightCompat.routeMiddleware,
      resolveSrcFile('/stl-docs/tabsMiddleware.ts'),
    ],
    customCss: [resolveSrcFile('/theme.css'), ...config.customCss],

    expressiveCode: {
      ...userExpressiveCode,
      themes: userExpressiveCode.themes ?? ['github-light', 'github-dark'],
      styleOverrides: {
        ...userExpressiveCode.styleOverrides,
        textMarkers: {
          insBackground: 'var(--stl-color-green-muted-background)',
          insBorderColor: 'var(--stl-color-green-border)',
          insDiffIndicatorColor: 'var(--stl-color-green-foreground-reduced)',

          delBackground: 'var(--stl-color-red-muted-background)',
          delBorderColor: 'var(--stl-color-red-border)',
          delDiffIndicatorColor: 'var(--stl-color-red-foreground-reduced)',

          markBackground: 'var(--stl-color-blue-muted-background)',
          markBorderColor: 'var(--stl-color-blue-border)',
          ...userExpressiveCode.styleOverrides?.textMarkers,
        },
      },
    },
    plugins,
  });
}

function stainlessDocsIntegration(
  config: NormalizedStainlessDocsConfig,
  apiReferenceBasePath: string | null,
): AstroIntegration {
  let redirects: NormalizedRedirectConfig | null = null;

  return {
    name: 'stl-docs-astro',
    hooks: {
      'astro:config:setup': ({ updateConfig, command, config: astroConfig }) => {
        // we only handle redirects for builds
        // in dev, Astro handles them for us
        if (command === 'build' && astroConfig.redirects) {
          redirects = normalizeRedirects(astroConfig.redirects);
        }

        const base = astroConfig.base ?? '/';
        const withBase = (link: string) =>
          /^([a-z][a-z0-9+.-]*:|\/\/)/.test(link) ? link : path.posix.join(base, link);

        let vmAiChatHandlerExport = 'export const AI_CHAT_HANDLER = undefined;';
        if (config.aiChat?.handlerEntrypoint) {
          const rawEntrypoint = config.aiChat.handlerEntrypoint;
          const handlerEntrypoint = rawEntrypoint.startsWith('file://')
            ? fileURLToPath(rawEntrypoint)
            : path.isAbsolute(rawEntrypoint)
              ? rawEntrypoint
              : path.resolve(fileURLToPath(astroConfig.root), rawEntrypoint);
          vmAiChatHandlerExport = `export { default as AI_CHAT_HANDLER } from '${handlerEntrypoint}';`;
        }

        const virtualModules = new Map<string, string>([
          [
            'virtual:stl-docs-virtual-module',
            buildVirtualModuleString({
              TABS: config.tabs.map((tab) => ({ ...tab, link: withBase(tab.link) })),
              SPLIT_TABS_ENABLED: config.splitTabsEnabled,
              HEADER_LINKS: config.header.links.map((link) => ({ ...link, link: withBase(link.link) })),
              HEADER_LAYOUT: config.header.layout,
              ENABLE_CLIENT_ROUTER: config.enableClientRouter,
              API_REFERENCE_BASE_PATH: apiReferenceBasePath ?? '/api',
              ENABLE_PROSE_MARKDOWN_RENDERING: config.enableProseMarkdownRendering,
              ENABLE_CONTEXT_MENU: !!config.contextMenu, // TODO: do not duplicate this between both virtual modules
              CONTEXT_MENU_ENABLE_THIRD_PARTY:
                (typeof config.contextMenu === 'object' ? config.contextMenu.thirdParty : null) ?? true,
              RENDER_PAGE_DESCRIPTIONS: config.renderPageDescriptions,
              FONTS: getFontRoles(config.fonts),
              LINK_GROUP_TITLES_TO_OVERVIEW_PAGES: config.linkGroupTitlesToOverviewPages,
              RENDER_CREDITS: config.credits,
              SITE_TITLE: config.siteTitle,
            }),
          ],
          ['virtual:stl-docs-ai-chat', vmAiChatHandlerExport],
        ]);
        if (config.aiChat) {
          virtualModules.set(
            'virtual:stl-docs-ai-chat-examples',
            generateExamplesVirtualModule(config.aiChat.examples),
          );
        }

        updateConfig({
          fonts: [...flattenFonts(config.fonts), ...(astroConfig?.fonts ?? [])],
          vite: {
            define: {
              __STLDOCS_HAS_API_REFERENCE__: !!config.apiReference,
              __STLDOCS_ENABLE_AI_CHAT__: !!config.aiChat,
            },
            plugins: [
              {
                name: 'stl-docs-virtual-modules',
                resolveId(id) {
                  // The '\0' prefix tells Vite "this is a virtual module" and prevents it from being resolved again.
                  if (virtualModules.has(id)) return `\0${id}`;
                },
                load(id) {
                  const bare = id.replace(/^\0/, '');
                  if (virtualModules.has(bare)) return virtualModules.get(bare);
                },
              },
            ],
          },
          build: {
            ...astroConfig.build,
            redirects: false,
          },
        });
      },
      'astro:build:done': ({ dir }) => {
        if (redirects !== null) {
          const stainlessDir = path.join(dir.pathname, '_stainless');
          mkdirSync(stainlessDir, { recursive: true });
          const outputPath = path.join(stainlessDir, 'redirects.json');
          writeFileSync(outputPath, JSON.stringify(redirects, null, 2), {
            encoding: 'utf-8',
          });
        }
      },
    },
  };
}

function sharedLoggerIntegration(): AstroIntegration {
  return {
    name: 'stainless',
    hooks: {
      'astro:config:setup': ({ logger }) => {
        setSharedLogger(logger);
      },
    },
  };
}

export function stainlessDocs(config: StainlessDocsUserConfig): AstroIntegration[] {
  const normalizedConfigResult = parseStlDocsConfig(config);
  if (normalizedConfigResult.result === 'error') {
    // TODO: would be good to use the astro logger somehow
    console.error(normalizedConfigResult.message);
    process.exit(1);
  }
  const normalizedConfig = normalizedConfigResult.config;

  // TODO: need to refactor this, but this allows us to get the base path for the API reference _if_ it exists
  // if it doesn't exist, the value of basePath is null.
  // the stl-starlight virtual module has base path, but it's not available when there's no API reference
  const hasApiReference = normalizedConfig.apiReference !== null;
  let apiReferenceBasePath: string | null = null;
  if (hasApiReference) {
    apiReferenceBasePath = normalizedConfig.apiReference?.basePath ?? '/api';
  }

  return [
    sharedLoggerIntegration(), // this **must** be first so it can set the shared logger used by our other integrations
    react(),
    stainlessDocsStarlightIntegration(normalizedConfig),
    stainlessDocsIntegration(normalizedConfig, apiReferenceBasePath),
    conditionalIntegration({
      condition: !config.experimental?.disableProseMarkdownRendering,
      integration: stainlessDocsMarkdownRenderer({ apiReferenceBasePath }),
      reason: 'disabled by experimental config "disableProseMarkdownRendering"',
    }),
    conditionalIntegration({
      condition: !config.experimental?.disableStainlessProseIndexing,
      integration: stainlessDocsVectorProseIndexing(normalizedConfig, apiReferenceBasePath),
      reason: 'disabled by experimental config "disableStainlessProseIndexing"',
    }),
  ];
}
