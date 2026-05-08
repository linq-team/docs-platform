import { AstroIntegration, type AstroIntegrationLogger } from 'astro';
import { getSharedLogger } from './getSharedLogger';

export default function conditionalIntegration({
  condition,
  integration,
  reason,
}: {
  condition: boolean;
  integration: AstroIntegration;
  reason?: string | undefined;
}): AstroIntegration {
  if (condition) {
    return integration;
  }
  return {
    name: integration.name,
    hooks: Object.fromEntries(
      Object.keys(integration.hooks).map((hookName) => [
        hookName,
        ({ logger: localLogger }: { logger: AstroIntegrationLogger }) => {
          const logger = getSharedLogger({ fallback: localLogger });
          logger.info(`Skipping ${integration.name} integration. Reason: ${reason ?? 'not provided'}`);
        },
      ]),
    ),
  };
}
