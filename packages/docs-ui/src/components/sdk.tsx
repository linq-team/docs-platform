import * as React from 'react';
import type * as SDKJSON from '@stainless/sdk-json';
import { useComponents } from '../contexts/use-components';
import {
  useLanguageComponents,
  useDeclaration,
  useLanguage,
  useSpec,
  useContentPanelLayout,
  useSettings,
  useNavigation,
  useAvailableLanguages,
  Declaration,
  useSnippetIds,
  useSnippetResponse,
} from '../contexts';
import style from '../style';
import {
  DocsLanguage,
  generateRoute,
  getLanguageSnippet,
  LanguageNames,
  parseStainlessPath,
} from '../routing';
import { BookOpenIcon, CopyIcon } from 'lucide-react';
import clsx from 'clsx';
import {
  GoIcon,
  JavaIcon,
  KotlinIcon,
  PythonIcon,
  RubyIcon,
  TerraformIcon,
  TypescriptIcon,
  CurlIcon,
  PowershellIcon,
  CSharpIcon,
  CLIIcon,
  PHPIcon,
  GithubIcon,
} from './icons';
import { Button, Callout } from '@stainless-api/ui-primitives';
import { Badge } from '@stainless-api/ui-primitives';

export type PropertyModelContextType = {
  modelPath?: string;
  propertyPath?: string;
};

export const PropertyModelContext = React.createContext<PropertyModelContextType>({});
export function usePropertyModel() {
  return React.use(PropertyModelContext);
}

export type ReferenceNestingContextType = string[];
export const ReferenceNestingContext = React.createContext<ReferenceNestingContextType>([]);
export function useReferenceNesting() {
  return React.use(ReferenceNestingContext);
}

export type DeclarationParentsContextType = ReadonlySet<string>;
const DeclarationParentsContext = React.createContext<DeclarationParentsContextType>(new Set());
const AddToDeclarationParents = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <DeclarationParentsContext
    value={
      new Set([
        ...useDeclarationParents(),
        // strips everything after the last "> (schema)" segment in the id
        // if present so if a model's properties are copied in to a different
        // node's children we still know not to recurse into the model.
        id.replace(/(?<=> \(schema\))((?!> \(schema\) > ).)+$/, ''),
      ])
    }
  >
    {children}
  </DeclarationParentsContext>
);
export function useDeclarationParents() {
  return React.use(DeclarationParentsContext);
}

export type SDKSnippetLanguagesType = Record<SDKJSON.SnippetLanguage, { name: string }>;

export const SDKSnippetLanguages: SDKSnippetLanguagesType = {
  'node.default': { name: 'TypeScript' },
  'typescript.default': { name: 'TypeScript' },
  'python.default': { name: 'Python' },
  'go.default': { name: 'Go' },
  'java.default': { name: 'Java' },
  'kotlin.default': { name: 'Kotlin' },
  'http.curl': { name: 'cURL' },
  'http.powershell': { name: 'Powershell' },
  'terraform.default': { name: 'Terraform' },
  'ruby.default': { name: 'Ruby' },
  'csharp.default': { name: 'C#' },
  'php.default': { name: 'PHP' },
  'cli.default': { name: 'CLI tool' },
};

export type TransformRequestSnippetFn = ({
  snippet,
  language,
}: {
  snippet: string;
  language: DocsLanguage;
}) => string;

type SDKChildrenProps = {
  paths: SDKJSON.ID[];
  expand?: boolean;
  depth?: number;
};

export function SDKChildren({ paths, expand, depth }: SDKChildrenProps) {
  const Docs = useComponents();

  return (
    <div className={style.Properties}>
      {paths.map((path, i) => (
        <Docs.SDKDeclaration path={path} key={i} expand={expand} depth={depth} />
      ))}
    </div>
  );
}

type SDKDeclarationProps = {
  path: string;
  expand?: boolean;
  depth?: number;
};

function normalizeDeclaration(raw: Declaration, http: Declaration | undefined): Declaration {
  if (
    raw.kind === 'JavaDeclProperty' &&
    raw.type.kind === 'JavaTypeString' &&
    (raw as SDKJSON.JavaAST.JavaDeclProperty & Pick<SDKJSON.HttpAST.HttpDeclProperty, 'constraints'>)
      .constraints?.format === 'binary'
  ) {
    return {
      ...raw,
      type: {
        kind: 'JavaTypeReference',
        typeName: 'InputStream',
      },
    } satisfies SDKJSON.JavaAST.JavaDeclProperty;
  }
  if (
    http?.kind === 'HttpDeclProperty' &&
    http.type.kind === 'HttpTypeString' &&
    http.constraints?.format === 'binary'
  ) {
    switch (raw.kind) {
      case 'CLISchemaProperty':
      case 'CLIFlag':
      case 'HttpDeclProperty':
        return {
          ...raw,
          type: {
            kind: 'HttpTypeBinary',
            contentType: [],
          },
        };
      case 'RubyDeclProperty':
        return {
          ...raw,
          type: {
            kind: 'RubyTypeBinary',
            contentType: [],
          },
        };
    }
  }
  return raw;
}

