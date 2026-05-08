import { CLIAST as AST } from '@stainless/sdk-json';
import { HttpAST as HttpAst } from '@stainless/sdk-json';
import * as Http from './http';
import { useLanguageComponents } from '../contexts';
import { useComponents } from '../contexts/use-components';
import style from '../style';
import React from 'react';
import { PropertyFn } from '.';

const ComplexTypes: Partial<Record<HttpAst.HttpType['kind'], string>> = {
  HttpTypeUnion: 'union',
  HttpTypeIntersection: 'intersection',
};

const constStyle: Record<string, string> = {
  string: style.LiteralString,
  number: style.LiteralNumeric,
  boolean: style.LiteralBoolean,
};

type TypeProps = {
  type: HttpAst.HttpType;
};

export function TypeName(props: TypeProps) {
  return Http.TypeName(props);
}

export function Type({ type }: TypeProps) {
  switch (type.kind) {
    case 'HttpTypeBinary':
      return (
        <span className={style.Type}>
          <span className={style.TypePlain}>file path</span>
        </span>
      );
    default:
      return Http.Type({ type });
  }
}

export type MethodSignatureProps = {
  decl: AST.CLICommand;
};

export function MethodSignature({ decl }: MethodSignatureProps) {
  const { Join } = useComponents();

  const params = decl.arguments?.map((arg, i) => (
    <React.Fragment key={i}>
      <span className={style.TextOperator}>&lt;</span>
      <span className={style.TextIdentifier}>{arg.value}</span>
      <span className={style.TextOperator}>&gt;</span>
    </React.Fragment>
  ));

  return (
    <div className={style.MethodSignature}>
      <span className={style.TextOperator}>{'$ '}</span>
      <span className={style.SignatureName}>
        <span className={style.TextIdentifier}>{decl.invocation.join(' ')}</span>
      </span>
      {params && (
        <span className={style.MethodSignature}>
          {' '}
          <Join items={params}> </Join>
        </span>
      )}
      {decl.options && decl.options.length > 0 ? (
        <span className={style.TextOperator}> [options]</span>
      ) : null}
    </div>
  );
}

function renderVariantInfo(type: HttpAst.HttpType) {
  if (
    type.kind === 'HttpTypeUnion' &&
    type.types.every((t) => t.kind === 'HttpTypeObject' || t.kind === 'HttpTypeReference')
  )
    return <>One of the following {type.types.length} object variants:</>;
}

export type PropertyProps = {
  decl: AST.CLIDeclaration;
  children: PropertyFn;
};

export function Property({ decl, children }: PropertyProps) {
  const Lang = useLanguageComponents();

  if (!decl) return;

  switch (decl.kind) {
    case 'CLIFlag':
    case 'CLISchemaProperty': {
      const variants = decl.type ? renderVariantInfo(decl.type) : undefined;

      return children({
        name: (
          <>
            {decl.kind === 'CLIFlag' && '--'}
            {flagName(decl)}
          </>
        ),
        typeName: decl.type ? <Lang.TypeName type={decl.type} /> : undefined,
        type: decl.type && decl.type.kind in ComplexTypes && !variants && <Lang.Type type={decl.type} />,
      });
    }

    case 'CLIFunction':
      return children({
        name: decl.name,
        typeName: 'function',
      });

    case 'CLIStdin':
      return children({
        name: 'stdin',
      });

    case 'CLICommand':
      return children({
        name: decl.invocation.join(' '),
        typeName: 'command',
      });
  }
}

function flagName(node: AST.CLIFlag | AST.CLISchemaProperty) {
  if (node.kind === 'CLIFlag' && node.flag)
    return typeof node.flag === 'string' ? node.flag : node.flag.name || '';
  return node.name ?? node.ident ?? 'unknown';
}

export type DeclarationProps = { decl: AST.CLIDeclaration };

export function Declaration({ decl }: DeclarationProps) {
  const Lang = useLanguageComponents();

  if (!decl) return;

  switch (decl.kind) {
    case 'CLICommand':
      return <span className={style.TextIdentifier}>{`$ ${decl.invocation.join(' ')}`}</span>;

    case 'CLISchemaProperty':
    case 'CLIFlag':
      if ('value' in decl) {
        return <span className={constStyle[typeof decl.value]}>{JSON.stringify(decl.value)}</span>;
      }

      return (
        <>
          <span className={style.PropertyName}>
            <span className={style.TextIdentifier}>
              {decl.kind === 'CLIFlag' && '--'}
              {flagName(decl)}
            </span>
          </span>
          {decl.type && (
            <>
              <span className={style.TextPunctuation}>: </span>
              {decl.optional && <span className={style.TextPunctuation}>optional </span>}
              {typeof decl.type === 'string' ? (
                <span className={style.TextKeyword}>{decl.type}</span>
              ) : (
                <Lang.Type type={decl.type} />
              )}
            </>
          )}
        </>
      );

    case 'CLIFunction':
      return <span className={style.TextIdentifier}>{decl.name}()</span>;

    case 'CLIStdin':
      return <span className={style.TextIdentifier}>stdin</span>;
  }
}
