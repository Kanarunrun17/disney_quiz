import { categories, getParkOf } from '@content';
import { getArticles, scoreRelation, type Article } from '@/lib/content';
import type { ArticleNode, Constellation, ConstellationEdge, ExploreModel, Gallery, RelatedBook, Star, Vec } from './explore-types';

// 探索ホームのモデルをビルド時に計算する（サーバー専用。乱数は seed 固定で毎回同じ結果になる）。
// 数値の根拠は Issue #4 を参照。

export const SKY_BOX = { w: 390, h: 560 } as const;
const CONSTELLATION_RADIUS = 48; // タップ領域（96×96 セル）
const STAR_FIELD_RADIUS = 40; // 星を散らす半径
const STAR_MIN_DIST = 14;
const NEWEST_COUNT = 5;
const RELATED_COUNT = 3;
const PARK_GROUP_RATIO = 0.6; // この割合以上の記事がパークを持てば、パークごとにまとめて並べる
const SEED = 20260929;

// 2-3-2 のハニカム（7 星座まで）。index 0 が中央＝最大カテゴリ、以降は左上から時計回り
const SLOTS_7: Vec[] = [
  { x: 195, y: 280 },
  { x: 135, y: 120 },
  { x: 255, y: 120 },
  { x: 315, y: 280 },
  { x: 255, y: 440 },
  { x: 135, y: 440 },
  { x: 75, y: 280 },
];
// 3-2-3（8 星座）。中央の 2 つから埋める
const SLOTS_8: Vec[] = [
  { x: 135, y: 280 },
  { x: 255, y: 280 },
  { x: 75, y: 110 },
  { x: 195, y: 110 },
  { x: 315, y: 110 },
  { x: 315, y: 450 },
  { x: 195, y: 450 },
  { x: 75, y: 450 },
];

const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const hashString = (s: string) => {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.codePointAt(0)!, 16777619);
  return h >>> 0;
};

const byNewest = (a: Article, b: Article) =>
  b.publishedAt.getTime() - a.publishedAt.getTime() || a.slug.localeCompare(b.slug);

// ---- 星座 ----

/** 半径内に最小間隔を保って星を散らす。入り切らなければ間隔を少しずつ詰める */
const scatterStars = (articles: Article[], rng: () => number): Star[] => {
  const stars: Star[] = [];
  let minDist = STAR_MIN_DIST;
  for (const article of articles) {
    let placed = false;
    for (let attempt = 0; attempt < 400 && !placed; attempt++) {
      if (attempt > 0 && attempt % 100 === 0) minDist *= 0.85;
      const angle = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * STAR_FIELD_RADIUS;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (stars.every((s) => Math.hypot(s.x - x, s.y - y) >= minDist)) {
        stars.push({ slug: article.slug, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
        placed = true;
      }
    }
    if (!placed) stars.push({ slug: article.slug, x: 0, y: 0 });
  }
  return stars;
};

/** 類似スコアの最大全域木。スコアが 0 で切れた部分は公開日順でつなぐ（必ず N−1 本になる） */
const spanningEdges = (articles: Article[]): ConstellationEdge[] => {
  const parent = new Map(articles.map((a) => [a.slug, a.slug]));
  const find = (s: string): string => {
    const p = parent.get(s)!;
    if (p === s) return s;
    const root = find(p);
    parent.set(s, root);
    return root;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return false;
    parent.set(ra, rb);
    return true;
  };

  const pairs: ConstellationEdge[] = [];
  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      const w = scoreRelation(articles[i], articles[j]) - 0.5; // 同カテゴリの 0.5 点は全員同じなので除く
      if (w >= 1) pairs.push({ a: articles[i].slug, b: articles[j].slug, w });
    }
  }
  pairs.sort((x, y) => y.w - x.w || x.a.localeCompare(y.a) || x.b.localeCompare(y.b));

  const edges = pairs.filter((e) => union(e.a, e.b));
  const sorted = [...articles].sort(byNewest);
  for (let i = 1; i < sorted.length; i++) {
    if (union(sorted[i - 1].slug, sorted[i].slug)) edges.push({ a: sorted[i - 1].slug, b: sorted[i].slug, w: 0 });
  }
  return edges;
};

