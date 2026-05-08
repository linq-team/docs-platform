#!/usr/bin/env node

/**
 * @module
 * This script ensures we have a `check:types` task for every package and that the
 * tsconfigs include all of our source files. Without it, we had silently unchecked
 * code and I don't want that to happen again...
 */

import { execSync } from 'child_process';
import { globSync } from 'fs';
import * as path from 'path';
import ts from 'typescript';
import { styleText } from 'util';

interface TurboTask {
  task: string;
  package: string;
  directory: string;
  command: string;
}

interface TurboDryRun {
  tasks: TurboTask[];
}

interface ValidationError {
  package: string;
  error: string;
}

interface ValidationWarning {
  package: string;
  warning: string;
}

function parseTsconfigPath(command: string):
  | {
      tsconfigPath: string;
      warning: string | null;
    }
  | { tsconfigPath: null; warning: string } {
  const trimmed = command.trim();

  // Handle astro check
  if (trimmed.startsWith('astro check')) {
    const afterAstroCheck = trimmed.substring('astro check'.length).trim();
    if (afterAstroCheck.length > 0) {
      return {
        tsconfigPath: null,
        warning:
          `Unexpected flags found in astro check command: "${afterAstroCheck}".\n` +
          `Please update scripts/check-tsconfig-coverage.ts to handle this case.`,
      };
    }
    return { tsconfigPath: 'tsconfig.json', warning: null };
  }

  // Handle tsc
  if (trimmed.startsWith('tsc')) {
    const args = trimmed.substring('tsc'.length).trim();

    if (!args) {
      return { tsconfigPath: 'tsconfig.json', warning: null };
    }

    const tokens = args.split(/\s+/);
    let tsconfigPath: string | null = 'tsconfig.json';
    const unexpectedFlags: string[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]!;

      if (token === '--noEmit') {
        continue;
      } else if (token === '-p' || token === '--project') {
        if (i + 1 < tokens.length) {
          tsconfigPath = tokens[i + 1]!;
          i++;
        }
      } else if (token.startsWith('-p=') || token.startsWith('--project=')) {
        const parts = token.split('=');
        if (parts.length === 2) {
          tsconfigPath = parts[1]!;
        }
      } else {
        unexpectedFlags.push(token);
      }
    }

    const warning =
      unexpectedFlags.length > 0
        ? `Unexpected flags found in tsc command: ${unexpectedFlags.join(', ')}.\n` +
          `Please update scripts/check-tsconfig-coverage.ts to handle these flags.`
        : null;

    return { tsconfigPath, warning };
  }

  return {
    tsconfigPath: null,
    warning:
      `Unexpected type checking command found: ${command}.\n` +
      `Please update scripts/check-tsconfig-coverage.ts to handle this command.`,
  };
}

function validateCommand(
  command: string,
  packageName: string,
): {
  error: string | null;
  warning: string | null;
  tsconfigPaths: string[];
} {
  if (command === '<NONEXISTENT>') {
    return {
      error:
        `Package "${packageName}" is missing a check:types task.\n` +
        `Please add a check:types script to ${packageName}/package.json`,
      warning: null,
      tsconfigPaths: [],
    };
  }

  const parts = command.split('&&').map((part) => part.trim());
  const tsconfigPaths: string[] = [];
  const warnings: string[] = [];

  for (const part of parts) {
    const { tsconfigPath, warning } = parseTsconfigPath(part);
    if (tsconfigPath) {
      tsconfigPaths.push(tsconfigPath);
    }
    if (warning) {
      warnings.push(warning);
    }
  }

  return {
    error: null,
    warning: warnings.length > 0 ? warnings.join('\n') : null,
    tsconfigPaths,
  };
}

