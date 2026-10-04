import { categories, getParkOf, tags as tagMaster, type Category } from '@content';
import { getArticles, getSeries, scoreRelation, type Article } from '@/lib/content';
import type {
  ArticleNode,
  Constellation,
  ConstellationEdge,
  ExploreModel,
  RelatedBook,
  Shelf,
  ShelfBy,
  ShelfRow,
  Spine,
  Star,
  Vec,
} from './explore-types';

// 探索ホームのモデルをビルド時に計算する（サーバー専用。乱数は seed 固定で毎回同じ結果になる）。
// 数値の根拠は docs/content-model.md と Issue #4 を参照。

export const SKY_BOX = { w: 390, h: 560 } as const;
export const SHELF_WIDTH = 320; // 1 行に並べられる背表紙の合計幅
const CONSTELLATION_RADIUS = 48; // タップ領域（96×96 セル）
const STAR_FIELD_RADIUS = 40; // 星を散らす半径
const STAR_MIN_DIST = 14;
const SPINE_GAP = 2;
const NEWEST_COUNT = 5;
const RELATED_COUNT = 3;
const PARK_SHELF_RATIO = 0.6; // この割合以上の記事がパークを持てば、段をパークで分ける
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

// ---- 本棚 ----

// 縦書き 13px は 1 文字およそ 13.5px。高さ 160 の背表紙に 1 列で収まるのは 10 文字まで
const SPINE_SINGLE_COLUMN_CHARS = 10;
export const SPINE_MAX_CHARS = SPINE_SINGLE_COLUMN_CHARS * 2;

const spineOf = (a: Article): Spine => ({
  slug: a.slug,
  width: [...a.title].length <= SPINE_SINGLE_COLUMN_CHARS ? 44 : 88,
  height: a.readingMinutes <= 2 ? 160 : a.readingMinutes <= 4 ? 176 : 192,
});

/** 幅 320 に収まるように背表紙を行に折り返す */
const packLines = (spines: Spine[]): Spine[][] => {
  const lines: Spine[][] = [];
  let line: Spine[] = [];
  let width = 0;
  for (const s of spines) {
    const next = width + (line.length ? SPINE_GAP : 0) + s.width;
    if (line.length && next > SHELF_WIDTH) {
      lines.push(line);
      line = [];
      width = 0;
    }
    line.push(s);
    width += (line.length > 1 ? SPINE_GAP : 0) + s.width;
  }
  if (line.length) lines.push(line);
  return lines;
};

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

const parkLabel = (parkIds: string[], hasPlaces: boolean) => {
  if (parkIds.length > 1) return 'リゾート';
  if (parkIds[0] === 'tdl') return 'ランド';
  if (parkIds[0] === 'tds') return 'シー';
  return hasPlaces ? 'リゾート' : 'ほか';
};
const PARK_LABEL_ORDER = ['ランド', 'シー', 'リゾート', 'ほか'];

const parkIdsOf = (a: Article) => [...new Set(a.places.map((p) => getParkOf(p)?.id).filter((id): id is string => !!id))];

const decideShelfBy = (categoryId: string, articles: Article[]): ShelfBy => {
  const override = (categories as readonly Category[]).find((c) => c.id === categoryId)?.shelfBy;
  if (override) return override;
  // 連載は冊数にかかわらず順番で並べる
  if (articles.every((a) => a.series)) return 'series';
  if (articles.length <= 3) return 'none';
  const withPark = articles.filter((a) => parkIdsOf(a).length > 0).length;
  if (withPark / articles.length >= PARK_SHELF_RATIO) return 'park';
  return 'none';
};