export function SDKDeclaration({ path, expand, depth = 0 }: SDKDeclarationProps) {
  const Lang = useLanguageComponents();
  const Docs = useComponents();
  const rawDecl = useDeclaration(path, true);
  const spec = useSpec();
  const httpDecl = useDeclaration(path.replace(/ > \(schema\)$/, '') + ' > (schema)', false, 'http');
  let pendingDecl = normalizeDeclaration(rawDecl, httpDecl);
  const settings = useSettings();
  const model = usePropertyModel();
  const nesting = useReferenceNesting();
  const { selectedPath, basePath } = useNavigation();
  const parents = useDeclarationParents();
  const language = useLanguage();

  if (parents.has(path)) {
    if (pendingDecl.kind === 'GoDeclType') {
      pendingDecl = {
        ...pendingDecl,
        kind: 'GoDeclType',
        type: {
          kind: 'GoTypeReference',
          typeName: pendingDecl.ident,
          $ref: pendingDecl.stainlessPath,
        },
        children: [],
      };
    } else if (pendingDecl.kind === 'HttpDeclTypeAlias') {
      pendingDecl = {
        ...pendingDecl,
        kind: 'HttpDeclTypeAlias',
        children: [],
      };
    } else if (pendingDecl.kind === 'PythonDeclClass') {
      pendingDecl = {
        kind: 'PythonDeclType',
        ident: pendingDecl.ident,
        stainlessPath: pendingDecl.stainlessPath,
        type: {
          kind: 'PythonTypeReference',
          typeName: pendingDecl.ident,
          $ref: pendingDecl.stainlessPath,
        },
      };
    } else if (pendingDecl.kind === 'TSDeclInterface') {
      pendingDecl = {
        kind: 'TSDeclTypeAlias',
        ident: pendingDecl.ident,
        stainlessPath: pendingDecl.stainlessPath,
        type: {
          kind: 'TSTypeReference',
          ident: pendingDecl.ident,
          $ref: pendingDecl.stainlessPath as SDKJSON.ID,
        },
      };
    } else if ('ident' in pendingDecl) {
      const ident = pendingDecl.ident;
      const url = generateRoute(basePath ?? '/', language, pendingDecl.stainlessPath);
      return (
        <span className={style.Type}>
          <span className={style.TypeReference}>{url ? <a href={url}>{ident}</a> : ident}</span>
        </span>
      );
    } else {
      throw new Error(
        'Infinite recursion in SDKDeclaration: ' +
          JSON.stringify({ parents: [...parents], path, pendingDecl }),
      );
    }
  }

  // Use a const after this so TS knows the type doesn't change.
  const decl = pendingDecl;

  if (decl.kind.endsWith('Reference')) {
    const refId =
      'type' in decl && decl.type !== undefined && typeof decl.type !== 'string' && '$ref' in decl.type
        ? decl.type['$ref']
        : undefined;
    if (refId && refId !== path && !nesting.includes(refId) && spec?.decls?.[language]?.[refId]) {
      return (
        <AddToDeclarationParents id={path}>
          <ReferenceNestingContext value={[...nesting, refId]}>
            <SDKDeclaration path={refId} expand={expand} depth={depth} />
          </ReferenceNestingContext>
        </AddToDeclarationParents>
      );
    }
  }

  const parsedPath = selectedPath ? parseStainlessPath(selectedPath) : null;
  const modelPropSetting = settings?.properties?.includeModelProperties;
  const inlineModelProps =
    modelPropSetting === 'method-page' ? Boolean(parsedPath?.method) : modelPropSetting !== false;

  const isUnion =
    'childrenParentSchema' in decl &&
    !!decl.childrenParentSchema &&
    // TODO: figure out why CLI types are `unknown` and improve them
    decl.kind !== 'CLIFlag' &&
    decl.kind !== 'CLISchemaProperty' &&
    ['enum', 'union'].includes(decl.childrenParentSchema);
  const id = model?.propertyPath ? `${model.propertyPath} + ${path}` : path;
  const shouldExpand =
    (selectedPath?.startsWith(path) && nesting.length < 1) ||
    (settings?.properties?.expandDepth && depth <= settings?.properties?.expandDepth && !isUnion) ||
    expand;

  const hasChildren =
    'children' in decl &&
    (decl.children?.length ?? 0) > 0 &&
    !decl.children?.includes(path) &&
    !(isUnion && decl.childrenParentSchema === 'enum' && decl.children?.length === 1) &&
    (inlineModelProps || !('modelPath' in decl));

  const content = (
    <Lang.Property decl={decl}>
      {({ ...props }) => (
        <Docs.Property
          id={id}
          expand={shouldExpand}
          // TODO: figure out why CLI constraints are `unknown` and improve them
          constraints={
            'constraints' in decl &&
            decl.kind !== 'CLIFlag' &&
            decl.kind !== 'CLISchemaProperty' && <Docs.SDKConstraints constraints={decl['constraints']} />
          }
          declaration={<Lang.Declaration decl={decl} />}
          title={'title' in decl ? decl.title : undefined}
          description={'docstring' in decl ? decl['docstring'] : undefined}
          deprecated={decl.deprecated}
          {...props}
        >
          {hasChildren && (
            <>
              {isUnion && <div className={style.PropertyAnnotation}>One of the following:</div>}
              <Docs.SDKChildren paths={decl.children ?? []} depth={depth + 1} />
            </>
          )}
        </Docs.Property>
      )}
    </Lang.Property>
  );

  if ('modelPath' in decl) {
    const value = {
      modelPath: decl.modelPath,
      propertyPath: decl.stainlessPath,
    };
    return (
      <AddToDeclarationParents id={path}>
        <PropertyModelContext value={value}>{content}</PropertyModelContext>
      </AddToDeclarationParents>
    );
  }

  return <AddToDeclarationParents id={path}>{content}</AddToDeclarationParents>;
}

