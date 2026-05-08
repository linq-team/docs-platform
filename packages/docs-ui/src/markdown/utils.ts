import { Parser } from 'htmlparser2';
import type { DocsLanguage } from '../routing';
import type * as SDKJSON from '@stainless/sdk-json';
import type { TransformRequestSnippetFn } from '../components/sdk';

export type EnvironmentType = {
  spec: SDKJSON.Spec;
  language: DocsLanguage;
  transforms?: {
    transformRequestSnippet?: TransformRequestSnippetFn;
  };
  options: {
    renderNestedResources?: boolean;
    includeModelProperties?: boolean | 'method-page';
  };
};

export function getDecl(
  env: EnvironmentType,
  path: string,
): SDKJSON.LanguageDeclNodes[SDKJSON.SpecLanguage] | undefined {
  const decl = env.spec?.decls?.[env.language]?.[path];

  if (decl?.kind?.endsWith('Reference')) {
    const refId =
      'type' in decl && typeof decl['type'] === 'object' && '$ref' in decl['type']
        ? decl['type']['$ref']
        : null;
    if (refId === path) return decl;
    if (refId) return getDecl(env, refId);
  }

  return decl;
}

export const customSnippetPrefix = 'custom:';
export const getCustomSnippetTitle = (snippetId: string) =>
  snippetId.startsWith(customSnippetPrefix) ? snippetId.slice(customSnippetPrefix.length) : snippetId;

export function getSnippets(env: EnvironmentType, path: string) {
  const lang = env.language === 'http' ? 'http.curl' : (`${env.language}.default` as SDKJSON.SnippetLanguage);
  const snippets = env.spec?.snippets?.[lang]?.[path];
  const responses = env.spec?.snippetResponses?.http?.[path];
  return Object.fromEntries(
    Object.entries(snippets ?? {}).map(([key, snippet]) => [
      key,
      {
        snippet: snippet.content,
        response: responses?.[key as keyof typeof responses]?.[0]?.content,
      },
    ]),
  );
}

export function stripMarkup(content: string) {
  let output = '';

  const parser = new Parser({
    ontext(content) {
      output += content;
    },
  });

  parser.parseComplete(content);
  return output;
}
