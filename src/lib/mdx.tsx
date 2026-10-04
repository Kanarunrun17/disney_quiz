import { evaluate } from '@mdx-js/mdx';
import type { MDXComponents } from 'mdx/types';
import * as runtime from 'react/jsx-runtime';
import { remarkPlugins } from '@content/mdx';

const components: MDXComponents = {
  a: ({ href = '', ...props }) =>
    /^https?:\/\//.test(href) ? (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props} />
    ) : (
      <a href={href} {...props} />
    ),
};

/** MDX 本文をビルド時に評価して描画する */
export async function MdxContent({ source }: { source: string }) {
  const { default: Content } = await evaluate(source, { ...runtime, remarkPlugins });
  return <Content components={components} />;
}
