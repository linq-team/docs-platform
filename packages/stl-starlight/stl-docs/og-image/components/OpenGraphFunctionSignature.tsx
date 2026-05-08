import { darkThemeVars, lightThemeVars } from '../theme';

export default function OpenGraphFunctionSignature({
  params,
  fullyQualifiedName,
  theme,
}: {
  params: { ident: string; optional?: boolean }[] | undefined;
  fullyQualifiedName: string | undefined;
  theme?: 'light' | 'dark';
}) {
  if (!params || !fullyQualifiedName) {
    return null;
  }
  const colors = theme === 'dark' ? darkThemeVars : lightThemeVars;

  const joinedParams = params
    .map((param) => {
      if (param.optional) {
        return `${param.ident}?`;
      }
      return param.ident;
    })
    .filter((p): p is string => p !== null)
    .join(', ');

  return (
    <p
      style={{
        lineClamp: 1,
        textOverflow: 'ellipsis',
        fontSize: '33px',
        lineHeight: '150%',
        overflow: 'hidden',
        width: '100%',
        color: colors.foreground,
        marginBottom: 0,
        marginTop: 0,
      }}
    >
      <span
        style={{
          color: colors.foregroundReduced,
        }}
      >
        {fullyQualifiedName.split('.').slice(0, -1).join('.')}.
      </span>
      <span
        style={{
          fontWeight: 600,
        }}
      >
        {fullyQualifiedName.split('.').slice(-1)}
      </span>
      <span
        style={{
          fontWeight: 600,
        }}
      >
        ({joinedParams})
      </span>
    </p>
  );
}
