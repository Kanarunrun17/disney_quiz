import type { Metadata } from 'next';
import Link from 'next/link';
import { getArticlesByCategory } from '@/lib/content';
import { categories } from '@content';

export const metadata: Metadata = {
  title: 'カテゴリ',
  alternates: { canonical: '/categories' },
};

export default function CategoriesPage() {
  const sorted = [...categories].sort((a, b) => a.order - b.order);
  return (
    <div>
      <h1 className="text-2xl font-bold">カテゴリ</h1>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {sorted.map((c) => {
          const count = getArticlesByCategory(c.id).length;
          return (
            <li key={c.id}>
              <Link
                href={`/categories/${c.id}`}
                className="flex items-center justify-between rounded-2xl border border-border bg-surface px-5 py-4 transition-colors hover:border-accent"
              >
                <span className="font-bold">{c.name}</span>
                <span className="text-sm text-muted">{count}件</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
