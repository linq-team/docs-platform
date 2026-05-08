import { Folder, Box, Code, Wrench, BookOpenText, Search } from 'lucide-react';
import { useLanguage } from '@stainless-api/docs-ui/contexts';
import { useComponents } from '@stainless-api/docs-ui/contexts/use-components';
import { GuideResultType, QueryKindsType, ResultRecordType, SearchAttributeNames } from './types';

import style from '@stainless-api/docs-ui/style';

export const QueryKindDisplay: Record<QueryKindsType, { name: string; icon: typeof Folder }> = {
  all: { name: 'Results', icon: Search },
  resource: { name: 'Resources', icon: Folder },
  http_method: { name: 'Methods', icon: Box },
  model: { name: 'Types', icon: Code },
  property: { name: 'Properties', icon: Wrench },
  guide: { name: 'Guide', icon: BookOpenText },
};

function Highlight({ result, name }: { result: ResultRecordType; name: SearchAttributeNames }) {
  const value = result._highlightResult[name]?.value;
  if (value) return <span dangerouslySetInnerHTML={{ __html: value }} />;
}

type SearchResultProps = {
  result: ResultRecordType;
};

function SearchResultBreadcrumb({ result }: SearchResultProps) {
  const Docs = useComponents();
  const Icon = QueryKindDisplay[result.kind].icon;
  const items = result.crumbs?.map((crumb) => (
    <span key={crumb} className={style.SearchBreadcrumbItem}>
      {crumb}
    </span>
  ));

  return (
    <div className={style.SearchBreadcrumb}>
      <Icon className={style.Icon} size={14} />
      {Array.isArray(result.crumbs) && (
        <Docs.Join items={items}>
          <span className={style.SearchBreadcrumbDivider}>{'›'}</span>
        </Docs.Join>
      )}
    </div>
  );
}

export function SearchResult({ result }: SearchResultProps) {
  return (
    <div className={style.SearchResult} data-stldocs-search-result={result.kind}>
      <SearchResultBreadcrumb result={result} />
      <SearchResultContent result={result} />
    </div>
  );
}

export function GuideResult({ result }: { result: GuideResultType }) {
  const Docs = useComponents();
  const Icon = QueryKindDisplay['guide'].icon;
  const path = result.data.url
    .slice(1, -1)
    .split('/')
    .map((crumb) => (
      <span className={style.SearchBreadcrumbItem} key={crumb}>
        {crumb}
      </span>
    ));

  const crumbs =
    path.length > 1
      ? path
      : [
          <span className={style.SearchBreadcrumbItem} key="overview">
            Overview
          </span>,
        ];

  return (
    <div className={style.SearchResult} data-stldocs-search-result="guide">
      <div className={style.SearchBreadcrumb}>
        <Icon className={style.Icon} size={14} />
        <Docs.Join items={crumbs}>
          <span className={style.SearchBreadcrumbDivider}>{'›'}</span>
        </Docs.Join>
      </div>
      <h3 className={style.SearchResultGuideTitle}>{result.data.meta.title}</h3>
      <div
        className={style.SearchResultGuideExcerpt}
        dangerouslySetInnerHTML={{ __html: result.data.excerpt }}
      />
    </div>
  );
}

function SearchResultContent({ result }: SearchResultProps) {
  const Docs = useComponents();
  const language = useLanguage();

  switch (result.kind) {
    case 'http_method':
      return (
        <>
          <Docs.MethodHeader
            level="h5"
            title={<Highlight result={result} name={result.summary ? 'summary' : 'title'} />}
            signature={result['qualified'] && <Highlight result={result} name={'qualified'} />}
          >
            <Docs.MethodRoute
              httpMethod={result.httpMethod}
              endpoint={<Highlight result={result} name="endpoint" />}
            />
          </Docs.MethodHeader>
          <div className={`${style.MethodDescription} ${style.Content}`}>
            <Highlight result={result} name="description" />
          </div>
        </>
      );

    case 'model': {
      const properties =
        result.children?.map((child, index) => (
          <span key={index} className={style.TextIdentifier}>
            {child}
          </span>
        )) ?? [];

      return (
        <div className={style.Property} data-stldocs-language={language}>
          <div className={style.PropertyHeader}>
            <span className={style.PropertyName}>
              <Highlight result={result} name={result.title ? 'title' : 'name'} />
            </span>
          </div>
          <span className={style.PropertyDeclaration}>
            <Highlight result={result} name="ident" />:{' '}
            <Docs.Join items={properties} limit={3}>
              <span className={style.TextPunctuation}>, </span>
            </Docs.Join>
          </span>
        </div>
      );
    }

    case 'resource':
      return (
        <div className={style.SearchResultResourceInfo}>
          <span className={style.SearchResultResourceTitle}>
            <Highlight result={result} name="title" />
          </span>
          <span className={style.SearchResultResourcePath}>
            <Highlight result={result} name="QualifiedName" />
          </span>
        </div>
      );

    case 'property':
      return (
        <div className={style.Property} data-stldocs-language={language}>
          <div className={style.PropertyHeader}>
            <span className={style.PropertyName}>
              <Highlight result={result} name="name" />
            </span>
            <span className={style.PropertyTypeName}>
              <span dangerouslySetInnerHTML={{ __html: result.type ?? '' }} />
            </span>
          </div>
          {result.docstring && (
            <span className={style.PropertyDescription}>
              <Highlight result={result} name="docstring" />
            </span>
          )}
        </div>
      );
  }
}
