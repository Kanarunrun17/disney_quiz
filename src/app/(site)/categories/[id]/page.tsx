import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleList } from '@/components/article-card';
import { getArticlesByCategory, getCategory } from '@/lib/content';
import { categories } from '@content';

export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: PageProps<'/categories/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const category = getCategory(id);
  if (!category) return {};
  return {
    title: category.name,
    description: `「${category.name}」のディズニートリビア記事一覧`,
    alternates: { canonical: `/categories/${id}` },
  };
}

export default async function CategoryPage({ params }: PageProps<'/categories/[id]'>) {
  const { id } = await params;
  const category = getCategory(id);
  if (!category) notFound();
  const articles = getArticlesByCategory(id);

  return (
    <div>
      <Link href="/categories" className="text-sm text-muted hover:text-accent">
        ← カテゴリ一覧
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{category.name}</h1>
      <p className="mt-2 text-sm text-muted">{articles.length}件の記事</p>
      <div className="mt-6">
        <ArticleList articles={articles} />
      </div>
    </div>
  );
}
