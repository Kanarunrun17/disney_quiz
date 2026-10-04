import { readFileSync } from 'node:fs';
import matter from 'gray-matter';
import {
  categories,
  getParkOf,
  getPlace,
  series,
  tags,
  type ArticleFrontmatter,
  type Place,
} from '@content';
import { articleSchema, findArticleFiles } from '@content/loader';

// ビルド時に content/articles を読み込む。ページ（Server Component）からのみ使う

export type Article = ArticleFrontmatter & {
  slug: string;
  body: string;
  readingMinutes: number;
};

// 日本語はおよそ 1分 500字 で計算
const CHARS_PER_MINUTE = 500;

let cache: Article[] | undefined;

export const getArticles = (): Article[] => {
  if (cache) return cache;
  const includeDrafts = process.env.NODE_ENV !== 'production';
  cache = findArticleFiles()
    .map(({ slug, file }) => {
      const { data, content } = matter(readFileSync(file, 'utf8'));
      // 検証は prebuild の content:validate で済んでいる前提。ここで失敗したら例外にする
      const fm = articleSchema.parse(data);
      return {
        ...fm,
        slug,
        body: content,
        readingMinutes: Math.max(1, Math.round(content.replace(/\s/g, '').length / CHARS_PER_MINUTE)),
      };
    })
    .filter((a) => includeDrafts || !a.draft)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  return cache;
};

export const getArticle = (slug: string) => getArticles().find((a) => a.slug === slug);

export const getArticlesByCategory = (id: string) => getArticles().filter((a) => a.category === id);

export const getArticlesByTag = (id: string) => getArticles().filter((a) => a.tags.includes(id));

export const getSeriesArticles = (id: string) =>
  getArticles()
    .filter((a) => a.series?.id === id)
    .sort((a, b) => a.series!.order - b.series!.order);

/** 2 記事の類似スコア。同じ場所 3 点、同じ連載 3 点、同じタグ 1 点、同じカテゴリ 0.5 点 */
export const scoreRelation = (a: Article, b: Article): number => {
  let s = 0;
  s += b.places.filter((p) => a.places.includes(p)).length * 3;
  if (a.series && b.series?.id === a.series.id) s += 3;
  s += b.tags.filter((t) => a.tags.includes(t)).length;
  if (b.category === a.category) s += 0.5;
  return s;
};

/** 同じ場所・連載・タグ・カテゴリを共有する記事を関連度順に返す */
export const getRelatedArticles = (article: Article, limit = 4): Article[] =>
  getArticles()
    .filter((a) => a.slug !== article.slug)
    .map((a) => ({ a, s: scoreRelation(article, a) }))
    .filter(({ s }) => s >= 1)
    .sort((x, y) => y.s - x.s)
    .slice(0, limit)
    .map(({ a }) => a);

// ---- マスタの参照 ----

export const getCategory = (id: string) => categories.find((c) => c.id === id);
export const getTag = (id: string) => tags.find((t) => t.id === id);
export const getSeries = (id: string) => series.find((s) => s.id === id);

export const getArticlePlaces = (article: Article): Place[] =>
  article.places.map((id) => getPlace(id)).filter((p): p is Place => !!p);

/** 記事が関係するパーク（places の祖先から求める） */
export const getArticleParks = (article: Article): Place[] => {
  const parks = new Map<string, Place>();
  for (const id of article.places) {
    const park = getParkOf(id);
    if (park) parks.set(park.id, park);
  }
  return [...parks.values()];
};
