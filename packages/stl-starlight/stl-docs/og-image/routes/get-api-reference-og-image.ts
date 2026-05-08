import { generateAllDocsRoutes } from '@stainless-api/docs/generate-docs-routes';
import type { APIRoute } from 'astro';
import generateApiReferenceOgImage from '../image-gen/generate-api-reference-og-image';
import { notFoundResponse } from '../utils';
import { RESOLVED_API_REFERENCE_PATH } from 'virtual:stl-starlight-virtual-module';

const routes = await generateAllDocsRoutes();

export function getStaticPaths() {
  return routes.map((route) => ({
    params: { slug: `${route.params.slug}` },
    ...route.props,
  }));
}

export const GET: APIRoute = async ({ params }) => {
  const slug = params?.slug;
  if (!slug) return notFoundResponse();

  // Remove slashes from the start and end of RESOLVED_API_REFERENCE_PATH
  const apiBasePath = RESOLVED_API_REFERENCE_PATH?.replace(/^\/|\/$/g, '');

  const slugWithoutBasePath = apiBasePath
    ? slug.startsWith(`${apiBasePath}/`)
      ? slug.slice(apiBasePath.length + 1)
      : slug
    : slug;

  const apiReferenceRoute = routes.find((r) => r.params.slug === slugWithoutBasePath);

  if (apiReferenceRoute) {
    return generateApiReferenceOgImage({ apiReferenceRoute, slug });
  }

  return notFoundResponse();
};
