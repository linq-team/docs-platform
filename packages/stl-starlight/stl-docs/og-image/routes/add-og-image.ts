import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import path from 'path';
import { OG_IMAGE_OPTIONS } from 'virtual:stainless-docs/docs-og-image';
import { renderOptions } from '../utils';

export const onRequest = defineRouteMiddleware((context) => {
  const base = OG_IMAGE_OPTIONS?.basePath || '';
  // Get the URL of the generated image for the current page using its ID and
  // append the `.png` file extension.
  const ogImageUrl = new URL(
    path.posix.join(
      import.meta.env.BASE_URL ?? '',
      base,
      'og',
      `${context.locals.starlightRoute.id || 'index'}.png`,
    ),
    context.site,
  );

  // Get the array of all tags to include in the `<head>` of the current page.
  const { head } = context.locals.starlightRoute;

  // Add the `<meta/>` tags for the Open Graph images.
  head.push({
    tag: 'meta',
    attrs: { property: 'og:image', content: ogImageUrl.href },
  });
  head.push({
    tag: 'meta',
    attrs: { name: 'twitter:image', content: ogImageUrl.href },
  });
  head.push({
    tag: 'meta',
    attrs: { name: 'twitter:card', content: 'summary_large_image' },
  });

  head.push({
    tag: 'meta',
    attrs: { property: 'og:image:width', content: renderOptions.width.toString() },
  });
  head.push({
    tag: 'meta',
    attrs: { property: 'og:image:height', content: renderOptions.height.toString() },
  });
});
