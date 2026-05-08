import React from 'react';
import clsx from 'clsx';
import { LucideIcon } from 'lucide-react';

export type ButtonVariant =
  | 'outline'
  | 'ghost'
  | 'accent'
  | 'accent-muted'
  | 'muted'
  | 'success'
  | 'destructive'
  | 'default';

type BaseProps = {
  variant?: ButtonVariant;
  className?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'lg' | 'default';
  border?: boolean;
  loading?: {
    label: string;
  };
};

type AnchorBranch = BaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & {
    href: string;
  };

type ButtonBranch = BaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    href?: never;
  };

export type ButtonProps = AnchorBranch | ButtonBranch;

// Because this code needs to run inside .astro files, we can’t use React.cloneElement
// (or radix-ui/react-slot). In .astro, children are passed as static HTML elements
// rather than React elements, so they can’t be cloned or modified to add class names.

export function Button(props: ButtonProps) {
  const { variant, children, border, loading, size, className, ...rest } = props;

  const classes = clsx(
    'stl-ui-button',
    {
      'stl-ui-button--outline': variant === 'outline',
      'stl-ui-button--ghost': variant === 'ghost',
      'stl-ui-button--accent': variant === 'accent',
      'stl-ui-button--accent-muted': variant === 'accent-muted',
      'stl-ui-button--muted': variant === 'muted',
      'stl-ui-button--success': variant === 'success',
      'stl-ui-button--destructive': variant === 'destructive',
    },
    {
      'stl-ui-button--size-sm': size === 'sm',
      'stl-ui-button--size-lg': size === 'lg',
    },
    {
      'stl-ui-button--with-border': variant === 'outline' || border,
    },
    {
      'stl-ui-button--loading': !!loading,
    },
    'not-content',
    'stl-ui-not-prose',
    className,
  );

  if (loading) {
    rest['aria-disabled'] = 'true';
    rest['aria-label'] = loading.label;
    rest['title'] = loading.label;
  }

  if ('href' in rest) {
    return (
      <a {...(rest as AnchorBranch)} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button {...rest} type={rest.type ?? 'button'} className={classes}>
      {children}
    </button>
  );
}

type LabelProps = React.HTMLAttributes<HTMLSpanElement>;

Button.Label = function ButtonLabel({ className, ...rest }: LabelProps) {
  return <span className={clsx('stl-ui-button-label leading-none', className)} {...rest} />;
};

type IconProps = {
  icon: LucideIcon | React.ComponentType<{ size?: number }>;
  size?: number;
} & React.HTMLAttributes<HTMLSpanElement>;

Button.Icon = function ButtonIcon({ className, icon: Icon, size = 18, ...rest }: IconProps) {
  return (
    <span className={clsx('stl-ui-button__icon', className)} {...rest}>
      <Icon size={size} />
    </span>
  );
};
