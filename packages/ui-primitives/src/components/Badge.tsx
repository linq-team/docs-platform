import React from 'react';
import clsx from 'clsx';

import { ArrowUpRightIcon, ArrowDownLeftIcon, XIcon } from 'lucide-react';

// prettier-ignore
export type BadgeIntent =
  | 'none'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'note'
  | 'tip'
  | 'accent';

function BaseBadge({
  children,
  icon = null,
  intent,
  size = 'md',
  solid = false,
  ...props
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  intent?: BadgeIntent;
  size?: 'sm' | 'md' | 'lg';
  solid?: boolean;
} & React.HTMLAttributes<HTMLSpanElement>) {
  const classes = clsx(
    'stl-ui-badge',
    intent && `stl-ui-badge--intent-${intent}`,
    `stl-ui-badge--size-${size}`,
    solid && 'stl-ui-badge--solid',

    'not-content',
    'stl-ui-not-prose',
    props.className,
  );

  return (
    <span {...props} className={classes}>
      {icon}
      {!!children && <span className="stl-ui-badge__content">{children}</span>}
    </span>
  );
}

// public badge interface disallows passing undefined intent
// but HTTPBadge needs to pass undefined intent to BaseBadge
const PublicBadge = function Badge({
  children,
  intent = 'none',
  ...props
}: {
  children: React.ReactNode;
} & React.ComponentProps<typeof BaseBadge>) {
  return (
    <BaseBadge intent={intent} {...props}>
      {children}
    </BaseBadge>
  );
};

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
function isHttpMethod(method: string | undefined) {
  // direct return of simple === comparison so that ts can infer type guard / narrowing
  return (
    method === 'GET' || method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE'
  );
}
export function getHttpMethod(method?: string): HTTPMethod | null {
  const upper = method?.toUpperCase();
  return isHttpMethod(upper) ? upper : null;
}

function HTTPBadge({
  method,
  iconOnly = false,
  ...props
}: {
  method: HTTPMethod;
  iconOnly?: boolean;
} & Omit<React.ComponentProps<typeof Badge>, 'children' | 'intent'>) {
  const classes = clsx('stl-ui-badge--http', `stl-ui-badge--http-${method.toLowerCase()}`, props.className);
  return (
    <BaseBadge
      {...props}
      className={classes}
      icon={
        (
          {
            GET: <ArrowDownLeftIcon aria-hidden={!iconOnly} aria-label="GET" />,
            POST: <ArrowUpRightIcon aria-hidden={!iconOnly} aria-label="POST" />,
            PUT: <ArrowUpRightIcon aria-hidden={!iconOnly} aria-label="PUT" />,
            PATCH: <ArrowUpRightIcon aria-hidden={!iconOnly} aria-label="PATCH" />,
            DELETE: <XIcon aria-hidden={!iconOnly} aria-label="DELETE" />,
          } satisfies Record<HTTPMethod, React.ReactNode>
        )[method]
      }
    >
      {!iconOnly && method}
    </BaseBadge>
  );
}

export const Badge = Object.assign(PublicBadge, {
  HTTP: HTTPBadge,
});
