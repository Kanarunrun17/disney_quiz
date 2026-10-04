import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleList } from '@/components/article-card';
import { getArticlesByTag, getTag } from '@/lib/content';
import { tags } from '@content';

export const dynamicParams = false;

export function generateStaticParams() {
  return tags.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: PageProps<'/tags/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const tag = getTag(id);
  if (!tag) return {};
  return {
    title: `#${tag.name}`,
    description: `「${tag.name}」に関するディズニートリビア記事一覧`,
    alternates: { canonical: `/tags/${id}` },
  };
}

export default async function TagPage({ params }: PageProps<'/tags/[id]'>) {
  const { id } = await params;
  const tag = getTag(id);
  if (!tag) notFound();
  const articles = getArticlesByTag(id);

  return (
    <div>
      <p className="text-sm text-muted">タグ</p>
      <h1 className="mt-1 text-2xl font-bold">#{tag.name}</h1>
      <p className="mt-2 text-sm text-muted">{articles.length}件の記事</p>
      <div className="mt-6">
        <ArticleList articles={articles} />
      </div>
    </div>
  );
}
