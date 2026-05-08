import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import generateOgImage from '../image-gen/generate-og-image';
import { notFoundResponse } from '../utils';

const entries = await getCollection('docs');
// Map the entry array to an object with the page ID as key and the
// frontmatter data as value.
const pages = Object.fromEntries(entries.map(({ data, id }) => [id, { data }]));

export function getStaticPaths() {
  const prosePaths = entries.map((entry) => ({
    params: { slug: entry.id },
  }));
  return [...prosePaths];
}

export const GET: APIRoute = async ({ params }) => {
  const slug = params?.slug;
  if (!slug) return notFoundResponse();
  const page = pages[slug];

  if (page) {
    return generateOgImage({ slug, page });
  }

  return notFoundResponse();
};
