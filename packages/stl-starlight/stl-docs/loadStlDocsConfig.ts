import type { StainlessStarlightUserConfig } from '../plugin/loadPluginConfig';
import type { StarlightUserConfig } from '@astrojs/starlight/types';
import type { ButtonVariant } from '@stainless-api/ui-primitives';
import type { AnchorHTMLAttributes } from 'react';
import type starlight from '@astrojs/starlight';
import { normalizeFonts, type StlDocsFontConfig } from './fonts';
import type { ExamplePromptResponse } from './aiChatExamples';
import type { OGImageConfig } from './og-image/config';

type StarlightConfig = Parameters<typeof starlight>[0];

type SidebarEntry = Exclude<StarlightConfig['sidebar'], undefined>[number];

export type Defined<T> = T extends undefined ? never : T;

export type StarlightConfigDefined = Defined<StarlightUserConfig>;

export type StarlightSidebarConfig = StarlightConfig['sidebar'];

type PassThroughStarlightConfigOptions = Pick<
  StarlightConfigDefined,
  | 'title'
  | 'logo'
  | 'description'
  | 'tagline'
  | 'head'
  | 'defaultLocale'
  | 'customCss'
  | 'tableOfContents'
  | 'titleDelimiter'
  | 'disable404Route'
  | 'editLink'
  | 'favicon'
  | 'locales'
  | 'lastUpdated'
  | 'pagination'
  | 'sidebar'
  | 'expressiveCode'
>;

type ExperimentalStarlightCompatibilityConfig = Pick<
  StarlightConfigDefined,
  'components' | 'routeMiddleware' | 'plugins' | 'prerender' | 'pagefind'
>;

export type Tabs = {
  label: string;
  link: string;
  sidebar?: SidebarEntry[];
  /**
   * Whether to hide the tab in the tab bar.
   *
   * @default false
   */
  hidden?: boolean;
}[];

export type HeaderLink = {
  label: string;
  link: string;
  variant?: ButtonVariant;
  attrs?: AnchorHTMLAttributes<HTMLAnchorElement>;
};

export type StainlessDocsUserConfig = {
  apiReference?: StainlessStarlightUserConfig;
  tabs?: Tabs;
  header?: {
    layout?: HeaderLayout;
    links?: HeaderLink[];
  };
  disableCredits?: boolean;
  fonts?: StlDocsFontConfig;
  experimental?: {
    starlightCompat?: ExperimentalStarlightCompatibilityConfig;
    enableClientRouter?: boolean;
    /**
     * Disable markdown rendering for prose content. Only disable this if it is causing issues.
     *
     * @default false
     */
    disableProseMarkdownRendering?: boolean;
    disableStainlessProseIndexing?: boolean;
    aiChat?: { handlerEntrypoint: string; examples?: ExamplePromptResponse };
    /**
     * Whether to link group titles to overview pages. Note: overview pages must already be present in the sidebar for this to work.
     *
     * @default false
     */
    linkGroupTitlesToOverviewPages?: boolean;
  };
  /**
   * Whether to show the context menu with options like "Copy as Markdown" and "Open in ChatGPT".
   *
   * @default true
   */
  contextMenu?: boolean | { thirdParty?: boolean };

  /**
   * Whether to render page descriptions in prose page headers
   *
   * @default true
   */
  renderPageDescriptions?: boolean;
  /**
   * Enable and configure Open Graph image generation.
   *
   * Requires `takumi-js` to be installed as a dependency.
   */
  ogImage?: OGImageConfig;
} & PassThroughStarlightConfigOptions;

type HeaderLayout = 'default' | 'stacked';

function areSplitTabsEnabled(config: StainlessDocsUserConfig) {
  if (config.sidebar) {
    return false;
  }
  if (config.tabs?.length === 0) {
    return false;
  }

  const hasTabsWithSidebar = config.tabs?.some((tab) => tab.sidebar !== undefined);
  if (hasTabsWithSidebar) {
    return true;
  }

  return false;
}