export type SDKConstraintsProps = {
  constraints?: Record<string, unknown>;
};

export function SDKConstraints({ constraints }: SDKConstraintsProps) {
  if (constraints)
    return (
      <div className={style.PropertyConstraints}>
        {Object.entries(constraints).map(([name, value]) =>
          name === 'format' && value === 'binary' ? null : (
            <div className={style.PropertyConstraint} key={name}>
              <span className={style.PropertyConstraintName}>{name}</span>
              <span className={style.PropertyConstraintValue}>{value as string}</span>
            </div>
          ),
        )}
      </div>
    );
}

type SDKIconProps = {
  language: SDKJSON.SnippetLanguage;
  size?: number;
};

const snippetIcons: Record<
  SDKJSON.SnippetLanguage,
  ({ className }: { className?: string }) => React.JSX.Element
> = {
  'node.default': TypescriptIcon,
  'typescript.default': TypescriptIcon,
  'go.default': GoIcon,
  'python.default': PythonIcon,
  'terraform.default': TerraformIcon,
  'http.curl': CurlIcon,
  'http.powershell': PowershellIcon,
  'ruby.default': RubyIcon,
  'java.default': JavaIcon,
  'kotlin.default': KotlinIcon,
  'csharp.default': CSharpIcon,
  'cli.default': CLIIcon,
  'php.default': PHPIcon,
};

export function SDKIcon({ language }: SDKIconProps) {
  const LangIcon = snippetIcons[language];
  if (!LangIcon) return null;
  return <LangIcon className={clsx(style.Icon, language.split('.').shift())} />;
}

export type SDKRequestTitleProps = {
  snippetLanguage: SDKJSON.SnippetLanguage;
};

export function SDKRequestTitle({ snippetLanguage }: SDKRequestTitleProps) {
  const languageName = SDKSnippetLanguages[snippetLanguage]?.name;

  return (
    <span className={style.SnippetRequestTitleLanguage}>
      <SDKIcon language={snippetLanguage} /> {languageName}
    </span>
  );
}

type SDKExampleProps = {
  method: Partial<SDKJSON.Method> & SDKJSON.HasStainlessPath;
  transformRequestSnippet?: TransformRequestSnippetFn;
};

