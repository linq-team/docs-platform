import {
  useState,
  useCallback,
  useEffect,
  ReactNode,
  Fragment,
  createContext,
  use,
  useMemo,
  useRef,
} from 'react';
import { useLanguage, useRenderMarkdown, useNavigation, useSettings } from '../contexts';
import { generateRoute } from '../routing';
import style from '../style';
import { MinusIcon, PlusIcon } from 'lucide-react';
import clsx from 'clsx';

type JoinProps = { items: ReactNode[]; limit?: number; children: ReactNode };

export function Join({ items, limit, children }: JoinProps) {
  const arr =
    limit && items.length > limit + 1
      ? [
          ...items.slice(0, limit),
          <span className={style.Truncation} key="truncation">
            {items.length - limit} more
          </span>,
        ]
      : items;

  return arr.map((item, index) => (
    <Fragment key={`iterator:${index}`}>
      {!!index && children}
      {item}
    </Fragment>
  ));
}

type ExpanderProps = {
  id?: string;
  open?: boolean;
  summary: ReactNode;
  virtual?: boolean;
  muted?: boolean;
  children?: ReactNode;
};

export function Expander({ id, open, summary, virtual, muted, children }: ExpanderProps) {
  const settings = useSettings();
  const virtualExpanders = settings?.virtualExpanders;

  if (virtual || virtualExpanders)
    return (
      <VirtualExpander summary={summary} open={open} muted={muted} id={id} key={open ? 'open' : 'closed'}>
        {children}
      </VirtualExpander>
    );

  return (
    <details
      className={style.Expander}
      open={open}
      data-stldocs-expander-muted={muted}
      data-stldocs-expander-initial-state={open}
    >
      <summary className={style.ExpanderSummary}>
        <div className={style.ExpanderSummaryIcon}>
          <PlusIcon size={16} strokeWidth={1} className={style.Icon} />
          <MinusIcon size={16} strokeWidth={1} className={style.Icon} />
        </div>
        <div className={style.ExpanderSummaryContent}>{summary}</div>
      </summary>
      <div className={style.ExpanderContent} id={id}>
        {children}
      </div>
    </details>
  );
}

export function VirtualExpander({
  id,
  open: isOpen,
  muted,
  summary,
  children,
}: Omit<ExpanderProps, 'virtual'>) {
  const [open, setOpen] = useState(isOpen ?? false);

  return (
    <div
      className={style.Expander}
      data-open={open}
      data-stldocs-expander-muted={muted}
      data-stldocs-expander-initial-state={open}
    >
      <div className={style.ExpanderSummary} onClick={() => setOpen(!open)}>
        <div className={style.ExpanderSummaryIcon}>
          <PlusIcon size={16} className={style.Icon} />
          <MinusIcon size={16} className={style.Icon} />
        </div>
        <div className={style.ExpanderSummaryContent}>{summary}</div>
      </div>
      {open && (
        <div className={style.ExpanderContent} id={id}>
          {children}
        </div>
      )}
    </div>
  );
}

export function Markdown({ content, style: cssStyle }: { content: string; style?: React.CSSProperties }) {
  const rendered = useRenderMarkdown(content);

  return (
    rendered && (
      <div
        style={cssStyle}
        className={clsx(style.Markdown, style.Content, 'stl-ui-prose')}
        dangerouslySetInnerHTML={{ __html: rendered }}
      />
    )
  );
}

const TooltipNestingContext = createContext<boolean>(false);

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
};

export function Tooltip({ content, children }: TooltipProps) {
  const nested = use(TooltipNestingContext);

  if (nested) return children;

  return (
    <span className={style.Tooltip}>
      <span className={style.TooltipContent}>
        <TooltipNestingContext value={true}>{content}</TooltipNestingContext>
      </span>
      <span className={style.TooltipHost}>{children}</span>
    </span>
  );
}

