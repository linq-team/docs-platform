import { useState, useRef, useEffect, createElement } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { QueryKinds, QueryKindsType, ResultData } from './types';
import { GuideResult, QueryKindDisplay, SearchResult } from './results';
import { guideSearch } from './providers/pagefind';
import { useLanguage } from '@stainless-api/docs-ui/contexts';
import { useSearch, useSearchContext } from './context';
import { useComponents } from '@stainless-api/docs-ui/contexts/use-components';

import style from '@stainless-api/docs-ui/style';
import { Button } from '@stainless-api/ui-primitives';

export function SearchForm() {
  const Docs = useComponents();
  const search = useSearch();
  const language = useLanguage();
  const { onSelect, pageFind } = useSearchContext();

  const [results, setResults] = useState<ResultData>(null!);
  const [filterKind, setFilterKind] = useState<QueryKindsType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const guideLimit = 25;
    const apiKindFilter = ['all', 'guide'].includes(filterKind) ? undefined : filterKind;

    const ac = new AbortController();

    Promise.all([
      pageFind ? guideSearch(pageFind, searchQuery, guideLimit) : [],
      search({ query: searchQuery, kind: apiKindFilter, language }),
    ])
      .then(([guideResults, apiResults]) => {
        if (ac.signal.aborted) return;
        setResults({
          items:
            filterKind === 'guide'
              ? guideResults
              : filterKind === 'all'
                ? [...guideResults.slice(0, 5), ...(apiResults?.hits ?? []), ...guideResults.slice(5)]
                : (apiResults?.hits ?? []),
          counts: {
            ...apiResults?.facets?.['kind'],
            guide: guideResults.length,
            all: (apiResults?.nbHits ?? 0) + guideResults.length,
          },
        });
      })
      .catch(() => {});

    return () => ac.abort();
  }, [searchQuery, filterKind, language, search, pageFind]);

  return (
    <div className={style.SearchForm}>
      <Docs.Input
        ref={inputRef}
        autoFocus
        onChange={(ev) => setSearchQuery(ev.target.value)}
        left={<SearchIcon size={16} className={style.Icon} />}
        value={searchQuery}
        placeholder="Search"
      />
      <SearchFilter
        results={results}
        filterKind={filterKind}
        onChange={(filterKind) => setFilterKind(filterKind)}
      />
      <Docs.ListView
        items={results?.items ?? []}
        itemDelegate={(item) =>
          'kind' in item ? <SearchResult result={item} /> : <GuideResult result={item} />
        }
        onSelectListItem={(item) =>
          onSelect?.((item as any)['data']?.['url'] ?? (item as any)['stainlessPath'])
        }
      />
    </div>
  );
}

export type SearchFilterProps = {
  results: ResultData;
  filterKind: QueryKindsType;
  onChange: (filterKind: QueryKindsType) => void;
};

export function SearchFilter({ results, filterKind, onChange }: SearchFilterProps) {
  const { pageFind } = useSearchContext();
  const toggles = pageFind ? QueryKinds : QueryKinds.filter((k) => k !== 'guide');

  return (
    <div className={style.SearchFilter}>
      {toggles.map((kind, index) => (
        <Button
          key={index}
          variant={filterKind === kind ? 'accent' : 'outline'}
          onClick={() => onChange?.(kind)}
        >
          {createElement(QueryKindDisplay[kind].icon, {
            size: 16,
            className: style.Icon,
          })}
          <span className={style.SearchFilterLabel}>{QueryKindDisplay[kind].name}</span>
          <span className={style.SearchFilterCount}>{results?.counts?.[kind] ?? 0}</span>
        </Button>
      ))}
    </div>
  );
}

export type SearchModalProps = {
  id?: string;
  open?: boolean;
};

export function SearchModal({ id, open: isOpen }: SearchModalProps) {
  const [open, setOpen] = useState<boolean>(isOpen ?? false);

  // Prevents the background from being scrollable when the modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div
      id={id}
      onToggle={(ev) => setOpen(ev.newState === 'open')}
      className={style.SearchModal}
      popover="auto"
      data-stldocs-modal-open={open}
    >
      {open && <SearchForm />}
    </div>
  );
}
