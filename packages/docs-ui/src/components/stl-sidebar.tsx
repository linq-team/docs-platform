import clsx from 'clsx';
import { useComponents } from '../contexts/use-components';
import style from '../style';
import { ChevronRight } from 'lucide-react';
import { ReactNode } from 'react';

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      /**
       * Custom element defined by Starlight's <SidebarPersister>.
       */
      'sl-sidebar-restore': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

export type StlSidebarTarget =
  | { type: 'href'; href: string }
  | { type: 'stainlessPath'; stainlessPath: string };

export interface StlSidebarLink {
  type: 'link';
  icon?: ReactNode;
  label: string;
  /** Current sidebar item is highlighted. */
  isCurrent?: boolean;
  target: StlSidebarTarget;
  /** Additional HTML attributes that will be attached to the anchor element. */
  attrs?: Record<string, unknown>;
}

export interface StlSidebarGroup {
  type: 'group';
  icon?: ReactNode;
  label: string;
  entries: Array<StlSidebarLink | StlSidebarGroup>;
  /** Defaults to true. */
  collapsible?: boolean;
  collapsed?: boolean;
  /** Current sidebar item is highlighted. */
  isCurrent?: boolean;
  target?: StlSidebarTarget;
}

function targetToAttributes(target: StlSidebarTarget): {
  href?: string;
  stainlessPath?: string;
} {
  return {
    href: target.type === 'href' ? target.href : undefined,
    stainlessPath: target.type === 'stainlessPath' ? target.stainlessPath : undefined,
  };
}

export type StlSidebarEntry = StlSidebarLink | StlSidebarGroup;

function StlSidebarSublist({
  entries,
  entryToIndex,
}: {
  entries: StlSidebarEntry[];
  /** If present, create <sl-sidebar-restore> elements based on this. */
  entryToIndex: Map<StlSidebarEntry, number> | undefined;
}) {
  return (
    <ul className={style.SidebarList}>
      {entries.map((entry, index) =>
        entry.type === 'link' ? (
          <LinkEntry key={index} entry={entry} />
        ) : (
          <GroupEntry key={index} entry={entry} entryToIndex={entryToIndex} />
        ),
      )}
    </ul>
  );
}

function EntryItem({ className, children }: { className?: string; children: ReactNode }) {
  return <li className={clsx(style.SidebarEntry, className)}>{children}</li>;
}

function LinkEntry({ entry }: { entry: StlSidebarLink }) {
  const Docs = useComponents();

  return (
    <EntryItem className={style.SidebarEntryLink}>
      <Docs.Link
        {...targetToAttributes(entry.target)}
        aria-current={entry.isCurrent ? 'page' : undefined}
        {...entry.attrs}
      >
        {entry.icon}
        {entry.label}
      </Docs.Link>
    </EntryItem>
  );
}

function GroupEntry({
  entry,
  entryToIndex,
}: {
  entry: StlSidebarGroup;
  entryToIndex: Map<StlSidebarEntry, number> | undefined;
}) {
  const Docs = useComponents();
  const restorePointIndex = entryToIndex?.get(entry);

  const { collapsible = true } = entry;

  const labelWithIcon = (
    <>
      {entry.label}
      {entry.icon}
    </>
  );

  // If the group is not collapsible, we can't use details/summary since it's impossible to disable
  // the default behavior there without JavaScript.
  const GroupElement = collapsible ? 'details' : 'div';
  const GroupLabelElement = collapsible ? 'summary' : 'div';

  return (
    <EntryItem className={style.SidebarEntryGroup}>
      {/* This link will be absolutely positioned over the summary > span. <a> elements cannot
      be nested under <summary> (since it's ill-defined whether when you click it expands the
      summary versus navigates), so this is our workaround. */}
      {entry.target && (
        <Docs.Link {...targetToAttributes(entry.target)} aria-current={entry.isCurrent ? 'page' : undefined}>
          {labelWithIcon}
        </Docs.Link>
      )}
      <GroupElement
        className={style.SidebarExpander}
        {...(collapsible
          ? {
              open: !entry.collapsed || isAnyItemCurrent(entry.entries),
            }
          : {})}
      >
        <GroupLabelElement className={style.ExpanderSummary}>
          <span aria-hidden={entry.target ? 'true' : undefined}>{labelWithIcon}</span>
          {entry.entries.length > 0 && collapsible && (
            <ChevronRight
              size={16}
              strokeWidth={1}
              className={`${style.Icon} ${style.ExpanderSummaryIcon}`}
            />
          )}
        </GroupLabelElement>
        {restorePointIndex !== undefined && <sl-sidebar-restore data-index={restorePointIndex} />}
        {entry.entries.length > 0 && (
          <StlSidebarSublist entries={entry.entries} entryToIndex={entryToIndex} />
        )}
      </GroupElement>
    </EntryItem>
  );
}

export type StlSidebarProps = {
  entries: StlSidebarEntry[];
  /**
   * If set, add <sl-sidebar-restore> custom elements (as defined by Starlight's SidebarPersister)
   * which are used to save/restore sidebar state.
   */
  withStarlightRestoration?: boolean;
};

export function StlSidebar({ entries, withStarlightRestoration }: StlSidebarProps) {
  const entryToIndex = withStarlightRestoration ? computeEntryToIndex(entries) : undefined;

  return (
    <div className={`${style.Root} ${style.Sidebar}`}>
      <StlSidebarSublist entries={entries} entryToIndex={entryToIndex} />
    </div>
  );
}

function computeEntryToIndex(allEntries: StlSidebarEntry[]) {
  const entryToIndex = new Map<StlSidebarEntry, number>();
  // Index starts at 0.
  // See https://github.com/withastro/starlight/blob/main/packages/starlight/components/SidebarRestorePoint.astro.
  let currentIndex = 0;

  function addEntries(entries: StlSidebarEntry[]) {
    for (const entry of entries) {
      if (entry.type === 'group') {
        // Only groups need restore points.
        // See https://github.com/withastro/starlight/blob/main/packages/starlight/components/SidebarSublist.astro.
        entryToIndex.set(entry, currentIndex);
        currentIndex++;
        addEntries(entry.entries);
      }
    }
  }

  addEntries(allEntries);
  return entryToIndex;
}

function* walkSidebar(entries: StlSidebarEntry[]): Generator<StlSidebarEntry> {
  for (const entry of entries) {
    // yield the entry _and_ each entry in the group
    yield entry;
    if (entry.type === 'group') {
      yield* walkSidebar(entry.entries);
    }
  }
}

function isAnyItemCurrent(entries: StlSidebarEntry[]): boolean {
  for (const e of walkSidebar(entries)) {
    if (e.isCurrent) {
      return true;
    }
  }
  return false;
}
