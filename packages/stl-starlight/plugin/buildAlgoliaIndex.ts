import Markdoc from '@markdoc/markdoc';
import { buildIndex } from '@stainless-api/docs-search/providers/algolia';
import type { AstroIntegrationLogger } from 'astro';
import { generateIndex } from '@stainless-api/docs-search/indexer';
import type { LoadedSpecs } from './specs/utils';
import { isSupportedLanguage } from '@stainless-api/docs-ui/routing';

const markdocConfig = {
  nodes: {
    document: { ...Markdoc.nodes.document, render: '' },
  },
};

function renderMarkdown(content?: string) {
  if (!content) return null;

  const ast = Markdoc.parse(content);
  const transformed = Markdoc.transform(ast, markdocConfig);
  return Markdoc.renderers.html(transformed);
}

export async function buildAlgoliaIndex({
  loadedSpecs,
  logger,
}: {
  loadedSpecs: LoadedSpecs;
  logger?: AstroIntegrationLogger;
}) {
  function warnLog(message: string) {
    if (logger) {
      logger.warn(message);
    } else {
      console.warn(message);
    }
  }

  function infoLog(message: string) {
    if (logger) {
      logger.info(message);
    } else {
      console.log(message);
    }
  }

  const {
    PUBLIC_ALGOLIA_APP_ID: appId,
    PUBLIC_ALGOLIA_INDEX: indexName,
    PRIVATE_ALGOLIA_WRITE_KEY: algoliaWriteKey,
  } = process.env;

  if (!appId || !indexName || !algoliaWriteKey) {
    const missing = [
      !appId && 'PUBLIC_ALGOLIA_APP_ID',
      !indexName && 'PUBLIC_ALGOLIA_INDEX',
      !algoliaWriteKey && 'PRIVATE_ALGOLIA_WRITE_KEY',
    ].filter(Boolean);
    warnLog(`Skipping Algolia indexing due to missing environment variables: ${missing.join(', ')}`);
    return;
  }

  const indexEntries = loadedSpecs.flatMap((spec) =>
    Array.from(generateIndex(spec.sdkJson, renderMarkdown, true, spec.languages.filter(isSupportedLanguage))),
  );

  await buildIndex(appId, indexName, algoliaWriteKey, indexEntries, renderMarkdown);
  infoLog('Indexing complete.');
}
