// This is probably temporary, but it fills in functionality needed for Mintlify imports

const INTERNAL_REFERENCE_ENTRY_MARKER = 'STL_STARLIGHT_API_REFERENCE_METHOD_LINK_PLACEHOLDER';

type GenerateProps = string | { label?: string; endpoint: string };

function normalizeGenerateProps(generateProps: GenerateProps) {
  if (typeof generateProps === 'string') {
    return {
      label: undefined,
      endpoint: generateProps,
    };
  }
  return {
    endpoint: generateProps.endpoint,
    label: generateProps.label,
  };
}

export function generateAPILink(generateProps: GenerateProps) {
  const { label, endpoint } = normalizeGenerateProps(generateProps);
  return {
    label: label ?? endpoint,
    link: `/`,
    attrs: {
      about: INTERNAL_REFERENCE_ENTRY_MARKER,
      'data-stldocs-endpoint': endpoint,
      'data-stldocs-label': label,
    },
  };
}
