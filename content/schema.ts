import { z } from 'zod';

// フレームワーク非依存のコンテンツスキーマ。
// Next.js 側のコンテンツローダー（Velite など）からもこのファイルを import して使う。
// 設計の背景は docs/content-model.md を参照。

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'kebab-case の英小文字・数字で指定してください');

// ---- マスタ ----

export const categorySchema = z.object({
  id,
  name: z.string().min(1),
  order: z.number().int(),
  // 探索ホームで使う幾何形の symbol id と、夜空の上での色（globals.css の --cat-* と一致させる）
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  // 本棚の段の分け方を自動判定から上書きする（未指定なら自動）
  shelfBy: z.enum(['park', 'series', 'tag']).optional(),
});

export const tagSchema = z.object({
  id,
  name: z.string().min(1),
  // work: 映画などの作品。記事が増えたら作品マスタに昇格させる候補
  kind: z.enum(['topic', 'work']),
});

export const seriesSchema = z.object({
  id,
  name: z.string().min(1),
  description: z.string().optional(),
});

export const placeKinds = [
  'resort',
  'park',
  'area',
  'attraction',
  'restaurant',
  'shop',
  'show',
  'landmark',
  'hotel',
  'facility',
] as const;

export const placeSchema = z.object({
  id,
  name: z.string().min(1),
  kind: z.enum(placeKinds),
  // resort 以外は必須。resort > park > area > 施設 の階層
  parent: id.optional(),
  // 自作イラストマップ上の位置（左上原点の %）。地図実装時に埋める
  mapPosition: z
    .object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) })
    .optional(),
  // 実座標（任意）
  geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
  status: z.enum(['operating', 'closed', 'upcoming']),
  // 検索用の別名・略称
  aliases: z.array(z.string()).optional(),
});

export type Category = z.input<typeof categorySchema>;
export type Tag = z.input<typeof tagSchema>;
export type Series = z.input<typeof seriesSchema>;
export type Place = z.input<typeof placeSchema>;
export type PlaceKind = (typeof placeKinds)[number];

// ---- 記事 ----

type MasterIds = {
  categoryIds: readonly string[];
  tagIds: readonly string[];
  placeIds: readonly string[];
  seriesIds: readonly string[];
};

const refOf = (ids: readonly string[], label: string) =>
  z.string().refine((v) => ids.includes(v), { error: (iss) => `未登録の${label}です: ${String(iss.input)}` });

/** frontmatter のスキーマ。マスタの ID 一覧を渡して参照整合性まで検証する */
export const createArticleSchema = (m: MasterIds) =>
  z
    .object({
      title: z.string().min(1),
      description: z.string().min(1).max(120),
      category: refOf(m.categoryIds, 'カテゴリ'),
      tags: z.array(refOf(m.tagIds, 'タグ')).default([]),
      places: z.array(refOf(m.placeIds, '場所')).default([]),
      series: z
        .object({ id: refOf(m.seriesIds, '連載'), order: z.number().int().positive() })
        .optional(),
      cover: z
        .object({ src: z.string().min(1), alt: z.string().min(1), credit: z.string().optional() })
        .optional(),
      sources: z.array(z.object({ title: z.string().min(1), url: z.url() })).default([]),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      legacyId: z.number().int().positive().optional(),
      draft: z.boolean().default(false),
    })
    .strict();

export type ArticleFrontmatter = z.output<ReturnType<typeof createArticleSchema>>;
