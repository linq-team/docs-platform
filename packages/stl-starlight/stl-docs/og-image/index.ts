import type { StarlightPlugin } from '@astrojs/starlight/types';
import type { NormalizedStainlessDocsConfig } from '../loadStlDocsConfig';
import { resolveSrcFile } from '../../resolveSrcFile';
import { resolve } from 'path';
import type { OGImageConfig } from './config';
import { buildVirtualModuleString } from '../../shared/virtualModule';

// The '\0' prefix tells Vite "this is a virtual module" and prevents it from being resolved again.
function resolveVirtualModuleId<T extends string>(id: T): `\0${T}` {
  return `\0${id}`;
}

const OG_IMAGE_DIR = '/stl-docs/og-image';

const stainlessComponentDefaults = {
  OpenGraphImage: resolveSrcFile(OG_IMAGE_DIR, 'components/OpenGraphImage.tsx'),
  OpenGraphFunctionSignature: resolveSrcFile(OG_IMAGE_DIR, 'components/OpenGraphFunctionSignature.tsx'),
};

function checkTakumiInstalled(): boolean {
  try {
    import.meta.resolve('takumi-js/response');
    return true;
  } catch {
    return false;
  }
}

export function ogImageStarlightPlugin(
  config: OGImageConfig | undefined,
  stainlessDocsConfig: NormalizedStainlessDocsConfig,
): StarlightPlugin {
  return {
    name: 'stainless-og-image',
    hooks: {
      'config:setup': ({ astroConfig, addRouteMiddleware, addIntegration, logger, command }) => {
        if (command !== 'build' && command !== 'dev') {
          return;
        }

        if (!checkTakumiInstalled()) {
          logger.error(
            'The "takumi-js" package is required to use OG image generation. ' +
              'Please install it: npm install takumi-js',
          );
          process.exit(1);
        }

        if (!astroConfig.site) {
          logger.warn('astro.config.site is not set. Open Graph images will not be generated.');
          return;
        }
        addRouteMiddleware({
          entrypoint: resolveSrcFile(OG_IMAGE_DIR, 'routes/add-og-image.ts'),
        });

        addIntegration({
          name: 'stainless-docs-og-image-astro-integration',
          hooks: {
            'astro:config:setup': ({ updateConfig, injectRoute, command, config: astroConfig }) => {
              const resolvePath = (id: string) =>
                JSON.stringify(id.startsWith('.') ? resolve(astroConfig.root.pathname, id) : id);

              const userComponents = Object.fromEntries(
                Object.entries(config?.components ?? {}).flatMap(([key, value]) =>
                  value !== undefined ? [[key, value]] : [],
                ),
              );

              const allComponents: Record<string, string> = {
                ...stainlessComponentDefaults,
                ...userComponents,
              };

              const modules = Object.fromEntries(
                Object.entries(allComponents).map(([name, path]) => [
                  `virtual:stainless-docs/docs-og-image/components/${name}`,
                  `export { default } from ${resolvePath(path)};`,
                ]),
              );

              const resolutionMap = Object.fromEntries(
                Object.keys(modules).map((key) => [resolveVirtualModuleId(key), key]),
              );

              const virtualId = `virtual:stainless-docs/docs-og-image`;

              updateConfig({
                vite: {
                  plugins: [
                    {
                      name: '@stainless-api/docs-og-image-vite',
                      resolveId(id) {
                        if (id in modules || id == virtualId) {
                          return resolveVirtualModuleId(id);
                        }
                      },
                      load(id) {
                        if (id === resolveVirtualModuleId(virtualId)) {
                          return buildVirtualModuleString({
                            LOGO: stainlessDocsConfig?.starlightPassThrough?.logo,
                            OG_IMAGE_OPTIONS: config,
                          });
                        }
                        const resolution = resolutionMap[id];
                        if (resolution) return modules[resolution];
                      },
                    },
                  ],
                },
              });

              injectRoute({
                pattern: `/og/[...slug].png`,
                entrypoint: resolveSrcFile(OG_IMAGE_DIR, 'routes/get-og-image.ts'),
                prerender: command === 'build',
              });

              if (stainlessDocsConfig.apiReference !== null) {
                const apiBasePath = stainlessDocsConfig.apiReference?.basePath ?? '/api';
                const normalizedBasePath = apiBasePath.replace(/^\/+|\/+$/g, '');

                injectRoute({
                  pattern: `/og/${normalizedBasePath}/[...slug].png`,
                  entrypoint: resolveSrcFile(OG_IMAGE_DIR, 'routes/get-api-reference-og-image.ts'),
                  prerender: command === 'build',
                });
              }
            },
          },
        });
      },
    },
  };
}
