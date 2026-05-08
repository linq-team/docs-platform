import * as React from 'react';
import { RubyAST as AST } from '@stainless/sdk-json';
import { useDeclaration, useLanguage, useLanguageComponents, useSpec } from '../contexts';
import { useComponents } from '../contexts/use-components';
import style from '../style';
import { PropertyFn } from '.';

const ComplexTypes: Record<string, string> = {
  RubyTypeObject: 'object',
  RubyTypeUnion: 'union',
  RubyTypeIntersection: 'intersection',
  RubyTypeArray: 'array',
  RubyTypeMap: 'hash',
};

const Keywords: Record<string, string> = {
  RubyTypeBinary: 'FileInput',
  RubyTypeUnknown: 'untyped',
  RubyTypeNull: 'nil',
  RubyTypeInteger: 'Integer',
  RubyTypeFloat: 'Float',
  RubyTypeBoolean: 'bool',
};

type TypeProps = {
  type: AST.RubyType;
};

export function TypeName({ type }: TypeProps) {
  const Lang = useLanguageComponents();
  return ComplexTypes[type.kind] ?? <Lang.Type type={type} />;
}

const VALID_IDENTIFIER = /^[_A-Za-z][_A-Za-z0-9]*$/;

function TypePreview({ path }: { path: string }) {
  const spec = useSpec();
  const language = useLanguage();
  const decl = useDeclaration(path, false);
  const { Join } = useComponents();

  if (
    !(decl && 'children' in decl && decl.children && decl.children.length > 0) ||
    ('type' in decl && decl['type'] && 'kind' in decl['type'] && decl['type']?.['kind'] === 'RubyTypeUnion')
  )
    return;

  const items = decl.children.map((prop, key) => {
    const p = spec?.decls?.[language]?.[prop];
    return (
      <span key={key} className={style.TypePropertyName}>
        <span className={style.TextIdentifier}>{p && 'ident' in p ? p['ident'] : null}</span>
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

export function Type({ type }: TypeProps) {
  const Lang = useLanguageComponents();
  const { SDKReference, Join } = useComponents();

  switch (type.kind) {
    case 'RubyTypeBinary':
    case 'RubyTypeUnknown':
    case 'RubyTypeNull':
    case 'RubyTypeInteger':
    case 'RubyTypeFloat':
    case 'RubyTypeBoolean':
      return (
        <span className={style.Type}>
          <span className={style.TypeKeyword}>{Keywords[type.kind]}</span>
        </span>
      );

    case 'RubyTypeString':
      return (
        <span className={style.Type}>
          <span className={style.TypeString}>String</span>
        </span>
      );

    case 'RubyTypeLiteral':
      switch (typeof type.literal) {
        case 'string':
          return (
            <span className={style.Type}>
              <span className={style.LiteralString}>
                {':'}
                {type.literal.match(VALID_IDENTIFIER) ? type.literal : JSON.stringify(type.literal)}
              </span>
            </span>
          );
        case 'number':
          return (
            <span className={style.Type}>
              <span className={style.LiteralNumeric}>{JSON.stringify(type.literal)}</span>
            </span>
          );
        case 'boolean':
          return (
            <span className={style.Type}>
              <span className={style.LiteralBoolean}>{JSON.stringify(type.literal)}</span>
            </span>
          );
      }
      break;

    case 'RubyTypeArray':
      return (
        <span className={style.Type}>
          <span className={style.TypeArray}>{'Array['}</span>
          <Lang.Type type={type.elementType} />
          <span className={style.TypeArray}>{']'}</span>
        </span>
      );

    case 'RubyTypeMap':
      return (
        <span className={style.Type}>
          <span className={style.TypeArray}>{'Hash['}</span>
          {type.indexType.kind === 'RubyTypeString' ? (
            <span className={style.TypeString}>Symbol</span>
          ) : (
            <Lang.Type type={type.indexType} />
          )}
          , <Lang.Type type={type.itemType} />
          <span className={style.TypeArray}>{']'}</span>
        </span>
      );

    case 'RubyTypeReference': {
      const name = type.ident.split('.').at(-1);
      if (!type.typeParameters || type.typeParameters.length === 0)
        return (
          <span className={style.Type}>
            <SDKReference stainlessPath={type.$ref!}>{name}</SDKReference>
            <TypePreview path={type.$ref!} />
          </span>
        );

      const typeParameters = type.typeParameters.map((t, i) => <Lang.Type key={i} type={t} />);

      return (
        <span className={style.Type}>
          <SDKReference stainlessPath={type.$ref!}>{name}</SDKReference>
          <span className={style.TypeBracket}>{'<'}</span>
          <Join items={typeParameters}>
            <span className={style.TextOperator}>, </span>
          </Join>
          <span className={style.TypeBracket}>{'>'}</span>
          <TypePreview path={type.$ref!} />
        </span>
      );
    }

    case 'RubyTypeIntersection':
    case 'RubyTypeUnion': {
      const items = type.types.map((t, key) => <Lang.Type key={key} type={t} />);

      const delimiter = type.kind === 'RubyTypeUnion' ? '|' : '&';

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

    case 'RubyTypeBuiltinClass':
      return <span className={style.TypeReference}>{type.className}</span>;

    case 'RubyTypeObject': {
      const items = type.members.map((prop, key) => (
        <span key={key} className={style.TextIdentifier}>
          {prop.ident}
        </span>
      ));

      return (
        <span className={style.Type}>
          <span className={style.TextIdentifier}>{type.ident}</span>
          <span className={style.TypePreview} data-stldocs-type-preview="properties">
            <span className={style.TypePreviewContent}>
              <span className={style.TypeBrace}>{'{ '}</span>
              <Join items={items} limit={3}>
                <span className={style.TextOperator}>, </span>
              </Join>
              <span className={style.TypeBrace}>{'}'}</span>
            </span>
          </span>
        </span>
      );
    }
  }
}

export type MethodSignatureProps = {
  decl: AST.RubyDeclFunction;
};

export function MethodSignature({ decl }: MethodSignatureProps) {
  const Lang = useLanguageComponents();
  const { Join } = useComponents();

  const params = decl.args.map((param, i) => (
    <React.Fragment key={i}>
      <span className={style.TextIdentifier}>{param.ident}</span>
    </React.Fragment>
  ));

  return (
    <div className={style.MethodSignature}>
      <span className={style.SignatureTitle}>
        <span className={style.SignatureQualified}>
          <span className={style.TextIdentifier}>{decl.qualified?.slice(0, -decl.ident.length)}</span>
        </span>
        <span className={style.SignatureName}>
          <span className={style.TextIdentifier}>{decl.ident}</span>
        </span>
        <span className={style.MethodSignature}>
          <span className={style.SignatureParen}>{'('}</span>

          <span className={style.SignatureParams}>
            <Join items={params}>
              <span className={style.TextOperator}>{', '}</span>
            </Join>
          </span>

          <span className={style.SignatureParen}>{')'}</span>
          {' -> '}
          {decl.returns ? <Lang.Type type={decl.returns} /> : 'void'}
        </span>
      </span>
    </div>
  );
}

export type PropertyProps = {
  decl: AST.RubyDeclaration;
  children: PropertyFn;
};

export function Property({ decl, children }: PropertyProps) {
  const Lang = useLanguageComponents();

  switch (decl.kind) {
    case 'RubyDeclProperty':
      return children({
        name: decl.ident,
        typeName: <Lang.TypeName type={decl.type} />,
        type: decl.type.kind in ComplexTypes && <Lang.Type type={decl.type} />,
      });

    case 'RubyDeclTypeAlias':
      return children({
        name: decl.ident,
        typeName: 'alias',
        type: <Lang.Type type={decl.type} />,
      });

    case 'RubyDeclReference':
      return children({ type: <Lang.Type type={decl.type} /> });

    case 'RubyDeclClass':
      return children({ name: decl.ident, typeName: 'class' });
  }
}

export type DeclarationProps = { decl: AST.RubyDeclaration };

export function Declaration({ decl }: DeclarationProps) {
  const Lang = useLanguageComponents();

  if (!decl) return;

  switch (decl.kind) {
    case 'RubyDeclProperty':
      return (
        <>
          <span className={style.TypePropertyName}>
            <span className={style.TextIdentifier}>{decl.ident}</span>
          </span>
          <span className={style.TextPunctuation}>: </span>
          <Lang.Type type={decl.type} />
        </>
      );

    case 'RubyDeclTypeAlias':
      return (
        <>
          <span className={style.TextIdentifier}>{decl.ident}</span>
          <span className={style.TextOperator}> = </span>
          <Lang.Type type={decl.type} />
        </>
      );

    case 'RubyDeclClass':
      return (
        <>
          <span className={style.TextKeyword}>class </span>
          <span className={style.TextIdentifier}>{decl.ident}</span>
          <TypePreview path={decl.stainlessPath} />
        </>
      );

    case 'RubyDeclReference':
      return (
        <>
          {decl.ident && (
            <>
              <span className={style.TextIdentifier}>{decl.ident}</span>
              <span className={style.TextOperator}> = </span>
            </>
          )}
          <Lang.Type type={decl.type} />
        </>
      );
  }
}
