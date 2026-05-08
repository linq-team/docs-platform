import React from 'react';

export function createStrictContext<T>(displayName: string) {
  const Context = React.createContext<T | null>(null);
  Context.displayName = displayName;

  function useStrictContext(): T {
    const context = React.use(Context);
    if (context === null) {
      throw new Error(`use${displayName} must be used within a ${displayName}Provider`);
    }
    return context;
  }

  return [Context.Provider, useStrictContext] as const;
}
