import { StlSidebarEntry } from '@stainless-api/docs-ui/components';
import { SidebarEntry } from '../pagination/util';
import { ReactNode } from 'react';
import { getHttpMethod } from '@stainless-api/ui-primitives';

function getIcon(entry: SidebarEntry): ReactNode | undefined {
  if (entry.type !== 'link') {
    return undefined;
  }
  const methodAttr = entry.attrs['data-stldocs-method'];
  const httpMethod = getHttpMethod(methodAttr);
  const classes = `stl-ui-badge stl-ui-badge--size-sm stl-sidebar-icon`;

  if (httpMethod) {
    const methodClass = `stl-ui-badge--http-${httpMethod.toLowerCase()}`;
    return (
      <span className={`${classes} stl-ui-badge--http ${methodClass}`} role="img" aria-label={httpMethod} />
    );
  }

  // special handling for the webhooks resource overview page
  if (entry.attrs['data-stldocs-overview'] === 'webhooks') {
    return (
      <span
        className={`${classes} stl-ui-badge--intent-info stl-sidebar-icon--braces`}
        role="img"
        aria-label="Webhook"
      />
    );
  }

  // Support empty string as method to show generic "Function" badge
  else if (methodAttr === '') {
    return (
      <span
        className={`${classes} stl-ui-badge--intent-info stl-sidebar-icon--function`}
        role="img"
        aria-label="Method"
      />
    );
  }
  return undefined;
}

export function convertAstroSidebarToStl(entries: SidebarEntry[]): StlSidebarEntry[] {
  return entries.map((entry): StlSidebarEntry => {
    if (entry.type === 'link') {
      const icon = getIcon(entry);
      return {
        type: 'link',
        attrs: entry.attrs,
        label: entry.label,
        target: {
          type: 'href',
          href: entry.href,
        },
        isCurrent: entry.isCurrent,
        icon,
      };
    } else {
      return {
        type: 'group',
        label: entry.label,
        collapsed: entry.collapsed,
        entries: convertAstroSidebarToStl(entry.entries),
      };
    }
  });
}
