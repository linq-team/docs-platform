import { useLanguage } from './docs';
import { LanguageComponentDefinition } from '../languages';
import { useComponentContext } from './component-generics';

// DO NOT re-export component contexts from here. Only export generics.
export * from './navigation';
export * from './markdown';
export * from './component-generics';
export * from './docs';

export function useLanguageComponents(): LanguageComponentDefinition {
  const language = useLanguage();
  const context = useComponentContext();
  const definition = context.language[language];
  if (!definition) {
    throw new Error(`Language component definition not found for language: ${language}`);
  }
  return definition;
}
