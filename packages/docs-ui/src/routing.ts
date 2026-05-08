import type * as SDKJSON from '@stainless/sdk-json';

export const Languages = [
  'http',
  'node',
  'python',
  'go',
  'typescript',
  'terraform',
  'ruby',
  'java',
  'kotlin',
  'csharp',
  'php',
  'cli',
] as const;

export const SupportedLanguageSyntaxes = [
  'http',
  'javascript',
  'python',
  'go',
  'typescript',
  'terraform',
  'ruby',
  'java',
  'kotlin',
  'csharp',
  'php',
  'bash',
];

export type DocsLanguage = (typeof Languages)[number];

export const LanguageNames: Record<DocsLanguage, string> = {
  http: 'HTTP',
  node: 'TypeScript',
  typescript: 'TypeScript',
  python: 'Python',
  go: 'Go',
  ruby: 'Ruby',
  java: 'Java',
  kotlin: 'Kotlin',
  terraform: 'Terraform',
  csharp: 'C#',
  php: 'PHP',
  cli: 'CLI Tool',
};

export function getLanguageSnippet(language: DocsLanguage) {
  return language === 'http' ? ('http.curl' as const) : (`${language}.default` as const);
}

export function isSupportedLanguage(language: string): language is DocsLanguage {
  return Languages.includes(language as DocsLanguage);
}

const DefaultLanguage = 'http';

const StainlessPathPattern =
  /(\(resource\) (?<resource>[^\s]+))( > (\(method\) (?<method>[^\s]+)|\(model\) (?<model>[^\s]+))?)?/;

export type ParsedStainlessPath = ReturnType<typeof parseStainlessPath>;

export function parseStainlessPath(stainlessPath: string) {
  const match = stainlessPath.match(StainlessPathPattern);

  if (!match?.groups) return null;

  return {
    resource: match.groups.resource?.split('.') ?? null,
    method: match.groups.method ?? null,
    model: match.groups.model ?? null,
    routable: match.groups.model ? match[1] : match[0],
  };
}

export function trimStainlessPath(stainlessPath: string) {
  return stainlessPath.replace(/ > \([^\s]+\)$/, '');
}

export function getResource(stainlessPath: string) {
  const parsed = parseStainlessPath(stainlessPath);
  return parsed?.resource?.[0];
}

export function parseRoute(
  basePath: string,
  route: string,
): { stainlessPath: string; language: DocsLanguage } {
  if (!route.startsWith(basePath)) return { stainlessPath: '', language: DefaultLanguage };

  if (basePath && route.startsWith(basePath)) route = route.slice(basePath.length);

  let stainlessPath = '';
  let elements = route.slice(1).split('/');
  let language: DocsLanguage = DefaultLanguage;

  if (elements[0] && Languages.includes(elements[0] as DocsLanguage)) {
    language = elements[0] as DocsLanguage;
    elements = elements.slice(1);
  }

  while (elements.length > 0) {
    const element = elements.shift();
    switch (element) {
      case 'resources':
        stainlessPath += `(resource) ${elements.shift()}`;
        break;

      case 'subresources':
        stainlessPath += `.${elements.shift()}`;
        break;

      case 'methods':
        stainlessPath += ` > (method) ${elements.shift()}`;
        break;
    }
  }

  return { stainlessPath, language };
}

export function generateRoute(basePath: string, language: string, stainlessPath: string) {
  const parsedPath = parseStainlessPath(stainlessPath);
  if (!parsedPath) return null;

  const path = [basePath.endsWith('/') ? basePath.slice(0, -1) : basePath];
  if (language && language !== DefaultLanguage) path.push(language);

  const resources = parsedPath.resource!.flatMap((name, index) => [
    index > 0 ? 'subresources' : 'resources',
    name,
  ]);

  // Ensure model links always go to top-level resource page
  const resourcePath = parsedPath.model ? resources.slice(0, 2) : resources;
  path.push(...resourcePath);

  if (parsedPath.method) path.push('methods', parsedPath.method);

  return stainlessPath.length > parsedPath.routable!.length
    ? `${path.join('/')}#${encodeURIComponent(stainlessPath)}`
    : path.join('/');
}

