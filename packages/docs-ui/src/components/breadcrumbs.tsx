import type * as SDKJSON from '@stainless/sdk-json';
import { Languages } from '../routing';
import { ChevronRight } from 'lucide-react';
import style from '../style';
import { Join } from './primitives';

type Breadcrumb = { title: string; href: string };

type BreadcrumbConfig = {
  includeCurrentPage?: boolean;
};

export function generateApiBreadcrumbs(fullPath: string, spec: any, basePath: string): Breadcrumb[] | null {
  // Normalize paths. Mostly for basePath since it's configurable and may have trailing slashes
  const cleanBasePath = basePath.replace(/\/+$/, '');
  const cleanPath = fullPath.replace(/\/+$/, '');

  if (!cleanPath.startsWith(cleanBasePath)) return null;

  // Slice off the basePath
  const rest = cleanPath.slice(cleanBasePath.length).split('/').filter(Boolean);

  const breadcrumbs: Breadcrumb[] = [];
  let href = cleanBasePath;
  let i = 0;

  // Handle sdk language prefix
  if (Languages.includes(rest[0] as (typeof Languages)[number])) {
    href += `/${rest[0]}`;
    i++;
  }

  // Always start with API Reference
  breadcrumbs.push({ title: 'API Reference', href });

  let currentSpec = spec;

  while (i < rest.length) {
    const idType = rest[i];
    const idValue = rest[i + 1];
    if (!idType || !idValue || !currentSpec?.[idType]?.[idValue]) break;

    currentSpec = currentSpec[idType][idValue];
    href += `/${idType}/${idValue}`;

    // This should always exist, but just in case fallback to the raw url value
    const title = (idType === 'methods' ? currentSpec.summary : currentSpec.title) ?? idValue;

    breadcrumbs.push({
      title,
      href,
    });

    i += 2;
  }

  return breadcrumbs;
}

export function SDKBreadcrumbs({
  spec,
  currentPath,
  basePath = '/api',
  config = { includeCurrentPage: false },
}: {
  spec: SDKJSON.Spec;
  currentPath: string;
  basePath?: string;
  config?: BreadcrumbConfig | null;
}) {
  const breadcrumbs = generateApiBreadcrumbs(currentPath, spec, basePath);

  if (!breadcrumbs || breadcrumbs.length === 0) return null;

  if (!config?.includeCurrentPage && breadcrumbs.length > 1) {
    breadcrumbs.pop();
  }

  const items = breadcrumbs.map((crumb, index) => (
    <div key={index} className={style.BreadcrumbsItem}>
      <a href={crumb.href} className={style.BreadcrumbsLink}>
        {crumb.title}
      </a>
    </div>
  ));

  return (
    <div className={style.Breadcrumbs}>
      <Join limit={breadcrumbs.length} items={items}>
        <ChevronRight />
      </Join>
    </div>
  );
}
