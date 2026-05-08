import clsx from 'clsx';
import type { ComponentProps } from 'react';
import { Menu } from './DropdownMenu';

function Trigger({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      aria-label="Select an option"
      aria-haspopup="menu"
      aria-expanded="false"
      {...props}
      data-part="trigger"
      className={clsx('stl-ui-dropdown__button', className)}
    >
      {props.children}
    </button>
  );
}

function TriggerSelectedItem({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      data-part="trigger-selected"
      className={clsx('stl-ui-dropdown__trigger-selected', className)}
    />
  );
}

function TriggerIcon({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span {...props} data-part="trigger-icon" className={clsx('stl-ui-dropdown__trigger-icon', className)} />
  );
}

function Icon({ className, ...props }: ComponentProps<'div'>) {
  return <div {...props} data-part="item-icon" className={clsx('stl-ui-dropdown__icon', className)} />;
}

export function Dropdown({ className, ...props }: ComponentProps<'div'>) {
  return <div {...props} className={clsx('stl-ui-dropdown stl-ui-not-prose not-content', className)} />;
}

Dropdown.Menu = Menu;
Dropdown.MenuItem = Menu.Item;
Dropdown.MenuItemText = Menu.ItemText;
Dropdown.MenuItemTemplate = Menu.ItemTemplate;
Dropdown.Trigger = Trigger;
Dropdown.TriggerSelectedItem = TriggerSelectedItem;
Dropdown.TriggerIcon = TriggerIcon;
Dropdown.Icon = Icon;
