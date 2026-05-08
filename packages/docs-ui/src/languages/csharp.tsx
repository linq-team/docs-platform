import * as React from 'react';
import { CSharpAST as AST } from '@stainless/sdk-json';
import { useLanguageComponents } from '../contexts';
import { useComponents } from '../contexts/use-components';
import style from '../style';
import { PropertyFn } from '.';
import { Badge } from '@stainless-api/ui-primitives';

const constStyle: Record<string, string> = {
  string: style.LiteralString,
  number: style.LiteralNumeric,
  boolean: style.LiteralBoolean,
};

export function TypeName({ type, optional }: TypeProps) {
  const Lang = useLanguageComponents();
  return (
    <>
      <Lang.Type type={type} />
      {optional && <span className={style.TextOperator}>? </span>}
    </>
  );
}

type TypeProps = {
  type: AST.CSharpType;
  optional?: boolean;
};

export function Type({ type }: TypeProps) {
  const Lang = useLanguageComponents();
  const { Join, SDKReference } = useComponents();

  switch (type.kind) {
    case 'CSharpTypeReference': {
      const params = type.typeParameters?.map((param, key) => <Lang.Type key={key} type={param} />);

      return (
        <span className={style.Type}>
          <SDKReference stainlessPath={type.$ref!}>{type.typeName}</SDKReference>
          {params && params.length > 0 ? (
            <>
              <span className={style.TypeBracket}>{'<'}</span>
              <Join items={params} limit={3}>
                <span className={style.TextOperator}>, </span>
              </Join>
              <span className={style.TypeBracket}>{'>'}</span>
            </>
          ) : null}
          {type.nullable && <span className={style.TextOperator}>?</span>}
        </span>
      );
    }

    case 'CSharpTypeClass':
    case 'CSharpTypeUnion':
      return (
        <span className={style.Type}>
          <span className={style.TypeKeyword}>class</span>
        </span>
      );

    case 'CSharpTypeEnum':
    case 'CSharpTypeBoolean':
    case 'CSharpTypeFloat':
    case 'CSharpTypeDouble':
    case 'CSharpTypeInt':
    case 'CSharpTypeLong':
      return (
        <span className={style.Type}>
          <span className={style.TypeKeyword}>{type.kind.slice(10)}</span>
        </span>
      );

    case 'CSharpTypeString':
      return (
        <span className={style.Type}>
          <span className={style.TypeString}>string</span>
        </span>
      );

    case 'CSharpTypeConstant':
      return (
        <span className={style.Type}>
          <span className={style.TypeKeyword}>JsonElement</span>
        </span>
      );
  }
}

export type MethodSignatureProps = {
  decl: AST.CSharpDeclFunction;
};

export function MethodSignature({ decl }: MethodSignatureProps) {
  const Lang = useLanguageComponents();
  const { Join, Tooltip } = useComponents();

  const params = decl.parameters.map((param, i) => (
    <React.Fragment key={i}>
      <Tooltip content={<Lang.Type type={param.typeAnnotation} />}>
        <span className={style.TextIdentifier}>{param.ident}</span>
        {param.hasDefault && (
          <>
            {' '}
            <span className={style.TextOperator}>=</span> <span className={style.TextKeyword}>default</span>
          </>
        )}
      </Tooltip>
    </React.Fragment>
  ));

  return (
    <div className={style.MethodSignature}>
      <span className={style.SignatureTitle}>
        {decl.returnType && (
          <span className={style.SignatureReturns}>
            <Lang.Type type={decl.returnType} />{' '}
          </span>
        )}
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
        </span>
      </span>
    </div>
  );
}

export type PropertyProps = {
  decl: AST.CSharpDeclaration;
  children: PropertyFn;
};

export function Property({ decl, children }: PropertyProps) {
  const Lang = useLanguageComponents();

  if (!decl) return null;

  switch (decl.kind) {
    case 'CSharpDeclProperty': {
      const type = <Lang.Type type={decl.type} optional={decl.optional} />;
      return children({
        name: decl.ident,
        typeName: <Lang.TypeName type={decl.type} optional={decl.optional} />,
        type,
      });
    }

    case 'CSharpDeclConst':
      return children({
        name: decl.ident,
        typeName: 'constant',
        type: <span className={constStyle[typeof decl.value]}>{JSON.stringify(decl.value)}</span>,
      });

    case 'CSharpDeclType': {
      const typeName =
        decl.type.kind === 'CSharpTypeUnion'
          ? 'union'
          : decl.type.kind === 'CSharpTypeEnum'
            ? 'enum'
            : 'class';
      return children({ name: decl.ident, typeName });
    }

    case 'CSharpDeclReference':
      return children({ type: <Lang.Type type={decl.type} /> });
  }
}

export type DeclarationProps = {
  decl: AST.CSharpDeclaration;
};

export function Declaration({ decl }: DeclarationProps) {
  const Docs = useComponents();
  const Lang = useLanguageComponents();

  if (!decl) return null;

  switch (decl.kind) {
    case 'CSharpDeclConst':
      return (
        <Docs.Tooltip content={JSON.stringify(decl.value)}>
          <span className={style.TextIdentifier}>{decl.ident}</span>
        </Docs.Tooltip>
      );

    case 'CSharpDeclType': {
      const keyword = decl.type.kind === 'CSharpTypeEnum' ? 'enum' : 'class';

      return (
        <>
          <span className={style.TextKeyword}>{keyword}</span>{' '}
          <span className={style.TextIdentifier}>{decl.ident}</span>
          <span className={style.TextPunctuation}>:</span>
          {decl.type.kind === 'CSharpTypeUnion' && (
            <>
              {' '}
              <Docs.Tooltip content="A class that can be one of several variants.">
                <Badge size="sm">union</Badge>
              </Docs.Tooltip>{' '}
            </>
          )}
        </>
      );
    }

    case 'CSharpDeclProperty': {
      return (
        <>
          {decl.optional === false && (
            <>
              <span className={style.TextKeyword}>required</span>{' '}
            </>
          )}
          <Lang.Type type={decl.type} optional={decl.optional} />
          {decl.nullable && !('nullable' in decl.type && decl.type.nullable) && (
            <span className={style.TextOperator}>?</span>
          )}{' '}
          <span className={style.TextIdentifier}>{decl.ident}</span>
          {decl.type.kind === 'CSharpTypeConstant' && (
            <>
              {' '}
              <Docs.Tooltip content={<span className={style.TextIdentifier}>{decl.type.value}</span>}>
                <Badge size="sm">constant</Badge>
              </Docs.Tooltip>
            </>
          )}
        </>
      );
    }

    case 'CSharpDeclReference':
      return <Lang.Type type={decl.type} />;
  }
}
