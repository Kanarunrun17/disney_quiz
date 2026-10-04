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
  /** 旧サイトの ID（`#/trivia/<id>` からの転送用） */
  legacyId?: number;
};

/** 1 カテゴリの本の並び（浮かぶカードの順）。連載は順番どおり、それ以外はパークでまとめた上で関連の強い本が隣になる */
export type Gallery = { categoryId: string; slugs: string[] };

export type RelatedBook = { slug: string; score: number; categoryId: string };

export type ExploreModel = {
  version: 2;
  sky: { box: { w: number; h: number }; constellations: Constellation[] };
  articles: Record<string, ArticleNode>;
  galleries: Record<string, Gallery>;
  related: Record<string, RelatedBook[]>;
  newest: string[];
};
