import * as React from 'react';
import { PhpAST } from '@stainless/sdk-json';
import { useLanguageComponents } from '../contexts';
import { useComponents } from '../contexts/use-components';
import style from '../style';
import { PropertyFn } from '.';

const ComplexTypes: Record<string, string> = {
  PHPTypeMapArray: 'array',
  PhpTypeListArray: 'list',
  PhpTypeUnion: 'union',
};

const constStyle: Record<string, string> = {
  string: style.LiteralString,
  number: style.LiteralNumeric,
  boolean: style.LiteralBoolean,
};

type TypeProps = {
  type: PhpAST.PhpType;
};

export function TypeName({ type }: TypeProps) {
  const Lang = useLanguageComponents();
  return ComplexTypes[type.kind] ?? <Lang.Type type={type} />;
}

export function Type({ type }: TypeProps) {
  const Docs = useComponents();
  const Lang = useLanguageComponents();
  const { Join } = useComponents();

  switch (type.kind) {
    case 'PhpTypeFloat':
    case 'PhpTypeInt':
    case 'PhpTypeBool':
    case 'PhpTypeNull':
    case 'PhpTypeMixed':
      return (
        <span className={style.Type}>
          <span className={style.TypeKeyword}>{type.kind.slice(7).toLowerCase()}</span>
        </span>
      );

    case 'PhpTypeString':
      return (
        <span className={style.Type}>
          <span className={style.TypeString}>string</span>
        </span>
      );

    case 'PhpTypeComplexBuiltin':
      return (
        <span className={style.Type}>
          <span className={style.TypeKeyword}>{type.typeName}</span>
        </span>
      );

    case 'PhpTypeLiteral':
      return (
        <span className={style.Type}>
          <span className={constStyle[typeof type.literal]}>{JSON.stringify(type.literal)}</span>
        </span>
      );

    case 'PhpTypeDatetime':
      return (
        <span className={style.Type}>
          <span className={style.TypeReference}>\Datetime</span>
        </span>
      );

    case 'PhpTypeReference': {
      const params = type.typeParameters?.map((param, key) => <Lang.Type key={key} type={param} />);
      return (
        <span className={style.Type}>
          <Docs.SDKReference stainlessPath={type.$ref!}>{type.typeName}</Docs.SDKReference>
          {params && params.length > 0 && (
            <>
              <span className={style.TypeBracket}>{'<'}</span>
              <Join items={params} limit={3}>
                <span className={style.TextOperator}>, </span>
              </Join>
              <span className={style.TypeBracket}>{'>'}</span>
            </>
          )}
        </span>
      );
    }

    case 'PhpTypeMapArray':
      return (
        <span className={style.Type}>
          <span className={style.TypeArray}>{'array<string,'}</span>
          <Lang.Type type={type.elementType} />
          <span className={style.TypeArray}>{'>'}</span>
        </span>
      );

    case 'PhpTypeListArray':
      return (
        <span className={style.Type}>
          <span className={style.TypeArray}>{'list<'}</span>
          <Lang.Type type={type.elementType} />
          <span className={style.TypeArray}>{'>'}</span>
        </span>
      );

    case 'PhpTypeUnion': {
      const items = type.types.map((t, key) => <Lang.Type key={key} type={t} />);

      return (
        <span className={style.Type}>
          <span className={style.TypePreview} data-stldocs-type-preview="union">
            <span className={style.TypePreviewContent}>
              <Join items={items} limit={3}>
                <span className={style.TextOperator}> | </span>
              </Join>
            </span>
          </span>
        </span>
      );
    }
  }
}

export type MethodSignatureProps = {
  decl: PhpAST.PhpDeclMethod;
};

export function MethodSignature({ decl }: MethodSignatureProps) {
  const Lang = useLanguageComponents();
  const { Join } = useComponents();

  const params = decl.parameters.map((param, i) => (
    <React.Fragment key={i}>
      {param.optional && <span className={style.TextPunctuation}>?</span>}
      <Lang.Type type={param.typeAnnotation} /> <span className={style.TextIdentifier}>{param.ident}</span>
      {param.hasDefault && (
        <>
          <span className={style.TextPunctuation}> = </span>
          <span className={style.TextKeyword}>default</span>
        </>
      )}
    </React.Fragment>
  ));

  return (
    <div className={style.MethodSignature}>
      <span className={style.SignatureTitle}>
        {decl.qualified && (
          <span className={style.SignatureQualified}>
            <span className={style.TextIdentifier}>
              {'$client->'}
              {decl.qualified?.slice(0, -decl.ident.length)}
            </span>
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

          <span className={style.SignatureParen}>{')'}</span>
          <span className={style.TextPunctuation}>: </span>
          {decl.returnType ? (
            <Lang.Type type={decl.returnType} />
          ) : (
            <span className={style.Type}>
              <span className={style.TypeKeyword}>void</span>
            </span>
          )}
        </span>
      </span>
    </div>
  );
}

export type PropertyProps = {
  decl: PhpAST.PhpDeclaration;
  children: PropertyFn;
};

export function Property({ decl, children }: PropertyProps) {
  const Lang = useLanguageComponents();

  if (!decl) return;

  switch (decl.kind) {
    case 'PhpDeclReference':
      return children({ type: <Lang.Type type={decl.type} /> });

    case 'PhpDeclClassProperty':
    case 'PhpDeclParam':
      return children({
        name: decl.ident,
        typeName: <Lang.TypeName type={decl.type} />,
        type: decl.type.kind in ComplexTypes && <Lang.Type type={decl.type} />,
      });
  }
}

export type DeclarationProps = { decl: PhpAST.PhpDeclaration };

export function Declaration({ decl }: DeclarationProps) {
  const Lang = useLanguageComponents();

  if (!decl) return;

  switch (decl.kind) {
    case 'PhpDeclClass':
    case 'PhpDeclAssocArray':
    case 'PhpDeclEnum':
      return <>Not yet implemented.</>;

    case 'PhpDeclReference':
      return (
        <>
          {decl.scope && <span className={style.TextKeyword}>{decl.scope} </span>}
          <Lang.Type type={decl.type} />
        </>
      );

    case 'PhpDeclParam':
      return (
        <>
          <span className={style.TextIdentifier}>{decl.ident}</span>
          {decl.isPositional ? (
            <span className={style.TextOperator}>{': '}</span>
          ) : (
            <>
              <span className={style.TextOperator}>{decl.optional ? '?:' : ': '}</span>
              {decl.optional && <span className={style.TextOperator}>optional </span>}
            </>
          )}
          <Lang.Type type={decl.type} />
        </>
      );

    case 'PhpDeclAssocArrayProperty':
      return (
        <>
          <span className={style.LiteralString}>'{decl.ident}'</span>
          {decl.optional && <span className={style.TextOperator}>{'?'}</span>}
          <span className={style.TextOperator}>{': '}</span>
          {decl.optional && <span className={style.TextKeyword}>optional </span>}
          <Lang.Type type={decl.type} />
        </>
      );

    case 'PhpDeclClassProperty':
      return (
        <>
          {decl.nullable && <span className={style.TextOperator}>?</span>}
          <Lang.Type type={decl.type} /> <span className={style.TextIdentifier}>{decl.ident}</span>
        </>
      );

    case 'PhpDeclMethod':
      return <Lang.MethodSignature decl={decl} />;
  }
}
