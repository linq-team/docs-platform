import type * as SDKJSON from '@stainless/sdk-json';
import { DocsLanguage } from '@stainless-api/docs-ui/routing';

export type SearchSettings = {
  appId: string;
  searchKey: string;
  indexName: string;
  assistant?: string;
};

export type SearchParams = {
  query: string;
  language?: DocsLanguage | null;
  kind?: QueryKindsType | null;
};

export const QueryKinds = ['all', 'guide', 'resource', 'http_method', 'model', 'property'] as const;

export type QueryKindsType = (typeof QueryKinds)[number];

export type IndexModel = {
  kind: 'model';
  title: string;
  children?: string[];
  ident?: string;
};

export type IndexProperty = {
  kind: 'property';
  docstring?: string;
  type?: string;
};

export type IndexResource = {
  kind: 'resource';
  title: string;
  Name: string;
  QualifiedName: string;
};

export type IndexMethod = Pick<
  SDKJSON.Method,
  'kind' | 'summary' | 'description' | 'endpoint' | 'httpMethod'
> & {
  title: string;
  qualified?: string;
  ident?: string;
};

export const SearchableAttributes = [
  'name',
  'title',
  'ident',
  'Name',
  'qualified',
  'QualifiedName',
  'endpoint',
  'summary',
  'description',
  'docstring',
] as const;

export const SearchableAttributesChat = [
  'title',
  'name',
  'endpoint',
  'summary',
  'description',
  'qualified',
  'ident',
  'content',
];

export type SearchAttributeNames = (typeof SearchableAttributes)[number];

export type RoutableJsonNode = SDKJSON.Method | SDKJSON.Model | SDKJSON.Resource;

export type IndexEntry = Pick<RoutableJsonNode, 'name' | 'stainlessPath'> &
  (IndexProperty | IndexModel | IndexResource | IndexMethod) & {
    language: DocsLanguage;
    priority: number;
    crumbs: string[];
  };

export type ResultRecordType = IndexEntry & {
  objectID: string;
  _highlightResult: Record<SearchAttributeNames, { value: string }>;
};

export type ResultType = {
  hits: ResultRecordType[];
  facets?: Record<string, Record<string, number>>;
  nbHits: number;
};

export type GuideResultType = {
  id: string;
  score: number;
  words: number[];
  data: {
    excerpt: string;
    url: string;
    word_count: number;
    meta: { title: string };
    sub_results: {
      url: string;
      title: string;
      excerpt: string;
    }[];
  };
};

export type ResultData = {
  items: Array<ResultRecordType | GuideResultType>;
  counts: Partial<Record<QueryKindsType, number>>;
};
