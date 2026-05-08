import Markdoc from '@markdoc/markdoc';
import type { Node } from '@markdoc/markdoc';

export function heading(level: number, children: string | Node[]) {
  const content = inline(...(typeof children === 'string' ? [text(children)] : children));

  return new Markdoc.Ast.Node('heading', { level }, [content]);
}

export function text(content: string) {
  return new Markdoc.Ast.Node('text', { content });
}

export function code(content: string) {
  return new Markdoc.Ast.Node('code', { content });
}

export function paragraph(...children: Node[]) {
  const inline = new Markdoc.Ast.Node('inline', {}, children);
  return new Markdoc.Ast.Node('paragraph', {}, [inline]);
}

export function list(...children: Node[]) {
  return new Markdoc.Ast.Node('list', { ordered: false }, children);
}

export function item(...children: Node[]) {
  return new Markdoc.Ast.Node('item', {}, children);
}

export function strong(...children: Node[]) {
  return new Markdoc.Ast.Node('strong', {}, children);
}

export function inline(...children: Node[]) {
  return new Markdoc.Ast.Node('inline', {}, children);
}

export function fence(language: string, content: string) {
  return new Markdoc.Ast.Node('fence', { language, content });
}

export function link(href: string, children: string | Node[]) {
  const content = typeof children === 'string' ? [text(children)] : children;
  return new Markdoc.Ast.Node('link', { href }, content);
}

export function parse(content: string) {
  return Markdoc.parse(content).children;
}
