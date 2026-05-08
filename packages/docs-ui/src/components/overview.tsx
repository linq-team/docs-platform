import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import type * as SDKJSON from '@stainless/sdk-json';

import { flatResources, getResourceFromSpec } from '../utils';
import { useDeclaration, useLanguage, useLanguageComponents, useSpec } from '../contexts';
import { useComponents } from '../contexts/use-components';

import style from '../style';
import { PropertyToggle } from './properties';
import { Markdown } from './primitives';
import { parseStainlessPath } from '../routing';
import { Badge } from '@stainless-api/ui-primitives';

export type SDKResourceProps = {
  resource: SDKJSON.Resource;
  parents?: SDKJSON.Resource[];
};

export function SDKResourceHeader({ resource, parents }: SDKResourceProps) {
  // const language = useLanguage();

  const segments = parents?.map((parent, index) => (
    <span className={style.ResourceTitleSegment} key={parent.stainlessPath}>
      {parent.title}
      {index < parents.length && <ChevronRight size={16} className={style.Icon} />}
    </span>
  ));

  if (!segments && !resource.description) {
    return null;
  }

  return (
    <div className={style.ResourceHeader}>
      {segments && (
        <h4 id={resource.stainlessPath} className={style.ResourceTitle}>
          {segments}
          <span className={style.ResourceTitleSegment}>{resource.title}</span>
        </h4>
      )}
      {resource.description && (
        <div className={style.ResourceDescription}>
          <Markdown content={resource.description} />
        </div>
      )}
    </div>
  );
}

export type SDKMethodSummaryProps = {
  method: SDKJSON.Method;
};

export function SDKMethodSummary({ method }: SDKMethodSummaryProps) {
  const Docs = useComponents();
  const Lang = useLanguageComponents();
  const decl = useDeclaration(method.stainlessPath, true);

  return (
    <Docs.MethodHeader
      level="h5"
      title={<Docs.Link stainlessPath={method.stainlessPath}>{method.summary || method.title}</Docs.Link>}
      signature={<Lang.MethodSignature decl={decl} />}
      badges={
        method.deprecated && (
          <Badge intent="danger" size="sm">
            Deprecated
          </Badge>
        )
      }
    >
      <Docs.MethodRoute httpMethod={method.httpMethod} endpoint={method.endpoint.split(' ', 2).at(-1)} />
      {/* Removing temporarily per design review */}
      {/* <Docs.MethodDescription description={method.description} /> */}
    </Docs.MethodHeader>
  );
}

export function SDKResource({ resource, parents, showModels }: SDKResourceProps & { showModels?: boolean }) {
  const Docs = useComponents();
  const Lang = useLanguageComponents();
  const language = useLanguage();
  const spec = useSpec();

  const methods = Object.values(resource.methods).filter(
    (method) => spec?.decls?.[language]?.[method.stainlessPath],
  );

  const models = Object.values(resource.models).filter(
    (model) => spec?.decls?.[language]?.[`${model.stainlessPath} > (schema)`],
  );

  if (Lang.Resource) return <Lang.Resource resource={resource} parents={parents} />;

  return (
    <div className={style.Resource} data-stl-resource-language={language}>
      <div className={style.ResourceContent}>
        <Docs.SDKResourceHeader resource={resource} parents={parents} />

        {methods.length > 0 && (
          <div className={style.ResourceContentGroup}>
            {methods.map((method) => (
              <div className={style.MethodSummary} key={method.stainlessPath}>
                <Docs.SDKMethodSummary method={method} />
              </div>
            ))}
          </div>
        )}

        {showModels !== false && models.length > 0 && (
          <div className={style.ResourceContentGroup} data-stldocs-property-group="models">
            <h5 className={style.ResourceContentGroupModelTitle}>
              Models
              <PropertyToggle target="models" />
            </h5>
            {models.map((model) => (
              <Docs.SDKModel model={model} key={model.stainlessPath} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export type SDKOverviewProps = {
  resource: SDKJSON.Resource;
};

export function SDKOverview({ resource }: SDKOverviewProps) {
  const { SDKResource } = useComponents();

  const nested = React.useMemo(() => flatResources(resource.subresources, [resource]), [resource]);

  return (
    <div className={style.Overview}>
      <div className={style.OverviewHeader}>
        <h1>{resource.title}</h1>
      </div>
      <SDKResource resource={resource} />
      {nested.map((props, index) => (
        <SDKResource key={index} {...props} />
      ))}
    </div>
  );
}

export type SDKRootProps = {
  stainlessPath: string;
};

export function SDKRoot({ stainlessPath }: SDKRootProps) {
  const spec = useSpec();
  const Docs = useComponents();

  const parsed = parseStainlessPath(stainlessPath);
  const resource = spec && getResourceFromSpec(stainlessPath, spec);

  if (!resource || !parsed) {
    console.warn(`Could not find resource or parsed path for '${stainlessPath}'`);
    return null;
  }

  if (parsed.method) {
    const method = resource.methods[parsed.method];
    if (!method) {
      console.warn(`Method '${parsed.method}' not found in resource '${resource.stainlessPath}'`);
      return null;
    }
    return (
      <div className={style.Root}>
        <Docs.SDKMethod method={method} />
      </div>
    );
  }

  return (
    <div className={style.Root}>
      <Docs.SDKOverview resource={resource} />
    </div>
  );
}
