import { buildVirtualModuleString } from '../shared/virtualModule';
import type * as virtualExampleModule from 'virtual:stl-docs-ai-chat-examples';
type VirtualExampleModule = typeof virtualExampleModule;

export type ExamplePromptResponse = {
  shortPrompt: string;
  longPrompt: string;
  icon: string;
}[];

export function generateExamplesVirtualModule(exampleOverrides: ExamplePromptResponse | undefined): string {
  if (!exampleOverrides) {
    return buildVirtualModuleString({ examples: undefined } satisfies VirtualExampleModule);
  }

  // Generate icon imports
  // prettier-ignore
  const pascalToKebab = (str: string) => str.split(/(?=[A-Z])/).join('-').toLowerCase();
  const iconImportPath = (iconName: string) =>
    import.meta.resolve(`lucide-react/dist/esm/icons/${pascalToKebab(iconName)}.js`);
  const iconImports = exampleOverrides.map(
    ({ icon }) => `import ${icon} from ${JSON.stringify(iconImportPath(icon))}`,
  );

  // Reference icon imports in `examples` exported object
  // "icon":"Sparkles" -> "icon":Sparkles
  const iconStringsToIdents = (jsonBlob: string) => jsonBlob.replace(/"icon":\s*"(\w+)"/g, '"icon":$1');
  const exportBody = `export const examples = ${iconStringsToIdents(JSON.stringify(exampleOverrides))};`;

  return [...iconImports, exportBody].join('\n');
}
