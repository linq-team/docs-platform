import type React from 'react';
import { useCallback, useId, useRef, useState } from 'react';
import { CheckIcon, CircleAlertIcon, CopyIcon, LucideIcon } from 'lucide-react';
import {
  useDeclaration,
  useHighlight,
  useLanguage,
  useSnippet,
  useSnippetIds,
  useSnippetResponse,
} from '../contexts';
import { useComponents } from '../contexts/use-components';
import style from '../style';
import clsx from 'clsx';
import type * as SDKJSON from '@stainless/sdk-json';
import type { TransformRequestSnippetFn } from './sdk';
import { Button, Badge, getHttpMethod } from '@stainless-api/ui-primitives';

export type SnippetCodeProps = {
  content: string;
  signature?: string;
  language?: string;
};

export function SnippetCode({ content, language }: SnippetCodeProps) {
  const lang = useLanguage();
  const highlighted = useHighlight(content, language || lang);

  return (
    <div
      className={style.SnippetCode}
      data-stldocs-copy-content
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

export type SnippetContainerProps = {
  method: Partial<SDKJSON.Method> & SDKJSON.HasStainlessPath;
  children: React.ReactNode;
  signature?: string;
} & React.ComponentProps<'div'>;

export function SnippetContainer({ children, className, ...props }: SnippetContainerProps) {
  return (
    <div className={clsx(style.Snippet, className)} {...props}>
      {children}
    </div>
  );
}

export type SnippetRequestContainerProps = {
  children?: React.ReactNode;
  signature?: string;
};

export function SnippetRequestContainer({ children }: SnippetRequestContainerProps) {
  return <div>{children}</div>;
}

export type SnippetProps = {
  requestTitle?: React.ReactNode;
  method: Partial<SDKJSON.Method> & SDKJSON.HasStainlessPath;
  snippet?: Parameters<typeof useSnippet>[2];
  transformRequestSnippet?: TransformRequestSnippetFn;
};
export function Snippet({ requestTitle, method, snippet, transformRequestSnippet }: SnippetProps) {
  const Docs = useComponents();
  const language = useLanguage();

  const originalSnippetContent = useSnippet(method.stainlessPath, undefined, snippet);
  const snippetResponses = useSnippetResponse(method.stainlessPath, snippet);

  const decl = useDeclaration(method.stainlessPath, false);
  const signature = decl && 'qualified' in decl ? decl.qualified : undefined;

  if (!originalSnippetContent) {
    console.warn(`Snippet not found for method '${method.stainlessPath}'`);
    return null;
  }
  const snippetContent = transformRequestSnippet
    ? transformRequestSnippet({ snippet: originalSnippetContent, language })
    : originalSnippetContent;

  const httpMethod = getHttpMethod(method.httpMethod);

  return (
    <Docs.SnippetContainer signature={signature} method={method}>
      {snippetContent && (
        <Docs.SnippetRequestContainer signature={signature}>
          <div className={style.SnippetRequest} data-stldocs-copy-parent>
            <div className={style.SnippetRequestTitle}>
              <div className={style.SnippetRequestTitleMethod}>
                {httpMethod && <Badge.HTTP method={httpMethod} iconOnly />}
                <h3>{method.summary || method.title}</h3>
              </div>
              <div className={style.SnippetRequestTitleContent}>{requestTitle}</div>
              <Docs.SnippetButtons content={snippetContent} />
            </div>
            <Docs.SnippetCode content={snippetContent} signature={signature} />
            <Docs.SnippetFooter />
          </div>
        </Docs.SnippetRequestContainer>
      )}
      <Docs.SnippetResponse responses={snippetResponses} />
    </Docs.SnippetContainer>
  );
}

export type MultiSnippetsProps = {
  method: Partial<SDKJSON.Method> & SDKJSON.HasStainlessPath;
  requestTitle?: React.ReactNode;
};

export function MultiSnippets({ requestTitle, method }: MultiSnippetsProps) {
  const snippetIds = useSnippetIds(method.stainlessPath)?.filter((id) => id !== 'default');
  const radioId = useId();
  const Docs = useComponents();

  if (!snippetIds) return null;

  return (
    <div className={style.SnippetMulti} data-stldocs-multi-snippet-container>
      <div className={style.SnippetMultiTabs} data-stldocs-multi-snippet-tabs>
        {snippetIds.map((snid, idx) => (
          <label key={`snippet-example-${idx}`} className={style.SnippetMultiTab}>
            <input
              type="radio"
              name={`snippet-example-radio-${radioId}`}
              value={idx}
              defaultChecked={idx === 0}
            />
            <span>{(snid satisfies `custom:${string}`).slice('custom:'.length)}</span>
          </label>
        ))}
      </div>

      <div className={style.SnippetMultiContent}>
        {snippetIds.map((snid, idx) => {
          return (
            <div
              key={`snippet-example-content-${idx}`}
              className={clsx(style.SnippetMultiPane, idx === 0 && style.SnippetMultiPaneActive)}
              data-stldocs-multi-snippet-id={idx}
            >
              <Docs.Snippet method={method} snippet={snid} requestTitle={requestTitle} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SnippetButtons({ content }: { content: string }) {
  const [CopyButtonIcon, setCopyButtonIcon] = useState<LucideIcon>(CopyIcon);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const handleCopy = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setCopyButtonIcon(CheckIcon);
      })
      .catch(() => {
        setCopyButtonIcon(CircleAlertIcon);
      })
      .finally(() => {
        timeoutRef.current = setTimeout(() => setCopyButtonIcon(CopyIcon), 1000);
      });
  }, [content]);

  return (
    <Button variant="outline" data-stldocs-snippet-copy>
      <CopyButtonIcon size={16} className={style.Icon} onClick={handleCopy} />
    </Button>
  );
}

// empty by default; overridable
export function SnippetFooter(): React.ReactNode {
  return null;
}

export function SnippetResponse({
  responses,
}: {
  responses?: { status?: string; content: string; contentType?: string }[];
}) {
  const Docs = useComponents();

  if (!responses || responses.length === 0) {
    return null;
  }

  const tabs = responses.map(({ status }, index) => ({
    status,
    index,
    label: status ? `${status} example` : null,
  }));
  const hasTabs = tabs.length > 1 || tabs.some((tab) => tab.label);

  return (
    <div className={style.SnippetMultiResponse}>
      <div className={clsx(style.Snippet)}>
        {hasTabs && (
          <div
            className={clsx(
              style.SnippetResponseTab,
              tabs.length === 1 && style.SnippetResponseTabSingleReturn,
            )}
          >
            {tabs.map(({ status, label }, index) => (
              <div
                key={`snippet-response-tab-item-${status}-${index}`}
                data-snippet-response-tab-id={`snippet-response-tab-${status}-${index}`}
                className={clsx(
                  style.SnippetResponseTabItem,
                  index === 0 && style.SnippetResponseTabItemActive,
                )}
              >
                <Button disabled={responses.length === 1} variant="ghost">
                  {label ?? `Example ${index + 1}`}
                </Button>
              </div>
            ))}
          </div>
        )}
        {responses.map(({ status, content, contentType }, index) => {
          return typeof content === 'string' ? (
            <div
              className={clsx(style.SnippetResponsePane, index === 0 && style.SnippetResponsePaneActive)}
              key={`snippet-response-${status}-${index}`}
              data-snippet-response-pane-id={`snippet-response-tab-${status}-${index}`}
            >
              <Docs.SnippetCode
                content={content}
                language={contentType === 'application/json' || !contentType ? 'json' : 'none'}
              />
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}