export type SpecTreeEntry = {
  data: SDKJSON.Method | SDKJSON.Resource | SDKJSON.Model;
  path: string[];
};

function* walkResource(
  resource: SDKJSON.Resource,
  path: string[],
  includeModels?: boolean,
): Generator<SpecTreeEntry> {
  yield { data: resource, path };

  for (const data of Object.values(resource.methods)) {
    yield { data, path: [...path, 'methods', data.name] };
  }

  if (includeModels)
    for (const data of Object.values(resource.models)) {
      yield { data, path: [...path, 'models', data.name] };
    }

  for (const data of Object.values(resource.subresources ?? {})) {
    yield* walkResource(data, [...path, 'subresources', data.name]);
  }
}

export function* walkTree(spec: SDKJSON.Spec, includeModels?: boolean) {
  for (const data of Object.values(spec.resources)) {
    yield* walkResource(data, ['resources', data.name], includeModels);
  }
}

export type RouteEntry = {
  title: string;
  kind: SpecTreeEntry['data']['kind'];
  language: DocsLanguage;
  stainlessPath: string;
  slug: string;
};

export function generateRouteList({
  spec,
  languages,
  excludeLanguages = [],
}: {
  spec: SDKJSON.Spec;
  languages?: DocsLanguage[];
  excludeLanguages?: DocsLanguage[];
}): RouteEntry[] {
  const entries = Array.from(walkTree(spec));
  const langs = languages ?? spec.docs?.languages ?? ['http'];

  return langs
    .filter((lang): lang is (typeof Languages)[number] => Languages.includes(lang))
    .filter((lang) => !excludeLanguages?.includes(lang))
    .flatMap((language) =>
      entries.map(({ path, data: { title, kind, stainlessPath } }) => ({
        title,
        kind,
        language,
        stainlessPath,
        slug: (language === 'http' ? path : [language, ...path]).join('/'),
      })),
    );
}

export function generateMissingRouteList({
  spec,
  basePath,
}: {
  spec: SDKJSON.Spec;
  basePath: string;
}): string[] {
  const entries = Array.from(walkTree(spec));
  const langs = spec.docs?.languages ?? ['http'];

  return langs
    .filter((lang): lang is (typeof Languages)[number] => Languages.includes(lang))
    .flatMap((language) =>
      entries
        .filter(({ data: { stainlessPath, ...rest } }) => {
          if (spec.decls?.[language]?.[stainlessPath] === undefined) {
            return rest.kind === 'http_method';
          }
          return false;
        })
        .map(
          ({ path }) =>
            `${basePath.endsWith('/') ? basePath.slice(0, -1) : basePath}/${
              language === 'http' ? path.join('/') : [language, ...path].join('/')
            }`,
        ),
    );
}
type ResourceOrMethod = SDKJSON.Resource | SDKJSON.Method;

export function findNavigationPath(items: ResourceOrMethod[], target: string): string[] | undefined {
  for (const item of Object.values(items)) {
    if (item.stainlessPath === target) return [item.stainlessPath];
    if (item.kind === 'http_method') continue;

    const path = findNavigationPath(
      [...Object.values(item.methods ?? {}), ...Object.values(item.subresources ?? {})],
      target,
    );

    if (path) return [item.stainlessPath, ...path];
  }
}

export function expandToElement(el: HTMLElement | null) {
  while (el) {
    if (el instanceof HTMLDetailsElement) el.open = true;
    el = el.parentElement;
  }
}

export function scrollToPath(stainlessPath: string) {
  const el = document.getElementById(stainlessPath);
  if (el) {
    expandToElement(el);
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

export function updateHistory(basePath: string, language: DocsLanguage, stainlessPath: string) {
  const path = generateRoute(basePath, language, stainlessPath);
  window.history.pushState({ stainlessPath, language }, '', path);
}
