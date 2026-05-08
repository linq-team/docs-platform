import { useComponents as useBaseComponents } from './component-generics';
import type { AppComponents } from './component-types';

export const useComponents = () => useBaseComponents<AppComponents>();
