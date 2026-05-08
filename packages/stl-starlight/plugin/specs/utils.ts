import { Spec } from '@stainless/sdk-json';
import { readFile } from 'fs/promises';
import { DocsLanguage } from '@stainless-api/docs-ui/routing';
import { AstroIntegrationLogger } from 'astro';

type PossibleLanguage = NonNullable<NonNullable<NonNullable<Spec['docs']>['languages']>[number]>;

export type SpecLoaderParams = {
  /**
   * The slug of your Stainless project.
   */
  stainlessProject: string;
  /**
   * The branch of your Stainless project.
   */
  branch: string;
  /**
   * The Stainless API key. This can be used to make requests against the Stainless API.
   */
  apiKey: string | null;
  /**
   * The languages that the user has explicitly asked to be excluded from the API reference.
   */
  excludeLanguages: DocsLanguage[] | null;
  /**
   * An Astro logger. This should be used for logging messages.
   */
  logger: AstroIntegrationLogger;
  /**
   * A function that creates a directory in .astro. See: https://docs.astro.build/en/reference/integrations-reference/#createcodegendir
   */
  createCodegenDir: () => URL;
};

type SpecLoaderResult = {
  /**
   * The file path to the loaded spec. The spec MUST be written to a path on disk.
   * If you are not sure where to place it, create a directory in .astro using the `createCodegenDir` function passed in the parameters of the spec loader function.
   */
  filePath: string;
  /**
   * The languages that are represented in the spec.
   */
  languages: PossibleLanguage[];
  /**
   * Optionally, if you already have already the spec in memory, you can provide it. If not provided, the contents of the file at `filePath` will be read.
   * IMPORTANT: This should be equivalent to the contents of the file at `filePath`. If not, bugs and inconsistencies will arise.
   */
  sdkJson?: Spec;
};

export type SpecLoaderFn = (opts: SpecLoaderParams) => Promise<SpecLoaderResult[]>;

async function readSpecFromFile(filePath: string) {
  const txt = await readFile(filePath, 'utf8');
  const json = JSON.parse(txt) as Spec;
  return json;
}

export async function loadAllSpecs(specLoaderResultsPromise: Promise<SpecLoaderResult[]>) {
  const specLoaderResults = await specLoaderResultsPromise;
  const specs = await Promise.all(
    specLoaderResults.map(async (result) => {
      return {
        filePath: result.filePath,
        languages: result.languages,
        sdkJson: result.sdkJson ?? (await readSpecFromFile(result.filePath)),
      };
    }),
  );
  return specs;
}

export type LoadedSpecs = Awaited<ReturnType<typeof loadAllSpecs>>;

export function flatSpecsList(specs: LoadedSpecs) {
  return specs
    .map((s) =>
      s.languages.map((language) => ({
        language,
        sdkJson: s.sdkJson,
        filePath: s.filePath,
      })),
    )
    .flat();
}
