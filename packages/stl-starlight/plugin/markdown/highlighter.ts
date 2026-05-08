import {
  createHighlighter,
  type HighlighterGeneric,
  type ThemeInput,
  type BundledTheme,
  type BundledLanguage,
} from 'shiki';
import { HIGHLIGHT_THEMES } from 'virtual:stl-starlight-virtual-module';
import { SupportedLanguageSyntaxes } from '@stainless-api/docs-ui/routing';
import type { CreateShikiHighlighterOptions } from '@astrojs/markdown-remark';

const STAINLESS_DOCS_JSON_THEME = {
  name: 'stainless-docs-json',
  colors: {
    'editor.background': 'var(--stl-color-background)',
    'editor.foreground': 'var(--stl-color-foreground)',
  },

  tokenColors: [
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: 'var(--stl-color-foreground-muted)' },
    },
    // numbers, booleans, null
    {
      scope: ['constant.numeric', 'constant.language'],
      settings: { foreground: 'var(--stl-color-orange-foreground)' },
    },
    // strings
    {
      scope: ['string', 'string.quoted', 'string.template'],
      settings: { foreground: 'var(--stl-color-green-foreground)' },
    },
    // Keys, brackets
    {
      scope: ['support.type', 'meta'],
      settings: { foreground: 'var(--stl-color-foreground)' },
    },
    // brackets
    {
      scope: ['meta'],
      settings: { foreground: 'var(--stl-color-foreground-muted)' },
    },
    // built-in types
    {
      scope: ['support.type.builtin'],
      settings: { foreground: 'var(--stl-color-purple-foreground)' },
    },
  ],
} satisfies ThemeInput;

// singleton
let astroShikiHighlighter:
  | HighlighterGeneric<BundledLanguage, BundledTheme>
  | Promise<HighlighterGeneric<BundledLanguage, BundledTheme>>
  | null = null;
async function getAstroHighlighter() {
  if (astroShikiHighlighter) {
    return astroShikiHighlighter;
  }

  astroShikiHighlighter = createHighlighter({
    themes: [
      HIGHLIGHT_THEMES?.dark ?? 'github-dark',
      HIGHLIGHT_THEMES?.light ?? 'github-light',
      STAINLESS_DOCS_JSON_THEME,
    ],
    langs: SupportedLanguageSyntaxes,
  });

  return astroShikiHighlighter;
}

function runHighlight({
  highlighter,
  content,
  language,
  themes,
}: {
  highlighter: HighlighterGeneric<BundledLanguage, BundledTheme>;
  content: string;
  language?: string;
  themes?: CreateShikiHighlighterOptions['themes'] | Record<string, 'stainless-docs-json'>;
}) {
  return highlighter.codeToHtml(content, {
    lang: language ?? 'javascript',
    themes:
      // Default to user-provided themes except in case of json
      themes ??
      (language === 'JSON'
        ? { light: 'stainless-docs-json', dark: 'stainless-docs-json' }
        : HIGHLIGHT_THEMES) ??
      {},
  });
}

export async function highlight(content: string, language?: string) {
  const highlighter = await getAstroHighlighter();
  return runHighlight({ highlighter, content, language });
}
