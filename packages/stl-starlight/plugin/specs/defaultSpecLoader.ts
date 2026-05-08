import path from 'path';
import type { SpecLoaderFn, SpecLoaderParams } from './utils';
import Stainless, { APIError } from '@stainless-api/sdk';
import { DocsLanguage } from '@stainless-api/docs-ui/routing';
import { bold } from '../../shared/terminalUtils';
import { mkdir, readdir, readFile, rm, writeFile } from 'fs/promises';
import { generateSpecFromStrings, previewWorkerCode } from '@stainless/sdk-json/spec';
import { Spec, SpecLanguage } from '@stainless/sdk-json';
import crypto from 'crypto';

function resolvePath(inputPath: string) {
  return path.resolve(process.cwd(), inputPath);
}

function getLocalFilePaths() {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const oasPath = process.env.OPENAPI_PATH;
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const configPath = process.env.STAINLESS_CONFIG_PATH;

  if (!oasPath || !configPath) {
    return null;
  }

  return {
    oasPath: resolvePath(oasPath),
    configPath: resolvePath(configPath),
  };
}

async function fetchVersionInfo(project: string, apiKey: string): Promise<Record<DocsLanguage, string>> {
  const data = await fetch(`https://api.stainless.com/api/projects/${project}/package-versions`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const content = await data.text();
  return JSON.parse(content) as Record<DocsLanguage, string>;
}

function redactApiKey(apiKey: string) {
  return apiKey
    .split('')
    .map((char, index) => (index < 10 ? char : '*'))
    .join('');
}

async function loadInputs({ apiKey, logger, stainlessProject, branch }: SpecLoaderParams) {
  const localFilePaths = getLocalFilePaths();

  if (localFilePaths) {
    try {
      const oasStr = await readFile(localFilePaths.oasPath, 'utf8');
      const configStr = await readFile(localFilePaths.configPath, 'utf8');
      return {
        oasStr,
        configStr,
        versionInfo: null,
      };
    } catch (e) {
      logger.error(bold('Failed to load spec inputs from files:'));
      logger.error(e instanceof Error ? e.message : String(e));
      process.exit(1);
    }
  }

  if (!apiKey) {
    logger.error(
      [
        bold(
          'No Stainless credentials found. Please choose one of the following options to authenticate with Stainless:',
        ),
        '- Run `stl auth login` to authenticate via the Stainless CLI',
        '- Provide a Stainless API key via the `STAINLESS_API_KEY` environment variable (eg. in a .env file)',
        '- Set the `apiKey` option in the Stainless Docs config',
      ].join('\n'),
    );
    process.exit(1);
  }

  try {
    const client = new Stainless({ apiKey });
    const configs = await client.projects.configs.retrieve({
      project: stainlessProject,
      branch: branch,
      include: 'openapi',
    });
    const versionInfo = await fetchVersionInfo(stainlessProject, apiKey);

    const configYML = Object.values(configs)[0] as { content: unknown };
    const oasJson = Object.values(configs)[1] as { content: unknown };
    const oasStr = oasJson['content'];
    const configStr = configYML['content'];

    if (typeof oasStr !== 'string' || typeof configStr !== 'string') {
      logger.error('Received invalid OAS or config from Stainless');
      process.exit(1);
    }

    return {
      oasStr,
      configStr,
      versionInfo,
    };
  } catch (e) {
    if (e instanceof APIError && e.status >= 400 && e.status < 500) {
      logger.error(`Failed to load requested project slug: "${stainlessProject}"`);
      if (apiKey) {
        logger.error(`API key: "${redactApiKey(apiKey)}"`);
      }
      logger.error(
        `This error can usually be corrected by re-authenticating with the Stainless.  Use the CLI (stl auth login) or verify that the Stainless API key you're using can access the project mentioned above.`,
      );
    }
    process.exit(1);
  }
}

async function maybeLoadJSONFile<T>(filePath: string): Promise<T | null> {
  try {
    const fileContents = await readFile(filePath, 'utf8');
    return JSON.parse(fileContents) as T;
  } catch {
    return null;
  }
}

async function cleanupDirectory(directory: string, filesToKeep: string[]) {
  const allFiles = await readdir(directory);
  const unusedFiles = allFiles.filter((file) => !filesToKeep.includes(file));
  await Promise.all(unusedFiles.map((file) => rm(path.join(directory, file))));
  return {
    deletedCount: unusedFiles.length,
  };
}

export const defaultSpecLoader: SpecLoaderFn = async (params) => {
  const { createCodegenDir } = params;

  const inputs = await loadInputs(params);

  const specsDirectory = path.join(createCodegenDir().pathname, 'specs2');
  await mkdir(specsDirectory, { recursive: true });

  const fileName =
    crypto
      .createHash('sha256')
      .update(JSON.stringify(inputs) + previewWorkerCode)
      .digest('hex')
      .slice(0, 10) + '.json';

  const filePath = path.join(specsDirectory, fileName);

  const cachedSpec = await maybeLoadJSONFile<{ languages: SpecLanguage[]; sdkJson: Spec }>(filePath);
  // skip generation since we already have a cached spec
  if (cachedSpec) {
    params.logger.info(`Loaded cached spec: ${fileName}`);
    return [
      {
        filePath,
        languages: cachedSpec.languages,
        sdkJson: cachedSpec.sdkJson,
      },
    ];
  }

  const result = await generateSpecFromStrings({
    oasStr: inputs.oasStr,
    configStr: inputs.configStr,
    languageOverrides: {
      mode: 'exclude',
      list: params.excludeLanguages ?? [],
    },
    versionInfo: inputs.versionInfo,
    stainlessProject: params.stainlessProject,
  });

  await writeFile(filePath, JSON.stringify(result), 'utf8');
  params.logger.info(`Generated: ${fileName}`);

  const { deletedCount } = await cleanupDirectory(specsDirectory, [fileName]);
  if (deletedCount > 0) {
    params.logger.info(`Cleaned up ${deletedCount} unused spec file(s)`);
  }

  return [
    {
      filePath,
      languages: result.languages.filter((language) => language !== 'sql' && language !== 'openapi'),
      sdkJson: result.sdkJson,
    },
  ];
};
