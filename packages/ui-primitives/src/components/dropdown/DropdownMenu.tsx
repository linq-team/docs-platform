import clsx from 'clsx';
import { CheckIcon, ExternalLink } from 'lucide-react';
import type { ComponentProps } from 'react';

export function Menu({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      role="menu"
      data-state="closed"
      data-part="menu"
      className={clsx('stl-ui-dropdown-menu', className)}
    />
  );
}

function MenuItemText({ className, subtle, ...props }: ComponentProps<'span'> & { subtle?: boolean }) {
  return (
    <span
      {...props}
      data-part="item-text"
      className={clsx(
        `stl-ui-dropdown-menu__item-text`,
        {
          'stl-ui-dropdown-menu__item-text--subtle': subtle,
        },
        className,
      )}
    />
  );
}

type MenuItemBaseProps = {
  children?: React.ReactNode;
  value: string;
  isExternalLink?: boolean;
  isSelected?: boolean;
};

type MenuItemWithHref = MenuItemBaseProps &
  ComponentProps<'a'> & {
    href: string;
  };

type MenuItemWithoutHref = MenuItemBaseProps &
  ComponentProps<'button'> & {
    href?: never;
  };

type MenuItemProps = MenuItemWithHref | MenuItemWithoutHref;

function MenuItem({ children, value, href, isExternalLink, isSelected, ...props }: MenuItemProps) {
  const inner = (
    <>
      <div className="stl-ui-dropdown-menu__item-content">{children}</div>
      {isSelected && (
        <div className="stl-ui-dropdown-menu__item-icon" data-part="item-selected-icon">
          <CheckIcon size={16} />
        </div>
      )}
      {isExternalLink && (
        <div className="stl-ui-dropdown-menu__item-subtle-icon" data-part="item-external-link-icon">
          <ExternalLink size={16} />
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <a
        role="menuitem"
        data-part="item"
        data-value={value}
        aria-selected={isSelected}
        href={href}
        {...(props as ComponentProps<'a'>)}
        className={clsx('stl-ui-dropdown-menu__item', 'stl-ui-dropdown-menu__item-link', props.className)}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      {...(props as ComponentProps<'button'>)}
      role="menuitem"
      data-part="item"
      data-value={value}
      aria-selected={isSelected}
      className={clsx('stl-ui-dropdown-menu__item', props.className)}
    >
      {inner}
    </button>
  );
}

/**
 * A template component that defines the content to be displayed in the dropdown trigger
 * when a menu item is selected. This template is used to customize the appearance of
 * the selected item in the trigger button.
 *
 * @param props - Standard HTML template element props
 * @returns A template element marked with the "selected-template" data part
 */
function MenuItemTemplate({ ...props }: ComponentProps<'template'>) {
  return <template data-part="selected-template" {...props} />;
}

Menu.Item = MenuItem;
Menu.ItemText = MenuItemText;
Menu.ItemTemplate = MenuItemTemplate;
