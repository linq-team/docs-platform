import * as React from 'react';
import { TSAST } from '@stainless/sdk-json';
import { useDeclaration, useLanguage, useLanguageComponents, useSpec } from '../contexts';
import { useComponents } from '../contexts/use-components';
import style from '../style';
import { PropertyFn } from '.';

const ComplexTypes: Record<string, string> = {
  TSTypeObject: 'object',
  TSTypeUnion: 'union',
  TSTypeInterface: 'interface',
  TSTypeIntersection: 'intersection',
  TSTypeArray: 'array',
};

const constStyle: Record<string, string> = {
  string: style.LiteralString,
  number: style.LiteralNumeric,
  boolean: style.LiteralBoolean,
};

type TypeProps = {
  type: TSAST.TSType;
};

function Identifier({ name, optional }: { name: string; optional?: boolean }) {
  return (
    <>
      <span className={style.TextIdentifier}>
        {/^[_a-zA-Z][_a-zA-Z0-9]*$/.test(name) ? name : JSON.stringify(name)}
      </span>
      {optional && <span className={style.TextPunctuation}>?</span>}
    </>
  );
}

function TypeParams({ params }: { params?: TSAST.TSTypeParameter[] }) {
  const Lang = useLanguageComponents();
  const { Join } = useComponents();

  if (!params?.length) return null;

  const typeParams = params?.map((param, key) =>
    param.constraint ? (
      <React.Fragment key={key}>
        <span className={style.TypeReference}>{param.name}</span>
        <span className={style.TextKeyword}>extends </span>
        <Lang.Type type={param.constraint} />
      </React.Fragment>
    ) : (
      <React.Fragment key={key}>param.name</React.Fragment>
    ),
  );

  return (
    <>
      <span className={style.TypeBracket}>{'<'}</span>
      <Join items={typeParams} limit={3}>
        <span className={style.TextOperator}>, </span>
      </Join>
      <span className={style.TypeBracket}>{'>'}</span>
    </>
  );
}

function TypePreview({ path }: { path: string }) {
  const spec = useSpec();
  const language = useLanguage();
  const decl = useDeclaration(path, false);
  const { Join } = useComponents();

  if (
    !(decl && 'children' in decl && decl.children && decl.children.length > 0) ||
    (decl &&
      'type' in decl &&
      decl.type !== undefined &&
      'kind' in decl['type'] &&
      decl['type']['kind'] === 'TSTypeUnion')
  )
    return;

  const items = decl.children.map((prop, key) => {
    const p = spec?.decls?.[language]?.[prop];
    return (
      <span key={key} className={style.TypePropertyName}>
        <span className={style.TextIdentifier}>{p && 'key' in p ? p['key'] : null}</span>
      </span>
    );
  });

  return (
    <span className={style.TypePreview} data-stldocs-type-preview="properties">
      <span className={style.TypeBrace}>{' {'}</span>
      <span className={style.TypePreviewContent}>
        {' '}
        <Join items={items} limit={3}>
          <span className={style.TextOperator}>, </span>
        </Join>{' '}
      </span>
      <span className={style.TypeBrace}>{'} '}</span>
    </span>
  );
}

export function TypeName({ type }: TypeProps) {
  const Lang = useLanguageComponents();
  return ComplexTypes[type.kind] ?? <Lang.Type type={type} />;
}

