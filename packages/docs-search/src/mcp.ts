import { renderMarkdown } from '@stainless-api/docs-ui/markdown';
import { DocsLanguage, parseStainlessPath } from '@stainless-api/docs-ui/routing';
import { getResourceFromSpec } from '@stainless-api/docs-ui/utils';
import { generateIndex } from './indexer';
import type { IndexEntry, IndexMethod } from './types';
import type * as SDKJSON from '@stainless/sdk-json';

type Item = IndexEntry & IndexMethod;

function consolidate(results: IndexEntry[]) {
  const resources = new Set<string>();
  const methods = new Set<string>();

  for (const entry of results) {
    const parsed = parseStainlessPath(entry.stainlessPath)!;
    if (parsed.method) methods.add(parsed.routable!);
    else resources.add(parsed.routable!);
  }

  const filtered = Array.from(methods).filter((path) => !resources.has(path.split(' >').at(0)!));
  return [...resources, ...filtered];
}

export function render(
  spec: SDKJSON.Spec,
  language: DocsLanguage,
  items: Item[],
  includeModelProperties: boolean,
) {
  const env = {
    spec,
    language,
    options: {
      renderNestedResources: false,
      includeModelProperties,
    },
  };

  const paths = consolidate(items);
  const output = paths.map((entry) => {
    const parsed = parseStainlessPath(entry)!;
    const resource = getResourceFromSpec(parsed.resource!, spec)!;
    const target = parsed.method ? resource.methods[parsed.method]! : resource;
    const content = renderMarkdown(env, target);
    return [entry, content];
  });

  return Object.fromEntries(output);
}

export { generateIndex };
