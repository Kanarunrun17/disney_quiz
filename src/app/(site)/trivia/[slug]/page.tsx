import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ViewTransition, type CSSProperties } from 'react';
import { ArticleList } from '@/components/article-card';
import { Chip } from '@/components/chip';
import {
  getArticle,
  getArticlePlaces,
  getArticles,
  getCategory,
  getRelatedArticles,
  getSeries,
  getSeriesArticles,
  getTag,
} from '@/lib/content';
import { MdxContent } from '@/lib/mdx';
import { BackLink } from '@/components/back-link';
import { formatDate } from '@/lib/site';

export const dynamicParams = false;

export function generateStaticParams() {
  return getArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<'/trivia/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/trivia/${slug}` },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.description,
      publishedTime: article.publishedAt.toISOString(),
      modifiedTime: article.updatedAt?.toISOString(),
    },
  };
}

export default async function TriviaPage({ params }: PageProps<'/trivia/[slug]'>) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const category = getCategory(article.category);
  const places = getArticlePlaces(article);
  const seriesInfo = article.series && getSeries(article.series.id);
  const seriesArticles = article.series ? getSeriesArticles(article.series.id) : [];
  const related = getRelatedArticles(article);

  return (
    // 探索ホームの表紙（同じ name）からモーフして開く。直接開いたときは何も動かない（default="none"）
    <ViewTransition enter={{ 'book-open': 'article-enter', default: 'none' }} default="none">
    <article className="mx-auto max-w-2xl">
      <ViewTransition name={`book-${article.slug}`} share="book-open" default="none">
      <header className="article-header" style={{ '--c': category?.color } as CSSProperties}>
        {/* 一つ前（探索ホームのこのカテゴリ）へ。直接開いたときもカテゴリのギャラリーに戻れる */}
        <div className="-ml-2 flex items-center gap-1">
          <BackLink fallbackHref={`/#${article.category}`} label="前の画面に戻る" />
          <Link href={`/#${article.category}`} className="text-sm font-medium text-accent">
            {category?.name}
          </Link>
        </div>
        <h1 className="mt-2 text-2xl font-bold leading-snug md:text-3xl">{article.title}</h1>
        <p className="mt-3 flex flex-wrap gap-x-4 text-sm text-muted">
          <time dateTime={article.publishedAt.toISOString()}>{formatDate(article.publishedAt)}</time>
          {article.updatedAt && (
            <span>
              更新：<time dateTime={article.updatedAt.toISOString()}>{formatDate(article.updatedAt)}</time>
            </span>
          )}
          <span>約{article.readingMinutes}分で読めます</span>
        </p>
        {places.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="関連する場所">
            {places.map((p) => (
              <li key={p.id}>
                <Chip>{p.name}</Chip>
              </li>
            ))}
          </ul>
        )}
      </header>
      </ViewTransition>

      {seriesInfo && (
        <nav aria-label="連載" className="mt-8 rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm font-bold">連載「{seriesInfo.name}」</p>
          <ol className="mt-3 space-y-1 text-sm">
            {seriesArticles.map((a) => (
              <li key={a.slug}>
                {a.slug === article.slug ? (
                  <span aria-current="page" className="font-bold">
                    {a.series!.order}. {a.title}
                  </span>
                ) : (
                  <Link href={`/trivia/${a.slug}`} className="text-accent hover:underline">
                    {a.series!.order}. {a.title}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="article-body mt-10">
        <MdxContent source={article.body} />
      </div>

      <p className="mt-12 text-xs leading-relaxed text-muted">
        記事の内容は {formatDate(article.updatedAt ?? article.publishedAt)} 時点の情報です。
      </p>

      {article.tags.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="タグ">
          {article.tags.map((id) => (
            <li key={id}>
              <Chip href={`/tags/${id}`}>#{getTag(id)?.name}</Chip>
            </li>
          ))}
        </ul>
      )}

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-4 text-lg font-bold">関連する記事</h2>
          <ArticleList articles={related} />
        </section>
      )}
    </article>
    </ViewTransition>
  );
}
