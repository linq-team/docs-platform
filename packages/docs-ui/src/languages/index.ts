import { type ReactNode } from 'react';
import type { DeclarationNode, Resource, Type } from '@stainless/sdk-json';

import * as typescript from './typescript';
import * as java from './java';
import { PropertyProps } from '../components';

export * as go from './go';
export * as python from './python';
export * as ruby from './ruby';
export * as http from './http';
export * as csharp from './csharp';
export * as php from './php';
export * as cli from './cli';
export * as terraform from './terraform';

export { typescript, java };
export const node = typescript;
export const kotlin = java;

export type PropertyFn = (params: PropertyProps) => ReactNode;

export interface LanguageComponentDefinition {
  Declaration: (props: { decl: DeclarationNode }) => ReactNode;
  Property: (props: { decl: DeclarationNode; children: PropertyFn }) => ReactNode;
  TypeName: (props: { type: Type; optional?: boolean }) => ReactNode;
  Type: (props: { type: Type; optional?: boolean }) => ReactNode;
  MethodSignature: (props: { decl: DeclarationNode }) => ReactNode;
  MethodInfo?: (props: { decl: DeclarationNode; children?: ReactNode }) => ReactNode;
  Resource?: (props: { resource: Resource; parents?: Resource[] }) => ReactNode;
}
