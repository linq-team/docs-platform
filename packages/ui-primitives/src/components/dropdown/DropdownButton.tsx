import clsx from 'clsx';
import { ChevronsUpDown } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Menu } from './DropdownMenu';

function PrimaryActionText({ children }: { children?: React.ReactNode }) {
  return <span data-part="primary-action-text">{children}</span>;
}

function PrimaryAction({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      aria-label="Select primary option"
      {...props}
      data-part="primary-action"
      className={clsx('stl-ui-dropdown__button stl-ui-dropdown-button--action', className)}
    />
  );
}

function Trigger({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded="false"
      aria-label="Select an option"
      {...props}
      data-part="trigger"
      className={clsx('stl-ui-dropdown__button stl-ui-dropdown-button__trigger', className)}
    >
      <ChevronsUpDown size={16} />
    </button>
  );
}

function Icon({ className, ...props }: ComponentProps<'div'>) {
  return <div data-part="item-icon" {...props} className={clsx('stl-ui-dropdown__icon', className)} />;
}

export function DropdownButton({ className, ...props }: ComponentProps<'div'>) {
  return <div {...props} className={clsx('stl-ui-dropdown stl-ui-not-prose not-content', className)} />;
}

DropdownButton.Menu = Menu;
DropdownButton.MenuItem = Menu.Item;
DropdownButton.MenuItemText = Menu.ItemText;
DropdownButton.PrimaryAction = PrimaryAction;
DropdownButton.PrimaryActionText = PrimaryActionText;
DropdownButton.Trigger = Trigger;
DropdownButton.Icon = Icon;
