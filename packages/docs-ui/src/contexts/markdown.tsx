import type React from 'react';
import { useMemo, createContext, use, Suspense } from 'react';
import { useLanguage } from './docs';

const HighlightLanguageMappings: Record<string, string> = {
  node: 'typescript',
  http: 'bash',
  cli: 'bash',
};

export type MarkdownContextValue = {
  highlight: (content: string, language: string) => string | Promise<string>;
  render: (content: string) => string | Promise<string>;
};

export const MarkdownContext = createContext<MarkdownContextValue>({
  highlight: (content) => content,
  render: (content) => content,
});

export const useMarkdownContext = () => use(MarkdownContext);

export function useRenderMarkdown(content?: string) {
  const { render } = use(MarkdownContext);
  return useMemo(() => {
    if (!content) return undefined;
    const rendered = render(content);
    return typeof rendered === 'string' ? rendered : use(rendered);
  }, [content, render]);
}

export function useHighlight(content: string, language?: string) {
  const { highlight } = use(MarkdownContext);
  const defaultLanguage = useLanguage();
  const lang = language ?? defaultLanguage;

  return useMemo(() => {
    if (lang === 'none') return content;
    const highlightLanguage = HighlightLanguageMappings[lang] ?? lang;
    const rendered = highlight(content, highlightLanguage);
    return typeof rendered === 'string' ? rendered : use(rendered);
  }, [content, highlight, lang]);
}

export type MarkdownProviderProps = MarkdownContextValue & {
  children: React.ReactNode;
};

export function MarkdownProvider({ render, highlight, children }: MarkdownProviderProps) {
  const value = useMemo(() => ({ render, highlight }), [render, highlight]);
  return <MarkdownContext value={value}>{children}</MarkdownContext>;
}

function SuspensefulMarkdownProviderInner({
  value,
  children,
}: {
  value: Promise<MarkdownContextValue>;
  children: React.ReactNode;
}) {
  const resolvedValue = use(value);
  return <MarkdownContext value={resolvedValue}>{children}</MarkdownContext>;
}
export function SuspensefulMarkdownProvider({
  value,
  children,
}: React.ComponentProps<typeof SuspensefulMarkdownProviderInner>) {
  return (
    // before promise resolves, use the default MarkdownContext value, which is identity functions
    <Suspense fallback={<>{children}</>}>
      <SuspensefulMarkdownProviderInner value={value}>{children}</SuspensefulMarkdownProviderInner>
    </Suspense>
  );
}
