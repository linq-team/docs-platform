// @ts-check
import { generateAPIReferenceItems, stainlessDocs } from '@stainless-api/docs';
import { generateSpecFromStrings, LanguageGenerateQuery } from '@stainless/sdk-json/spec';
import { defineConfig } from 'astro/config';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

// This is a sample function that loads configs from a folder and generates a spec
async function loadSpec(folderName: string, outputFolder: string, languages: LanguageGenerateQuery) {
  const dirPath = path.join(import.meta.dirname, 'sample-configs', folderName);
  const [openapi, stainlessConfig] = await Promise.all([
    readFile(path.join(dirPath, 'openapi.yml'), 'utf8'),
    readFile(path.join(dirPath, 'stainless.yml'), 'utf8'),
  ]);

  const spec = await generateSpecFromStrings({
    oasStr: openapi,
    configStr: stainlessConfig,
    versionInfo: null,
    stainlessProject: folderName,
    languageOverrides: languages,
  });

  const filePath = path.join(outputFolder, `${folderName}.json`);

  await writeFile(filePath, JSON.stringify(spec));

  return {
    filePath,
    languages: spec.languages,
    sdkJson: spec.sdkJson,
  };
}

const USE_CUSTOM_SPEC_LOADER = true;
// const USE_CUSTOM_SPEC_LOADER = false;

// https://astro.build/config
export default defineConfig({
  vite: {
    ssr: {
      noExternal: ['@stainless-api/docs', '@stainless-api/docs-ui', '@stainless-api/ui-primitives'],
    },
  },
  integrations: [
    stainlessDocs({
      title: 'Stl Docs site',
      apiReference: {
        stainlessProject: 'stainless-v0',
        experimentalRequestBuilder: true,
        propertySettings: {
          collapseDescription: false,
        },
        loadSpecs: USE_CUSTOM_SPEC_LOADER
          ? async ({ createCodegenDir }) => {
              const specsDirectory = path.join(createCodegenDir().pathname, 'my_specs');

              await mkdir(specsDirectory, { recursive: true });

              const [petStoreSpec, stainlessV0Spec] = await Promise.all([
                loadSpec('pet-store', specsDirectory, {
                  mode: 'only',
                  list: ['http'],
                }),
                loadSpec('stainless-v0', specsDirectory, {
                  mode: 'exclude',
                  list: ['http'],
                }),
              ]);

              return [petStoreSpec, stainlessV0Spec];
            }
          : undefined,
      },
      contextMenu: { thirdParty: false },
      experimental: {
        aiChat: { handlerEntrypoint: import.meta.resolve('./src/ai-chat-handler.ts') },
      },
      header: {
        layout: 'stacked',
        links: [
          {
            label: 'Home',
            link: '/',
          },
          {
            label: 'Docs',
            link: '/docs',
          },
          {
            label: 'API',
            link: '/api',
          },
        ],
      },
      tabs: [
        {
          label: 'Home',
          link: '/',
          sidebar: [
            {
              label: 'Home',
              link: '/',
            },
            {
              label: 'Google',
              link: 'https://google.com',
            },
          ],
        },
        {
          label: 'Reference',
          link: '/api',
          sidebar: generateAPIReferenceItems(),
        },
      ],
    }),
  ],
});
