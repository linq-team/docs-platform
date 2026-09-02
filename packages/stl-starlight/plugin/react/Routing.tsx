import * as React from 'react';
import { getDocsLanguages } from '../helpers/multiSpec';

import { astroMarkdownRenderText } from '../markdown';
import { highlight } from '../markdown/highlighter';

import type { MarkdownHeading } from 'astro';
import type * as SDKJSON from '@stainless/sdk-json';
import { LanguageNames, type DocsLanguage } from '@stainless-api/docs-ui/routing';

import { parseStainlessPath, getLanguageSnippet } from '@stainless-api/docs-ui/routing';

import {
  DocsProvider,
  MarkdownProvider,
  NavigationProvider,
  type ContentPanelLayout,
} from '@stainless-api/docs-ui/contexts';

import { flatResources, getResourceFromSpec } from '@stainless-api/docs-ui/utils';

import {
  SDKMethod,
  SDKResource,
  type SDKRequestTitleProps,
  SDKBreadcrumbs,
  SDKIcon,
  SDKOverview,
  SDKLanguageBlock,
} from '@stainless-api/docs-ui/components';

import { Dropdown } from '@stainless-api/docs/components';

import {
  RESOLVED_API_REFERENCE_PATH,
  BREADCRUMB_CONFIG,
  PROPERTY_SETTINGS,
  ENABLE_CONTEXT_MENU,
  EXPERIMENTAL_COLLAPSIBLE_METHOD_DESCRIPTIONS,
  MIDDLEWARE,
} from 'virtual:stl-starlight-virtual-module';
import style from '@stainless-api/docs-ui/style';
import {
  SnippetCode,
  SnippetContainer,
  SnippetButtons,
  SnippetFooter,
  SnippetResponse,
} from '../components/SnippetCode';
import type { StlStarlightMiddleware } from '../middlewareBuilder/stainlessMiddleware';
import { ComponentProvider } from '@stainless-api/docs-ui/contexts/component';
import { AIDropdown } from '../../stl-docs/components/AIDropdown';
import { ChevronsUpDownIcon } from 'lucide-react';
import { MethodDescription } from '../components/MethodDescription';

export function buildPageNavigation(resource: SDKJSON.Resource, depth: number = 2): MarkdownHeading[] {
  // The resource's own entry points at the top of the page: nothing renders an
  // element with the bare `(resource) <name>` id, so using stainlessPath here
  // produced a dead link on every resource page.
  const output: MarkdownHeading[] = [{ depth, slug: '_top', text: resource.title }];

  // Models render on the resource page with their own anchors, so they belong
  // in the on-this-page nav. Without them a resource whose content is mostly
  // models (Webhooks has 44) renders a TOC with a single entry and reads as an
  // unnavigable wall.
  //
  // The rendered anchor is the model's stainlessPath plus a " > (schema)"
  // segment — the id sits on the schema block, not on a heading for the model
  // itself. Methods are deliberately absent: they are rendered without any
  // anchor at all (verified across resource pages), so linking to them would
  // produce dead TOC entries.
  const MODEL_ANCHOR_SUFFIX = ' > (schema)';

  const models = Object.values(resource.models ?? {})
    // A model with no `oasRef` is synthetic — Stainless generates it for the
    // `webhook_unwrap` union and renders nothing for it, so a TOC entry would
    // be a dead link.
    .filter((model) => !model.isImplicit && "oasRef" in model && model.oasRef)
    .map((model) => ({
      depth: depth + 1,
      slug: `${model.stainlessPath}${MODEL_ANCHOR_SUFFIX}`,
      text: model.title,
    }));

  const subs = Object.values(resource.subresources ?? {}).flatMap((sub) =>
    buildPageNavigation(sub, depth + 1),
  );

  return [...output, ...models, ...subs];
}

