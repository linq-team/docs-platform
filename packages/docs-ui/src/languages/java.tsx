import * as React from 'react';
import { JavaAST as AST } from '@stainless/sdk-json';

import { useLanguage, useLanguageComponents } from '../contexts';
import { useComponents } from '../contexts/use-components';
import style from '../style';
import { PropertyFn } from '.';
import { Badge } from '@stainless-api/ui-primitives';

function showFullType(type: AST.JavaType) {
  return (
    type.kind === 'JavaTypeReference' &&
    (type.typeName === 'List' || (type.typeParameters && type.typeParameters.length > 0))
  );
}

const constStyle: Record<string, string> = {
  string: style.LiteralString,
  number: style.LiteralNumeric,
  boolean: style.LiteralBoolean,
};

type TypeProps = {
  type: AST.JavaType;
  optional?: boolean;
};

export function TypeName({ type, optional }: TypeProps) {
  const Lang = useLanguageComponents();

  if (type.kind === 'JavaTypeReference' && type.typeName === 'List') return 'List';

  return <Lang.Type type={type} optional={optional} />;
}

export function Type({ type, optional }: TypeProps) {
  const language = useLanguage();
  const Lang = useLanguageComponents();
  const { Join, SDKReference } = useComponents();

  switch (type.kind) {
    case 'JavaTypeReference': {
      const name = type.typeName.split('.').at(-1);
      const params = type.typeParameters?.map((param, key) => (
        <Lang.Type key={key} type={param} optional={optional} />
      ));

      return (
        <span className={style.Type}>
          <SDKReference stainlessPath={type.$ref!}>{name}</SDKReference>
          {params && params.length > 0 ? (
            <>
              <span className={style.TypeBracket}>{'<'}</span>
              <Join items={params} limit={3}>
                <span className={style.TextOperator}>, </span>
              </Join>
              <span className={style.TypeBracket}>{'>'}</span>
            </>
          ) : null}
        </span>
      );
    }

    case 'JavaTypeClass':
    case 'JavaTypeUnion':
      return (
        <span className={style.Type}>
          <span className={style.TypeKeyword}>class</span>
        </span>
      );

    case 'JavaTypeEnum':
      return (
        <span className={style.Type}>
          <span className={style.TypeKeyword}>{language === 'kotlin' ? 'enum class' : 'enum'}</span>
        </span>
      );

    case 'JavaTypeVoid':
      return (
        <span className={style.Type}>
          <span className={style.TypeKeyword}>{language === 'kotlin' ? 'Nothing?' : 'Void'}</span>
        </span>
      );

    case 'JavaTypeBoolean':
      return (
        <span className={style.Type}>
          <span className={style.TypeKeyword}>
            {language === 'kotlin' || optional ? 'Boolean' : 'boolean'}
          </span>
        </span>
      );

    case 'JavaTypeDouble':
      return (
        <span className={style.Type}>
          <span className={style.TypeKeyword}>{language === 'kotlin' || optional ? 'Double' : 'double'}</span>
        </span>
      );

    case 'JavaTypeLong':
      return (
        <span className={style.Type}>
          <span className={style.TypeKeyword}>{language === 'kotlin' || optional ? 'Long' : 'long'}</span>
        </span>
      );

    case 'JavaTypeString':
      return (
        <span className={style.Type}>
          <span className={style.TypeString}>String</span>
        </span>
      );

    case 'JavaTypeConstant':
      return (
        <span className={style.Type}>
          <span className={style.TypeKeyword}>JsonValue</span>;
        </span>
      );
  }
}

export type MethodSignatureProps = {
  decl: AST.JavaDeclFunction;
};

