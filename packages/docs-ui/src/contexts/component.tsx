import React from 'react';
import * as DefaultComponents from '../components';
import * as DefaultLanguage from '../languages';
import {
  ComponentProvider as GenericComponentProvider,
  customizeComponents,
  type ComponentsContextType,
} from './component-generics';

export type AppComponents = typeof DefaultComponents;
export type AppLanguage = typeof DefaultLanguage;

export const defaultContextValue: ComponentsContextType<AppComponents, AppLanguage> = {
  components: DefaultComponents,
  language: DefaultLanguage,
};

export function ComponentProvider({
  components,
  language,
  children,
}: {
  components?: Partial<AppComponents>;
  language?: { [K in keyof AppLanguage]?: Partial<AppLanguage[K]> };
  children: React.ReactNode;
}) {
  const value = React.useMemo(
    () => customizeComponents(defaultContextValue, { components, language }),
    [components, language],
  );
  return <GenericComponentProvider value={value}>{children}</GenericComponentProvider>;
}
