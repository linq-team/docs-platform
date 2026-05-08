import * as React from 'react';
import type { LanguageDeclNodes, SnippetLanguage, Spec, SpecLanguage } from '@stainless/sdk-json';

export type ContentPanelLayout = 'double-pane' | 'single-pane';
export type PropertySettingsType = {
  types?: 'simple' | 'rich';
  includeModelProperties?: boolean | 'method-page';
  collapseDescription?: boolean | 'show-first-line';
  showTitle?: boolean;
  expandDepth?: number;
};

export type DocsContextType = {
  language: SpecLanguage;
  spec: Spec | null;
  settings?: {
    properties?: PropertySettingsType;
    contentPanelLayout?: ContentPanelLayout;
    virtualExpanders?: boolean;
  };
};

const DocsContextDefaults: DocsContextType = {
  settings: {},
  language: 'node',
  spec: null,
};

const DocsContext = React.createContext<DocsContextType>(DocsContextDefaults);

export function useDocs() {
  return React.use(DocsContext);
}

export function useSpec() {
  return useDocs().spec;
}

export function useSettings() {
  return useDocs().settings;
}

export function useSnippets(stainlessPath: string, language?: SpecLanguage) {
  const defaultLanguage = useLanguage();
  const lang = language ?? defaultLanguage;
  const snippetLanguage: SnippetLanguage = lang === 'http' ? 'http.curl' : `${lang}.default`;
  return useSpec()?.snippets?.[snippetLanguage]?.[stainlessPath];
}

export function useSnippetIds(stainlessPath: string, language?: SpecLanguage): SnippetId[] | undefined {
  const snippets = useSnippets(stainlessPath, language);
  if (!snippets) return undefined;
  return Object.keys(snippets).flatMap((key): SnippetId | [] => {
    const customPrefix = 'custom:';
    if (key.startsWith(customPrefix)) {
      return `${customPrefix}${key.slice(customPrefix.length)}` satisfies SnippetId;
    }
    if (key === 'default') return 'default' satisfies SnippetId;
    return [];
  });
}

/** Find a custom snippet named Default (case-insensitive); otherwise use the generated default */
function getDefaultSnippet<ValueT>(snippets: Partial<Record<SnippetId, ValueT>>) {
  return (
    Object.entries(snippets).find(
      ([key]) => key.toLowerCase() === ('custom:default' satisfies SnippetId),
    )?.[1] ?? snippets.default
  );
}

type SnippetId = keyof NonNullable<ReturnType<typeof useSnippets>>;
export function useSnippet(stainlessPath: string, language?: SpecLanguage, snippetId?: SnippetId) {
  const snippets = useSnippets(stainlessPath, language);
  if (!snippets) return undefined;
  if (!snippetId) return getDefaultSnippet(snippets)?.content;
  return snippets?.[snippetId]?.content;
}

export function useSnippetResponse(stainlessPath: string, snippetId?: SnippetId) {
  const responses = useSpec()?.snippetResponses?.http?.[stainlessPath];
  if (!responses) return undefined;
  if (!snippetId) return getDefaultSnippet(responses);
  return responses[snippetId];
}

export type Declaration = LanguageDeclNodes[SpecLanguage];
export function useDeclaration<Required extends boolean>(
  stainlessPath: string,
  required: Required,
  language?: SpecLanguage,
): (Required extends true ? never : undefined) | Declaration {
  const defaultLanguage = useLanguage();
  const decl = useSpec()?.decls?.[language ?? defaultLanguage]?.[stainlessPath];
  if (required && !decl) {
    throw new Error(`Declaration not found for '${stainlessPath}'`);
  }
  return decl!;
}

export function useAvailableLanguages(stainlessPath: string): SpecLanguage[] {
  const spec = useSpec();
  return (Object.keys(spec?.decls ?? {}) as SpecLanguage[])
    .filter((lang) => spec?.decls?.[lang]?.[stainlessPath] !== undefined)
    .filter((e) => spec?.docs?.languages?.includes(e));
}

// FIXME(soon): this is obviously bad and should be supplied by the user
export function useIgnoredResources(): string[] {
  const IGNORED_PROPERTIES = ['(resource) webhooks > (model) unwrap_webhook_event > (schema)'];
  return IGNORED_PROPERTIES;
}

export function useResource(name: string) {
  return useSpec()?.resources?.[name];
}

export function useLanguage() {
  return useDocs().language;
}

export function useContentPanelLayout() {
  return useDocs().settings?.contentPanelLayout ?? 'double-pane';
}

export type DocsProviderProps = DocsContextType & { children: React.ReactNode };

export function DocsProvider({ spec, language, settings, children }: DocsProviderProps) {
  const value = React.useMemo(
    () => ({
      ...DocsContextDefaults,
      spec,
      settings: settings ?? DocsContextDefaults.settings,
      language: language ?? DocsContextDefaults.language,
    }),
    [spec, language, settings],
  );

  return <DocsContext value={value}>{children}</DocsContext>;
}
