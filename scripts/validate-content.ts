// コンテンツ（マスタ + content/articles/**）を検証する。
// 実行: npm run content:validate
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { compile } from '@mdx-js/mdx';
import matter from 'gray-matter';
import { z } from 'zod';
import { articleSchema, findArticleFiles } from '../content/loader';
import { remarkPlugins } from '../content/mdx';
import { assertLayout, buildExploreModel } from '../src/lib/explore';
import {
  categories,
  categorySchema,
  places,
  placeSchema,
  series,
  seriesSchema,
  tags,
  tagSchema,
  type Place,
} from '../content';

const ROOT = process.cwd();
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const errors: string[] = [];
const warnings: string[] = [];
const err = (where: string, msg: string) => errors.push(`${where}: ${msg}`);
const warn = (where: string, msg: string) => warnings.push(`${where}: ${msg}`);

const formatIssues = (e: z.ZodError) =>
  e.issues.map((i) => `${i.path.join('.') || '(root)'} ${i.message}`);

// ---- マスタ ----

const checkMaster = <T extends { id: string }>(name: string, schema: z.ZodType, items: readonly T[]) => {
  const seen = new Set<string>();
  for (const item of items) {
    const r = schema.safeParse(item);
    if (!r.success) formatIssues(r.error).forEach((m) => err(`${name}[${item.id}]`, m));
    if (seen.has(item.id)) err(name, `ID が重複しています: ${item.id}`);
    seen.add(item.id);
  }
};

checkMaster('categories', categorySchema, categories);
checkMaster('tags', tagSchema, tags);
checkMaster('series', seriesSchema, series);
checkMaster('places', placeSchema, places);

// 場所の階層
const allPlaces: readonly Place[] = places;
const placeById = new Map(allPlaces.map((p) => [p.id, p]));
const allowedParentKinds: Record<string, readonly string[]> = {
  resort: [],
  park: ['resort'],
  area: ['park'],
};
for (const p of allPlaces) {
  const where = `places[${p.id}]`;
  const parentId = p.parent;
  if (p.kind === 'resort') {
    if (parentId) err(where, 'resort は parent を持てません');
    continue;
  }
  if (!parentId) {
    err(where, 'parent が必要です');
    continue;
  }
  const parent = placeById.get(parentId);
  if (!parent) {
    err(where, `parent が未登録です: ${parentId}`);
    continue;
  }
  const allowed = allowedParentKinds[p.kind];
  if (allowed && !allowed.includes(parent.kind)) err(where, `${p.kind} の parent は ${allowed.join('/')} である必要があります（実際: ${parent.kind}）`);
  if (!allowed && !['resort', 'park', 'area'].includes(parent.kind)) err(where, `施設の parent は resort/park/area である必要があります（実際: ${parent.kind}）`);

  // 循環チェック
  const seen = new Set([p.id]);
  for (let cur: Place | undefined = parent; cur; cur = cur.parent ? placeById.get(cur.parent) : undefined) {
    if (seen.has(cur.id)) {
      err(where, '親子関係が循環しています');
      break;
    }
    seen.add(cur.id);
  }
}

// ---- 記事 ----

const main = async () => {
  const articles = findArticleFiles();
  const slugs = new Map<string, string>();
  const legacyIds = new Map<number, string>();
  const seriesOrders = new Map<string, string>();
  const used = { category: new Set<string>(), tag: new Set<string>(), series: new Set<string>() };

  for (const { slug, file } of articles) {
    const where = relative(ROOT, file);

    if (!SLUG.test(slug)) err(where, `slug は kebab-case の英小文字・数字にしてください: ${slug}`);
    if (slugs.has(slug)) err(where, `slug が ${slugs.get(slug)} と重複しています`);
    slugs.set(slug, where);

    const source = readFileSync(file, 'utf8');
    const { data, content } = matter(source);

    const r = articleSchema.safeParse(data);
    if (!r.success) {
      formatIssues(r.error).forEach((m) => err(where, m));
    } else {
      const fm = r.data;
      used.category.add(fm.category);
      fm.tags.forEach((t) => used.tag.add(t));

      if (new Set(fm.tags).size !== fm.tags.length) err(where, 'tags に重複があります');
      if (new Set(fm.places).size !== fm.places.length) err(where, 'places に重複があります');
      if (fm.tags.length === 0 && fm.places.length === 0 && !fm.series)
        warn(where, 'タグも場所も連載もないため、探索ホームで他の記事とつながりません');

      if (fm.legacyId !== undefined) {
        if (legacyIds.has(fm.legacyId)) err(where, `legacyId ${fm.legacyId} が ${legacyIds.get(fm.legacyId)} と重複しています`);
        legacyIds.set(fm.legacyId, where);
      }
      if (fm.series) {
        used.series.add(fm.series.id);
        const key = `${fm.series.id}#${fm.series.order}`;
        if (seriesOrders.has(key)) err(where, `連載 ${fm.series.id} の order ${fm.series.order} が ${seriesOrders.get(key)} と重複しています`);
        seriesOrders.set(key, where);
      }
      if (fm.cover && !/^https?:\/\//.test(fm.cover.src) && !existsSync(join(dirname(file), fm.cover.src))) {
        err(where, `cover.src のファイルが見つかりません: ${fm.cover.src}`);
      }
      if (fm.updatedAt && fm.updatedAt < fm.publishedAt) err(where, 'updatedAt が publishedAt より前です');
    }

    try {
      await compile(content, { remarkPlugins });
    } catch (e) {
      err(where, `MDX のコンパイルに失敗しました: ${(e as Error).message}`);
    }
  }

  // 未使用のマスタ（エラーではなく警告）
  const unused = (label: string, ids: string[], set: Set<string>) => {
    const xs = ids.filter((i) => !set.has(i));
    if (xs.length) warn(label, `記事から参照されていません: ${xs.join(', ')}`);
  };
  unused('categories', categories.map((c) => c.id), used.category);
  unused('tags', tags.map((t) => t.id), used.tag);
  unused('series', series.map((s) => s.id), used.series);

  // 探索ホームのレイアウト（記事に不備があるとモデルが作れないので、記事エラーがないときだけ）
  if (errors.length === 0) {
    try {
      assertLayout(buildExploreModel());
    } catch (e) {
      err('explore', (e as Error).message);
    }
  }

  // ---- 結果 ----

  warnings.forEach((w) => console.warn(`⚠ ${w}`));
  if (errors.length) {
    errors.forEach((e) => console.error(`✗ ${e}`));
    console.error(`\n${errors.length} 件のエラー`);
    process.exit(1);
  }
  console.log(`✓ 記事 ${articles.length} 件 / 場所 ${places.length} 件 / タグ ${tags.length} 件 を検証しました`);
};

await main();
