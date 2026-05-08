import { Fragment } from 'react';

import { LightAsync as SyntaxHighlighter } from 'react-syntax-highlighter';

import type { Components } from 'react-markdown';
import clsx from 'clsx';
import './hljs-github.css';

function NoPropsFragment({ children }: { children: React.ReactNode }) {
  return <Fragment>{children}</Fragment>;
}

export default {
  code(props) {
    const { children, className, ref, style, ...rest } = props;
    const match = /language-(\w+)/.exec(className || '');
    return match && typeof children === 'string' ? (
      <SyntaxHighlighter
        {...rest}
        PreTag={NoPropsFragment}
        language={match[1]}
        useInlineStyles
        codeTagProps={{ className: clsx(className, 'hljs-github') }}
      >
        {children.replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code {...rest} className={className}>
        {children}
      </code>
    );
  },
} satisfies Components;
