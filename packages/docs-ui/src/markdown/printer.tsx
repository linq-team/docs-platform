import * as React from 'react';
import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type * as SDKJSON from '@stainless/sdk-json';
import type { DocsLanguage } from '../routing';

import { DocsProvider, useLanguageComponents } from '../contexts';

import style from '../style';
import { ComponentProvider } from '../contexts/component';
import type { AppComponents } from '../contexts/component-types';

type ProvidersProps = {
  language: DocsLanguage;
  children: React.ReactNode;
};

function SDKReference({ stainlessPath, children }: ComponentProps<AppComponents['SDKReference']>) {
  if (!stainlessPath) return children;
  return <span className={style.TypeReference}>{children}</span>;
}

function Providers({ language, children }: ProvidersProps) {
  return (
    <DocsProvider spec={null} language={language}>
      <ComponentProvider
        components={{
          SDKReference,
        }}
      >
        {children}
      </ComponentProvider>
    </DocsProvider>
  );
}

function RenderType({ type, full }: { type: SDKJSON.Type; full?: boolean }) {
  const { Type, TypeName } = useLanguageComponents();
  return full ? <Type type={type} /> : <TypeName type={type} />;
}

export function typeName(language: DocsLanguage, type: SDKJSON.Type) {
  const component = (
    <Providers language={language}>
      <RenderType type={type} />
    </Providers>
  );

  return renderToStaticMarkup(component);
}

export function type(language: DocsLanguage, type: SDKJSON.Type) {
  const component = (
    <Providers language={language}>
      <RenderType type={type} full={true} />
    </Providers>
  );

  return renderToStaticMarkup(component);
}

function RenderDeclaration({ decl }: { decl: SDKJSON.DeclarationNode }) {
  const { Declaration } = useLanguageComponents();
  return <Declaration decl={decl} />;
}

export function declaration(language: DocsLanguage, decl: SDKJSON.DeclarationNode) {
  const component = (
    <Providers language={language}>
      <RenderDeclaration decl={decl} />
    </Providers>
  );

  return renderToStaticMarkup(component);
}

function RenderMethod({ method }: { method: SDKJSON.DeclarationNode }) {
  const { MethodSignature } = useLanguageComponents();
  return <MethodSignature decl={method} />;
}

export function methodSignature(language: DocsLanguage, decl: SDKJSON.DeclarationNode) {
  const component = (
    <Providers language={language}>
      <RenderMethod method={decl} />
    </Providers>
  );

  return renderToStaticMarkup(component);
}
