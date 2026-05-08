import Fuse, { FuseIndex } from 'fuse.js';
import { DocsLanguage } from '@stainless-api/docs-ui/routing';
import { generateIndex } from '../indexer';
import { IndexEntry, SearchableAttributes } from '../types';
import type * as SDKJSON from '@stainless/sdk-json';

export type FuseIndexData = { content: IndexEntry[]; index: FuseIndex<IndexEntry> };

export function buildIndex(spec: SDKJSON.Spec, language?: DocsLanguage): FuseIndexData {
  const idx = Array.from(generateIndex(spec, undefined, false));
  const content = language ? idx.filter((entry) => entry.language === language) : idx;
  const index = Fuse.createIndex([...SearchableAttributes], content);
  return { content, index };
}

export function search({ content, index }: FuseIndexData, query: string, limit: number = 100) {
  const fuse = new Fuse(content, { keys: [...SearchableAttributes] }, index);
  return fuse.search(query).slice(0, limit);
}
