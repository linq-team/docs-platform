import { createMarkdownProcessor, type MarkdownProcessor } from '@astrojs/markdown-remark';
import remarkGfmAlerts from 'remark-github-alerts';
import { HIGHLIGHT_THEMES } from 'virtual:stl-starlight-virtual-module';

// singleton
let astroMarkdownProcessor: MarkdownProcessor;
async function getAstroMarkdown() {
  if (!astroMarkdownProcessor) {
    astroMarkdownProcessor = await createMarkdownProcessor({
      gfm: true,
      remarkPlugins: [remarkGfmAlerts],
      shikiConfig: { themes: HIGHLIGHT_THEMES },
    });
  }

  return astroMarkdownProcessor;
}

export async function astroMarkdownRender(content: string) {
  const md = await getAstroMarkdown();
  const output = await md.render(content);

  // Map GFM callouts to the closest Starlight equivalent
  // TODO: this sucks; we should be rendering via ui-primitives callouts instead of ugly theme-incompatible starlight ones
  output.code = output.code
    .replaceAll('markdown-alert-caution', 'markdown-alert-danger')
    .replaceAll('markdown-alert-warning', 'markdown-alert-caution')
    .replaceAll('markdown-alert-important', 'markdown-alert-caution')
    .replaceAll('markdown-alert-title', 'starlight-aside__title')
    .replaceAll('markdown-alert-', 'starlight-aside--')
    .replaceAll('markdown-alert', 'starlight-aside');

  return output;
}

export async function astroMarkdownRenderText(content: string) {
  const result = await astroMarkdownRender(content);
  return result.code;
}
