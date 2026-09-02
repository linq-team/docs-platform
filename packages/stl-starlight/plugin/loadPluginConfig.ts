import path from 'path';
import { homedir } from 'os';
import { existsSync, readFileSync } from 'fs';

import type { CreateShikiHighlighterOptions } from '@astrojs/markdown-remark';
import type { DocsLanguage } from '@stainless-api/docs-ui/routing';
import type { PropertySettingsType } from '@stainless-api/docs-ui/contexts';

import { defaultSDKJSONLoader } from './specs/defaultSDKJSONLoader';
import { SDKJSONFilesLoaderFn as SDKJSONFilesLoaderFn } from './specs/utils';

type ApiKeySource = 'explicit-config' | 'environment-variable' | 'cli';

type LoadedApiKey = {
  value: string;
  source: ApiKeySource;
};

type AstroCommand = 'dev' | 'build' | 'preview' | 'sync';

type ContentLayout = 'double-pane' | 'single-pane';

type VersionUserConfig = {
  version: string;
  stainlessProject: string;
  branch: string;
};

type BreadcrumbUserConfig = {
  /**
   * Include the current page in the breadcrumb list.
   * Default: `false`
   */
  includeCurrentPage?: boolean;
};

export type StainlessStarlightUserConfig = {
  /**
   * Optional api key for Stainless API.
   * If not provided, we will handle Stainless auth via the `stl` CLI or look for the STAINLESS_API_KEY environment variable.
   * Precedence:
   * 1. Explicity `apiKey` option provided
   * 2. `STAINLESS_API_KEY` environment variable
   * 3. Login status from the `stl` CLI
   * 4. Error (no auth found)
   */
  apiKey?: string;

  /**
   * The slug of your Stainless project.
   */
  stainlessProject: string;

  /**
   * Optional function to provide your own loader for API reference data.
   */
  loadSDKJSONFiles?: SDKJSONFilesLoaderFn;

  /**
   * Optional list of versions to render in the API reference.
   */
  versions?: VersionUserConfig[];

  /**
   * Optional mount point for API reference docs.
   * Example: `/my-api` → docs available at `/my-api/…`.
   * @default `/api`
   */
  basePath?: string;

  /**
   * Optional list of languages to exclude from the API reference.
   * Example: `["python", "javascript"]`
   */
  excludeLanguages?: DocsLanguage[];

  /**
   * Optional language to treat as the default when the user hasn't selected one.
   * Example: `'python'`
   * @default 'http'
   */
  defaultLanguage?: DocsLanguage;

  /**
   * Configure breadcrumbs for API reference pages
   */
  breadcrumbs?: BreadcrumbUserConfig;

  /**
   * Optional setting that automatically expands the top-level sidebar resources when set to true.
   * When no value is provided, top-level resources automatically expand if the total number of
   * endpoints in the API is less than 20. You can explicitly set the value to `false` to prevent
   * that behavior.
   */
  expandResources?: boolean;

  /**
   * Options that control syntax highlighting for embedded code snippets in the API reference.
   */
  highlighting?: {
    /**
     * Optionally set the syntax highlighting theme to use for code snippets.
     * Defaults to Github Dark. Can accept any standard shiki syntax highlighting theme.
     */
    themes?: CreateShikiHighlighterOptions['themes'];
  };

  /**
   * Configure the content panel for API reference pages.
   */
  contentPanel?: {
    /**
     * Optional layout for the content panel.
     * @default 'double-pane'
     */
    layout?: ContentLayout;
  };

  /**
   * Configure the API reference property design
   */
  propertySettings?: PropertySettingsType;

  /**
   * Enable experimental collapsible code snippets. Snippets will be collapsed by default for
   * single-pane and mobile layouts.
   *
   * @default false
   */
  experimentalCollapsibleSnippets?: boolean;

  /**
   * Enable experimental collapsible method descriptions. Method descriptions will be
   * collapsed if their content exceeds a certain length.
   *
   * @default false
   */
  experimentalCollapsibleMethodDescriptions?: boolean;

  /**
   * Whether to show the context menu with options like "Copy as Markdown" and "Open in ChatGPT".
   *
   * @default true
   */

  contextMenu?: boolean | { thirdParty?: boolean };

  /** When set to true, enables the experimental request builder interface for testing API endpoints. */
  experimentalRequestBuilder?: boolean;

  /** Whether to prerender the api reference pages.
   *
   * @default true
   */
  experimentalPrerender?: boolean;

  /**
   * Configuration for the generated `/llms.txt` file.
   */
  llmsTxt?: {
    /**
     * Whether to disable the generated `/llms.txt` file.
     *
     * @default false
     */
    disabled?: boolean;
    /**
     * A short description of the site, used as the blockquote summary at the top of the file.
     * Falls back to the top-level Starlight `description` field if not set.
     */
    description?: string;
    /**
     * The maximum number of total routes (prose + API reference) at which the file switches
     * from compact mode (resources only) to detailed mode (resources and
     * methods).
     *
     * @default 2000
     */
    detailThreshold?: number;
  };
};

