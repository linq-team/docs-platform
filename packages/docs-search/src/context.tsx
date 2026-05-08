import { useCallback, use, createContext } from 'react';
import { search } from './providers/algolia';
import { SearchParams, SearchSettings } from './types';

function createStrictContext<T>(displayName: string) {
  const Context = createContext<T | null>(null);
  Context.displayName = displayName;

  function useStrictContext(): T {
    const context = use(Context);
    if (context === null) {
      throw new Error(`use${displayName} must be used within a ${displayName}Provider`);
    }
    return context;
  }

  return [Context.Provider, useStrictContext] as const;
}

export type SearchContextType = {
  settings: SearchSettings;
  onSelect?: (stainlessPath: string) => void;
  pageFind?: string;
};

const [Provider, useSearchContext] = createStrictContext<SearchContextType>('SearchContext');

export { useSearchContext };

export function useSearch() {
  const { settings } = useSearchContext();
  return useCallback((params: SearchParams) => search({ settings, params }), [settings]);
}

export type SearchProviderProps = SearchContextType & {
  children: React.ReactNode;
};

export function SearchProvider({ children, ...props }: SearchProviderProps) {
  return <Provider value={props}>{children}</Provider>;
}
