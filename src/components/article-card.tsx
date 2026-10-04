import Link from 'next/link';
import { getArticleParks, getCategory, type Article } from '@/lib/content';
import { formatDate } from '@/lib/site';

export function ArticleCard({ article }: { article: Article }) {
  const category = getCategory(article.category);
  const parks = getArticleParks(article);
  return (
    <Link
      href={`/trivia/${article.slug}`}
      className="group block rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <span className="font-medium text-accent">{category?.name}</span>
        {parks.map((p) => (
          <span key={p.id}>・{p.name}</span>
        ))}
      </div>
      <h3 className="mt-2 text-lg font-bold leading-snug group-hover:text-accent">{article.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{article.description}</p>
      <p className="mt-3 text-xs text-muted">
        <time dateTime={article.publishedAt.toISOString()}>{formatDate(article.publishedAt)}</time>
      </p>
    </Link>
  );
}

export function ArticleList({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return <p className="text-muted">まだ記事がありません。</p>;
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {articles.map((a) => (
        <li key={a.slug}>
          <ArticleCard article={a} />
        </li>
      ))}
    </ul>
  );
}
