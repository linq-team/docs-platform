import { getCollection } from 'astro:content';
import { z } from 'astro/zod';
import { ImageResponse } from 'takumi-js/response';
import { Tabs } from '@stainless-api/docs/docs-config';
import OpenGraphImage from 'virtual:stainless-docs/docs-og-image/components/OpenGraphImage';
import { OG_IMAGE_OPTIONS } from 'virtual:stainless-docs/docs-og-image';
import { TABS } from 'virtual:stl-docs-virtual-module';
import getLogoDataUrl from './get-logo-url';
import { stainlessDocsSchemaExtension } from '../../schema-extension';
import { notFoundResponse, renderOptions } from '../utils';

type GetcollectionReturnType = Awaited<ReturnType<typeof getCollection<'docs'>>>[number];

type PageEntry = {
  data: GetcollectionReturnType['data'] & z.infer<typeof stainlessDocsSchemaExtension>;
};

let contentEntriesCache: { id: string }[] | null = null;

async function getContentEntries(): Promise<{ id: string }[]> {
  if (contentEntriesCache === null) {
    contentEntriesCache = await getCollection('docs').then((entries) =>
      entries.map((entry) => ({ id: entry.id })),
    );
  }
  return contentEntriesCache ?? [];
}

async function resolveAutogenerateEntry(autogenerate: {
  directory: string;
}): Promise<NonNullable<Tabs[0]['sidebar']>> {
  const entries = await getContentEntries();
  const directoryPrefix = autogenerate.directory.endsWith('/')
    ? autogenerate.directory
    : `${autogenerate.directory}/`;

  const matchingEntries = entries
    .filter((entry) => {
      return entry.id === autogenerate.directory || entry.id.startsWith(directoryPrefix);
    })
    .map((entry) => entry.id)
    .sort();

  return matchingEntries;
}

const findBreadcrumbsInSidebar = async (
  data: NonNullable<Tabs[0]['sidebar']>,
  slug: string,
): Promise<string[] | null> => {
  for (const entry of data) {
    if (typeof entry === 'string') {
      if (entry === slug) {
        return [];
      }
    } else {
      if ('link' in entry && entry.link === slug) {
        return [entry.label];
      }

      if ('autogenerate' in entry && entry.autogenerate) {
        const resolvedItems = await resolveAutogenerateEntry(entry.autogenerate);
        const breadcrumbs = await findBreadcrumbsInSidebar(resolvedItems, slug);
        if (breadcrumbs) {
          return breadcrumbs;
        }
        continue;
      }

      const children = ('sidebar' in entry && entry.sidebar) || ('items' in entry && entry.items);
      if (children) {
        const breadcrumbs = await findBreadcrumbsInSidebar(children as NonNullable<Tabs[0]['sidebar']>, slug);
        if (breadcrumbs) {
          return [entry.label!, ...breadcrumbs];
        }
      }
    }
  }
  return null;
};

const findBreadcrumbs = async (data: Tabs, slug: string): Promise<string[] | undefined> => {
  for (const tab of data) {
    if (tab.link === slug) {
      return [tab.label];
    }
    if (!tab.sidebar) continue;
    const breadcrumbs = await findBreadcrumbsInSidebar(tab.sidebar, slug);
    if (breadcrumbs) {
      return [tab.label, ...breadcrumbs.map((label) => label)];
    }
  }
  return undefined;
};

async function generateOgImage({ page, slug }: { page?: PageEntry; slug: string }) {
  if (!page) {
    return notFoundResponse();
  }

  const logoDataUrl = getLogoDataUrl({
    logo: page.data.ogImageOptions?.logo,
    theme: page.data.ogImageOptions?.theme || OG_IMAGE_OPTIONS?.theme,
  });

  const breadcrumbs = page.data.template !== 'splash' ? await findBreadcrumbs(TABS, slug) : undefined;
  return new ImageResponse(
    <OpenGraphImage
      title={page.data.ogImageOptions?.title ?? page.data.title}
      description={page.data.ogImageOptions?.description ?? page.data.description}
      logo={logoDataUrl}
      theme={page.data.ogImageOptions?.theme || OG_IMAGE_OPTIONS?.theme}
      breadcrumbs={breadcrumbs}
    />,
    renderOptions,
  );
}

export default generateOgImage;
