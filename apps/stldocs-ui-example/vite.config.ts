import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  ssr: {
    noExternal: ['@stainless-api/docs', '@stainless-api/docs-ui', '@stainless-api/ui-primitives'],
  },
  plugins: [react()],
});