const buildConstellations = (groups: Map<string, Article[]>): Constellation[] => {
  const nonEmpty = categories
    .filter((c) => (groups.get(c.id)?.length ?? 0) > 0)
    .sort((a, b) => groups.get(b.id)!.length - groups.get(a.id)!.length || a.order - b.order);
  if (nonEmpty.length > SLOTS_8.length) throw new Error(`星座は ${SLOTS_8.length} 個までです（現在 ${nonEmpty.length}）`);
  const slots = nonEmpty.length <= SLOTS_7.length ? SLOTS_7 : SLOTS_8;

  return nonEmpty.map((c, i) => {
    const articles = [...groups.get(c.id)!].sort(byNewest);
    return {
      categoryId: c.id,
      name: c.name,
      color: c.color,
      icon: c.icon,
      href: `/categories/${c.id}`,
      center: slots[i],
      radius: CONSTELLATION_RADIUS,
      stars: scatterStars(articles, mulberry32(SEED ^ hashString(c.id))),
      edges: spanningEdges(articles),
    };
  });
};

// ---- ギャラリー（カテゴリ内の並び順） ----

/** 関連の強い本が隣に並ぶように、最新の本から貪欲に最近傍をたどる */
const chainBySimilarity = (articles: Article[]): Article[] => {
  if (articles.length === 0) return [];
  const rest = [...articles].sort(byNewest);
  const out = [rest.shift()!];
  while (rest.length) {
    const last = out[out.length - 1];
    let best = 0;
    for (let i = 1; i < rest.length; i++) {
      if (scoreRelation(last, rest[i]) > scoreRelation(last, rest[best])) best = i;
    }
    out.push(rest.splice(best, 1)[0]);
  }
  return out;
};

const parkIdsOf = (a: Article) => [...new Set(a.places.map((p) => getParkOf(p)?.id).filter((id): id is string => !!id))];

// 並べる順：ランド → シー → 両パーク／リゾート → 場所なし
const parkGroupOf = (a: Article) => {
  const parks = parkIdsOf(a);
  if (parks.length > 1) return 2;
  if (parks[0] === 'tdl') return 0;
  if (parks[0] === 'tds') return 1;
  return a.places.length > 0 ? 2 : 3;
};

const orderArticles = (articles: Article[]): Article[] => {
  if (articles.every((a) => a.series)) return [...articles].sort((a, b) => a.series!.order - b.series!.order);
  const withPark = articles.filter((a) => parkIdsOf(a).length > 0).length;
  if (articles.length > 3 && withPark / articles.length >= PARK_GROUP_RATIO) {
    const groups = new Map<number, Article[]>();
    for (const a of articles) groups.set(parkGroupOf(a), [...(groups.get(parkGroupOf(a)) ?? []), a]);
    return [...groups.entries()].sort(([a], [b]) => a - b).flatMap(([, items]) => chainBySimilarity(items));
  }
  return chainBySimilarity(articles);
};

// ---- 関連 ----

const relatedOf = (article: Article, all: Article[]): RelatedBook[] =>
  all
    .filter((a) => a.slug !== article.slug)
    .map((a) => ({ a, score: scoreRelation(article, a) }))
    .filter(({ score }) => score >= 1)
    .sort((x, y) => y.score - x.score || byNewest(x.a, y.a))
    .slice(0, RELATED_COUNT)
    .map(({ a, score }) => ({ slug: a.slug, score, categoryId: a.category }));

// ---- モデル ----

