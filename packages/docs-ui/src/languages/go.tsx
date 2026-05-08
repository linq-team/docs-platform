import * as React from 'react';
import { GoAST as AST } from '@stainless/sdk-json';

import { useComponents } from '../contexts/use-components';
import { useLanguageComponents } from '../contexts';
import style from '../style';
import { PropertyFn } from '.';
import { Badge } from '@stainless-api/ui-primitives';

const ComplexTypes: Record<string, string> = {
  GoTypeMap: 'map',
  GoTypeArray: 'array',
};

const Keywords = {
  GoTypeAny: 'any',
  GoTypeUnknown: 'unknown',
  GoTypeInt: 'int64',
  GoTypeFloat: 'float64',
  GoTypeBool: 'bool',
  GoTypeError: 'error',
};

function isField(type: AST.GoType) {
  return type.kind === 'GoTypeReference' && type.typeName === 'param.Field';
}

export type TypeProps = {
  type: AST.GoType;
};

export function TypeName({ type }: TypeProps) {
  const Lang = useLanguageComponents();
  return isField(type) ? 'field' : (ComplexTypes[type.kind] ?? <Lang.Type type={type} />);
}

export function Type({ type }: TypeProps) {
  const Lang = useLanguageComponents();
  const { Join, SDKReference } = useComponents();

  switch (type.kind) {
    case 'GoTypeReference': {
      const params = type.typeParameters?.map((param, key) => <Lang.Type key={key} type={param} />);

      return (
        <span className={style.Type}>
          {type.$ref ? <SDKReference stainlessPath={type.$ref}>{type.typeName}</SDKReference> : type.typeName}
          {params && params.length > 0 ? (
            <>
              <span className={style.TypeBracket}>{'['}</span>
              <Join items={params} limit={3}>
                <span className={style.TextOperator}>, </span>
              </Join>
              <span className={style.TypeBracket}>{']'}</span>
            </>
          ) : null}
        </span>
      );
    }

    case 'GoTypeAny':
    case 'GoTypeUnknown':
    case 'GoTypeInt':
    case 'GoTypeFloat':
    case 'GoTypeBool':
    case 'GoTypeError':
      return (
        <span className={style.Type}>
          <span className={style.TypeKeyword}>{Keywords[type.kind]}</span>
        </span>
      );

    case 'GoTypeString':
      return (
        <span className={style.Type}>
          <span className={style.TypeString}>string</span>
        </span>
      );

    case 'GoTypeArray':
      return (
        <span className={style.Type}>
          <span className={style.TextOperator}>[]</span>
          <Lang.Type type={type.elementType} />
        </span>
      );

    case 'GoTypeStruct':
      return (
        <span className={style.Type}>
          <span className={style.TypeKeyword}>{'struct{…}'}</span>
        </span>
      );

    case 'GoTypeInterface':
      return (
        <span className={style.Type}>
          <span className={style.TypeKeyword}>{'interface{…}'}</span>
        </span>
      );

    case 'GoTypeMap':
      return (
        <span className={style.Type}>
          <span className={style.TypeKeyword}>map</span>
          <span className={style.TypeBracket}>[</span>
          <Lang.Type type={type.indexType} />
          <span className={style.TextPunctuation}>,</span> <Lang.Type type={type.itemType} />
          <span className={style.TypeBracket}>]</span>
        </span>
      );

    case 'GoTypePointer':
      return (
        <span className={style.Type}>
          <span className={style.TextOperator}>*</span>
          <Lang.Type type={type.inner} />
        </span>
      );
  }
}

export type MethodSignatureProps = {
  decl: AST.GoDeclFunction;
};