export function Type({ type }: TypeProps) {
  const Lang = useLanguageComponents();
  const { Join, SDKReference } = useComponents();

  switch (type.kind) {
    case 'TSTypeUnknown':
    case 'TSTypeUndefined':
    case 'TSTypeNever':
    case 'TSTypeVoid':
    case 'TSTypeNull':
    case 'TSTypeAny':
    case 'TSTypeBoolean':
    case 'TSTypeNumber':
      return (
        <span className={style.Type}>
          <span className={style.TypeKeyword}>{type.kind.slice(6).toLowerCase()}</span>
        </span>
      );

    case 'TSTypeString':
      return (
        <span className={style.Type}>
          <span className={style.TypeString}>string</span>
        </span>
      );

    case 'TSTypeLiteral':
      return (
        <span className={style.Type}>
          <span className={constStyle[typeof type.literal]}>{JSON.stringify(type.literal)}</span>
        </span>
      );

    case 'TSTypeArray': {
      return (
        <span className={style.Type}>
          <span className={style.TypeArray}>{'Array<'}</span>
          <Lang.Type type={type.elementType} />
          <span className={style.TypeArray}>{'>'}</span>
        </span>
      );
    }

    case 'TSTypeReference': {
      const name = type.ident.split('.').at(-1);
      const params = type.typeParameters?.map((param, key) => <Lang.Type key={key} type={param} />);

      return (
        <span className={style.Type}>
          <SDKReference stainlessPath={type.$ref!}>{name}</SDKReference>
          {params && params.length > 0 && (
            <>
              <span className={style.TypeBracket}>{'<'}</span>
              <Join items={params} limit={3}>
                <span className={style.TextOperator}>, </span>
              </Join>
              <span className={style.TypeBracket}>{'>'}</span>
            </>
          )}
          <TypePreview path={type.$ref!} />
        </span>
      );
    }

    case 'TSTypeIntersection':
    case 'TSTypeUnion': {
      const items = type.types.map((t, key) => <Lang.Type key={key} type={t} />);

      const delimiter = type.kind === 'TSTypeUnion' ? '|' : '&';

      return (
        <span className={style.Type}>
          <span className={style.TypePreview} data-stldocs-type-preview="union">
            <span className={style.TypePreviewContent}>
              <Join items={items} limit={3}>
                <span className={style.TextOperator}> {delimiter} </span>
              </Join>
            </span>
          </span>
        </span>
      );
    }

    case 'TSTypeObject':
    case 'TSTypeInterface': {
      const extend =
        type.kind === 'TSTypeObject'
          ? null
          : type.extends?.map((ref, key) => <Lang.Type key={key} type={ref} />);

      const items = type.members.map((prop, key) => (
        <React.Fragment key={key}>
          <span className={style.TypePropertyName}>
            <Identifier name={prop.ident} optional={prop.optional} />
          </span>
          <span className={style.TextPunctuation}>: </span>
          <Lang.Type type={prop.type} />
        </React.Fragment>
      ));

      return (
        <span className={style.Type}>
          {extend?.length ? (
            <>
              <span className={style.TypeKeyword}> extends </span>
              <Join items={extend} limit={3}>
                <span className={style.TextOperator}>, </span>
              </Join>
            </>
          ) : null}
          <span className={style.TypePreview} data-stldocs-type-preview="properties">
            <span className={style.TypeBrace}>{'{ '}</span>
            <span className={style.TypePreviewContent}>
              <Join items={items} limit={3}>
                <span className={style.TextOperator}>, </span>
              </Join>
            </span>
            <span className={style.TypeBrace}>{'} '}</span>
          </span>
        </span>
      );
    }
  }
}

export type MethodSignatureProps = {
  decl: TSAST.TSDeclFunction;
};

export function MethodSignature({ decl }: MethodSignatureProps) {
  const Lang = useLanguageComponents();
  const { Join, Tooltip } = useComponents();

  const params = decl.signature.parameters.map((param, i) => (
    <React.Fragment key={i}>
      <Tooltip content={<Lang.Type type={param.type} />}>
        <span className={style.TextIdentifier}>{param.ident}</span>
      </Tooltip>
      {param.optional && <span className={style.TextPunctuation}>?</span>}
    </React.Fragment>
  ));

  return (
    <div className={style.MethodSignature}>
      <span className={style.SignatureTitle}>
        {decl.signature.async && <span className={style.TextKeyword}>async </span>}
        <span className={style.SignatureQualified}>
          <span className={style.TextIdentifier}>{decl.qualified?.slice(0, -decl.ident.length)}</span>
        </span>
        <span className={style.SignatureName}>
          <span className={style.TextIdentifier}>{decl.ident}</span>
        </span>
        <span className={style.MethodSignature}>
          {decl.signature.typeParameters && <TypeParams params={decl.signature.typeParameters} />}
          <span className={style.SignatureParen}>{'('}</span>

          <span className={style.SignatureParams}>
            <Join items={params}>
              <span className={style.TextOperator}>{', '}</span>
            </Join>
          </span>

          <span className={style.SignatureParen}>{')'}</span>
          {decl.signature.returns && (
            <>
              <span className={style.TextPunctuation}>: </span>
              <Lang.Type type={decl.signature.returns} />
            </>
          )}
        </span>
      </span>
    </div>
  );
}

