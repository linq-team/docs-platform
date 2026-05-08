import * as React from 'react';
import { PythonAST as AST } from '@stainless/sdk-json';
import { useLanguageComponents } from '../contexts';
import { useComponents } from '../contexts/use-components';
import style from '../style';
import { PropertyFn } from '.';

const constStyle: Record<string, string> = {
  string: style.LiteralString,
  number: style.LiteralNumeric,
  boolean: style.LiteralBoolean,
};

function showFullType(type: AST.PythonType): boolean {
  if (type.kind !== 'PythonTypeReference') return false;
  return type.typeName === 'Optional'
    ? showFullType(type.typeParameters![0]!)
    : type.typeParameters!.length > 0;
}

type TypeProps = {
  type: AST.PythonType;
};

export function TypeName({ type }: TypeProps) {
  const Lang = useLanguageComponents();

  if (type.kind === 'PythonTypeReference') {
    switch (type.typeName) {
      case 'Optional':
        return <Lang.TypeName type={type.typeParameters![0]!} />;
      case 'List':
      case 'Iterable':
      case 'Literal':
      case 'Union':
        return type.typeName.toLowerCase();
    }
  }

  return <Lang.Type type={type} />;
}

export function Type({ type }: TypeProps) {
  const Lang = useLanguageComponents();
  const { Join, SDKReference } = useComponents();

  switch (type.kind) {
    case 'PythonTypeAny':
    case 'PythonTypeUnknown':
    case 'PythonTypeInt':
    case 'PythonTypeFloat':
    case 'PythonTypeBool':
      return (
        <span className={style.Type}>
          <span className={style.TypeKeyword}>{type.kind.slice(10).toLowerCase()}</span>
        </span>
      );

    case 'PythonTypeString':
      return (
        <span className={style.Type}>
          <span className={style.TypeString}>str</span>
        </span>
      );

    case 'PythonTypeLiteral':
      return (
        <span className={style.Type}>
          <span className={constStyle[typeof type.literal.value]}>{JSON.stringify(type.literal.value)}</span>
        </span>
      );

    case 'PythonTypeArray':
      return (
        <span className={style.Type}>
          <span className={style.TypeArray}>{'List['}</span>
          <Lang.Type type={type.elementType} />
          <span className={style.TypeArray}>{']'}</span>
        </span>
      );

    case 'PythonTypeClass':
      return (
        <span className={style.Type}>
          <span className={style.TypeKeyword}>class</span>
        </span>
      );

    case 'PythonTypeMap':
      return (
        <span className={style.Type}>
          <span className={style.TypeKeyword}>Dict</span>
        </span>
      );

    case 'PythonTypeReference': {
      const params = type.typeParameters?.map((param, key) => <Lang.Type key={key} type={param} />);

      return (
        <span className={style.Type}>
          {type.$ref ? (
            <span className={style.TypeReference}>
              <SDKReference stainlessPath={type.$ref}>{type.typeName}</SDKReference>
            </span>
          ) : (
            <span className={params && params.length > 0 ? style.TypeReferencePlain : style.TypeReference}>
              {type.typeName}
            </span>
          )}

          {params && params.length > 0 && (
            <>
              <span className={style.TypeBracket}>{'['}</span>
              <Join items={params} limit={3}>
                <span className={style.TextOperator}>, </span>
              </Join>
              <span className={style.TypeBracket}>{']'}</span>
            </>
          )}
        </span>
      );
    }
  }
}

export type MethodSignatureProps = {
  decl: AST.PythonDeclFunction;
};

export function MethodSignature({ decl }: MethodSignatureProps) {
  const Lang = useLanguageComponents();
  const { Join, Tooltip } = useComponents();

  const params = decl.parameters.map((param, i) => (
    <React.Fragment key={i}>
      <Tooltip content={<Lang.Type type={param.type} />}>
        <span className={style.TextIdentifier}>{param.ident}</span>
      </Tooltip>
    </React.Fragment>
  ));

  return (
    <div className={style.MethodSignature}>
      <span className={style.SignatureTitle}>
        {decl.async && <span className={style.TextKeyword}>async </span>}
        {decl.qualified && (
          <span className={style.SignatureQualified}>
            <span className={style.TextIdentifier}>{decl.qualified?.slice(0, -decl.ident.length)}</span>
          </span>
        )}
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

          <span className={style.SignatureParen}>{')'} </span>
          {decl.returns && (
            <>
              <span className={style.TextOperator}>{' -> '}</span>
              <Lang.Type type={decl.returns} />
            </>
          )}
        </span>
      </span>
    </div>
  );
}

export type PropertyProps = {
  decl: AST.PythonDeclaration;
  children: PropertyFn;
};

export function Property({ decl, children }: PropertyProps) {
  const Lang = useLanguageComponents();

  if (!decl) return;

  switch (decl.kind) {
    case 'PythonDeclProperty':
      return children({
        name: decl.ident,
        typeName: <Lang.TypeName type={decl.type} />,
        type: showFullType(decl.type) && <Lang.Type type={decl.type} />,
      });

    case 'PythonDeclClass':
      return children({ name: decl.ident, typeName: 'class' });

    case 'PythonDeclType':
      return children({
        name: decl.ident,
        typeName: 'type',
        type: <Lang.Type type={decl.type} />,
      });

    case 'PythonDeclReference':
      return children({ type: <Lang.Type type={decl.type} /> });
  }
}

export type DeclarationProps = { decl: AST.PythonDeclaration };

export function Declaration({ decl }: DeclarationProps) {
  const Lang = useLanguageComponents();

  if (!decl) return;

  switch (decl.kind) {
    case 'PythonDeclProperty': {
      const nullable =
        decl.type.kind === 'PythonTypeReference' &&
        decl.type.typeName === 'Optional' &&
        (decl.type.typeParameters ?? []).length > 0;

      return (
        <>
          <span className={style.TypePropertyName}>
            <span className={style.TextIdentifier}>{decl.ident}</span>
          </span>
          <span className={style.TextPunctuation}>: </span>
          {decl.optional && !nullable ? (
            <>
              <span className={style.TypeReferencePlain}>Optional</span>
              <span className={style.TypeBracket}>{'['}</span>
              <Lang.Type type={decl.type} />
              <span className={style.TypeBrace}>{']'}</span>
            </>
          ) : (
            <Lang.Type type={decl.type} />
          )}
        </>
      );
    }

    case 'PythonDeclClass':
      return (
        <>
          <span className={style.TextKeyword}>class </span>
          <span className={style.TextIdentifier}>{decl.ident}</span>
          <span className={style.TextPunctuation}>: </span>
          <span className={`${style.TypePreviewContent} ${style.TextPunctuation}`}>…</span>
        </>
      );

    case 'PythonDeclType':
      return <Lang.Type type={decl.type} />;

    case 'PythonDeclReference':
      return <Lang.Type type={decl.type} />;
  }
}