export function SDKExample({ method, transformRequestSnippet }: SDKExampleProps) {
  // TODO: support language variants in snippets
  const Docs = useComponents();
  const language = useLanguage();
  const snippetLanguage = getLanguageSnippet(language);

  // prettier-ignore
  const hasMultiExamples = (
    useSnippetIds(method.stainlessPath, language)
      ?.filter((id) => id !== 'default')
      ?.length
      ?? 0
  ) >= 2;

  if (hasMultiExamples) {
    return (
      <Docs.MultiSnippets
        requestTitle={<Docs.SDKRequestTitle snippetLanguage={snippetLanguage} />}
        method={method}
      />
    );
  }

  return (
    <Docs.Snippet
      requestTitle={<Docs.SDKRequestTitle snippetLanguage={snippetLanguage} />}
      method={method}
      transformRequestSnippet={transformRequestSnippet}
    />
  );
}

export type SDKMethodProps = {
  method: SDKJSON.Method;
  transformRequestSnippet?: TransformRequestSnippetFn;
};

export function SDKMethodHeader({ method }: SDKMethodProps) {
  const Docs = useComponents();
  const Lang = useLanguageComponents();
  const decl = useDeclaration(method.stainlessPath, true);

  return (
    <Docs.MethodHeader
      level="h1"
      title={method.summary || method.title}
      signature={<Lang.MethodSignature decl={decl} />}
      badges={
        method.deprecated &&
        (typeof method.deprecated === 'string' ? (
          <Callout className={style.CalloutDeprecationWarning} variant="danger">
            Deprecated: {method.deprecated}
          </Callout>
        ) : (
          <Badge intent="danger">Deprecated</Badge>
        ))
      }
    >
      <Docs.MethodRoute httpMethod={method.httpMethod} endpoint={method.endpoint.split(' ', 2).at(-1)} />
    </Docs.MethodHeader>
  );
}

export function useStreamingResponse(method: SDKJSON.BaseDeclaration): SDKJSON.ID | undefined {
  const tsDecl = useDeclaration(method.stainlessPath, false, 'typescript');

  if (tsDecl?.kind === 'TSDeclFunction' && tsDecl.overloads) {
    for (const e of tsDecl.overloads) {
      if (
        e.returns.kind === 'TSTypeReference' &&
        (e.returns.$ref === '$.typescript.Stream' || e.returns.$ref === '$.node.Stream') &&
        e.returns.typeParameters?.[0]?.kind === 'TSTypeReference'
      ) {
        const id = e.returns.typeParameters?.[0].$ref;
        if (id) {
          return id;
        }
      }
    }
  }
}

export function SDKMethodInfo({ method, children }: SDKMethodProps & { children?: React.ReactNode }) {
  const Docs = useComponents();
  const Lang = useLanguageComponents();
  const decl = useDeclaration(method.stainlessPath, true);
  const streamingResponseID = useStreamingResponse(method);
  const streamingResponseDecl = useDeclaration(streamingResponseID ?? '', false);
  const spec = useSpec();
  const language = useLanguage();

  if (Lang.MethodInfo) return <Lang.MethodInfo decl={decl}>{children}</Lang.MethodInfo>;

  function shouldExpand(items: SDKJSON.ID[]) {
    if (items.length > 1) return false;
    const item = items[0];
    if (!item) return false;
    const decl = spec?.decls?.[language]?.[item];
    return decl && 'children' in decl && decl.children && decl.children.length > 0;
  }

  const responseChildren =
    'responseChildren' in decl && decl.responseChildren && decl.responseChildren.length > 0
      ? [...decl.responseChildren]
      : [];
  if (streamingResponseDecl && streamingResponseID && !responseChildren.includes(streamingResponseID))
    responseChildren.push(streamingResponseID);

  return (
    <Docs.MethodInfo
      parameters={
        'paramsChildren' in decl &&
        Array.isArray(decl.paramsChildren) &&
        decl.paramsChildren.length > 0 && (
          <Docs.SDKChildren expand={shouldExpand(decl.paramsChildren)} paths={decl.paramsChildren} />
        )
      }
      returns={
        responseChildren.length > 0 && (
          <Docs.SDKChildren expand={shouldExpand(responseChildren)} paths={responseChildren} />
        )
      }
    >
      {children}
    </Docs.MethodInfo>
  );
}