export const buildExploreModel = (all: Article[] = getArticles()): ExploreModel => {
  const groups = new Map<string, Article[]>();
  for (const a of all) groups.set(a.category, [...(groups.get(a.category) ?? []), a]);

  const newest = [...all].sort(byNewest).slice(0, NEWEST_COUNT).map((a) => a.slug);

  const articles: Record<string, ArticleNode> = {};
  for (const a of all) {
    articles[a.slug] = {
      slug: a.slug,
      title: a.title,
      description: a.description,
      categoryId: a.category,
      href: `/trivia/${a.slug}`,
      publishedAt: a.publishedAt.toISOString(),
      readingMinutes: a.readingMinutes,
      parkIds: parkIdsOf(a),
      isNew: newest.includes(a.slug),
      legacyId: a.legacyId,
    };
  }

  const galleries: Record<string, Gallery> = {};
  for (const [categoryId, items] of groups) galleries[categoryId] = { categoryId, slugs: orderArticles(items).map((a) => a.slug) };

  const related: Record<string, RelatedBook[]> = {};
  for (const a of all) related[a.slug] = relatedOf(a, all);

  return {
    version: 2,
    sky: { box: { ...SKY_BOX }, constellations: buildConstellations(groups) },
    articles,
    galleries,
    related,
    newest,
  };
};

/** レイアウトの破綻をビルド時に検出する。問題があれば全件をまとめて例外にする */
export const assertLayout = (model: ExploreModel): void => {
  const errors: string[] = [];
  const slugs = new Set(Object.keys(model.articles));
  const finite = (v: number) => Number.isFinite(v);

  const { constellations, box } = model.sky;
  for (const c of constellations) {
    if (!finite(c.center.x) || !finite(c.center.y)) errors.push(`${c.categoryId}: 中心座標が不正です`);
    if (c.center.x - c.radius < 0 || c.center.x + c.radius > box.w || c.center.y - c.radius < 0 || c.center.y + c.radius > box.h)
      errors.push(`${c.categoryId}: 星座が空からはみ出しています`);
    for (const s of c.stars) {
      if (!finite(s.x) || !finite(s.y)) errors.push(`${c.categoryId}: 星 ${s.slug} の座標が不正です`);
      if (Math.hypot(s.x, s.y) > STAR_FIELD_RADIUS + 0.5) errors.push(`${c.categoryId}: 星 ${s.slug} が半径を超えています`);
      if (!slugs.has(s.slug)) errors.push(`${c.categoryId}: 星 ${s.slug} の記事がありません`);
    }
    if (c.edges.length !== Math.max(0, c.stars.length - 1))
      errors.push(`${c.categoryId}: 星座線は ${c.stars.length - 1} 本のはずですが ${c.edges.length} 本です`);
  }
  for (let i = 0; i < constellations.length; i++) {
    for (let j = i + 1; j < constellations.length; j++) {
      const a = constellations[i];
      const b = constellations[j];
      const d = Math.hypot(a.center.x - b.center.x, a.center.y - b.center.y);
      if (d < a.radius + b.radius) errors.push(`${a.categoryId} と ${b.categoryId} の星座が重なっています（距離 ${d.toFixed(0)}）`);
    }
  }

  const seen = new Map<string, number>();
  for (const g of Object.values(model.galleries)) {
    for (const slug of g.slugs) {
      seen.set(slug, (seen.get(slug) ?? 0) + 1);
      if (model.articles[slug]?.categoryId !== g.categoryId) errors.push(`${slug}: ${g.categoryId} のギャラリーにありますがカテゴリが違います`);
    }
  }
  for (const slug of slugs) {
    const n = seen.get(slug) ?? 0;
    if (n !== 1) errors.push(`${slug}: ギャラリーに ${n} 回登場しています（1 回のはず）`);
  }

  for (const [slug, books] of Object.entries(model.related)) {
    for (const b of books) if (!slugs.has(b.slug)) errors.push(`${slug}: 関連本 ${b.slug} の記事がありません`);
  }
  for (const slug of model.newest) if (!slugs.has(slug)) errors.push(`新着 ${slug} の記事がありません`);

  if (errors.length) throw new Error(`探索モデルのレイアウトに問題があります:\n  ${errors.join('\n  ')}`);
};
