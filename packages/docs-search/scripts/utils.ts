import { DocsLanguage, Languages } from '@stainless-api/docs-ui/routing';

export function isDocsLanguage(language: string | undefined | null): language is DocsLanguage {
  return language ? Languages.includes(language as DocsLanguage) : false;
}
