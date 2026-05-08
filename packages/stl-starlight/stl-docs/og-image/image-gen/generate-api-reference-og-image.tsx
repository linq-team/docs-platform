import { ImageResponse } from 'takumi-js/response';
import { generateDocsRoutes } from '@stainless-api/docs/generate-docs-routes';
import { DocsLanguage, parseStainlessPath } from '@stainless-api/docs-ui/routing';
import { getResourceFromSpec } from '@stainless-api/docs-ui/utils';
import { ArrowDownLeft, ArrowUpRight, XIcon } from 'lucide-react';
import OpenGraphImage from 'virtual:stainless-docs/docs-og-image/components/OpenGraphImage';
import OpenGraphFunctionSignature from 'virtual:stainless-docs/docs-og-image/components/OpenGraphFunctionSignature';
import { LanguageDeclNodes, Method } from '@stainless/sdk-json';
import getLogoDataUrl from './get-logo-url';
import { notFoundResponse, renderOptions } from '../utils';
import { OG_IMAGE_OPTIONS } from 'virtual:stainless-docs/docs-og-image';
import { darkThemeVars, lightThemeVars } from '../theme';
import { generateApiBreadcrumbs } from '@stainless-api/docs-ui/components';
import { getSDKJSONInSSR } from '@stainless-api/docs/specs/fetchSpecSSR';
import { RESOLVED_API_REFERENCE_PATH } from 'virtual:stl-starlight-virtual-module';
import type * as SDKJSON from '@stainless/sdk-json';

type ApiReferenceRoute = ReturnType<typeof generateDocsRoutes>[number];

export default async function generateApiReferenceOgImage({
  apiReferenceRoute,
  slug,
}: {
  apiReferenceRoute?: ApiReferenceRoute;
  slug: string;
}) {
  if (!apiReferenceRoute?.props.stainlessPath) return notFoundResponse();

  const spec = await getSDKJSONInSSR(apiReferenceRoute.props.language);

  const parsed = parseStainlessPath(apiReferenceRoute.props.stainlessPath);
  const resource = getResourceFromSpec(apiReferenceRoute.props.stainlessPath, spec);

  if (!resource || !parsed?.method || !resource.methods[parsed.method]) return notFoundResponse();

  if (apiReferenceRoute.props.kind === 'http_method') {
    const method = resource.methods[parsed.method]!;
    return generateApiReferenceMethodOgImage({
      method,
      language: apiReferenceRoute.props.language,
      stainlessPath: apiReferenceRoute.props.stainlessPath,
      slug: `${RESOLVED_API_REFERENCE_PATH}/${slug}`,
      spec,
    });
  }

  const logoDataUrl = getLogoDataUrl();

  return new ImageResponse(
    <OpenGraphImage
      title={resource.title}
      description={`API Overview - ${apiReferenceRoute.props.language} `}
      logo={logoDataUrl}
    />,
    renderOptions,
  );
}

function generateApiReferenceMethodOgImage({
  method,
  language,
  stainlessPath,
  slug,
  spec,
}: {
  method: Method;
  language: DocsLanguage;
  stainlessPath: string;
  slug: string;
  spec: SDKJSON.Spec;
}) {
  const slugWithoutExtension = slug.replace(/\.[^/.]+$/, '');
  const endpoint = method.endpoint.slice(method.endpoint.indexOf(' ') + 1);
  const httpMethod = method.httpMethod.toUpperCase();

  const decl = spec?.decls?.[language]?.[stainlessPath] as LanguageDeclNodes[keyof LanguageDeclNodes];

  if (!decl) {
    return notFoundResponse();
  }

  let params: { ident: string; optional?: boolean }[] | undefined = undefined;
  let qualified: string | undefined = undefined;

  if ('signature' in decl && decl.signature) {
    params = decl.signature.parameters;
  } else if ('parameters' in decl && decl.parameters) {
    // @ts-expect-error TODO: this is breaking builds
    params = decl.parameters;
  } else if ('args' in decl && decl.args) {
    params = decl.args;
  }

  if ('qualified' in decl && decl.qualified) {
    qualified = decl.qualified;
  }

  const logoDataUrl = getLogoDataUrl();
  const colors = OG_IMAGE_OPTIONS?.theme === 'dark' ? darkThemeVars : lightThemeVars;
  const httpColors =
    httpMethod === 'GET'
      ? { background: colors.greenBackground, text: colors.green }
      : httpMethod === 'POST'
        ? { background: colors.blueBackground, text: colors.blue }
        : httpMethod === 'PUT' || httpMethod === 'PATCH'
          ? { background: colors.orangeBackground, text: colors.orange }
          : httpMethod === 'DELETE'
            ? { background: colors.redBackground, text: colors.red }
            : { background: colors.foregroundMuted, text: colors.foreground };
  // remove first and last breadcrumb (API Reference and current page)
  const breadcrumbs = generateApiBreadcrumbs(
    slugWithoutExtension,
    spec,
    RESOLVED_API_REFERENCE_PATH || '/api',
  )?.slice(1, -1);

  return new ImageResponse(
    <OpenGraphImage
      title={method.summary || method.title}
      logo={logoDataUrl}
      theme={OG_IMAGE_OPTIONS?.theme}
      breadcrumbs={breadcrumbs ? breadcrumbs.map((b) => b.title) : undefined}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'monospace',
        }}
      >
        <OpenGraphFunctionSignature
          params={params}
          fullyQualifiedName={qualified}
          theme={OG_IMAGE_OPTIONS?.theme}
        />
        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            fontFamily: 'monospace',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingLeft: '2px',
              paddingRight: '6px',
              paddingTop: '4px',
              paddingBottom: '4px',
              borderRadius: '8px',
              fontWeight: 600,
              color: httpColors.text,
              backgroundColor: httpColors.background,
              lineHeight: '100%',
              fontSize: '25px',
              stroke: colors.foreground,
              fontFamily: 'monospace',
              flexShrink: 0,
            }}
          >
            {httpMethod === 'GET' && <ArrowDownLeft size={36} color={colors.green} />}
            {httpMethod === 'POST' && <ArrowUpRight size={36} color={colors.blue} />}
            {(httpMethod === 'PUT' || httpMethod === 'PATCH') && (
              <ArrowUpRight size={36} color={colors.orange} />
            )}
            {httpMethod === 'DELETE' && <XIcon size={36} color={colors.red} />}
            {httpMethod}
          </div>
          <div
            style={{
              lineClamp: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: colors.foregroundMuted,
              fontFamily: 'monospace',
            }}
          >
            {endpoint}
          </div>
        </div>
      </div>
    </OpenGraphImage>,
    renderOptions,
  );
}
