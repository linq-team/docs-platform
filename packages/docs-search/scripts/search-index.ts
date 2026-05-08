import Markdoc from '@markdoc/markdoc';
import { buildChatIndex, buildIndex } from '../src/providers/algolia';
import { readFileSync, existsSync } from 'fs';
import * as dotenv from 'dotenv';
import * as assert from 'assert/strict';
import type { Spec } from '@stainless/sdk-json';
dotenv.config();

const specPath = process.argv[2];

if (!specPath) {
  console.error('Please provide a path to the spec file');
  process.exit(1);
}

if (!existsSync(specPath)) {
  console.error(`File not found: ${specPath}`);
  process.exit(1);
}

const spec = JSON.parse(readFileSync(specPath, 'utf8')) as Spec;
const appId = process.env['PUBLIC_ALGOLIA_APP_ID'];
const writeKey = process.env['PRIVATE_ALGOLIA_WRITE_KEY'];
const indexName = process.env['PUBLIC_ALGOLIA_INDEX'];
const indexChat = indexName ? `${indexName}-chat` : null;

assert.ok(appId !== undefined, '$PUBLIC_ALGOLIA_APP_ID should be set');
assert.ok(writeKey !== undefined, '$PRIVATE_ALGOLIA_WRITE_KEY should be set');
assert.ok(indexName !== undefined, '$PUBLIC_ALGOLIA_INDEX should be set');

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

buildIndex(appId, indexName, writeKey, spec, renderMarkdown)
  .then(() => {
    if (indexChat) {
      return buildChatIndex(appId, indexChat, writeKey, spec);
    }
  })
  .then(() => {
    console.log('Indexing complete.');
  })
  .catch((error) => {
    console.error('Error during indexing:', error);
    process.exit(1);
  });
