import React from 'react';
import clsx from 'clsx';

export type AccordionProps = React.ComponentProps<'details'>;

export function Accordion({ className, children, ...props }: AccordionProps) {
  const classes = clsx('stl-ui-accordion', className);

  return (
    <details className={classes} {...props}>
      {children}
    </details>
  );
}

function AccordionSummary({ children, className, ...props }: React.ComponentProps<'summary'>) {
  const classes = clsx('stl-ui-accordion__summary', className);

  return (
    <summary className={classes} {...props}>
      {children}
    </summary>
  );
}

Accordion.Summary = AccordionSummary;

function AccordionGroup({ className, children, ...props }: React.ComponentProps<'div'>) {
  const classes = clsx('stl-ui-accordion-group', className);

  // TODO: boolean `exclusive` prop assigns a unique `name` to each of the child <details> elements
  // For now this can be handled by the user

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

Accordion.Group = AccordionGroup;
