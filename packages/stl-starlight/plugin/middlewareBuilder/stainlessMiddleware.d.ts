import type { TransformRequestSnippetFn } from '@stainless-api/docs-ui/components/sdk';
import type { AppComponents } from '@stainless-api/docs-ui/contexts/component';

export type StlStarlightMiddleware = {
  transformRequestSnippet?: TransformRequestSnippetFn;
  componentOverrides?: Partial<AppComponents>;
};