const buildShelf = (categoryId: string, articles: Article[]): Shelf => {
  const shelfBy = decideShelfBy(categoryId, articles);
  const display = articles.length <= 3 ? 'face-out' : 'spines';

  const rowsFromGroups = (groups: Map<string, Article[]>, order: (a: string, b: string) => number): ShelfRow[] =>
    [...groups.entries()]
      .sort(([a], [b]) => order(a, b))
      .map(([label, items]) => ({ label, lines: packLines(chainBySimilarity(items).map(spineOf)) }));

  let rows: ShelfRow[];
  if (shelfBy === 'park') {
    const groups = new Map<string, Article[]>();
    for (const a of articles) {
      const label = parkLabel(parkIdsOf(a), a.places.length > 0);
      groups.set(label, [...(groups.get(label) ?? []), a]);
    }
    rows = rowsFromGroups(groups, (a, b) => PARK_LABEL_ORDER.indexOf(a) - PARK_LABEL_ORDER.indexOf(b));
  } else if (shelfBy === 'series') {
    const groups = new Map<string, Article[]>();
    for (const a of articles) {
      const label = getSeries(a.series!.id)?.name ?? a.series!.id;
      groups.set(label, [...(groups.get(label) ?? []), a]);
    }
    rows = [...groups.entries()].map(([label, items]) => ({
      label,
      lines: packLines([...items].sort((a, b) => a.series!.order - b.series!.order).map(spineOf)),
    }));
  } else if (shelfBy === 'tag') {
    // 最初のテーマタグで段を分ける。タグのない本は「ほか」
    const groups = new Map<string, Article[]>();
    for (const a of articles) {
      const tagId = a.tags.find((t) => tagMaster.find((m) => m.id === t)?.kind === 'topic');
      const label = tagId ? (tagMaster.find((m) => m.id === tagId)?.name ?? tagId) : 'ほか';
      groups.set(label, [...(groups.get(label) ?? []), a]);
    }
    rows = rowsFromGroups(groups, (a, b) => (a === 'ほか' ? 1 : 0) - (b === 'ほか' ? 1 : 0) || a.localeCompare(b, 'ja'));
  } else {
    rows = [{ lines: packLines(chainBySimilarity(articles).map(spineOf)) }];
  }

  return { categoryId, shelfBy, display, rows };
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

export const buildExploreModel = (): ExploreModel => {
  const all = getArticles();
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

  const shelves: Record<string, Shelf> = {};
  for (const [categoryId, items] of groups) shelves[categoryId] = buildShelf(categoryId, items);

  const related: Record<string, RelatedBook[]> = {};
  for (const a of all) related[a.slug] = relatedOf(a, all);

  return {
    version: 1,
    sky: { box: { ...SKY_BOX }, constellations: buildConstellations(groups) },
    articles,
    shelves,
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

  const shelved = new Map<string, number>();
  for (const shelf of Object.values(model.shelves)) {
    for (const row of shelf.rows) {
      for (const line of row.lines) {
        const width = line.reduce((w, s, i) => w + s.width + (i ? SPINE_GAP : 0), 0);
        if (width > SHELF_WIDTH) errors.push(`${shelf.categoryId}: 段「${row.label ?? ''}」の行幅 ${width} が ${SHELF_WIDTH} を超えています`);
        for (const s of line) shelved.set(s.slug, (shelved.get(s.slug) ?? 0) + 1);
      }
    }
  }
  for (const slug of slugs) {
    const n = shelved.get(slug) ?? 0;
    if (n !== 1) errors.push(`${slug}: 本棚に ${n} 回登場しています（1 回のはず）`);
    const len = [...model.articles[slug].title].length;
    if (len > SPINE_MAX_CHARS) errors.push(`${slug}: 題が ${len} 文字で背表紙に収まりません（${SPINE_MAX_CHARS} 文字まで）`);
  }

  for (const [slug, books] of Object.entries(model.related)) {
    for (const b of books) if (!slugs.has(b.slug)) errors.push(`${slug}: 関連本 ${b.slug} の記事がありません`);
  }
  for (const slug of model.newest) if (!slugs.has(slug)) errors.push(`新着 ${slug} の記事がありません`);

  if (errors.length) throw new Error(`探索モデルのレイアウトに問題があります:\n  ${errors.join('\n  ')}`);
};
