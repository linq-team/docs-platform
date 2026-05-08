import { defineConfig } from 'eslint/config';
import { config as baseConfig } from './base.ts';
import pluginReact from '@eslint-react/eslint-plugin';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import * as pluginMdx from 'eslint-plugin-mdx';

export const reactConfig = defineConfig(
  pluginReact.configs['strict-type-checked'],

  {
    rules: {
      '@eslint-react/no-array-index-key': 'off',
      '@eslint-react/dom-no-dangerously-set-innerhtml': 'off',
      '@eslint-react/static-components': 'off',
    },
  },

  {
    plugins: {
      'react-hooks': {
        ...pluginReactHooks,
        configs: {},
      },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...pluginReactHooks.configs.flat['recommended-latest'].rules,
      'react-hooks/exhaustive-deps': 'error',
      // React scope no longer necessary with new JSX transform.
      'react/react-in-jsx-scope': 'off',
    },
  },

  // disable-type-checked for mdx
  {
    files: pluginMdx.flat.files,
    rules: pluginReact.configs['disable-type-checked'].rules,
  },
);

/**
 * A custom ESLint configuration for libraries that use React.
 */
export const config = defineConfig(...baseConfig, ...reactConfig);
