import { DocsLanguage } from '@stainless-api/docs-ui/routing';
import { generateIndex } from '../indexer';
import { IndexEntry, SearchableAttributes } from '../types';
import type * as SDKJSON from '@stainless/sdk-json';

export function buildIndex(spec: SDKJSON.Spec) {
  return generateIndex(spec, undefined, false);
}

function* findEntryInIndex(index: Generator<IndexEntry>, language: string, query: string) {
  for (const entry of index) {
    if (entry.language !== language) continue;
    for (const attr of SearchableAttributes) {
      const attr_ = attr in entry ? (attr as keyof typeof entry) : null;
      if (attr_ && entry[attr_] && typeof entry[attr_] === 'string' && entry[attr_].includes(query))
        yield entry;
    }
  }
}

export function search(
  index: Generator<IndexEntry>,
  language: DocsLanguage,
  query: string,
  limit: number = 100,
) {
  const results = findEntryInIndex(index, language, query);
  const sorted = Array.from(results)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, limit);
  return sorted;
}
