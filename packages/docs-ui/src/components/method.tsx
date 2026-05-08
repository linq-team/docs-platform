import * as React from 'react';
import type { ReactNode } from 'react';
import { useComponents } from '../contexts/use-components';
import style from '../style';
import clsx from 'clsx';
import { PropertyToggle } from './properties';
import { Badge, getHttpMethod } from '@stainless-api/ui-primitives';
import { FunctionIcon } from '@stainless-api/ui-primitives/icons';

export type MethodHeaderProps = {
  title: ReactNode;
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5';
  signature?: ReactNode;
  badges?: ReactNode;
  children?: ReactNode;
};

export function MethodHeader({ title, badges, signature, children, level }: MethodHeaderProps) {
  const Heading = level ?? 'h5';
  return (
    <div className={style.MethodHeader}>
      <Heading className={style.MethodTitle}>{title}</Heading>
      {badges ? <div className={style.MethodBadges}>{badges}</div> : null}
      {signature}
      {children}
    </div>
  );
}

export type MethodRouteProps = {
  httpMethod?: string;
  endpoint?: string | ReactNode;
  iconOnly?: boolean;
};
export function MethodRoute({ httpMethod, endpoint, iconOnly }: MethodRouteProps) {
  const httpMethodTyped = getHttpMethod(httpMethod);
  return (
    <div className={style.MethodRoute}>
      {httpMethod ? (
        httpMethodTyped && <Badge.HTTP method={httpMethodTyped} iconOnly={iconOnly} size="sm" />
      ) : (
        <Badge size="sm" icon={<FunctionIcon />} intent="info">
          {!iconOnly && 'Function'}
        </Badge>
      )}
      {endpoint ? <span className={style.MethodRouteEndpoint}>{endpoint}</span> : null}
    </div>
  );
}

export type MethodDescriptionProps = {
  description?: string;
};

export function MethodDescription({ description }: MethodDescriptionProps) {
  const { Markdown } = useComponents();

  if (description)
    return (
      <div className={style.MethodDescription}>
        <Markdown content={description} />
      </div>
    );
}

export type MethodInfoProps = {
  children?: ReactNode;
  parameters?: ReactNode;
  returns?: ReactNode;
};

export function MethodInfo({ children, parameters, returns }: MethodInfoProps) {
  return (
    <div className={style.MethodInfo}>
      {children ? <div className={style.MethodContent}>{children}</div> : null}

      {parameters ? (
        <div className={style.MethodInfoSection}>
          <h5>
            Parameters
            <PropertyToggle target="parameters" />
          </h5>
          <div className={style.MethodParameters} data-stldocs-property-group="parameters">
            {parameters}
          </div>
        </div>
      ) : null}

      {returns ? (
        <div className={style.MethodInfoSection}>
          <h5>
            Returns
            <PropertyToggle target="returns" />
          </h5>
          <div className={style.MethodReturns} data-stldocs-property-group="returns">
            {returns}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export type MethodProps = {
  id?: string;
  header?: ReactNode;
  children?: ReactNode;
} & React.HTMLProps<HTMLDivElement>;

export function Method({ id, header, children, className, ...props }: MethodProps) {
  return (
    <div id={id} className={clsx(style.Method, className)} tabIndex={0} {...props}>
      {header}
      <div className={style.MethodBody}>{children}</div>
    </div>
  );
}
