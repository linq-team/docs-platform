/// <reference types="node" />

import fs from 'fs/promises';
import pathutils from 'path';
import { parseArgs } from 'util';
import * as specUtils from '../src/spec';

const { values } = parseArgs({
  options: {
    project: {
      type: 'string',
      short: 'p',
    },
    spec: {
      type: 'string',
      short: 's',
    },
    revision: {
      type: 'string',
      short: 'v',
      default: 'main',
    },
    output: {
      type: 'string',
      short: 'o',
    },
  },
});

async function getSpec() {
  if (values.project) {
    const key = process.env['STAINLESS_API_KEY'];

    if (!key) {
      console.error('Must set the STAINLESS_API_KEY environment variable');
      process.exit(1);
    }

    return specUtils.retrieve(key, values.project, values.revision);
  }

  if (values.spec) {
    const raw = await fs.readFile(values.spec, 'utf8');
    return specUtils.parseSpec(raw);
  }
}

function write(path: string, name: string, content: unknown) {
  const output = JSON.stringify(content);
  const filename = pathutils.join(path, `${name}.json`);
  return fs.writeFile(filename, output);
}

(async function () {
  if (typeof values.output !== 'string' || !(values.project || values.spec)) {
    console.error('Usage: split-spec.ts -p projectName -o output/dir');
    return;
  }

  const spec = await getSpec();
  if (!spec) return;

  const { resources, navigation } = specUtils.split(spec);
  const writes = resources.map(
    ({ name, lang, spec }) => values.output && write(values.output, `resource-${name}-${lang}`, spec),
  );

  return Promise.allSettled([...writes, write(values.output, 'navigation', navigation)]);
})().catch(() => {
  console.error('An error occurred while splitting the spec');
  process.exit(1);
});
