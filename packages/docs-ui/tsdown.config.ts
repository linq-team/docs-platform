import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: [
    './src/index.ts',
    './src/routing.ts',
    './src/utils.ts',
    './src/components/*',
    './src/components/scripts/*',
    './src/contexts/*',
    './src/style.ts',
    './src/markdown/*',
    './src/spec.ts',
    './src/languages/*',
    // stylesheets
    './src/styles/*.css',
    './src/styles.css',
  ],
  format: 'esm',
  dts: true,
  tsconfig: './tsconfig.build.json',
  platform: 'browser',
  fixedExtension: false,
  css: {
    splitting: true,
  },
});