function getTsConfigs(): {
  tsConfigs: string[];
  errors: ValidationError[];
  warnings: ValidationWarning[];
} {
  try {
    const output = execSync('./node_modules/.bin/turbo run --dry=json check:types', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const dryRunData = JSON.parse(output) as TurboDryRun;

    const tsConfigs: string[] = [];
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    dryRunData.tasks.forEach((task) => {
      if (!['check:types:scripts', 'check:types'].includes(task.task)) return;
      if (task.command.includes('check-tsconfig-coverage.ts')) return;
      const { error, warning, tsconfigPaths } = validateCommand(task.command, task.package);

      if (error) {
        errors.push({
          package: task.package,
          error,
        });
      } else {
        for (const tsconfigPath of tsconfigPaths) {
          tsConfigs.push(path.resolve(task.directory, tsconfigPath));
        }
        if (warning) {
          warnings.push({
            package: task.package,
            warning,
          });
        }
      }
    });

    return { tsConfigs, errors, warnings };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error running turbo command:', error.message);
    }
    throw error;
  }
}

function listFilesForTsconfig(tsconfigPath: string): string[] {
  try {
    // Read and parse the tsconfig file
    const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);

    if (configFile.error) {
      return [];
    }

    // Parse the config
    const parsedConfig = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      path.dirname(tsconfigPath),
      undefined,
      tsconfigPath,
    );

    if (parsedConfig.errors.length > 0) {
      return [];
    }

    // Get all file names included in the project
    const files = parsedConfig.fileNames
      .map((file) => path.relative('.', file))
      .filter((line) => !line.match(/^\.\.[\\/]|[\\/]node_modules[\\/]/));

    return files;
  } catch (error) {
    return [];
  }
}

// Main execution
(async () => {
  const INDENT = '   ';

  const { tsConfigs, errors, warnings } = getTsConfigs();

  // Use TypeScript Compiler API to list files
  const fileLists = tsConfigs.map(listFilesForTsconfig);
  const checkedFiles = new Set(fileLists.flat());

  // Find all unchecked files
  const uncheckedFiles = globSync('**/*.{m,c,}{j,t}s{x,}', {
    exclude: ['**/node_modules', '**/dist', '**/vendor/preview.*', 'apps/*/public/pagefind/*'],
  }).filter((file) => !checkedFiles.has(file));

  // Display warnings
  if (warnings.length > 0) {
    console.log(
      '\n⚠️  ' +
        styleText(['bold', 'yellow'], warnings.length + ' Warning' + (warnings.length > 1 ? 's' : '')) +
        '\n',
    );
    warnings.forEach(({ package: pkg, warning }) => {
      console.log(INDENT + styleText('bold', pkg));
      console.log(warning.replace(/^/gm, INDENT) + '\n');
    });
  }

  // Display validation errors
  if (errors.length > 0) {
    console.log(
      '\n❌ ' +
        styleText(['bold', 'red'], errors.length + ' Validation Error' + (errors.length > 1 ? 's' : '')) +
        '\n',
    );
    errors.forEach(({ package: pkg, error }) => {
      console.log(INDENT + styleText('bold', pkg));
      console.log(error.replace(/^/gm, INDENT) + '\n');
    });
  }

  // Display unchecked files error
  if (uncheckedFiles.length > 0) {
    console.log(
      '\n❌ ' +
        styleText(
          ['bold', 'red'],
          uncheckedFiles.length + ' Unchecked File' + (uncheckedFiles.length > 1 ? 's' : ''),
        ),
    );

    // Group files by directory for better readability
    const filesByDir = new Map<string, string[]>();
    uncheckedFiles.forEach((file) => {
      const dir = path.dirname(file);
      if (!filesByDir.has(dir)) {
        filesByDir.set(dir, []);
      }
      filesByDir.get(dir)!.push(path.basename(file));
    });

    // Sort directories and display
    const sortedDirs = Array.from(filesByDir.keys()).sort();
    sortedDirs.forEach((dir) => {
      const files = filesByDir.get(dir)!.sort();
      console.log(`\n   ` + `📁 ${styleText('bold', dir + '/')}`);
      files.forEach((file, i) => {
        console.log(`${INDENT}${styleText('gray', `${i === files.length - 1 ? '└' : '├'}─╴`)}${file}`);
      });
    });
    console.log(
      '\nℹ️  ' +
        styleText(['bold', 'cyan'], 'Add these files to a tsconfig.json included in a check:types script.\n'),
    );
  }

  // Exit with error code if there were any issues
  if (errors.length > 0 || uncheckedFiles.length > 0) {
    process.exit(1);
  }

  console.log('✅ ' + styleText('green', 'All TypeScript files are covered'));
})();