export type PropertyProps = {
  decl: TSAST.TSDeclaration;
  children: PropertyFn;
};

export function Property({ decl, children }: PropertyProps) {
  const Lang = useLanguageComponents();

  if (!decl) return;

  switch (decl.kind) {
    case 'TSDeclProperty':
      return children({
        name: decl.key,
        typeName: <Lang.TypeName type={decl.type} />,
        type: decl.type.kind in ComplexTypes && <Lang.Type type={decl.type} />,
      });

    case 'TSDeclTypeAlias':
      return children({
        name: decl.ident,
        typeName: 'alias',
        type: <Lang.Type type={decl.type} />,
      });

    case 'TSDeclReference':
      return children({ type: <Lang.Type type={decl.type} /> });

    case 'TSDeclInterface':
      return children({
        type: (
          <>
            <span className={style.TextIdentifier}>{decl.ident}</span>
            {decl.typeParameters && <TypeParams params={decl.typeParameters} />}
            {decl.extends?.flatMap((t, key) => (
              <React.Fragment key={`extends:${key}`}>
                <span className={style.TextKeyword}> extends </span>
                <Lang.Type type={t} />
              </React.Fragment>
            ))}
          </>
        ),
      });
  }
}

export type DeclarationProps = { decl: TSAST.TSDeclaration };

export function Declaration({ decl }: DeclarationProps) {
  const Lang = useLanguageComponents();

  if (!decl) return;

  switch (decl.kind) {
    case 'TSDeclProperty':
      return (
        <>
          {decl.declare && <span className={style.TextKeyword}>declare </span>}
          <span className={style.TypePropertyName}>
            <Identifier name={decl.key} optional={decl.optional} />
          </span>
          <span className={style.TextPunctuation}>: </span>
          <Lang.Type type={decl.type} />
        </>
      );

    case 'TSDeclFunction':
      return <Lang.MethodSignature decl={decl} />;

    case 'TSDeclTypeAlias':
      return (
        <>
          <Identifier name={decl.ident} />
          <TypeParams params={decl.typeParameters} />
          <span className={style.TextOperator}> = </span>
          <Lang.Type type={decl.type} />
        </>
      );

    case 'TSDeclReference':
      return <Lang.Type type={decl.type} />;

    case 'TSDeclInterface':
      return (
        <>
          <span className={style.TextIdentifier}>{decl.ident}</span>
          <TypeParams params={decl.typeParameters} />
          {decl.extends?.map((t, index) => (
            <React.Fragment key={index}>
              <span className={style.TextKeyword}> extends </span>
              <Lang.Type type={t} />
            </React.Fragment>
          ))}
          <TypePreview path={decl.stainlessPath} />
        </>
      );

    case 'TSDeclClass':
      return (
        <>
          <span className={style.TextKeyword}>class </span>
          <span className={style.TextIdentifier}>{decl.ident}</span>
          <TypeParams params={decl.typeParameters} />
          {decl.superClass ? (
            <>
              <span className={style.TextKeyword}> extends </span>
              <Lang.Type type={decl.superClass} />
            </>
          ) : null}
          {decl.implements?.map((t, index) => (
            <React.Fragment key={index}>
              <span className={style.TextKeyword}> implements </span>
              <Lang.Type type={t} />
            </React.Fragment>
          ))}
        </>
      );
  }
}
