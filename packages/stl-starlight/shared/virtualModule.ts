import type { ViteUserConfig } from 'astro';

type VitePlugin = NonNullable<ViteUserConfig['plugins']>[number];

export function buildVirtualModuleString<T extends Record<string, unknown>>(vars: T) {
  return Object.entries(vars)
    .map(([key, value]) => {
      return `export const ${key} = ${JSON.stringify(value)};`;
    })
    .join('\n');
}

export function makeAsyncVirtualModPlugin<T extends Record<string, unknown>>(
  bareId: string,
  contentLoader: () => Promise<T | string>,
): VitePlugin {
  return {
    name: `stl-virtual-module-loader-${bareId}`,
    resolveId(id) {
      // The '\0' prefix tells Vite “this is a virtual module” and prevents it from being resolved again.
      if (id === bareId) {
        return `\0${bareId}`;
      }
    },
    async load(id) {
      if (id === `\0${bareId}`) {
        const content = await contentLoader();
        if (typeof content === 'string') {
          return content;
        }
        return buildVirtualModuleString(content);
      }
    },
  };
}