export function SDKSelectReactComponent({
  selected,
  languages,
  className,
  ...rest
}: {
  selected: DocsLanguage;
  languages: DocsLanguage[];
  className?: string;
} & Omit<React.ComponentProps<'div'>, 'children'>) {
  return (
    <Dropdown data-current-value={selected} className={className} {...rest}>
      <Dropdown.Trigger>
        <Dropdown.TriggerSelectedItem>
          <Dropdown.Icon>
            <SDKIcon language={getLanguageSnippet(selected)} />
          </Dropdown.Icon>
          <span className="stl-snippet-dropdown-button-text">{LanguageNames[selected]}</span>
        </Dropdown.TriggerSelectedItem>
        <Dropdown.TriggerIcon>
          <ChevronsUpDownIcon size={16} />
        </Dropdown.TriggerIcon>
      </Dropdown.Trigger>
      <Dropdown.Menu
        className="dropdown-menu stl-sdk-select-dropdown-menu"
        aria-labelledby="stl-docs-snippet-title-button"
      >
        {languages.map((item) => (
          <Dropdown.MenuItem key={item} value={item} isSelected={item === selected}>
            <Dropdown.Icon>
              <SDKIcon language={getLanguageSnippet(item)} size={16} />
            </Dropdown.Icon>
            <Dropdown.MenuItemText>{LanguageNames[item]}</Dropdown.MenuItemText>
            <Dropdown.MenuItemTemplate>
              <Dropdown.Icon>
                <SDKIcon language={getLanguageSnippet(item)} size={16} />
              </Dropdown.Icon>
              <span className="stl-snippet-dropdown-button-text">{LanguageNames[item]}</span>
            </Dropdown.MenuItemTemplate>
          </Dropdown.MenuItem>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}

function SDKRequestTitle({ snippetLanguage }: SDKRequestTitleProps) {
  const selected = snippetLanguage.split('.').at(0) as DocsLanguage;
  const languages = getDocsLanguages();

  return (
    <SDKSelectReactComponent
      selected={selected || 'http'}
      languages={languages}
      data-stldocs-snippet-select
      className="stl-sdk-select stl-ui-not-prose"
    />
  );
}

export type SpecMetadata = [
  DocsLanguage,
  {
    repo_url?: string;
    code_url?: string;
    version?: string;
    install?: string;
  },
][];

const componentOverrides = {
  SDKRequestTitle,
  SnippetCode,
  SnippetContainer,
  SnippetButtons,
  SnippetFooter,
  SnippetResponse,
  ...(EXPERIMENTAL_COLLAPSIBLE_METHOD_DESCRIPTIONS ? { MethodDescription } : {}),
  ...MIDDLEWARE.componentOverrides,
} satisfies React.ComponentProps<typeof ComponentProvider>['components'];

export function RenderLibraries({ metadata }: { metadata: SpecMetadata }) {
  return (
    <ComponentProvider components={componentOverrides}>
      {metadata.map(([language, data]) => (
        <SDKLanguageBlock
          key={language}
          language={language}
          version={data.version || ''}
          install={data.install || ''}
          links={{ repo: data.repo_url || '#', docs: `${RESOLVED_API_REFERENCE_PATH}/${language}` }}
        />
      ))}
    </ComponentProvider>
  );
}

export function RenderSpecOverview({ spec, language }: { spec: SDKJSON.Spec; language: DocsLanguage }) {
  const resources = React.useMemo(() => flatResources(spec.resources, []), [spec]);

  return (
    <DocsProvider spec={spec} language={language ?? 'node'}>
      <ComponentProvider components={componentOverrides}>
        <NavigationProvider basePath={RESOLVED_API_REFERENCE_PATH}>
          <MarkdownProvider render={astroMarkdownRenderText} highlight={highlight}>
            <div className={style.Overview}>
              {resources
                .filter(({ resource }) => !resource.name.startsWith('$'))
                .map(({ resource, parents }) => (
                  <SDKResource
                    key={resource.stainlessPath}
                    resource={resource}
                    parents={parents}
                    showModels={false}
                  />
                ))}
            </div>
          </MarkdownProvider>
        </NavigationProvider>
      </ComponentProvider>
    </DocsProvider>
  );
}

export function RenderSpec({
  spec,
  kind,
  path,
  language,
  currentPath,
  contentPanelLayout = 'double-pane',
  transformRequestSnippet,
}: {
  spec: SDKJSON.Spec;
  kind: string;
  path: string;
  language: DocsLanguage;
  currentPath: string;
  contentPanelLayout?: ContentPanelLayout;
  transformRequestSnippet?: StlStarlightMiddleware['transformRequestSnippet'];
}) {
  const parsed = parseStainlessPath(path);
  const resource = getResourceFromSpec(path, spec);

  if (!resource || !parsed) {
    console.warn(`Could not find resource or parsed path for '${path}'`);
    return null;
  }

  return (
    <DocsProvider
      spec={spec}
      language={language ?? 'node'}
      settings={{
        contentPanelLayout,
        properties: PROPERTY_SETTINGS,
      }}
    >
      <ComponentProvider components={componentOverrides}>
        <NavigationProvider basePath={RESOLVED_API_REFERENCE_PATH} selectedPath={path}>
          <MarkdownProvider render={astroMarkdownRenderText} highlight={highlight}>
            {
              <div className="stldocs-root stl-ui-not-prose">
                <div className="stl-page-nav-container">
                  <SDKBreadcrumbs
                    spec={spec}
                    currentPath={currentPath}
                    basePath={RESOLVED_API_REFERENCE_PATH}
                    config={BREADCRUMB_CONFIG}
                  />
                  {ENABLE_CONTEXT_MENU && <AIDropdown />}
                </div>
                {kind === 'http_method' ? (
                  <SDKMethod
                    method={resource.methods[parsed.method!]!}
                    transformRequestSnippet={transformRequestSnippet}
                  />
                ) : (
                  <SDKOverview resource={resource} />
                )}
              </div>
            }
          </MarkdownProvider>
        </NavigationProvider>
      </ComponentProvider>
    </DocsProvider>
  );
}

export async function getReadmeContent(spec: SDKJSON.Spec, language: DocsLanguage) {
  const repoUrl = spec.metadata?.[language]?.repo_url;

  try {
    if (repoUrl) {
      const rawUrl = repoUrl.replace('www.github.com', 'raw.githubusercontent.com');

      const response = await fetch(`${rawUrl}/refs/heads/main/README.md`);
      if (response && response.ok) return response.text();
    }
  } catch {
    // ignore
  }

  return spec.readme[language];
}
