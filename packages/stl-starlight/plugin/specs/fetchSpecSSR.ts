import { readFile } from 'fs/promises';

import { api } from 'virtual:stainless-apis-manifest';
import { Spec } from '@stainless/sdk-json';
import { DocsLanguage } from '@stainless-api/docs-ui/routing';

const cachedSpecs: Record<string, Spec> = {};

export async function getSDKJSONInSSR(language: DocsLanguage) {
  const filePath = api.languages.find((l) => l.language === language)?.sdkJSONFilePath;
  if (!filePath) {
    throw new Error(`No SDK JSON file path for language: ${language}`);
  }

  if (cachedSpecs[filePath]) {
    return cachedSpecs[filePath];
  }
  const specStr = await readFile(filePath, 'utf8');
  const json = JSON.parse(specStr) as Spec;
  cachedSpecs[filePath] = json;

  return json;
}
