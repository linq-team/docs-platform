import * as React from 'react';
import { createRoot } from 'react-dom/client';
import * as marked from 'marked';
import hljs from 'highlight.js';

import type { Spec } from '@stainless/sdk-json';

import {
  DocsProvider,
  NavigationProvider,
  MarkdownProvider,
  useSpec,
  NavigationHandler,
} from '@stainless-api/docs-ui/contexts';
import { useComponents } from '@stainless-api/docs-ui/contexts/use-components';

import {
  DocsLanguage,
  generateRoute,
  getResource,
  parseStainlessPath,
  scrollToPath,
} from '@stainless-api/docs-ui/routing';

import '@stainless-api/docs-ui/styles.css';
// hljs colors
import '../../packages/ai-chat/src/components/hljs-github.css';

import specUrl from './specs/spec.json?url';
import { SearchProvider } from '@stainless-api/docs-search/context';
import { ComponentProvider } from '@stainless-api/docs-ui/contexts/component';
import type { SearchSettings } from '@stainless-api/docs-search/types';

const specPromise = (async () => (await (await fetch(specUrl)).json()) as Spec)();

const appId = import.meta.env['VITE_PUBLIC_ALGOLIA_APP_ID'];
const searchKey = import.meta.env['VITE_PUBLIC_ALGOLIA_SEARCH_KEY'];
const indexName = import.meta.env['VITE_PUBLIC_ALGOLIA_INDEX'];
const searchSettings = { appId, searchKey, indexName } satisfies SearchSettings;
const envLanguage = (import.meta.env['VITE_LANGUAGE'] as DocsLanguage) || 'typescript';
const envSelectedPath = import.meta.env['VITE_SELECTED_PATH'] || '(resource) projects > (method) create';
const envResource = import.meta.env['VITE_RESOURCE'] || 'projects';

function render(content: string) {
  return marked.parse(content, { gfm: true }) as string;
}

function highlight(content: string, language: string) {
  return `<pre class="hljs-github language-${language}"><code>${hljs.highlight(content, { language }).value}</code></pre>`;
}

function App({ resource }: { resource: string }) {
  const { SDKMethod } = useComponents();

  const spec = useSpec();
  const value = spec?.resources?.[resource];
  const method = value?.methods?.['create'];
  if (!method) throw new Error(`Method 'create' not found`);

  return value && <SDKMethod method={method} />;
}

function Root() {
  const [language, setLanguage] = React.useState<DocsLanguage>(envLanguage);
  const [selectedPath, setSelectedPath] = React.useState<string>(envSelectedPath);
  const [resource, setResource] = React.useState<string>(envResource);

  const handler = (e: PopStateEvent) => {
    const state: unknown = e.state;
    if (!state || typeof state !== 'object') return;
    if (!('stainlessPath' in state) || typeof state.stainlessPath !== 'string') return;
    if (!('language' in state) || typeof state.language !== 'string') return;
    const { stainlessPath, language } = state;
    if (!stainlessPath) return;

    e.preventDefault();
    setLanguage(language as DocsLanguage);
    setSelectedPath(stainlessPath);
    const resourceObject = getResource(stainlessPath);
    if (!resourceObject) throw new Error(`Resource '${stainlessPath}' not found`);
    setResource(resourceObject);
    scrollToPath(stainlessPath);
  };

  React.useEffect(() => {
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const navigate: NavigationHandler = (e, { stainlessPath, language }) => {
    if (!stainlessPath) return;
    e?.preventDefault();

    const parsed = parseStainlessPath(stainlessPath);
    if (!parsed || !parsed.resource || !parsed.resource[0])
      throw new Error(`Resource '${stainlessPath}' not found`);

    setLanguage(language);
    setSelectedPath(stainlessPath);
    setResource(parsed.resource[0]);
    scrollToPath(stainlessPath);

    const path = generateRoute('/api', language, stainlessPath);
    window.history.pushState({ stainlessPath, language }, '', path);
  };

  const spec = React.use(specPromise);

  return (
    <ComponentProvider components={{}}>
      <DocsProvider spec={spec} language={language}>
        <SearchProvider
          settings={searchSettings}
          pageFind={`${import.meta.env.BASE_URL}/pagefind/pagefind.js`.replace(/\/+/g, '/')}
          onSelect={(path) => console.log('Selected:', path)}
        >
          <NavigationProvider basePath="/api" selectedPath={selectedPath} onNavigate={navigate}>
            <MarkdownProvider render={render} highlight={highlight}>
              <App resource={resource} />
            </MarkdownProvider>
          </NavigationProvider>
        </SearchProvider>
      </DocsProvider>
    </ComponentProvider>
  );
}

const rootEl = document.getElementById('root');
createRoot(rootEl!).render(
  <React.Suspense fallback={'Loading...'}>
    <Root />
  </React.Suspense>,
);
