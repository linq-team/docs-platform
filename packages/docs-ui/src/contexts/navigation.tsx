import * as React from 'react';
import { DocsLanguage } from '../routing';

export type NavigationHandler = (
  ev: React.MouseEvent | null,
  opts: {
    href: string;
    language: DocsLanguage;
    stainlessPath: string;
    scroll: boolean;
  },
) => void;

export type NavigationContextType = {
  basePath?: string;
  selectedPath?: string;
  navigationPath?: string[];
  onNavigate?: NavigationHandler;
};

const Defaults: NavigationContextType = {
  basePath: '/',
};

const NavigationContext = React.createContext<NavigationContextType>(Defaults);

export function useNavigation() {
  return React.use(NavigationContext);
}

export type NavigationProviderProps = NavigationContextType & {
  children: React.ReactNode;
};

export function NavigationProvider({
  basePath,
  selectedPath,
  onNavigate,
  children,
}: NavigationProviderProps) {
  const value = { ...Defaults, onNavigate, basePath, selectedPath };

  return <NavigationContext value={value}>{children}</NavigationContext>;
}
