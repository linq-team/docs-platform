import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    entry: [
      './src/index.tsx', //
      './src/context.tsx',
      './src/indexer.ts',
      './src/mcp.ts',
      './src/types.ts',
      './src/providers/*',
    ],
    format: 'esm',
    dts: true,
    tsconfig: './tsconfig.build.json',
    platform: 'browser',
    fixedExtension: false,
  },
]);