// TODO: eventually? re-add support for external spec servers
// export type ExternalSpecServerUserConfig = Omit<StainlessStarlightUserConfig, 'stainlessProject'> & {
//   externalSpecServerUrl: string;
// };

export type SomeStainlessStarlightUserConfig = StainlessStarlightUserConfig;

function parseAuthJson(authJsonStr: string) {
  let json: unknown;
  try {
    json = JSON.parse(authJsonStr);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return null;
  }

  if (typeof json !== 'object' || json === null) {
    return null;
  }
  if (!('access_token' in json)) {
    return null;
  }
  const accessToken = json['access_token'];
  if (typeof accessToken !== 'string') {
    return null;
  }
  return accessToken;
}

function loadApiKey(configValue: string | undefined): LoadedApiKey | null {
  if (typeof configValue === 'string') {
    return { value: configValue, source: 'explicit-config' };
  }
  if (process.env.STAINLESS_API_KEY) {
    return { value: process.env.STAINLESS_API_KEY, source: 'environment-variable' };
  }

  const homeDirPath = homedir();

  const authJsonPath = path.join(homeDirPath, '.config', 'stainless', 'auth.json');

  if (!existsSync(authJsonPath)) {
    return null;
  }

  const authJsonStr = readFileSync(authJsonPath, 'utf-8');
  const accessToken = parseAuthJson(authJsonStr);
  if (!accessToken) {
    return null;
  }

  return { value: accessToken, source: 'cli' };
}

/** @public but discouraged - used by cloudflare via relative import */
export function forceLoadStainlessCredentials(): LoadedApiKey {
  const v = loadApiKey(undefined);
  if (!v) {
    throw new Error(`Failed to load Stainless credentials.`);
  }
  return v;
}

type AstroOptions = {
  command: AstroCommand;
  base: string;
};

function normalizeConfig(partial: SomeStainlessStarlightUserConfig, astroOptions: AstroOptions) {
  const configWithDefaults = {
    basePath: partial.basePath ?? '/api',
    astroBase: astroOptions.base,
    excludeLanguages: partial.excludeLanguages ?? [],
    defaultLanguage: partial.defaultLanguage ?? 'http',
    breadcrumbs: {
      includeCurrentPage: partial.breadcrumbs?.includeCurrentPage ?? false,
    },
    expandResources: partial.expandResources ?? true,
    highlighting: {
      themes: partial.highlighting?.themes ?? {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
    contentPanel: {
      layout: partial.contentPanel?.layout ?? 'double-pane',
    },
    experimentalCollapsibleSnippets: partial.experimentalCollapsibleSnippets ?? false,
    experimentalCollapsibleMethodDescriptions: partial.experimentalCollapsibleMethodDescriptions ?? false,
    propertySettings: {
      types: partial.propertySettings?.types ?? 'rich',
      collapseDescription: partial.propertySettings?.collapseDescription ?? true,
      showTitle: partial.propertySettings?.showTitle ?? false,
      expandDepth: partial.propertySettings?.expandDepth ?? 0,
      includeModelProperties: partial.propertySettings?.includeModelProperties ?? true,
    },
    contextMenu: partial.contextMenu ?? true,
    experimentalRequestBuilder: partial.experimentalRequestBuilder ?? false,
    experimentalPrerender: partial.experimentalPrerender ?? true,
    stainlessProject: partial.stainlessProject,
    llmsTxt: {
      enabled: !partial.llmsTxt?.disabled,
      description: partial.llmsTxt?.description ?? null,
      detailThreshold: partial.llmsTxt?.detailThreshold ?? 2000,
    },
    apiKey: loadApiKey(partial.apiKey),
    loadSDKJSONFiles: partial.loadSDKJSONFiles ?? defaultSDKJSONLoader,
    branch: partial.versions?.[0]?.branch ?? 'main',
  };

  return configWithDefaults;
}

export type NormalizedStainlessStarlightConfig = ReturnType<typeof normalizeConfig>;

/*
 The goal of the code in this file is to take a user's config and normalize it.
 Specifically: we want a single complete config format used throughout the internals of the plugin.

 We've tried to avoid any config values being optional/undefined. To accomplish this:
 - Any optional config values should have their defaults set here: eg. basePath defaults to /api
 - If a field is only used in certain contexts, we make each context a discriminated union (see SDKJSONInputs)
 - We prefer empty arrays over undefined/null
*/
export function parseStarlightPluginConfig(
  partial: SomeStainlessStarlightUserConfig,
  astroOptions: AstroOptions,
) {
  try {
    const config = normalizeConfig(partial, astroOptions);
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
