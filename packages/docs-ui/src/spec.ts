import * as SDKJSON from '@stainless/sdk-json';
import { Languages, type DocsLanguage } from './routing';
import { isResourceEmpty } from './utils';

export type SecurityScheme = SDKJSON.Spec['security_schemes'][number];
// TODO: these should be exported from SDKJSON
type AllSnippets = NonNullable<SDKJSON.Spec['snippets']>;
type Snippets = NonNullable<AllSnippets[keyof AllSnippets]>;

export interface SpecTransforms {
  resource(resource: SDKJSON.Resource): SDKJSON.Resource;
  method(method: SDKJSON.Method): SDKJSON.Method;
  model(model: SDKJSON.Model): SDKJSON.Model;
  declaration(decl: SDKJSON.DeclarationNode, language: SDKJSON.SpecLanguage): SDKJSON.DeclarationNode;
  securityScheme(scheme: SecurityScheme): SecurityScheme;
  snippet(snippet: string, language: string): string;
  markdown(content?: string): string | undefined;
}

const defaultTransforms: SpecTransforms = {
  resource: (resource) => resource,
  method: (method) => method,
  model: (model) => model,
  declaration: (decl) => decl,
  securityScheme: (scheme) => scheme,
  snippet: (snippet) => snippet,
  markdown: (content) => content,
};

export function defineTransforms(transforms: Partial<SpecTransforms> = {}) {
  return { ...defaultTransforms, ...transforms };
}

function removeStudioRefs(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(removeStudioRefs);
  }

  const newObj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key !== 'oasRef' && key !== 'configRef') {
      newObj[key] = removeStudioRefs(value);
    }
  }

  return newObj;
}

function mapEntries<T>({
  input,
  fn,
  filter,
}: {
  input?: Record<string, T>;
  fn?: (value: T) => T;
  filter?: (name: string, value: T) => boolean;
}) {
  if (!input) return;
  const output: Record<string, T> = {};
  for (const [name, entry] of Object.entries(input)) {
    if (filter && !filter(name, entry)) continue;
    output[name] = fn ? fn(entry) : entry;
  }

  return output;
}

function transformRecursively(resource: SDKJSON.Resource, transforms: SpecTransforms): SDKJSON.Resource {
  return {
    ...transforms.resource(resource),
    methods:
      mapEntries({
        input: resource.methods,
        fn: (method) => transforms.method(method),
      }) ?? {},
    models:
      mapEntries({
        input: resource.models,
        fn: (model) => transforms.model(model),
      }) ?? {},
    subresources:
      mapEntries({
        input: resource.subresources,
        fn: (sub) => transformRecursively(sub, transforms),
      }) ?? {},
  };
}

export function generateNavigation(resource: Partial<SDKJSON.Resource>) {
  const { title, name, stainlessPath, terraform } = resource;
  const subresources = mapEntries<Partial<SDKJSON.Resource>>({
    input: resource.subresources,
    fn: generateNavigation,
  });

  const methods = mapEntries<Partial<SDKJSON.Method>>({
    input: resource.methods,
    fn: (method) => ({
      name: method.name,
      stainlessPath: method.stainlessPath,
      summary: method.summary,
      httpMethod: method.httpMethod,
    }),
  });

  const models = mapEntries<Partial<SDKJSON.Model>>({
    input: resource.models,
    fn: (model) => ({
      name: model.name,
      stainlessPath: model.stainlessPath,
    }),
  });

  return { title, name, subresources, methods, models, stainlessPath, terraform };
}

export function generateSpecForResource(
  spec: SDKJSON.Spec,
  name: string,
  lang: DocsLanguage,
  transforms: SpecTransforms,
): Partial<SDKJSON.Spec> {
  const resource = spec.resources[name];
  if (!resource) throw new Error(`Invalid resource: ${name}`);

  return {
    resources: {
      [name]: transformRecursively(resource, transforms),
      ...(spec.resources['$shared']
        ? { $shared: transformRecursively(spec.resources['$shared'], transforms) }
        : {}),
    },
    security_schemes: spec.security_schemes?.map((scheme) => transforms.securityScheme(scheme)),
    decls: {
      [lang]: mapEntries<SDKJSON.LanguageDeclNodes[typeof lang]>({
        input: spec.decls[lang] ?? {},
        filter: (name) => name.startsWith(resource.stainlessPath) || name.startsWith('(resource) $shared'),
        fn: (decl) => transforms.declaration(decl, lang),
      }),
    },
    snippets: mapEntries({
      input: spec.snippets,
      filter: (name) => name.startsWith(lang),
      fn: (snippets) =>
        mapEntries({
          input: snippets,
          filter: (name) => name.startsWith(resource.stainlessPath),
          fn: (snippetObj) =>
            Object.fromEntries(
              Object.entries(snippetObj).map(([key, snippet]) => [
                key,
                { content: transforms.snippet(snippet.content, lang) },
              ]),
            ) as Snippets[string],
        }) ?? {},
    }),
  };
}

export function transform(spec: SDKJSON.Spec, transforms: SpecTransforms) {
  const t: SpecTransforms = {
    ...transforms,
    declaration: (decl, lang) =>
      transforms.declaration(
        {
          ...decl,
          ...('docstring' in decl ? { docstring: transforms.markdown(decl.docstring) } : {}),
        },
        lang,
      ),
    method: (method) =>
      transforms.method({
        ...method,
        description: transforms.markdown(method.description),
        deprecated:
          typeof method.deprecated === 'string' ? transforms.markdown(method.deprecated) : method.deprecated,
      }),
    securityScheme: (scheme) =>
      transforms.securityScheme({
        ...scheme,
        description: transforms.markdown(scheme.description),
      }),
  };

  const output = [];
  for (const lang of Languages) {
    for (const [name, resource] of Object.entries(spec.resources)) {
      if (isResourceEmpty(resource)) continue;
      output.push({ name, lang, spec: generateSpecForResource(spec, name, lang, t) });
    }
  }

  return output;
}

export function split(spec: SDKJSON.Spec, transforms?: SpecTransforms) {
  const t = transforms ?? defineTransforms();
  return {
    resources: transform(spec, t).map(removeStudioRefs) as ReturnType<typeof transform>,
    navigation: {
      languages: spec.docs?.languages,
      resources: Object.fromEntries(
        Object.entries(spec.resources)
          .filter(([, res]) => !isResourceEmpty(res))
          .map(([name, res]) => [name, generateNavigation(res)]),
      ),
    },
  };
}

export function parseSpec(content: string) {
  const parsed = JSON.parse(content);
  if (parsed && typeof parsed === 'object' && 'kind' in parsed && parsed.kind === 'spec')
    return parsed as SDKJSON.Spec;
}

export async function retrieve(apiKey: string, project: string, revision: string) {
  const response = await fetch('https://app.stainless.com/api/generate/spec', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ project, source: { type: 'git', revision } }),
  });

  const data = (await response.json()) as { spec: string };
  if (typeof data.spec === 'string') return parseSpec(data.spec);
}
