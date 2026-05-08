import { defineConfig } from 'eslint/config';
import { config as baseConfig } from './base.ts';
import { reactConfig } from './react.ts';

import tseslint from 'typescript-eslint';
import pluginAstro from 'eslint-plugin-astro';

/**
 * An Astro ESLint configuration for the repository.
 */
export const config = defineConfig(
  baseConfig,

  pluginAstro.configs.recommended,

  // Run react rules on .jsx/.tsx files but not .astro files
  { files: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'], extends: reactConfig },

  { ignores: ['.astro/**', 'public/'] },

  {
    files: ['**/*.astro'],
    rules: tseslint.configs.disableTypeChecked.rules,
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: true,
      },
    },
  },
);
