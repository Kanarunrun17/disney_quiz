// 探索ホームのモデル型。ビルド時に src/lib/explore.ts が生成し、クライアントの Explorer に props で渡す。
// クライアントからも import するため、この file は型のみ（ランタイムの import を持たない）。
// 座標の単位は 390px 幅のスマホを基準にした px。画面側で --u（倍率）を掛けて配置する。

export type Vec = { x: number; y: number };

export type Star = { slug: string; x: number; y: number }; // 星座の中心からの相対座標

/** 星座線＝類似グラフの最大全域木。w は類似スコア（0 は公開日順でつないだ補助線） */
export type ConstellationEdge = { a: string; b: string; w: number };

export type Constellation = {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  href: string; // /categories/[id]
  center: Vec;
  radius: number;
  stars: Star[];
  edges: ConstellationEdge[];
};

export type ArticleNode = {
  slug: string;
  title: string;
  description: string;
  categoryId: string;
  href: string; // /trivia/[slug]
  publishedAt: string; // ISO
  readingMinutes: number;
  parkIds: string[];
  isNew: boolean;
};

/** 背表紙。width は題の長さ（11 文字以下 44 / 12 文字以上 88）、height は読了分数（160 / 176 / 192） */
export type Spine = { slug: string; width: 44 | 88; height: 160 | 176 | 192 };

/** 棚の 1 段。ラベル（ランド／シーなど）と、幅 320 に収まるように折り返した行 */
export type ShelfRow = { label?: string; lines: Spine[][] };

export type ShelfBy = 'park' | 'series' | 'tag' | 'none';

export type Shelf = {
  categoryId: string;
  shelfBy: ShelfBy;
  /** spines: 背表紙を並べる / face-out: 3 冊以下は表紙を正面に向けた面陳列 */
  display: 'spines' | 'face-out';
  rows: ShelfRow[];
};

export type RelatedBook = { slug: string; score: number; categoryId: string };

export type ExploreModel = {
  version: 1;
  sky: { box: { w: number; h: number }; constellations: Constellation[] };
  articles: Record<string, ArticleNode>;
  shelves: Record<string, Shelf>;
  related: Record<string, RelatedBook[]>;
  newest: string[];
};
