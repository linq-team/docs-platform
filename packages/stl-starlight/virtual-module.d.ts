declare module 'virtual:stl-starlight-virtual-module' {
  import type { CreateShikiHighlighterOptions } from '@astrojs/markdown-remark';
  import type { PropertySettingsType } from '@stainless-api/docs-ui/contexts';
  import type { StlStarlightMiddleware } from '@stainless-api/docs/plugin/MiddlewareTypes';
  import type { DocsLanguage } from '@stainless-api/docs-ui/routing';

  export const RESOLVED_API_REFERENCE_PATH: string;
  export const EXCLUDE_LANGUAGES: DocsLanguage[];
  export const DEFAULT_LANGUAGE: string;
  export const BREADCRUMB_CONFIG: {
    includeCurrentPage?: boolean;
  } | null;
  export const EXPAND_RESOURCES: boolean;
  export const HIGHLIGHT_THEMES: CreateShikiHighlighterOptions['themes'];
  export const CONTENT_PANEL_LAYOUT: 'double-pane' | 'single-pane';
  export const EXPERIMENTAL_COLLAPSIBLE_SNIPPETS: boolean | undefined;
  export const EXPERIMENTAL_COLLAPSIBLE_METHOD_DESCRIPTIONS: boolean | undefined;
  export const EXPERIMENTAL_REQUEST_BUILDER: boolean | undefined;
  export const PROPERTY_SETTINGS: PropertySettingsType;
  export const MIDDLEWARE: StlStarlightMiddleware;
  export const ENABLE_CONTEXT_MENU: boolean;
  export const CONTEXT_MENU_ENABLE_THIRD_PARTY: boolean;
  export const STAINLESS_PROJECT: string | undefined;
  export const LLMS_TXT_DESCRIPTION: string | null;
  export const LLMS_TXT_DETAIL_THRESHOLD: number;
}

declare module 'virtual:stl-docs-virtual-module' {
  import type { ButtonVariant } from '@stainless-api/ui-primitives';
  import type { AnchorHTMLAttributes } from 'react';
  import { FontPreloadFilter } from 'astro:assets';

  type Tab = {
    label: string;
    link: string;
    hidden?: boolean;
  };

  type FontConfig = {
    cssVariable: string;
    preload?: FontPreloadFilter;
  };

  export const HEADER_LINKS: {
    label: string;
    link: string;
    variant?: ButtonVariant;
    attrs?: AnchorHTMLAttributes<HTMLAnchorElement>;
  }[];
  export const TABS: Tab[];
  export const SPLIT_TABS_ENABLED: boolean;
  export const HEADER_LAYOUT: 'default' | 'stacked';
  export const ENABLE_CLIENT_ROUTER: boolean;
  export const API_REFERENCE_BASE_PATH: string;
  export const ENABLE_PROSE_MARKDOWN_RENDERING: boolean;
  export const ENABLE_CONTEXT_MENU: boolean;
  export const CONTEXT_MENU_ENABLE_THIRD_PARTY: boolean;
  export const RENDER_PAGE_DESCRIPTIONS: boolean;
  export const LINK_GROUP_TITLES_TO_OVERVIEW_PAGES: boolean;
  export const FONTS: {
    primary?: FontConfig;
    heading?: FontConfig;
    mono?: FontConfig;
    additional?: FontConfig[];
  };
  export const RENDER_CREDITS: boolean;
  export const SITE_TITLE: string;
}

declare module 'virtual:stl-docs-ai-chat' {
  export const AI_CHAT_HANDLER: import('./stl-docs/chat/docs-chat-handler').DocsChatHandler | undefined;
}

declare module 'virtual:stl-docs-ai-chat-examples' {
  import type { ExamplePrompt } from './stl-docs/chat/ui/types';

  export const examples: ExamplePrompt[] | undefined;
}

declare module 'virtual:stainless-apis-manifest' {
  import type { DocsLanguage } from '@stainless-api/docs-ui/routing';

  export type APIManifestEntry = {
    languages: {
      sdkJSONFilePath: string;
      language: DocsLanguage;
    }[];
  };

  export const api: APIManifestEntry;
}

declare module 'virtual:stl-starlight-reference-sidebars' {
  import type { DocsLanguage } from '@stainless-api/docs-ui/routing';
  import type { StarlightRouteData } from '@astrojs/starlight/route-data';

  export type GeneratedSidebarDef = {
    id: number;
    language: DocsLanguage;
    entries: StarlightRouteData['sidebar'];
  };

  export const sidebars: GeneratedSidebarDef[];
}

declare module 'virtual:stainless-docs/docs-og-image' {
  import type { StarlightUserConfig } from '@astrojs/starlight/types';

  export const LOGO: StarlightUserConfig['logo'];
  export const OG_IMAGE_OPTIONS: import('./stl-docs/og-image/config').OGImageConfig | undefined;
}

declare module 'virtual:stainless-docs/docs-og-image/components/OpenGraphImage' {
  const OpenGraphImage: typeof import('./stl-docs/og-image/components/OpenGraphImage').default;
  export default OpenGraphImage;
}

declare module 'virtual:stainless-docs/docs-og-image/components/OpenGraphFunctionSignature' {
  const OpenGraphFunctionSignature: typeof import('./stl-docs/og-image/components/OpenGraphFunctionSignature').default;
  export default OpenGraphFunctionSignature;
}

declare const __STLDOCS_HAS_API_REFERENCE__: boolean;
declare const __STLDOCS_ENABLE_AI_CHAT__: boolean;
