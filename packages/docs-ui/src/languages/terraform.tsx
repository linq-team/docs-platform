import * as React from 'react';
import * as SDKJSON from '@stainless/sdk-json';
import { TerraformAST as AST } from '@stainless/sdk-json';
import clsx from 'clsx';
import { useComponents } from '../contexts/use-components';
import { useDeclaration, useLanguageComponents, useSpec } from '../contexts';
import style from '../style';
import { PropertyFn } from '.';
import { Callout } from '@stainless-api/ui-primitives';
import { Badge } from '@stainless-api/ui-primitives';

export type TypeProps = {
  type: AST.AttributeType;
};

export function TypeName({ type }: TypeProps) {
  const Lang = useLanguageComponents();
  return <Lang.Type type={type} />;
}

export function Type({ type }: TypeProps) {
  const Lang = useLanguageComponents();
  const { Join } = useComponents();

  switch (type.category) {
    case 'nested': {
      switch (type.type) {
        case 'ListNested':
        case 'MapNested':
        case 'SetNested': {
          return (
            <span className={style.Type}>
              <span className={style.TypeArray}>{type.type.replace('Nested', '')}</span>
              <span className={style.TypeBracket}>{'['}</span>
              <span className={style.TypeReference}>Attributes</span>
              <span className={style.TypeBracket}>{']'}</span>
            </span>
          );
        }

        case 'SingleNested':
          return (
            <span className={style.Type}>
              <span className={style.TypeReference}>Attributes</span>
            </span>
          );

        default:
          return;
      }
    }

    case 'collection':
      return (
        <span className={style.Type}>
          <span className={style.TypeArray}>{type.type}</span>
          <span className={style.TypeBracket}>{'['}</span>
          <Lang.Type type={type.elementType} />
          <span className={style.TypeBracket}>{']'}</span>
        </span>
      );

    case 'dynamic': {
      const subtypes = type.allowedSubtypes.length > 0 ? <Join items={type.allowedSubtypes}> | </Join> : null;
      return (
        <span className={style.Type}>
          <span className={style.TypeKeyword}>Dynamic {subtypes}</span>
        </span>
      );
    }

    case 'primitive':
      if (type.type === 'String')
        return (
          <span className={style.Type}>
            <span className={style.TypeString}>String</span>
          </span>
        );

      return (
        <span className={style.Type}>
          <span className={style.TypeKeyword}>{type.type}</span>
        </span>
      );

    case 'unknown':
      return (
        <span className={style.Type}>
          <span className={style.TypeKeyword}>JSON</span>
        </span>
      );
  }
}

export function MethodSignature() {
  return null;
}

const PropGroups = ['required', 'optional', 'computed'] as const;

export type PropertyProps = {
  decl: AST.TerraformDeclaration;
  children: PropertyFn;
};

export function Property({ decl, children }: PropertyProps) {
  if (!decl) return null;

  switch (decl.kind) {
    case 'TerraformDeclAttribute':
      return children({ name: decl.name });
  }
}

export function TerraformSource({ path, group }: { path: string; group: string }) {
  const Docs = useComponents();
  const decl = useDeclaration(path, true);

  if (decl.kind !== 'TerraformDeclSource') return;

  const type = decl.type === 'resource' ? 'resource' : 'data';
  const badge = type === 'resource' ? `success` : `note`;

  const children = PropGroups.filter((section) => decl[section].length > 0).map((section) => {
    const propGroupId = `${decl.name}-${section}-${group}`;
    return (
      <div className={style.ResourceContentGroup} key={section}>
        <h5 className={style.ResourceContentGroupModelTitle}>
          {section} <Docs.PropertyToggle target={propGroupId} />
        </h5>
        <div className={style.ResourceContentProperties} data-stldocs-property-group={propGroupId}>
          <Docs.SDKChildren paths={decl[section]} />
        </div>
      </div>
    );
  });

  return (
    <div className={clsx(style.Method, style.MethodDoublePane)}>
      <div className={style.MethodBody}>
        <div className={style.MethodContentColumn}>
          <h4 className={style.TerraformResourceTitle}>
            <Badge intent={badge}>{type}</Badge> {decl.name}
          </h4>
          {children}
        </div>
        <div className={clsx(style.MethodExample, 'not-content', 'stl-ui-not-prose')}>
          <Docs.SDKExample method={{ title: decl.name, stainlessPath: path }} />
        </div>
      </div>
    </div>
  );
}

export type DeclarationProps = { decl: AST.TerraformDeclaration };

export function Declaration({ decl }: DeclarationProps) {
  const Lang = useLanguageComponents();

  if (!decl) return;

  switch (decl.kind) {
    case 'TerraformDeclAttribute': {
      const isOptional = decl.configurability === 'optional' || decl.configurability === 'computed_optional';

      return (
        <>
          <span className={style.TextIdentifier}>{decl.name}</span>
          {isOptional && <span className={style.TextPunctuation}>?</span>}
          <span className={style.TextPunctuation}>: </span>
          <span className={style.TextKeyword}>
            <Lang.Type type={decl.type} />
          </span>
        </>
      );
    }

    case 'TerraformDeclServiceNode': {
      const { resource, dataSource, listDataSource } = decl;

      return (
        <div className={style.Method}>
          {resource && <TerraformSource path={resource} group="resource" />}
          {dataSource && <TerraformSource path={dataSource} group="dataSource" />}
          {listDataSource && <TerraformSource path={listDataSource} group="listDataSource" />}
        </div>
      );
    }
  }
}

export function isResourceEntirelyUnsupported(
  resource: SDKJSON.Resource,
  decls?: Record<string, unknown>,
): boolean {
  if (decls?.[resource.stainlessPath]) return false;
  return Object.values(resource.subresources ?? {}).every((child) =>
    isResourceEntirelyUnsupported(child, decls),
  );
}

export type ResourceProps = { resource: SDKJSON.Resource; parents?: SDKJSON.Resource[] };

export function Resource({ resource, parents }: ResourceProps) {
  const Docs = useComponents();
  const Lang = useLanguageComponents();
  const decl = useDeclaration(resource.stainlessPath, false);
  const spec = useSpec();

  if (decl)
    return (
      <div className={style.Resource} data-stl-resource-language="terraform">
        <div className={style.ResourceContent}>
          <Docs.SDKResourceHeader resource={resource} parents={parents} />
          <Lang.Declaration decl={decl} />
        </div>
      </div>
    );

  if (!parents && isResourceEntirelyUnsupported(resource, spec?.decls.terraform))
    return (
      <Callout variant="warning">
        The resource <code>{resource.name}</code> is not supported in Terraform.
      </Callout>
    );
}