export function MethodSignature({ decl }: MethodSignatureProps) {
  const Lang = useLanguageComponents();
  const { Join } = useComponents();

  const params = decl.parameters.map((param, i) => (
    <React.Fragment key={i}>
      <span className={style.TextIdentifier}>{param.ident}</span>
      {param.optional && <span className={style.TextPunctuation}>?</span>}
    </React.Fragment>
  ));

  const returns = decl.returnType.map((t, key) => <Lang.Type key={key} type={t} />);

  return (
    <div className={style.MethodSignature}>
      <span className={style.SignatureTitle}>
        {decl.async && <span className={style.TextKeyword}>async </span>}
        {decl.qualified && (
          <span className={style.SignatureQualified}>
            <span className={style.TextIdentifier}>{decl.qualified?.slice(0, -decl.ident.length)}</span>
          </span>
        )}
        {decl.kind === 'GoDeclFunction' && (
          <span className={style.SignatureName}>
            <span className={style.TextIdentifier}>{decl.ident}</span>
          </span>
        )}
        <span className={style.MethodSignature}>
          <span className={style.SignatureParen}>{'('}</span>

          <span className={style.SignatureParams}>
            <Join items={params}>
              <span className={style.TextOperator}>{', '}</span>
            </Join>
          </span>

          <span className={style.SignatureParen}>{')'} </span>
          {decl.returnType.length === 1 ? (
            returns
          ) : (
            <>
              <span className={style.SignatureParen}>{'('}</span>
              <Join items={returns}>
                <span className={style.TextOperator}>, </span>
              </Join>
              <span className={style.SignatureParen}>{')'}</span>
            </>
          )}
        </span>
      </span>
    </div>
  );
}

export type PropertyProps = {
  decl: AST.GoDeclaration;
  children: PropertyFn;
};

export function Property({ decl, children }: PropertyProps) {
  const Lang = useLanguageComponents();

  if (!decl) return null;

  switch (decl.kind) {
    case 'GoDeclProperty':
      return children({
        name: decl.ident,
        typeName: <Lang.TypeName type={decl.type} />,
        badges: decl.optional && (
          <Badge size="sm" intent="info">
            Optional
          </Badge>
        ),
        type: (isField(decl.type) || decl.type.kind in ComplexTypes) && <Lang.Type type={decl.type} />,
      });

    case 'GoDeclConst':
      return children({
        name: decl.ident,
        typeName: 'const',
        type: <Lang.Type type={decl.type} />,
      });

    case 'GoDeclReference':
      return children({ type: <Lang.Type type={decl.type} /> });

    case 'GoDeclType':
    case 'GoDeclTypeAlias': {
      const typeName =
        decl.type.kind === 'GoTypeStruct'
          ? 'struct'
          : decl.type.kind === 'GoTypeInterface'
            ? 'interface'
            : decl.kind === 'GoDeclTypeAlias'
              ? 'alias'
              : 'type';

      return children({
        name: decl.ident,
        typeName,
        type: ['GoTypeStruct', 'GoTypeInterface'].includes(decl.type.kind) || <Lang.Type type={decl.type} />,
      });
    }
  }
}

export type DeclarationProps = { decl: AST.GoDeclaration };

export function Declaration({ decl }: DeclarationProps) {
  const Lang = useLanguageComponents();

  if (!decl) return;

  switch (decl.kind) {
    case 'GoDeclType':
      return (
        <>
          <span className={style.TextKeyword}>type </span>
          <span className={style.TextIdentifier}>{decl.ident} </span>
          <Lang.Type type={decl.type} />
        </>
      );

    case 'GoDeclTypeAlias':
      return (
        <>
          <span className={style.TextKeyword}>type </span>
          <span className={style.TextIdentifier}>{decl.ident} </span>
          <span className={style.TextOperator}>= </span>
          <Lang.Type type={decl.type} />
        </>
      );

    case 'GoDeclProperty':
      return (
        <>
          <span className={style.TypePropertyName}>
            <span className={style.TextIdentifier}>{decl.ident} </span>
          </span>
          <Lang.Type type={decl.type} />
        </>
      );

    case 'GoDeclReference':
      return <Lang.Type type={decl.type} />;

    case 'GoDeclConst':
      return (
        <>
          <span className={style.TextKeyword}>const </span>
          <span className={style.TextIdentifier}>{decl.ident} </span>
          <Lang.Type type={decl.type} />
          <span className={style.TextOperator}> = </span>
          {JSON.stringify(decl.value)}
        </>
      );
  }
}
