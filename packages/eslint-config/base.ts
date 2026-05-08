import { defineConfig } from 'eslint/config';
import js from '@eslint/js';

import tseslint from 'typescript-eslint';
import pluginTurbo from 'eslint-plugin-turbo';
import * as pluginMdx from 'eslint-plugin-mdx';

export const config = defineConfig(
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },

  {
    rules: {
      // handled by TypeScript
      'no-undef': 'off',
      // handled by prettier
      'no-irregular-whitespace': 'off',
      // allow unused vars when used to omit properties from object destructuring rest
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },

  {
    plugins: { turbo: pluginTurbo },
    rules: { 'turbo/no-undeclared-env-vars': 'warn' },
  },

  { ignores: ['**/dist', '**/worker-configuration.d.ts'] },

  {
    ...pluginMdx.flat,
    rules: {
      ...pluginMdx.flat.rules,
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      ...tseslint.configs.disableTypeChecked.rules,
    },
    languageOptions: {
      ...pluginMdx.flat.languageOptions,
      parserOptions: {
        ...(typeof pluginMdx.flat.languageOptions?.parserOptions === 'object' &&
          pluginMdx.flat.languageOptions.parserOptions),
        ecmaFeatures: { jsx: true },
      },
    },
  },
);