type LinkProps = {
  stainlessPath?: string;
  scroll?: boolean;
  children?: ReactNode;
} & React.HTMLProps<HTMLAnchorElement>;

export function Link({ stainlessPath, scroll = true, children, ...props }: LinkProps) {
  const { basePath, onNavigate } = useNavigation();
  const language = useLanguage();

  const href = useMemo(() => {
    if (props.href) return props.href;
    if (stainlessPath && basePath) return generateRoute(basePath, language, stainlessPath);
  }, [basePath, language, stainlessPath, props.href]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (props.onClick) props.onClick(e);
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (href && stainlessPath) onNavigate?.(e, { href, language, stainlessPath, scroll });
    },
    [href, scroll, onNavigate, language, props, stainlessPath],
  );

  if (!href) return children;

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

export type InputProps = {
  left?: ReactNode;
  right?: ReactNode;
  ref?: React.Ref<HTMLInputElement>;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ left, right, ref, className, ...props }: InputProps) {
  return (
    <div className={clsx(style.Input, props.disabled && style.InputDisabled, className)}>
      {left}
      <input {...props} ref={ref} className={style.InputTextField} />
      {right}
    </div>
  );
}

export type ToggleButtonProps = {
  children?: ReactNode;
  selected?: boolean;
} & React.ComponentProps<'button'>;

export function ToggleButton({ children, selected, ref, ...props }: ToggleButtonProps) {
  return (
    <button {...props} ref={ref} className={style.ToggleButton} data-stldocs-toggle-selected={selected}>
      {children}
    </button>
  );
}

export type ListViewProps<TItem> = {
  items: Array<TItem>;
  itemDelegate: (item: TItem, selected: boolean) => React.ReactNode;
  onSelectListItem?: (item: TItem) => void;
} & React.HTMLAttributes<HTMLDivElement>;

export function ListView<TItem>({ items, itemDelegate, onSelectListItem, ...rest }: ListViewProps<TItem>) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [keyboardIndex, setKeyboardIndex] = useState<number>(0);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback(() => {
    const item = items[selectedIndex];
    if (item) {
      onSelectListItem?.(item);
    }
  }, [items, selectedIndex, onSelectListItem]);

  useEffect(() => {
    const ac = new AbortController();
    document.addEventListener(
      'keydown',
      (ev) => {
        switch (ev.key) {
          case 'ArrowUp': {
            ev.preventDefault();
            const value = Math.max(0, selectedIndex - 1);
            setSelectedIndex(value);
            setKeyboardIndex(value);
            break;
          }

          case 'ArrowDown': {
            ev.preventDefault();
            const value = Math.min(items.length, selectedIndex + 1);
            setSelectedIndex(value);
            setKeyboardIndex(value);
            break;
          }

          case 'Enter':
            ev.preventDefault();
            handleSelect();
            break;
        }
      },
      { signal: ac.signal },
    );
    return () => ac.abort();
  }, [items, selectedIndex, handleSelect]);

  useEffect(() => {
    if (!keyboardIndex || !itemRef.current || !listRef.current) {
      listRef?.current?.scroll(0, 0);
      return;
    }

    const selectedBounds = itemRef.current.getBoundingClientRect();
    const listBounds = listRef.current.getBoundingClientRect();
    const needsScroll = selectedBounds.top < listBounds.top || selectedBounds.bottom > listBounds.bottom;

    if (needsScroll) itemRef.current.scrollIntoView({ block: 'nearest' });
  }, [keyboardIndex, items, listRef]);

  return (
    <div ref={listRef} className={style.ListView} tabIndex={0} {...rest}>
      {items.map((item, index) => (
        <div
          key={index}
          ref={index === selectedIndex ? itemRef : null}
          className={style.ListViewItem}
          data-stldocs-listview-selected={index === selectedIndex}
          onClick={handleSelect}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          {itemDelegate(item, index === selectedIndex)}
        </div>
      ))}
    </div>
  );
}
