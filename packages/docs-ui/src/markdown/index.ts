import Markdoc from '@markdoc/markdoc';
import * as md from './md';
import { EnvironmentType, getCustomSnippetTitle, getDecl, getSnippets, stripMarkup } from './utils';
import * as printer from './printer';
import type * as SDKJSON from '@stainless/sdk-json';
import type { Node } from '@markdoc/markdoc';

export * as printer from './printer';

export function declaration(env: EnvironmentType, decl: SDKJSON.DeclarationNode) {
  const content = printer.declaration(env.language, decl);
  return md.paragraph(md.code(stripMarkup(content)));
}

function renderChildren(env: EnvironmentType, children: SDKJSON.ID[], nesting: Set<string> = new Set()) {
  return md.list(...children.map((child) => renderDecl(env, child, nesting)));
}

function renderDecl(env: EnvironmentType, path: string, nesting: Set<string> = new Set()) {
  const decl = getDecl(env, path)!;
  const item = md.item(declaration(env, decl));
  const effectivePath =
    ('modelPath' in decl && decl['modelPath'] ? `${decl.modelPath} > (schema)` : null) ?? decl.stainlessPath;

  const hasChildren = 'children' in decl && decl.children && decl.children.length > 0;
  const showModelProps = !('modelPath' in decl && decl['modelPath']) || env.options.includeModelProperties;

  if ('docstring' in decl && decl.docstring) item.children.push(...md.parse(decl.docstring));
  if (hasChildren && showModelProps && !nesting.has(effectivePath)) {
    nesting.add(effectivePath);
    item.push(renderChildren(env, decl.children ?? [], nesting));
  }

  return item;
}

function renderMethod(env: EnvironmentType, method: SDKJSON.Method): Node[] {
  const decl = getDecl(env, method.stainlessPath);

  if (!decl)
    return [
      md.paragraph(
        md.text('The method '),
        md.code(method.name),
        md.text(' is not available in this language.'),
      ),
    ];

  const signature = printer.methodSignature(env.language, decl);
  const [httpMethod, endpoint] = method.endpoint.split(' ') as [string, string];

  const output = [
    md.heading(2, method.summary ?? method.title),
    ...(env.language === 'http' ? [] : [md.paragraph(md.code(stripMarkup(signature)))]),
    md.paragraph(md.strong(md.text(httpMethod)), md.text(' '), md.code(endpoint)),
  ];

  if (method.description) output.push(...md.parse(method.description));

  if (env.language === 'http') {
    const p = 'paramsChildren' in decl && typeof decl.paramsChildren === 'object' ? decl.paramsChildren : {};
    for (const [location, value] of Object.entries(p)) {
      if (value.length < 1) continue;
      output.push(
        md.heading(3, [
          md.text(location.at(0)?.toUpperCase() ?? ''),
          md.text(location.slice(1)),
          md.text(' Parameters'),
        ]),
        renderChildren(env, value),
      );
    }

    const bp = 'bodyParamsChildren' in decl ? decl.bodyParamsChildren?.['application/json'] : [];
    if (bp && bp.length > 0) output.push(md.heading(3, 'Body Parameters'), renderChildren(env, bp));
  }

  if ('paramsChildren' in decl && Array.isArray(decl.paramsChildren) && decl.paramsChildren.length > 0)
    output.push(md.heading(3, 'Parameters'), renderChildren(env, decl.paramsChildren));

  if ('responseChildren' in decl && decl.responseChildren && decl.responseChildren.length > 0)
    output.push(md.heading(3, 'Returns'), renderChildren(env, decl.responseChildren));

  const snippetEntries = getSnippets(env, method.stainlessPath);
  for (const [key, { snippet, response }] of Object.entries(snippetEntries)) {
    if (!snippet) continue;

    let title = getCustomSnippetTitle(key);
    if (title.toLowerCase() === 'default') title = 'Example';

    output.push(md.heading(3, title), md.fence(env.language, snippet));
    if (response) output.push(md.heading(4, 'Response'), md.fence('json', response));
  }

  return output;
}

function renderModel(env: EnvironmentType, model: SDKJSON.Model) {
  return [md.heading(3, model.title), md.list(renderDecl(env, `${model.stainlessPath} > (schema)`))];
}

function renderResource(env: EnvironmentType, resource: SDKJSON.Resource): Node[] {
  const methods = Object.values(resource.methods)
    .filter((method) => getDecl(env, method.stainlessPath))
    .flatMap((method) => renderMethod(env, method));

  const models = Object.values(resource.models)
    .filter((model) => getDecl(env, `${model.stainlessPath} > (schema)`))
    .flatMap((model) => renderModel(env, model));

  const doc: Node[] = [md.heading(1, resource.title), ...methods];

  if (models.length > 0) doc.push(md.heading(2, 'Domain Types'), ...models);

  if (!env.options.renderNestedResources) return doc;

  const children = Object.values(resource.subresources ?? {}).flatMap((resource) =>
    renderResource(env, resource),
  );
  return [...doc, ...children];
}

export function render(
  env: EnvironmentType,
  node: SDKJSON.Resource | SDKJSON.Method | SDKJSON.Model,
): Node[] {
  switch (node.kind) {
    case 'resource':
      return renderResource(env, node);
    case 'http_method':
      return renderMethod(env, node);
    case 'model':
      return renderModel(env, node);
  }
}

export function renderMarkdown(
  env: EnvironmentType,
  node: SDKJSON.Resource | SDKJSON.Method | SDKJSON.Model,
) {
  const content = render(env, node);
  const doc = new Markdoc.Ast.Node('document', {}, content);
  return Markdoc.format(doc);
}
