import {
  type SnippetCodeProps,
  type SnippetContainerProps,
  SnippetResponse as DocsUiSnippetResponse,
} from '@stainless-api/docs-ui/components';
import { useHighlight, useLanguage } from '@stainless-api/docs-ui/contexts';
import style from '@stainless-api/docs-ui/style';
import * as cheerio from 'cheerio/slim';
import {
  EXPERIMENTAL_COLLAPSIBLE_SNIPPETS,
  EXPERIMENTAL_REQUEST_BUILDER,
} from 'virtual:stl-starlight-virtual-module';
import clsx from 'clsx';
import { Button } from '@stainless-api/ui-primitives';
import { CopyIcon, PlayIcon } from 'lucide-react';
import React from 'react';
import { RequestBuilder } from './RequestBuilder';
import { Method } from '@stainless/sdk-json';

/*
 * This may be replaced by additional data from the sdk.
 * Without information from the sdk, we use simple heuristics per language.
 */
function getCollapsedRanges(content: string, language: string, signature?: string): [number, number][] {
  if (!signature) return [];
  const raw = content.split(/\r?\n/);

  const sigIdx = raw.findIndex((l) => l.includes(signature));
  if (sigIdx < 0) return [];

  let finalIndex;
  if (language === 'kotlin' || language === 'java') {
    finalIndex = raw.findIndex((l, i) => i > sigIdx && l.trim() === '}');
  } else if (language === 'python') {
    finalIndex = raw.findIndex((l, i) => i > sigIdx && l.trim().startsWith('print'));
  } else if (language === 'go') {
    finalIndex = raw.findIndex((l, i) => i > sigIdx && l.trim().startsWith('if err'));
  } else {
    // Fallback to empty line
    finalIndex = raw.findIndex((l, i) => i > sigIdx && l.trim() === '');
  }

  if (finalIndex > 0) {
    return [
      [0, sigIdx],
      [finalIndex, raw.length],
    ];
  }

  return [[0, sigIdx]];
}

/*
 * While collapsed, we may need to remove indentation.
 * This function allows us to remove any level of indentation from a given line.
 */
function wrapFirstNSpaces($line: cheerio.Cheerio<any>, n: number) {
  const $firstSpan = $line.children('span').first();
  if ($firstSpan.length === 0) return;

  const inner = $firstSpan.html() ?? '';
  const m = inner.match(new RegExp(`^( {1,${n}})`));
  if (!m) return;

  const lead = m[1]!;
  $firstSpan.html(`<span class="leading-ws">${lead}</span>${inner.slice(lead.length)}`);
}

/*
 * This function calculates the counter offset for the given ranges.
 * This only works when there is between 0 and 2 ranges. If we add support
 * for more than 2 ranges, we will need to re-work how we calculate offsets.
 * It may be that we will no longer be able to use css counters, and will need
 * to find a different approach.
 */
function getCounterOffset(ranges: [number, number][]) {
  let offset = 0;
  const firstRange = ranges.length > 0 ? ranges[0] : null;
  if (firstRange && firstRange[0] === 0) {
    offset = firstRange[1];
  }
  return offset;
}

function condensedShikiHtmlFull(docHtml: string, language: string, ranges: [number, number][] = []) {
  const $ = cheerio.load(docHtml, null, false);

  const counterOffset = getCounterOffset(ranges);

  $('.shiki').attr('style', `counter-reset: codeblock-line ${Math.max(counterOffset - 1, 0)}`);

  const $code = $('pre code').first();
  if ($code.length === 0) return docHtml;

  const lines = $code.find('span.line').toArray();

  const out: string[] = [];
  let didPushEllipsis = false;

  lines.forEach((lineEl, idx) => {
    const $line = $(lineEl);
    const existsInRange = ranges.some(([start, end]) => idx >= start && idx < end);
    if (existsInRange) {
      $line.addClass('hidden');
    } else {
      didPushEllipsis = false;
    }

    if (language === 'java') {
      wrapFirstNSpaces($line, 8);
    } else if (language === 'kotlin') {
      wrapFirstNSpaces($line, 4);
    } else if (language === 'go') {
      wrapFirstNSpaces($line, 2);
    }

    $line.append('<span class="nl">\n</span>');
    if (!didPushEllipsis && existsInRange) {
      out.push('<span class="line ellipsis">…\n</span>');
      didPushEllipsis = true;
    }
    out.push($.html(lineEl));
  });

  $code.html(out.join(''));
  return $.html();
}

function useIsCollapsible({ signature }: { signature?: string }): boolean {
  const language = useLanguage();

  return Boolean(EXPERIMENTAL_COLLAPSIBLE_SNIPPETS && signature && language);
}

function isActualMethod(value: object): value is Method {
  return 'kind' in value && value.kind === 'http_method';
}

export function SnippetContainer({ children, signature, method }: SnippetContainerProps) {
  const isCollapsible = useIsCollapsible({ signature });
  const className = clsx(
    style.Snippet,
    isCollapsible ? 'stl-snippet-collapsible' : 'stl-snippet-non-collapsible',
  );
  return EXPERIMENTAL_REQUEST_BUILDER && isActualMethod(method) ? (
    <RequestBuilder className={className} method={method}>
      {children}
    </RequestBuilder>
  ) : (
    <div className={className}>{children}</div>
  );
}

export function SnippetButtons() {
  return (
    <Button variant="outline" data-stldocs-snippet-copy>
      <CopyIcon size={16} className={style.Icon} />
    </Button>
  );
}

export function SnippetCode({ content, signature, language: forcedLanguage }: SnippetCodeProps) {
  const lang = useLanguage();
  const language = forcedLanguage || lang;
  let highlighted = useHighlight(content, language);

  const isCollapsible = useIsCollapsible({ signature });

  let offset = 0;

  if (isCollapsible && language) {
    const ranges = getCollapsedRanges(content, language, signature);
    highlighted = condensedShikiHtmlFull(highlighted, language, ranges);
    offset = getCounterOffset(ranges);
  }

  return (
    <>
      <div
        className={clsx(style.SnippetCode, isCollapsible && 'stl-snippet-code-is-collapsed')}
        data-snippet-expanded-offset={offset}
        data-stldocs-copy-content
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
      {signature && isCollapsible && (
        <Button
          className={'stl-snippet-expand-button'}
          id="stl-snippet-expand-button"
          size="sm"
          variant="outline"
        >
          Show more
        </Button>
      )}
      {EXPERIMENTAL_REQUEST_BUILDER && (
        <div className="request-builder-container" style={{ display: 'contents' }}></div>
      )}
    </>
  );
}

export function SnippetFooter() {
  if (!EXPERIMENTAL_REQUEST_BUILDER) return null;
  return (
    <div className={clsx(style.SnippetFooter, 'try-it-footer')}>
      {EXPERIMENTAL_REQUEST_BUILDER && (
        <div className="request-builder-footer" style={{ display: 'contents' }}></div>
      )}
      <Button variant="accent" className="try-it-button">
        <Button.Label>Try it</Button.Label>
        <Button.Icon icon={PlayIcon} />
      </Button>
    </div>
  );
}

export function SnippetResponse({ ...props }: React.ComponentProps<typeof DocsUiSnippetResponse>) {
  return (
    <>
      <DocsUiSnippetResponse {...props} />
      {EXPERIMENTAL_REQUEST_BUILDER && (
        <div className="request-builder-response" style={{ display: 'contents' }} />
      )}
    </>
  );
}
