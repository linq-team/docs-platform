import { Spec, SpecLanguage } from '@stainless/sdk-json';
import { SDKJSONFilesLoaderFn, SDKJSONFilesLoaderParams, sdkJSONCacheReaderWriter } from './utils';
import { mkdir, readFile } from 'fs/promises';
import path from 'path';
import { generateSpecFromStrings } from '@stainless/sdk-json/spec';

interface GenerateSDKJSONOptions {
  /** Raw OpenAPI spec contents (JSON or YAML). */
  spec: string;
  /** Raw Stainless config contents (YAML). */
  config: string;
  /** Language to build the SDK JSON spec for. */
  language: SpecLanguage;
  /** The name of the project. */
  stainlessProject: string;
}

type GenerateSDKJSONFn<T> = (options: GenerateSDKJSONOptions) => Promise<{ spec: T }>;

type NonHttpSpecLanguage = Exclude<SpecLanguage, 'http'>;

type LibraryInformationOverride = Partial<{
  [key in NonHttpSpecLanguage]: {
    repo_url?: string;
    code_url?: string;
    version?: string;
    install?: string;
  };
}>;

type FileSystemSpecLoaderParams<T> = {
  /**
   * The path to the OpenAPI spec file.
   *
   */
  specPath: string;
  /**
   * The path to your Stainless config file.
   */
  configFilePath: string;
  /**
   * The function used to generate your SDKJSON.
   */
  generateSDKJSON?: GenerateSDKJSONFn<T>;
  /**
   * The languages for which you want to render documentation.
   */
  languages: SpecLanguage[];
  /**
   * A key:value map of languages to overrides. Used to manually set things like the install command or SDK version.
   */
  override?: LibraryInformationOverride;
};

const defaultGenerateSDKJSON: GenerateSDKJSONFn<Spec> = async ({
  config,
  spec,
  language,
  stainlessProject,
}) => {
  const { sdkJson } = await generateSpecFromStrings({
    oasStr: spec,
    configStr: config,
    languageOverrides: {
      mode: 'only',
      list: [language],
    },
    versionInfo: null,
    stainlessProject,
  });

  return { spec: sdkJson };
};

export function fileSystemSDKJSONLoader<T>({
  specPath,
  configFilePath,
  generateSDKJSON,
  languages,
  override,
}: FileSystemSpecLoaderParams<T>): SDKJSONFilesLoaderFn {
  const generateFn = generateSDKJSON ?? defaultGenerateSDKJSON;
  return async function fileSystemSpecLoader(opts: SDKJSONFilesLoaderParams) {
    const { createCodegenDir, logger } = opts;
    const [spec, config] = await Promise.all([readFile(specPath, 'utf8'), readFile(configFilePath, 'utf8')]);

    const specsDirectory = path.join(createCodegenDir().pathname, 'fs_spec_loader_specs');
    await mkdir(specsDirectory, { recursive: true });

    const r = languages.map(async (language) => {
      const generateResult = await generateFn({
        spec,
        config,
        language,
        stainlessProject: opts.stainlessProject,
      });

      // type casting here is a little weird
      // it prevents type errors from slightly incompatible SDKJSON types (since generateSDKJSON comes from the user)
      const sdkJson = generateResult.spec as unknown as Spec;

      if (override && language !== 'http' && override[language]) {
        sdkJson.metadata[language] = {
          ...sdkJson.metadata[language],
          ...override[language],
        };
      }

      const filePath = path.join(specsDirectory, `${language}.json`);

      await sdkJSONCacheReaderWriter.writeFile(filePath, sdkJson);

      logger.info(`Loaded SDKJSON for ${language} to ${filePath}`);

      return {
        filePath: filePath,
        languages: [language],
        sdkJson,
      };
    });

    const results = await Promise.all(r);

    return results;
  };
}
