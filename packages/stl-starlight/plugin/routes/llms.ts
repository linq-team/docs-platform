import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { base as ASTRO_BASE } from 'astro:config/server';
import { SITE_TITLE, API_REFERENCE_BASE_PATH } from 'virtual:stl-docs-virtual-module';
import { LLMS_TXT_DESCRIPTION, LLMS_TXT_DETAIL_THRESHOLD } from 'virtual:stl-starlight-virtual-module';
import { getSDKJSONInSSR } from '../specs/fetchSpecSSR';
import Markdoc from '@markdoc/markdoc';
import type { Node } from '@markdoc/markdoc';
import * as md from '@stainless-api/docs-ui/markdown/md';
import type * as SDKJSON from '@stainless/sdk-json';
import { generateRoute, walkTree } from '@stainless-api/docs-ui/routing';

export const prerender = true;

function joinUrlParts(...parts: (string | boolean | null | undefined)[]) {
  return (
    '/' +
    parts
      .map((p) => {
        if (typeof p === 'string') {
          return p.split('/');
        }
        return p;
      })
      .flat()
      .filter(Boolean)
      .join('/')
  );
}

export type ProsePageEntry = {
  id: string;
  title: string;
  description?: string;
};

function isResourceEmpty(resource: SDKJSON.Resource) {
  return Object.values(resource.methods).length < 1 && Object.values(resource.subresources ?? {}).length < 1;
}

function trimPath(path: string) {
  return path.endsWith('/') ? path.slice(0, -1) : path;
}

function apiHref(basePath: string, language: string, stainlessPath: string) {
  const href = generateRoute(basePath, language, stainlessPath);
  if (!href) return null;
  return joinUrlParts(ASTRO_BASE, href, 'index.md');
}

function linkListItem(title: string, url: string, description?: string): Node {
  const children = [md.link(url, title)];
  if (description) children.push(md.text(`: ${description}`));
  return md.item(md.inline(...children));
}

function generateProseIndex(routes: ProsePageEntry[], detailed: boolean) {
  const pageEntryLink = (page: ProsePageEntry) =>
    linkListItem(
      page.title,
      joinUrlParts(ASTRO_BASE, page.id === 'index' ? null : page.id, 'index.md'),
      detailed ? page.description : undefined,
    );
  return [md.heading(2, 'Docs'), md.list(...routes.map(pageEntryLink))];
}

function renderMethods(basePath: string, language: string, methods: Record<string, SDKJSON.Method>) {
  const output: Node[] = [];

  for (const method of Object.values(methods)) {
    const href = apiHref(basePath, language, method.stainlessPath);
    if (href) output.push(linkListItem(method.title, href, method.summary));
  }

  return md.list(...output);
}

function renderResource(
  basePath: string,
  language: string,
  detailed: boolean,
  resource: SDKJSON.Resource,
): Node {
  const href = apiHref(basePath, language, resource.stainlessPath);
  const output = [md.paragraph(href ? md.link(href, resource.title) : md.text(resource.title))];
  if (resource.methods && detailed) output.push(renderMethods(basePath, language, resource.methods));
  if (resource.subresources) output.push(renderSubs(basePath, language, detailed, resource.subresources));
  return md.item(...output);
}

function renderSubs(
  basePath: string,
  language: string,
  detailed: boolean,
  resources: Record<string, SDKJSON.Resource>,
): Node {
  return md.list(
    ...Object.values(resources)
      .filter((res) => !isResourceEmpty(res))
      .map((sub) => renderResource(basePath, language, detailed, sub)),
  );
}

function renderLanguageNote(basePath: string, languages: string[]) {
  return [
    md.paragraph(
      md.text('Links below point to language-neutral HTTP documentation. '),
      md.text(
        'SDK-specific docs follow the same URL structure with the language inserted after the base path: ',
      ),
      md.code(`${trimPath(basePath)}/{language}/resources/...`),
      md.text('.'),
    ),
    md.paragraph(md.text(`Available languages: ${languages.join(', ')}`)),
  ];
}

function generateRefIndex(
  basePath: string,
  languages: string[],
  language: string,
  detailed: boolean,
  spec: SDKJSON.Spec,
) {
  const output = [md.heading(2, 'API Reference'), ...renderLanguageNote(basePath, languages)];

  for (const resource of Object.values(spec.resources)) {
    if (isResourceEmpty(resource)) continue;
    const href = apiHref(basePath, language, resource.stainlessPath);
    output.push(md.heading(3, [href ? md.link(href, resource.title) : md.text(resource.title)]));
    if (resource.methods && detailed) output.push(renderMethods(basePath, language, resource.methods));
    if (resource.subresources) output.push(renderSubs(basePath, language, detailed, resource.subresources));
  }

  return output;
}

function generateMarkdownIndex({
  siteTitle,
  description,
  basePath,
  languages,
  spec,
  detailed,
  proseRoutes,
}: {
  siteTitle: string;
  description: string | null;
  basePath: string;
  languages: string[];
  spec: SDKJSON.Spec;
  detailed: boolean;
  proseRoutes: ProsePageEntry[];
}) {
  const output: Node[] = [md.heading(1, siteTitle)];
  if (description) output.push(md.paragraph(md.text(description)));
  if (proseRoutes.length > 0) output.push(...generateProseIndex(proseRoutes, detailed));
  if (languages.length > 0) output.push(...generateRefIndex(basePath, languages, 'http', detailed, spec));

  const doc = new Markdoc.Ast.Node('document', {}, output);
  return Markdoc.format(doc);
}

export const GET: APIRoute = async () => {
  const [docsCollection, spec] = await Promise.all([getCollection('docs'), getSDKJSONInSSR('http')]);
  const apiEntries = [...walkTree(spec)].filter((n) => n.data.kind !== 'model');
  const proseRoutes = docsCollection.map((entry) => ({
    id: entry.id,
    title: entry.data.title,
    description: entry.data.description,
  }));

  const content = generateMarkdownIndex({
    siteTitle: SITE_TITLE,
    description: LLMS_TXT_DESCRIPTION,
    basePath: API_REFERENCE_BASE_PATH,
    languages: spec.docs?.languages ?? [],
    detailed: apiEntries.length + proseRoutes.length < LLMS_TXT_DETAIL_THRESHOLD,
    spec,
    proseRoutes,
  });

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
