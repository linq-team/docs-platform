import type * as SDKJSON from '@stainless/sdk-json';
import { parseStainlessPath } from './routing';

export function flatResources(
  resources: Record<string, SDKJSON.Resource> | undefined,
  parents: SDKJSON.Resource[],
): { resource: SDKJSON.Resource; parents: SDKJSON.Resource[] }[] {
  return Object.keys(resources ?? {}).flatMap((key: string | number) => {
    const resource = resources![key]!;
    return [
      { resource, parents },
      ...(resource.subresources ? flatResources(resource.subresources, [...parents, resource]) : []),
    ];
  });
}

export function getResourceFromSpec(
  stainlessPath: string | string[],
  spec: SDKJSON.Spec,
): SDKJSON.Resource | null {
  if (typeof stainlessPath === 'string') {
    const parsed = parseStainlessPath(stainlessPath);
    if (!parsed?.resource) return null;
    stainlessPath = parsed.resource;
  }

  return (
    stainlessPath
      .slice(1)
      .reduce((acc, cur) => acc?.subresources?.[cur], spec.resources[stainlessPath[0]!]) ?? null
  );
}

export function isResourceEmpty(resource: SDKJSON.Resource) {
  return !(
    Object.values(resource.methods).length > 0 ||
    Object.values(resource.models).length > 0 ||
    Object.values(resource.subresources!).length > 0
  );
}

export type HttpBodyEncoding = 'json' | 'form-data' | 'unknown';

export function getBodyParams(
  decl: SDKJSON.HttpAST.HttpDeclFunction,
): { params: SDKJSON.ID[]; encoding: HttpBodyEncoding } | null {
  if (!decl.bodyParamsChildren) return null;

  const keys = Object.keys(decl.bodyParamsChildren);
  if (keys.length > 1) {
    console.warn('multiple bodyParams content types in ' + decl.stainlessPath + ':', keys);
  }

  const jsonKey = keys.find((e) => /[/+]json(;|$)/.test(e));
  if (jsonKey) {
    return {
      params: decl.bodyParamsChildren[jsonKey]!,
      encoding: 'json',
    };
  }

  const formDataKey = keys.find((e) => /^multipart\/form-data(;|$)/.test(e));
  if (formDataKey) {
    return {
      params: decl.bodyParamsChildren[formDataKey]!,
      encoding: 'form-data',
    };
  }

  const firstKey = keys[0];
  if (firstKey) {
    return {
      params: decl.bodyParamsChildren[firstKey]!,
      encoding: 'unknown',
    };
  }

  return null;
}

export type AssertExhaustive<T extends never> = T;
