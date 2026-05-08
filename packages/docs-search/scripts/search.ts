import fs from 'fs';
import { parseArgs } from 'util';
import { buildIndex, search } from '../src/providers/fuse';
import type * as SDKJSON from '@stainless/sdk-json';
import { isDocsLanguage } from './utils';

const {
  values: { language, query },
  positionals,
} = parseArgs({
  allowPositionals: true,
  options: {
    language: {
      type: 'string',
      short: 'l',
    },
    query: {
      type: 'string',
      short: 'q',
    },
  },
});

if (positionals.length < 1 || !fs.existsSync(positionals.at(0)!)) {
  throw new Error('Missing spec file');
}

if (!isDocsLanguage(language)) {
  throw new Error('Invalid language');
}

if (!query) {
  throw new Error('Must provide a query');
}

const spec = JSON.parse(fs.readFileSync(positionals.at(0)!, 'utf8')) as SDKJSON.Spec;
const idx = buildIndex(spec, language);
const results = search(idx, query);
const paths = new Set(results.map((result) => result.item.stainlessPath));
console.log(paths);
