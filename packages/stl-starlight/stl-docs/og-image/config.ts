// Exported utilites for @stainless-api/docs consumers

import type { ImageResponseOptions } from 'takumi-js/response';
import type { CSSProperties } from 'react';

export type OGImageConfig = {
  /**
   * Path to source file for logo to include in generated OG images
   *
   * example: './src/assets/og-logo.png'
   */
  logo?: string;
  /**
   * Takumi ImageResponseOptions for OG image generation
   */
  renderOptions?: Omit<ImageResponseOptions, 'fonts'>;
  /**
   * A background image for the OG images. A tailwind `tw` string can be provided to style the image.
   *
   * example: './src/assets/og-background-logo.png'
   */
  backgroundImage?: {
    /**
     * Path to source file for background image
     *
     * example: './src/assets/og-background-logo.png'
     */
    src: string;
    /**
     * Style applied to the background image using React CSSProperties
     *
     * example: { right: -20px }
     */
    style?: CSSProperties;
  };
  /** Preferred theme for the OG images
   */
  theme?: 'light' | 'dark';
  /** The base path for the docs site. To be used when setting `base` within your astro config is not sufficient depending on hosting strategy.
   * If your docs site is hosted at a subpath (e.g. example.com/docs), set the basePath to '/docs'.
   *
   * example: '/docs'
   */
  basePath?: string;
  /**
   * Override the default OG image components with custom implementations.
   * Each value should be a file path to a component that exports a default React component.
   *
   * You can import the default components from `@stainless-api/docs/og-image/components/OpenGraphImage`
   * and `@stainless-api/docs/og-image/components/OpenGraphFunctionSignature` to compose with them.
   */
  components?: {
    OpenGraphImage?: string;
    OpenGraphFunctionSignature?: string;
  };
};
