import type { MetadataRoute } from 'next';
import { getArticles, getArticlesByCategory, getArticlesByTag } from '@/lib/content';
import { SITE_URL } from '@/lib/site';
import { categories, tags } from '@content';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => new URL(path, SITE_URL).toString();
  return [
    { url: url('/') },
    { url: url('/categories') },
    ...categories.filter((c) => getArticlesByCategory(c.id).length > 0).map((c) => ({ url: url(`/categories/${c.id}`) })),
    ...tags.filter((t) => getArticlesByTag(t.id).length > 0).map((t) => ({ url: url(`/tags/${t.id}`) })),
    ...getArticles().map((a) => ({
      url: url(`/trivia/${a.slug}`),
      lastModified: a.updatedAt ?? a.publishedAt,
    })),
  ];
}