function normalizeRouteMiddleware(userConfig: StainlessDocsUserConfig) {
  const entry = userConfig.experimental?.starlightCompat?.routeMiddleware;
  if (entry === undefined) {
    return [];
  }
  if (typeof entry === 'string') {
    return [entry];
  }
  return entry;
}

function normalizeSiteTitle(userConfig: StainlessDocsUserConfig) {
  if (typeof userConfig.title === 'string') {
    return userConfig.title;
  }
  if (typeof userConfig.title === 'object') {
    const firstValue = Object.values(userConfig.title)[0];
    if (typeof firstValue === 'string') {
      return firstValue;
    }
  }
  throw new Error('Site title provided in config is not valid.');
}

function normalizeConfig(userConfig: StainlessDocsUserConfig) {
  const splitTabsEnabled = areSplitTabsEnabled(userConfig);

  const configWithDefaults = {
    splitTabsEnabled,
    tabs: userConfig.tabs ?? [],
    head: userConfig.head ?? [],
    defaultLocale: userConfig.defaultLocale,
    customCss: userConfig.customCss ?? [],
    header: {
      layout: userConfig.header?.layout ?? 'default',
      links: userConfig.header?.links ?? [],
    },
    fonts: normalizeFonts(userConfig.fonts),
    starlightPassThrough: {
      tableOfContents: userConfig.tableOfContents,
      titleDelimiter: userConfig.titleDelimiter,
      title: userConfig.title,
      description: userConfig.description,
      tagline: userConfig.tagline,
      logo: userConfig.logo,
      favicon: userConfig.favicon,
      disable404Route: userConfig.disable404Route,
      editLink: userConfig.editLink,
      locales: userConfig.locales,
      lastUpdated: userConfig.lastUpdated,
      pagination: userConfig.pagination,
      prerender: userConfig.experimental?.starlightCompat?.prerender ?? true,
    },
    starlightCompat: {
      components: userConfig.experimental?.starlightCompat?.components ?? {},
      plugins: userConfig.experimental?.starlightCompat?.plugins ?? [],
      pagefind: userConfig.experimental?.starlightCompat?.pagefind ?? true,
      routeMiddleware: normalizeRouteMiddleware(userConfig),
    },
    enableClientRouter: userConfig.experimental?.enableClientRouter ?? false,
    apiReference: userConfig.apiReference ?? null,
    sidebar: userConfig.sidebar,
    enableStainlessProseIndexing:
      userConfig.experimental?.disableStainlessProseIndexing === true ? false : true,
    enableProseMarkdownRendering:
      userConfig.experimental?.disableProseMarkdownRendering === true ? false : true,
    contextMenu: userConfig.contextMenu ?? true,
    expressiveCode: userConfig.expressiveCode,
    renderPageDescriptions: userConfig.renderPageDescriptions ?? true,
    aiChat: userConfig.experimental?.aiChat,
    linkGroupTitlesToOverviewPages: userConfig.experimental?.linkGroupTitlesToOverviewPages ?? false,
    credits: !userConfig.disableCredits,
    siteTitle: normalizeSiteTitle(userConfig),
    ogImage: userConfig.ogImage ?? null,
  };

  return configWithDefaults;
}

export type NormalizedStainlessDocsConfig = ReturnType<typeof normalizeConfig>;

/*
 The goal of the code in this file is to take a user's config and normalize it.
 Specifically: we want a single complete config format used throughout the internals of the plugin.

 We've tried to avoid any config values being optional/undefined. To accomplish this:
 - Any optional config values should have their defaults set here: eg. basePath defaults to /api
 - If a field is only used in certain contexts, we make each context a discriminated union (see SDKJSONInputs)
 - We prefer empty arrays over undefined/null
*/
export function parseStlDocsConfig(userConfig: StainlessDocsUserConfig) {
  try {
    const config = normalizeConfig(userConfig);
    return {
      result: 'success' as const,
      config,
    };
  } catch (error) {
    return {
      result: 'error' as const,
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}
