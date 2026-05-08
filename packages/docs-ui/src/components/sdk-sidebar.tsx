import * as React from 'react';
import type * as SDKJSON from '@stainless/sdk-json';
import { useNavigation } from '../contexts';
import { isResourceEmpty } from '../utils';
import { StlSidebar, StlSidebarEntry, StlSidebarGroup } from './stl-sidebar';
import { Badge, getHttpMethod } from '@stainless-api/ui-primitives';

export type SDKSidebarProps = {
  resources: SDKJSON.Resource[];
};

function resourceToEntry(resource: SDKJSON.Resource, selectedPath: string | undefined): StlSidebarEntry {
  const result: StlSidebarGroup = {
    type: 'group',
    collapsed: false,
    label: resource.title,
    entries: [],
    target: { type: 'stainlessPath', stainlessPath: resource.stainlessPath },
    isCurrent: selectedPath === resource.stainlessPath,
  };

  for (const method of Object.values(resource.methods)) {
    const httpMethod = getHttpMethod(method.httpMethod);

    result.entries.push({
      type: 'link',
      target: { type: 'stainlessPath', stainlessPath: method.stainlessPath },
      label: method.title,
      isCurrent: selectedPath === method.stainlessPath,
      icon: httpMethod ? <Badge.HTTP method={httpMethod} iconOnly size="sm" /> : undefined,
    });
  }

  for (const subresource of Object.values(resource.subresources ?? {})) {
    result.entries.push(resourceToEntry(subresource, selectedPath));
  }

  return result;
}

/**
 * Given some SDKJSON.Resources, calls into StlSidebar with the appropriate sidebar entries.
 */
export function SDKSidebar({ resources }: SDKSidebarProps) {
  const { selectedPath } = useNavigation();

  const entries = React.useMemo(
    (): StlSidebarEntry[] =>
      resources
        .filter((resource) => !isResourceEmpty(resource))
        .map((resource) => resourceToEntry(resource, selectedPath)),
    [resources, selectedPath],
  );

  return <StlSidebar entries={entries} />;
}
