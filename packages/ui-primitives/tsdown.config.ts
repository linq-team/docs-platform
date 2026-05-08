import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: [
    './src/index.ts',
    './src/scripts/index.ts',
    './src/components/**/*.tsx',
    // stylesheets
    './src/styles.css',
    './src/styles/theme.scss',
    './src/styles/starlight-compat.css',
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
