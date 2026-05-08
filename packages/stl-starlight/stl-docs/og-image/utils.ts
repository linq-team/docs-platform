import { ImageResponseOptions } from 'takumi-js/response';
import { OG_IMAGE_OPTIONS } from 'virtual:stainless-docs/docs-og-image';

const defaultRenderOptions: ImageResponseOptions & { width: number; height: number } = {
  width: 1200,
  height: 630,
};

export const renderOptions = {
  ...defaultRenderOptions,
  ...OG_IMAGE_OPTIONS?.renderOptions,
};

export const notFoundResponse = () => new Response('Not found', { status: 404 });
