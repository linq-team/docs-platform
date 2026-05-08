import type { APIRoute, GetStaticPaths } from 'astro';
import type { Node } from '@markdoc/markdoc';
import { getReadmeContent } from '../react/Routing';
import { getResourceFromSpec, isResourceEmpty } from '@stainless-api/docs-ui/utils';

import { renderMarkdown } from '@stainless-api/docs-ui/markdown';
import * as md from '@stainless-api/docs-ui/markdown/md';

import { parseStainlessPath, generateRoute, type DocsLanguage } from '@stainless-api/docs-ui/routing';
import type { EnvironmentType } from '@stainless-api/docs-ui/markdown/utils';
import {
  PROPERTY_SETTINGS,
  MIDDLEWARE,
  RESOLVED_API_REFERENCE_PATH,
} from 'virtual:stl-starlight-virtual-module';
import { generateAllDocsRoutes } from '../helpers/generateDocsRoutes';
import { getSDKJSONInSSR } from '../specs/fetchSpecSSR';
import Markdoc from '@markdoc/markdoc';
import type * as SDKJSON from '@stainless/sdk-json';
import { API_REFERENCE_BASE_PATH } from 'virtual:stl-docs-virtual-module';

type RouteProps = {
  stainlessPath: string;
  language: DocsLanguage;
  kind: 'http_method' | 'resource' | 'readme';
};

export const getStaticPaths = (async () => {
  const paths = await generateAllDocsRoutes();
  return paths;
}) satisfies GetStaticPaths;

function renderLink(stainlessPath: string, title: string) {
  const href = generateRoute(RESOLVED_API_REFERENCE_PATH, 'http', stainlessPath);
  return href ? md.link(`${href}/index.md`, title) : md.text(title);
}

function renderOverviewResource(resource: SDKJSON.Resource, topLevel: boolean): Node[] {
  const link = renderLink(resource.stainlessPath, resource.title);

  const methodItems = Object.values(resource.methods).map((method) =>
    md.item(md.paragraph(renderLink(method.stainlessPath, method.title))),
  );

  const subItems = Object.values(resource.subresources ?? {})
    .filter((sub) => !isResourceEmpty(sub))
    .flatMap((sub) => renderOverviewResource(sub, false));

  const nestedItems = [...methodItems, ...subItems];
  const list = nestedItems.length > 0 ? [md.list(...nestedItems)] : [];

  return topLevel ? [md.heading(2, [link]), ...list] : [md.item(md.paragraph(link), ...list)];
}

function renderOverview({ spec }: EnvironmentType): string {
  const output: Node[] = [md.heading(1, 'API Reference')];

  for (const resource of Object.values(spec.resources)) {
    if (!isResourceEmpty(resource)) output.push(...renderOverviewResource(resource, true));
  }

  const doc = new Markdoc.Ast.Node('document', {}, output);
  return Markdoc.format(doc);
}

export const GET: APIRoute<RouteProps> = async ({ props, routePattern }) => {
  const spec = await getSDKJSONInSSR(props.language ?? 'http');

  const env: EnvironmentType = {
    spec,
    language: props.language,
    options: {
      renderNestedResources: true,
      includeModelProperties: PROPERTY_SETTINGS.includeModelProperties,
    },
    transforms: {
      transformRequestSnippet: MIDDLEWARE.transformRequestSnippet,
    },
  };

  if (routePattern === `${API_REFERENCE_BASE_PATH}/index.md`) {
    const content = renderOverview({ ...env, language: 'http' });
    return new Response(content, {
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  if (props.kind === 'readme') {
    const readmeContent = await getReadmeContent(spec, props.language);
    return new Response(readmeContent, {
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const parsed = parseStainlessPath(props.stainlessPath);
  const resource = getResourceFromSpec(props.stainlessPath, spec);

  if (!resource) throw new Error('Invalid route');

  const target = props.kind === 'http_method' && parsed?.method ? resource.methods[parsed.method]! : resource;
  const output = renderMarkdown(env, target);

  return new Response(output, {
    headers: { 'Content-Type': 'text/plain' },
  });
};

export const prerender = true;
