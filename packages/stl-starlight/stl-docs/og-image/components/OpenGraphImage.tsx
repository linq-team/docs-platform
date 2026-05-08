import { darkThemeVars, lightThemeVars, typography } from '../theme';
import { resolveLocalImageFile } from '../image-gen/get-logo-url';
import { OG_IMAGE_OPTIONS } from 'virtual:stainless-docs/docs-og-image';

/* The default open graph image template. It is expected to be used with takumi-js */
export default function OpenGraphImage({
  title,
  description,
  logo,
  children,
  theme,
  breadcrumbs,
}: {
  title: string;
  description?: string;
  logo?: string;
  children?: React.ReactNode;
  theme?: 'light' | 'dark';
  breadcrumbs?: string[];
}) {
  const colors = theme === 'dark' ? darkThemeVars : lightThemeVars;

  const testLogo = OG_IMAGE_OPTIONS?.backgroundImage
    ? resolveLocalImageFile(OG_IMAGE_OPTIONS.backgroundImage.src)
    : undefined;

  return (
    <div
      style={{
        backgroundColor: colors.background,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexDirection: 'column',
        padding: '72px',
        position: 'relative',
        fontFeatureSettings: "'ss01' on, 'ss03' on, 'ss04' on, 'ss06' on",
        lineHeight: `${typography.baseLineHeight}`,
        fontSize: `${typography.baseFontSize}`,
        letterSpacing: `${typography.baseLetterSpacing}`,
      }}
    >
      {testLogo && (
        <img
          src={testLogo}
          alt="Background"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            zIndex: -1,
            ...OG_IMAGE_OPTIONS?.backgroundImage?.style,
          }}
        />
      )}
      {logo && <img src={logo} alt="Logo" style={{ height: '80px', marginBottom: '24px' }} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.foregroundMuted }}>
            {breadcrumbs.map((crumb, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {index > 0 && (
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g opacity="0.6">
                      <path
                        d="M11.0573 7.05727C11.578 6.53657 12.422 6.53657 12.9427 7.05727L20.9427 15.0573C21.4634 15.578 21.4634 16.422 20.9427 16.9427L12.9427 24.9427C12.422 25.4634 11.578 25.4634 11.0573 24.9427C10.5366 24.422 10.5366 23.578 11.0573 23.0573L18.1146 16L11.0573 8.94269C10.5366 8.42199 10.5366 7.57797 11.0573 7.05727Z"
                        fill={colors.foreground}
                      />
                    </g>
                  </svg>
                )}
                <span
                  style={{
                    fontSize: `${typography.breadcrumbFontSize}`,
                    lineHeight: `${typography.breadcrumbLineHeight}`,
                    letterSpacing: `${typography.breadcrumbLetterSpacing}`,
                  }}
                >
                  {crumb}
                </span>
              </div>
            ))}
          </div>
        )}
        <h1
          style={{
            marginBottom: '0',
            marginTop: '0',
            fontWeight: 600,
            color: colors.foreground,
            letterSpacing: `${typography.headerLetterSpacing}`,
            lineClamp: 2,
            textOverflow: 'ellipsis',
            lineHeight: `${typography.headerLineHeight}`,
            fontSize: `${typography.headerFontSize}`,
            textWrap: 'balance',
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            style={{
              color: colors.foregroundMuted,
              marginBottom: 0,
              marginTop: 0,
              lineClamp: 2,
              textOverflow: 'ellipsis',
            }}
          >
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
