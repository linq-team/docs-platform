import {
  DocsLanguage,
  generateRoute,
  Languages,
  parseStainlessPath,
  walkTree,
} from '@stainless-api/docs-ui/routing';
import type * as SDKJSON from '@stainless/sdk-json';
import type { IndexEntry } from './types';
import { printer, renderMarkdown } from '@stainless-api/docs-ui/markdown';
import { isResourceEmpty } from '@stainless-api/docs-ui/utils';

// function sanitizeTerraformType(key: string, value: any) {
//   return typeof value === "number" && !Number.isSafeInteger(value)
//     ? value.toString()
//     : value;
// }

export function getResourceNames(resourceIds: string[], topResources?: Record<string, SDKJSON.Resource>) {
  let element: SDKJSON.Resource | undefined;
  let resources: Record<string, SDKJSON.Resource> | undefined = topResources;
  const resourceName = [];
  for (const resource of resourceIds) {
    element = resources?.[resource];
    if (!element) break;
    resourceName.push(element.title);
    resources = element?.subresources;
  }

  return resourceName;
}

function chunkByLines(content: string, maxSize: number = 60000) {
  if (Buffer.byteLength(content, 'utf8') < maxSize) return [content];

  const lines = content.split('\n');
  const chunks = [];

  let currentChunk = [];
  let currentSize = 0;

  for (const line of lines) {
    const lineSize = Buffer.byteLength(line + '\n', 'utf8');
    if (currentSize + lineSize > maxSize) {
      chunks.push(currentChunk.join('\n'));
      currentChunk = [];
      currentSize = 0;
    }

    currentChunk.push(line);
    currentSize += lineSize;
  }

  if (currentChunk.length > 0) chunks.push(currentChunk.join('\n'));
  return chunks;
}

export function* generateChatIndex(spec: SDKJSON.Spec) {
  for (const [language, readme] of Object.entries(spec.readme)) {
    const chunks = chunkByLines(readme);

    for (const chunk of chunks) {
      yield {
        language,
        title: 'Overview',
        content: chunk,
        url: `docs://BASE_PATH/${language}`,
      };
    }
  }

  for (const { data } of walkTree(spec)) {
    if (data.kind !== 'http_method') continue;
    const { title, name, stainlessPath, httpMethod, summary, description } = data;
    const endpoint = data.endpoint.slice(httpMethod.length).trim();

    for (const language of Languages) {
      const decl = spec.decls[language]?.[stainlessPath];
      if (!decl) continue;

      const env = {
        spec,
        language,
        options: {
          includeModelProperties: true,
        },
      };

      const content = renderMarkdown(env, data);
      const chunks = chunkByLines(content);

      for (const chunk of chunks) {
        yield {
          language,
          title,
          name,
          endpoint,
          httpMethod,
          summary,
          description,
          stainlessPath,
          qualified: 'qualified' in decl ? decl['qualified'] : undefined,
          ident: 'ident' in decl ? decl['ident'] : undefined,
          content: chunk,
          url: generateRoute('docs://BASE_PATH', language, stainlessPath),
        };
      }
    }
  }
}

export function* generateIndex(
  spec: SDKJSON.Spec,
  renderMarkdownFn?: (_: string) => string | null,
  includeTypes?: boolean,
  languages?: DocsLanguage[],
): Generator<IndexEntry> {
  const parentCrumbs: Record<string, string[]> = {};
  const targetLangs = languages ?? Languages;

  for (const { data } of walkTree(spec, true)) {
    const { kind, name, title, stainlessPath } = data;
    const common = { name, title, stainlessPath };

    const parsedPath = parseStainlessPath(stainlessPath)!;
    const crumbs = getResourceNames(parsedPath.resource!, spec.resources);

    switch (kind) {
      case 'resource':
        if (isResourceEmpty(data)) break;
        for (const language of targetLangs) {
          if (!data[language]) continue;

          parentCrumbs[stainlessPath] = crumbs;
          const { Name, QualifiedName } = data[language];

          yield {
            kind,
            crumbs,
            language,
            Name,
            QualifiedName,
            priority: 0,
            ...common,
          };
        }

        break;

      case 'http_method': {
        const { summary, endpoint, httpMethod } = data;
        for (const language of targetLangs) {
          const found = spec.decls[language]?.[stainlessPath];
          if (!found) continue;

          parentCrumbs[stainlessPath] = [...crumbs, title];
          const qualified = 'qualified' in found ? found['qualified'] : undefined;
          const ident = qualified?.split('.')?.at(-1);

          yield {
            kind,
            crumbs: [...crumbs, title],
            ident,
            qualified,
            language,
            description: data.description
              ? (renderMarkdownFn?.(data.description) ?? data.description)
              : undefined,
            endpoint: endpoint.slice(httpMethod.length).trim(),
            httpMethod,
            summary,
            priority: 0,
            ...common,
          };
        }

        break;
      }

      case 'model':
        for (const language of targetLangs) {
          if (!spec.decls[language]) continue;

          parentCrumbs[stainlessPath] = [...crumbs, title];
          const schema = spec.decls[language]?.[`${stainlessPath} > (schema)`];
          const children =
            (schema && 'children' in schema ? schema?.['children'] : undefined)
              ?.map((childPath) => {
                const child = spec.decls?.[language]?.[childPath] as any;
                return (
                  child?.['ident'] ??
                  child?.['name'] ??
                  child?.['key'] ??
                  child?.['type']?.['literal']?.['value'] ??
                  child?.['type']?.['literal'] ??
                  child?.['type']?.['value']
                );
              })
              ?.filter((child) => child) ?? [];

          yield {
            kind,
            crumbs: [...crumbs, title],
            children,
            language,
            priority: 2,
            ident: schema && 'ident' in schema ? schema?.['ident'] : undefined,
            ...common,
          };
        }
    }
  }

  for (const language of targetLangs) {
    const decls = spec.decls?.[language];
    if (!decls) continue;

    for (const decl of Object.values<SDKJSON.LanguageDeclNodes[SDKJSON.SpecLanguage]>(decls)) {
      switch (decl.kind) {
        // case "TerraformDeclAttribute":
        case 'JavaDeclProperty':
        case 'GoDeclProperty':
        case 'PythonDeclProperty':
        case 'RubyDeclProperty':
        case 'HttpDeclProperty':
        case 'TSDeclProperty':
          {
            const parsedPath = parseStainlessPath(decl.stainlessPath)!;
            const type = includeTypes === false ? undefined : printer.typeName(language, decl.type);
            const name: string = (decl as any)['ident'] ?? (decl as any)['name'] ?? (decl as any)['key'];

            const parent = parentCrumbs[parsedPath.routable!];
            // Filter out properties of non-routable response types
            if (parent === undefined) continue;

            const matches = decl.stainlessPath.matchAll(/\((property|params|param)\) ([^\s]+)/g);

            const props = Array.from(matches)
              .map((p) => p[2])
              .filter((p) => p !== undefined);

            yield {
              kind: 'property',
              name,
              stainlessPath: decl.stainlessPath,
              crumbs: [...parent, ...props],
              docstring: decl.docstring ? (renderMarkdownFn?.(decl.docstring) ?? decl.docstring) : undefined,
              type,
              language,
              priority: 3,
            };
          }

          break;
      }
    }
  }
}