export function MethodSignature({ decl }: MethodSignatureProps) {
  const Lang = useLanguageComponents();
  const language = useLanguage();
  const { Join, Tooltip } = useComponents();

  const params = decl.parameters.map((param, i) => (
    <React.Fragment key={i}>
      <Tooltip content={<Lang.Type type={param.typeAnnotation} />}>
        <span className={style.TextIdentifier}>{param.ident}</span>
        {param.hasDefault && (
          <>
            {' '}
            <span className={style.TextOperator}>=</span> <Lang.Type type={param.typeAnnotation} />
            <span className={style.TextOperator}>.</span>
            <span className={style.TextIdentifier}>none</span>
            <span className={style.TextOperator}>()</span>
          </>
        )}
      </Tooltip>
    </React.Fragment>
  ));

  return (
    <div className={style.MethodSignature}>
      <span className={style.SignatureTitle}>
        {decl.returnType && language !== 'kotlin' && (
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
          {decl.returnType && language === 'kotlin' && (
            <>
              <span className={style.TextOperator}>:</span> <Lang.Type type={decl.returnType} />
            </>
          )}
        </span>
      </span>
    </div>
  );
}

export type PropertyProps = {
  decl: AST.JavaDeclaration;
  children: PropertyFn;
};

export function Property({ decl, children }: PropertyProps) {
  const Docs = useComponents();
  const Lang = useLanguageComponents();
  const language = useLanguage();

  if (!decl) return null;

  switch (decl.kind) {
    case 'JavaDeclProperty': {
      const typeRaw = <Lang.Type type={decl.type} optional={decl.optional} />;
      const typeWrapped = decl.optional ? (
        <>
          <span className={style.TypeKeyword}>Optional</span>
          <span className={style.TypeBracket}>{'<'}</span>
          {typeRaw}
          <span className={style.TypeBracket}>{'>'}</span>
        </>
      ) : (
        typeRaw
      );

      const badges = (
        <>
          {decl.type.kind === 'JavaTypeConstant' && (
            <Docs.Tooltip content={<span className={style.TextIdentifier}>{decl.type.value}</span>}>
              <span className={style.TextIdentifier}>constant</span>
            </Docs.Tooltip>
          )}
        </>
      );

      return children({
        name: decl.ident,
        typeName: <Lang.TypeName type={decl.type} optional={decl.optional} />,
        type: showFullType(decl.type) && typeWrapped,
        badges,
      });
    }

    case 'JavaDeclConst':
      return children({
        name: decl.ident,
        typeName: 'const',
        type: <span className={constStyle[typeof decl.value]}>{JSON.stringify(decl.value)}</span>,
      });

    case 'JavaDeclType': {
      const typeName =
        decl.type.kind === 'JavaTypeUnion'
          ? 'union'
          : decl.type.kind === 'JavaTypeEnum'
            ? language === 'kotlin'
              ? 'enum class'
              : 'enum'
            : 'class';

      return children({ name: decl.ident, typeName });
    }

    case 'JavaDeclReference':
      return children({ type: <Lang.Type type={decl.type} /> });
  }
}

export type DeclarationProps = {
  decl: AST.JavaDeclaration;
};

export function Declaration({ decl }: DeclarationProps) {
  const Docs = useComponents();
  const Lang = useLanguageComponents();
  const language = useLanguage();

  if (!decl) return null;

  switch (decl.kind) {
    case 'JavaDeclConst':
      return (
        <>
          <span className={style.TextIdentifier}>{decl.ident}</span>
          <span className={style.TextPunctuation}>{'('}</span>
          {JSON.stringify(decl.value)}
          <span className={style.TextPunctuation}>{')'}</span>
        </>
      );

    case 'JavaDeclType': {
      const keyword =
        decl.type.kind === 'JavaTypeEnum' ? (language === 'kotlin' ? 'enum class' : 'enum') : 'class';

      return (
        <>
          <span className={style.TextKeyword}>{keyword}</span>{' '}
          <span className={style.TextIdentifier}>{decl.ident}</span>
          <span className={style.TextPunctuation}>:</span>
          {decl.type.kind === 'JavaTypeUnion' && (
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

    case 'JavaDeclProperty': {
      const inlineType = <Lang.Type type={decl.type} optional={decl.optional} />;

      const ident = (
        <span className={style.TypePropertyName}>
          <span className={style.TextIdentifier}>{decl.ident}</span>
        </span>
      );

      const suffix =
        decl.type.kind === 'JavaTypeConstant' ? (
          <>
            {' '}
            <Docs.Tooltip content={<span className={style.TextIdentifier}>{decl.type.value}</span>}>
              <Badge size="sm">constant</Badge>
            </Docs.Tooltip>
          </>
        ) : null;

      if (language === 'kotlin')
        return (
          <>
            {ident}
            <span className={style.TextPunctuation}>:</span>{' '}
            {decl.optional ? (
              <>
                <span className={style.TypeReference}>Optional</span>
                <span className={style.TypeBracket}>{'<'}</span>
                {inlineType}
                <span className={style.TypeBracket}>{'>'}</span>
              </>
            ) : (
              inlineType
            )}
            {suffix}
          </>
        );

      return (
        <>
          {decl.optional ? (
            <>
              <span className={style.TypeReference}>Optional</span>
              <span className={style.TypeBracket}>{'<'}</span>
              {inlineType}
              <span className={style.TypeBracket}>{'>'}</span>
            </>
          ) : (
            inlineType
          )}{' '}
          {ident}
          {suffix}
        </>
      );
    }

    case 'JavaDeclReference':
      return <Lang.Type type={decl.type} />;
  }
}
