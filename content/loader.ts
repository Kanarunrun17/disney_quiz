import { existsSync, readdirSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { categories } from './masters/categories';
import { places } from './masters/places';
import { series } from './masters/series';
import { tags } from './masters/tags';
import { createArticleSchema } from './schema';

// ファイルシステムを読むため、ビルド時（サーバー側）専用

export const ARTICLES_DIR = join(process.cwd(), 'content/articles');

/** slug.mdx と slug/index.mdx の両方を拾う */
export const findArticleFiles = (dir = ARTICLES_DIR): { slug: string; file: string }[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      const index = join(full, 'index.mdx');
      return existsSync(index) ? [{ slug: name, file: index }] : [];
    }
    return name.endsWith('.mdx') ? [{ slug: basename(name, '.mdx'), file: full }] : [];
  });

export const articleSchema = createArticleSchema({
  categoryIds: categories.map((c) => c.id),
  tagIds: tags.map((t) => t.id),
  placeIds: places.map((p) => p.id),
  seriesIds: series.map((s) => s.id),
});
