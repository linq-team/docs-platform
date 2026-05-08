// This file should never import from ../components or ../languages to avoid circular dependencies

import * as React from 'react';
import { createStrictContext } from '../hooks/use-strict-context';

type DeepPartialMap<L> = { [K in keyof L]?: Partial<L[K]> };

export type ComponentsContextType<C, L> = {
  components: C;
  language: L;
};

const [Provider, useComponentContext] = createStrictContext<ComponentsContextType<any, any>>('Component');

export function useComponents<C = unknown>(): C {
  return useComponentContext().components as C;
}

export function customizeComponents<C, L>(
  defaults: { components: C; language: L },
  overrides: { components?: Partial<C>; language?: DeepPartialMap<L> } = {},
): { components: C; language: L } {
  const mergedComponents = { ...defaults.components, ...(overrides.components ?? {}) } as C;

  const mergedLanguage = Object.keys(defaults.language as Record<string, unknown>).reduce((acc, key) => {
    acc[key] = { ...(defaults.language as any)[key], ...((overrides.language as any)?.[key] ?? {}) };
    return acc;
  }, {} as any);

  return { components: mergedComponents, language: mergedLanguage };
}

export function ComponentProvider<C, L>({
  value,
  children,
}: {
  value: ComponentsContextType<C, L>;
  children: React.ReactNode;
}) {
  return <Provider value={value}>{children}</Provider>;
}

export { useComponentContext };
