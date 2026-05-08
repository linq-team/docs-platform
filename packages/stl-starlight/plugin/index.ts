import react from '@astrojs/react';
import type { StarlightPlugin } from '@astrojs/starlight/types';
import type { AstroIntegration } from 'astro';
import { config } from 'dotenv';
import {
  getAPIReferencePlaceholderItemFromSidebarConfig,
  makePlaceholderItems,
} from './referencePlaceholderUtils';
import {
  SidebarConfigItemsBuilder,
  toStarlightSidebar,
  type GeneratedSidebarConfig,
  type ReferenceSidebarConfigGenerateOptions,
  type ReferenceSidebarConfigItem,
} from './sidebar-utils/sidebar-builder';
import {
  parseStarlightPluginConfig,
  type NormalizedStainlessStarlightConfig,
  type SomeStainlessStarlightUserConfig,
} from './loadPluginConfig';
import { buildVirtualModuleString, makeAsyncVirtualModPlugin } from '../shared/virtualModule';
import type * as StlStarlightVirtualModule from 'virtual:stl-starlight-virtual-module';
import path from 'path';
import fs from 'fs';
import { getSharedLogger } from '../shared/getSharedLogger';
import { resolveSrcFile } from '../resolveSrcFile';
import { mkdir, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';

import type * as ReferenceSidebarsVirtualModule from 'virtual:stl-starlight-reference-sidebars';
import type * as VirtualManifestModule from 'virtual:stainless-apis-manifest';

import {
  generateMissingRouteList,
  isSupportedLanguage,
  type DocsLanguage,
} from '@stainless-api/docs-ui/routing';
import { buildAlgoliaIndex } from './buildAlgoliaIndex';
import { flatSpecsList, loadAllSpecs, LoadedSpecs } from './specs/utils';

export { generateAPILink } from './generateAPIReferenceLink';
export type { ReferenceSidebarConfigItem };

config({
  quiet: true,
});

let sidebarIdCounter = 0;

const sidebarConfigs = new Map<number, GeneratedSidebarConfig>();

type PlaceholderEntries = {
  label: string;
  link: string;
  attrs?: any; // tbd what type this should be. I sort of don't want to say what it _really_ is, bc I don't want people messing with it
}[];

/**
 * This returns placeholder entries that indicate where the API reference items should be inserted.
 * The placeholder entries are replaced with the actual API reference items by the Stainless Starlight plugin.
 *
 * You may place the placeholders wherever you want your API reference items to be inserted.
 *
 * **IMPORTANT:** DO NOT MODIFY THESE ENTRIES. Doing so will prevent items from being inserted correctly.
 */

type SidebarTransformFn = GeneratedSidebarConfig['transformFn'];

export function generateAPIReferenceItems(
  options: ReferenceSidebarConfigGenerateOptions,
  fn?: SidebarTransformFn,
): PlaceholderEntries;
export function generateAPIReferenceItems(fn?: SidebarTransformFn): PlaceholderEntries;
export function generateAPIReferenceItems(
  arg1: SidebarTransformFn | ReferenceSidebarConfigGenerateOptions,
  arg2?: SidebarTransformFn,
): PlaceholderEntries {
  sidebarIdCounter++;
  const id = sidebarIdCounter;

  let fn: SidebarTransformFn | undefined;
  if (typeof arg1 === 'function') {
    fn = arg1;
  } else if (typeof arg2 === 'function') {
    fn = arg2;
  }

  let options: ReferenceSidebarConfigGenerateOptions | undefined;
  if (typeof arg1 === 'object') {
    options = arg1;
  }

  sidebarConfigs.set(id, { transformFn: fn, options });
  return makePlaceholderItems(id);
}

function stlStarlightAstroIntegration(pluginConfig: NormalizedStainlessStarlightConfig): AstroIntegration {
  const virtualId = `virtual:stl-starlight-virtual-module`;
  // The '\0' prefix tells Vite “this is a virtual module” and prevents it from being resolved again.
  const resolvedId = `\0${virtualId}`;
  let astroBase = '/';

  let specsPromise: Promise<LoadedSpecs> | undefined;
  async function specsPromiseResolved() {
    if (!specsPromise) throw new Error('Expected spec promise to exist');
    const result = await specsPromise;

    return result;
  }

  return {
    name: 'stl-starlight-astro',
    hooks: {
      'astro:config:setup': ({
        injectRoute,
        updateConfig,
        logger: localLogger,
        command,
        config: astroConfig,
        createCodegenDir,
      }) => {
        const logger = getSharedLogger({ fallback: localLogger });
        const projectDir = astroConfig.root.pathname;
        astroBase = astroConfig.base;

        specsPromise = loadAllSpecs(
          pluginConfig.loadSpecs({
            stainlessProject: pluginConfig.stainlessProject,
            branch: pluginConfig.branch,
            apiKey: pluginConfig.apiKey?.value ?? null,
            excludeLanguages: pluginConfig.excludeLanguages,
            logger,
            createCodegenDir,
          }),
        );

        const middlewareFileBase = path.join(projectDir, 'middleware.stainless');
        const middlewareFile = ['.tsx', '.ts']
          .map((ext) => middlewareFileBase + ext)
          .find((f) => fs.existsSync(f));

        let vmMiddlewareExport = 'export const MIDDLEWARE = {};';
        if (middlewareFile) {
          logger.debug(`Loading middleware from ${middlewareFile}`);
          vmMiddlewareExport = `export { default as MIDDLEWARE } from '${middlewareFile}';`;
        }

        injectRoute({
          pattern: `${pluginConfig.basePath}/[...slug]/index.md`,
          entrypoint: resolveSrcFile('/plugin/routes/markdown.ts'),
          prerender: pluginConfig.experimentalPrerender ? command === 'build' : false,
        });

        injectRoute({
          pattern: `${pluginConfig.basePath}/index.md`,
          entrypoint: resolveSrcFile('/plugin/routes/markdown.ts'),
          prerender: pluginConfig.experimentalPrerender ? command === 'build' : false,
        });

        const astroFile = command === 'build' ? 'DocsStatic' : 'Docs';
        injectRoute({
          pattern: `${pluginConfig.basePath}/[...slug]`,
          entrypoint: resolveSrcFile(`/plugin/routes/${astroFile}.astro`),
          prerender: pluginConfig.experimentalPrerender ? command === 'build' : false,
        });

        injectRoute({
          pattern: pluginConfig.basePath,
          entrypoint: resolveSrcFile('/plugin/routes/Overview.astro'),
          prerender: pluginConfig.experimentalPrerender ? command === 'build' : false,
        });

        if (pluginConfig.llmsTxt.enabled) {
          injectRoute({
            pattern: '/llms.txt',
            entrypoint: resolveSrcFile('/plugin/routes/llms.ts'),
            prerender: pluginConfig.experimentalPrerender ? command === 'build' : false,
          });
        } else {
          logger.info('LLMS.txt generation is disabled.');
        }

        updateConfig({
          vite: {
            plugins: [
              makeAsyncVirtualModPlugin<typeof ReferenceSidebarsVirtualModule>(
                'virtual:stl-starlight-reference-sidebars',
                async () => {
                  // we know specLoader exists here
                  const specs = await specsPromiseResolved();

                  const sidebars = [...sidebarConfigs.entries()]
                    // produce all { id, language } combos with the attached config
                    // flattens to one item per language * id combo
                    .flatMap(([id, config]) =>
                      flatSpecsList(specs)
                        .filter((res): res is typeof res & { language: DocsLanguage } =>
                          isSupportedLanguage(res.language),
                        )
                        .map((res) => ({
                          id,
                          config,
                          language: res.language,
                          sdkJson: res.sdkJson,
                        })),
                    )
                    // produce a sidebar for each
                    // later we will .find() the sidebar that matches the (id, language)
                    .map(({ id, config, language, sdkJson }) => {
                      const configItemsBuilder = new SidebarConfigItemsBuilder(
                        sdkJson,
                        language,
                        config.options,
                      );

                      let userSidebarConfig = configItemsBuilder.generateItems();
                      if (config.transformFn) {
                        const transformedSidebarConfig = config.transformFn(userSidebarConfig, language);
                        if (transformedSidebarConfig) userSidebarConfig = transformedSidebarConfig;
                      }

                      return {
                        id,
                        language,
                        // this has to run multiple times because it depends on the
                        // userSidebarConfig (which is per-id) and the language
                        entries: toStarlightSidebar({
                          basePath: path.posix.join(astroBase, pluginConfig.basePath),
                          spec: sdkJson,
                          entries: userSidebarConfig,
                          currentLanguage: language,
                        }),
                      };
                    });

                  return { sidebars };
                },
              ),
              makeAsyncVirtualModPlugin<typeof VirtualManifestModule>(
                'virtual:stainless-apis-manifest',
                async () => {
                  // this virtual module only resolves when the specs are loaded
                  // this prevents the SSR module from trying to read the spec file before it's generated
                  const specs = await specsPromiseResolved();

                  return {
                    api: {
                      languages: specs
                        .map((s) =>
                          s.languages
                            .filter(isSupportedLanguage)
                            .map((lang) => ({ language: lang, sdkJSONFilePath: s.filePath })),
                        )
                        .flat(),
                    },
                  };
                },
              ),
              {
                name: 'stl-starlight-vite',
                // TODO: eventually - re-add support for watching local input changes (eg. reloading when OAS/config files change)
                resolveId(id) {
                  if (id === virtualId) {
                    return resolvedId;
                  }
                },
                load(id) {
                  if (id === resolvedId) {
                    return [
                      buildVirtualModuleString({
                        RESOLVED_API_REFERENCE_PATH: path.posix.join(astroConfig.base, pluginConfig.basePath),
                        EXCLUDE_LANGUAGES: pluginConfig.excludeLanguages,
                        DEFAULT_LANGUAGE: pluginConfig.defaultLanguage,
                        BREADCRUMB_CONFIG: pluginConfig.breadcrumbs,
                        EXPAND_RESOURCES: pluginConfig.expandResources,
                        HIGHLIGHT_THEMES: pluginConfig.highlighting.themes,
                        CONTENT_PANEL_LAYOUT: pluginConfig.contentPanel.layout,
                        EXPERIMENTAL_COLLAPSIBLE_SNIPPETS: pluginConfig.experimentalCollapsibleSnippets,
                        EXPERIMENTAL_COLLAPSIBLE_METHOD_DESCRIPTIONS:
                          pluginConfig.experimentalCollapsibleMethodDescriptions,
                        PROPERTY_SETTINGS: pluginConfig.propertySettings,
                        ENABLE_CONTEXT_MENU: !!pluginConfig.contextMenu,
                        CONTEXT_MENU_ENABLE_THIRD_PARTY:
                          (typeof pluginConfig.contextMenu === 'object'
                            ? pluginConfig.contextMenu.thirdParty
                            : null) ?? true,
                        EXPERIMENTAL_REQUEST_BUILDER: pluginConfig.experimentalRequestBuilder,
                        STAINLESS_PROJECT: pluginConfig.stainlessProject,
                        LLMS_TXT_DESCRIPTION: pluginConfig.llmsTxt.description,
                        LLMS_TXT_DETAIL_THRESHOLD: pluginConfig.llmsTxt.detailThreshold,
                      } satisfies Omit<typeof StlStarlightVirtualModule, 'MIDDLEWARE'>),
                      vmMiddlewareExport,
                    ].join('\n');
                  }
                },
              },
            ],
          },
        });
      },
      'astro:build:done': async ({ dir, logger }) => {
        const dist = fileURLToPath(dir);
        const stainlessDir = path.join(dist, '_stainless');
        await mkdir(stainlessDir, { recursive: true });

        const manifest = {
          astroBase,
        };
        await writeFile(path.join(stainlessDir, 'stl-manifest.json'), JSON.stringify(manifest, null, 2));

        const loadedSpecs = await specsPromiseResolved();

        await buildAlgoliaIndex({
          loadedSpecs,
          logger,
        });

        // Generate a list of missing API routes to enable graceful handling of unimplemented SDK methods.
        // When users switch languages in the docs, some API methods may not be implemented in the target SDK.
        // Instead of showing a generic 404, we statically generate pages for these routes and mark them
        // in this file so Cloudflare can serve them with a 404 status. These pages display helpful information
        // about the missing method and provide links to SDKs where it is available.

        // TODO: (multi-spec) support multiple specs
        const spec = loadedSpecs[0]!.sdkJson;

        const missingRoutes = generateMissingRouteList({
          spec,
          basePath: path.posix.join(astroBase, pluginConfig.basePath),
        });
        await mkdir(stainlessDir, { recursive: true });
        await writeFile(
          path.join(stainlessDir, 'missing-routes.json'),
          JSON.stringify(missingRoutes, null, 2),
        );
      },
    },
  };
}

export function stainlessStarlight(someUserConfig: SomeStainlessStarlightUserConfig): StarlightPlugin {
  return {
    name: 'stl-starlight',
    hooks: {
      'config:setup': ({
        addIntegration,
        updateConfig,
        addRouteMiddleware,
        command,
        config: starlightConfig,
        astroConfig,
        logger: localLogger,
      }) => {
        if (command !== 'build' && command !== 'dev') {
          return;
        }

        const logger = getSharedLogger({ fallback: localLogger });

        const configParseResult = parseStarlightPluginConfig(someUserConfig, {
          command,
          base: astroConfig.base,
        });
        if (configParseResult.result === 'error') {
          const errorLines = configParseResult.message.split('\n');
          for (const line of errorLines) {
            logger.error(line);
          }
          process.exit(1);
        }

        const config = configParseResult.config;

        const isReactLoaded = astroConfig.integrations.find(({ name }) => name === '@astrojs/react');

        if (!isReactLoaded) {
          addIntegration(react());
        }

        if ('apiKey' in config) {
          if (!config.apiKey) {
            logger.info(`Stainless credentials not loaded`);
          } else if (config.apiKey.source === 'explicit-config') {
            logger.info(`Stainless credentials loaded from user config`);
          } else if (config.apiKey.source === 'environment-variable') {
            logger.info('Stainless credentials loaded from `STAINLESS_API_KEY` environment variable');
          } else if (config.apiKey.source === 'cli') {
            logger.info('Stainless credentials loaded from `stl` CLI');
          }
        }

        if (starlightConfig.sidebar) {
          // for pagination (https://starlight.astro.build/reference/configuration/#pagination) to work correctly
          // update the placeholder link to be correct
          for (const placeholder of getAPIReferencePlaceholderItemFromSidebarConfig(
            starlightConfig.sidebar,
          )) {
            if (placeholder && typeof placeholder === 'object' && 'link' in placeholder) {
              placeholder.link = config.basePath;
            }
          }
        }

        addIntegration(stlStarlightAstroIntegration(config));

        const expressiveCodeConfig =
          typeof starlightConfig.expressiveCode === 'object' ? starlightConfig.expressiveCode : {};

        const themes = expressiveCodeConfig.themes
          ? expressiveCodeConfig.themes
          : (['github-light', 'github-dark'] satisfies (typeof expressiveCodeConfig)['themes']);

        updateConfig({
          sidebar: starlightConfig.sidebar,
          ...(expressiveCodeConfig && {
            expressiveCode: {
              ...expressiveCodeConfig,
              themes,
            },
          }),
        });

        addRouteMiddleware({
          entrypoint: resolveSrcFile('/plugin/replaceSidebarPlaceholderMiddleware.ts'),
          order: 'post',
        });
      },
    },
  };
}

// Additional exports we want for Stainless <-> docs integration.
export { parseStainlessPath } from '@stainless-api/docs-ui/routing';
export { renderMarkdown } from '@stainless-api/docs-ui/markdown';
