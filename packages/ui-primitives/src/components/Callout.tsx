import React from 'react';
import clsx from 'clsx';
import { Info, CircleAlert, Lightbulb, Check, TriangleAlert, OctagonAlert } from 'lucide-react';

export type CalloutVariant = 'info' | 'note' | 'tip' | 'success' | 'warning' | 'danger';

export type CalloutProps = {
  variant?: CalloutVariant;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ComponentProps<'aside'>, 'className' | 'children'>;

export function Callout({ variant = 'info', className, children, ...props }: CalloutProps) {
  const classes = clsx('stl-ui-callout', `stl-ui-callout--${variant}`, className);

  const Icon = {
    info: Info,
    note: CircleAlert,
    tip: Lightbulb,
    success: Check,
    warning: TriangleAlert,
    danger: OctagonAlert,
  }[variant];

  return (
    <aside className={classes} {...props}>
      <Icon className="stl-ui-callout__icon" />
      <div className="stl-ui-callout__content">{children}</div>
    </aside>
  );
}
