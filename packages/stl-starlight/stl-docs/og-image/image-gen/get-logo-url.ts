import { readFileSync } from 'fs';
import { join } from 'path';
import { LOGO, OG_IMAGE_OPTIONS } from 'virtual:stainless-docs/docs-og-image';

export function resolveLocalImageFile(logoPath: string): string | undefined {
  try {
    // Remove leading slash and resolve from project root
    const filePath = join(process.cwd(), logoPath.replace(/^\//, ''));
    const fileBuffer = readFileSync(filePath);

    // Determine mime type from extension
    const ext = logoPath.split('.').pop()?.toLowerCase();

    const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;

    return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
  } catch (error) {
    console.warn('Failed to load logo for OG image:', error);
    return undefined;
  }
}

// Convert logo to base64 data URL if it exists
function getLogoDataUrl({ logo, theme }: { logo?: string; theme?: 'light' | 'dark' } = {}):
  | string
  | undefined {
  const logoConfig = logo ?? OG_IMAGE_OPTIONS?.logo ?? LOGO;
  if (!logoConfig) return undefined;

  // Handle string path or object with src/light properties
  let logoPath: string | undefined;
  if (typeof logoConfig === 'string') {
    logoPath = logoConfig;
  } else if ('src' in logoConfig) {
    logoPath = logoConfig.src;
  } else if ('dark' in logoConfig && theme === 'dark') {
    logoPath = logoConfig.dark;
  } else if ('light' in logoConfig) {
    logoPath = logoConfig.light;
  }

  if (!logoPath) return undefined;

  return resolveLocalImageFile(logoPath);
}

export default getLogoDataUrl;