export function SDKMethodNotImplemented({ method }: SDKMethodProps) {
  const Docs = useComponents();
  const languages = useAvailableLanguages(method?.stainlessPath);
  const language = useLanguage();
  const { basePath } = useNavigation();

  const availableLanguageLinks = languages.flatMap((lang) => {
    const url = generateRoute(basePath ?? '/', lang, method.stainlessPath);
    return url ? [{ url, label: LanguageNames[lang] ?? lang }] : [];
  });

  return (
    <div className={style.Method}>
      <Docs.MethodHeader level="h1" title={method.summary || method.title}>
        <Docs.MethodRoute httpMethod={method.httpMethod} endpoint={method.endpoint.split(' ', 2).at(-1)} />
      </Docs.MethodHeader>
      <Callout variant="warning">
        The method <code>{method.name}</code> is not implemented in {LanguageNames[language] ?? language}
        {basePath && availableLanguageLinks.length > 0 ? (
          <>
            , but it is available in the following languages:
            <ul>
              {availableLanguageLinks.map(({ url, label }) => {
                return (
                  <li key={url}>
                    <a href={url}>{label}</a>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          '.'
        )}
      </Callout>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SDKMethodInfoContent(_props: SDKMethodProps): React.ReactNode {
  return null;
}

export function SDKMethod({ method, transformRequestSnippet }: SDKMethodProps) {
  const Docs = useComponents();
  const decl = useDeclaration(method?.stainlessPath, false);
  const layout = useContentPanelLayout();
  const defaultResponses = useSnippetResponse(method.stainlessPath);

  if (!decl) {
    return <SDKMethodNotImplemented method={method} />;
  }

  return (
    <Docs.Method
      id={method.stainlessPath}
      header={<Docs.SDKMethodHeader method={method} />}
      className={clsx({
        [style.MethodSinglePane]: layout === 'single-pane',
        [style.MethodDoublePane]: layout === 'double-pane',
      })}
    >
      <div className={style.MethodContentColumn}>
        <Docs.MethodDescription description={method.description} />
        <Docs.SDKMethodInfo method={method}>
          <Docs.SDKMethodInfoContent method={method} />
        </Docs.SDKMethodInfo>
      </div>
      <div className={clsx(style.MethodExample, 'not-content', 'stl-ui-not-prose')}>
        <Docs.SDKExample method={method} transformRequestSnippet={transformRequestSnippet} />
      </div>
      <div className={style.MethodResponseColumn}>
        <h5>Returns Examples</h5>
        <Docs.SnippetResponse responses={defaultResponses} />
      </div>
    </Docs.Method>
  );
}

export type SDKModelProps = {
  model: SDKJSON.Model;
};

export function SDKModel({ model }: SDKModelProps) {
  const Docs = useComponents();
  const decl = useDeclaration(`${model.stainlessPath} > (schema)`, true);

  if (!decl) return null;

  return (
    <div className={style.Model} tabIndex={0}>
      <div className={style.ResourceContentProperties}>
        <Docs.SDKDeclaration path={`${model.stainlessPath} > (schema)`} />
      </div>
    </div>
  );
}

type SDKReferenceProps = {
  stainlessPath: string;
  children?: React.ReactNode;
};

export function SDKReference({ stainlessPath, children }: SDKReferenceProps) {
  const Docs = useComponents();

  if (!stainlessPath || !stainlessPath.endsWith('(schema)')) return children;

  const link = (
    <span className={style.TypeReference}>
      <Docs.Link stainlessPath={stainlessPath}>{children}</Docs.Link>
    </span>
  );

  return link;
}

type SDKLanguageBlockProps = {
  language: DocsLanguage;
  version: string;
  install: string;
  links: {
    repo: string;
    docs: string;
  };
};

export function SDKLanguageBlock({ language, version, install, links }: SDKLanguageBlockProps) {
  const Docs = useComponents();
  const lang = `${language}.default` as SDKJSON.SnippetLanguage;

  return (
    <div className={style.LanguageBlock}>
      <div className={style.LanguageBlockContent}>
        <div className={style.LanguageBlockContentIcon}>
          <Docs.SDKIcon language={lang} size={24} />
        </div>
        <div className={style.LanguageBlockContentInfo}>
          <div className={style.LanguageBlockContentInfoLanguage}>{Docs.SDKSnippetLanguages[lang].name}</div>
          <div className={style.LanguageBlockContentInfoVersion}>{version}</div>
        </div>
      </div>

      <div className={style.LanguageBlockInstall} data-stldocs-copy-parent>
        <pre data-stldocs-copy-content>{install}</pre>{' '}
        <Button variant="ghost" size="sm" data-stldocs-snippet-copy>
          <CopyIcon size={16} className={style.Icon} />
        </Button>
      </div>

      <div className={style.LanguageBlockLinks}>
        <Button href={links.repo} variant="outline">
          <Button.Icon icon={GithubIcon} style={{ color: 'var(--stl-color-foreground-reduced)' }} />
        </Button>
        <Button href={links.docs} variant="outline">
          <Button.Icon icon={BookOpenIcon} />
          <Button.Label>Read Docs</Button.Label>
        </Button>
      </div>
    </div>
  );
}
