/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_ALGOLIA_APP_ID: string;
  readonly VITE_PUBLIC_ALGOLIA_SEARCH_KEY: string;
  readonly VITE_PUBLIC_ALGOLIA_INDEX: string;
  readonly VITE_LANGUAGE: string;
  readonly VITE_SELECTED_PATH: string;
  readonly VITE_RESOURCE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
