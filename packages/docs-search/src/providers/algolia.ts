import { searchClient } from '@algolia/client-search';
import { generateChatIndex, generateIndex } from '../indexer';
import { SearchableAttributes, SearchableAttributesChat } from '../types';
import type * as SDKJSON from '@stainless/sdk-json';
import type { ResultRecordType, SearchSettings, SearchParams, ResultType, IndexEntry } from '../types';

export async function buildIndex(
  appId: string,
  indexName: string,
  writeKey: string,
  content: SDKJSON.Spec | IndexEntry[],
  renderMarkdown: (_: string) => string | null,
): Promise<void> {
  if (!appId || !indexName || !writeKey) return;
  const objects = Array.isArray(content) ? content : Array.from(generateIndex(content, renderMarkdown));
  const client = searchClient(appId, writeKey);

  await client.setSettings({
    indexName,
    indexSettings: {
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
      customRanking: ['asc(priority)'],
      attributesForFaceting: ['language', 'kind'],
      searchableAttributes: [...SearchableAttributes],
    },
  });

  await client.replaceAllObjects({ indexName, objects });
}

export async function buildChatIndex(
  appId: string,
  indexName: string,
  writeKey: string,
  spec: SDKJSON.Spec,
): Promise<void> {
  if (!appId || !indexName || !writeKey) return;
  const objects = Array.from(generateChatIndex(spec));
  const client = searchClient(appId, writeKey);

  await client.setSettings({
    indexName,
    indexSettings: {
      attributesForFaceting: ['language'],
      attributeForDistinct: 'stainlessPath',
      searchableAttributes: SearchableAttributesChat,
    },
  });

  await client.replaceAllObjects({ indexName, objects });
}

export async function search({
  settings: { appId, indexName, searchKey },
  params: { query, language, kind },
}: {
  params: SearchParams;
  settings: SearchSettings;
}): Promise<ResultType | undefined> {
  const client = searchClient(appId, searchKey);
  const filters = language ? `language:${language}` : undefined;
  const facetFilters = kind ? [`kind:${kind}`] : undefined;
  const { results } = await client.search<ResultRecordType>({
    requests: [
      {
        query,
        indexName,
        filters,
        hitsPerPage: 5,
        facets: ['kind'],
      },
      {
        query,
        indexName,
        filters,
        facetFilters,
        facets: ['kind'],
        hitsPerPage: 50,
      },
    ],
  });

  if ('hits' in results[0]! && 'hits' in results[1]!) {
    const [{ nbHits, facets }, { hits }] = results;
    return { hits, nbHits: nbHits ?? 0, facets };
  }
}
