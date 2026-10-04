// 記事が 100 本以上に増えたときに本棚の折り返しとレイアウト検証が成立するかを確かめる。
// 実行: npm run explore:stress
import { getArticles, type Article } from '../src/lib/content';
import { assertLayout, buildExploreModel, SHELF_WIDTH } from '../src/lib/explore';

const CATEGORY_IDS = ['architecture', 'film', 'attraction', 'game', 'other', 'character', 'show-parade', 'food-goods'];
const base = getArticles();

// 既存記事を素材に 100 本の擬似記事を作る（題は 20 文字以内、連載なし）
const fakes: Article[] = Array.from({ length: 100 }, (_, i) => {
  const src = base[i % base.length];
  const title = [...`${src.title}${i % 3 === 0 ? `と${i + 1}の話` : ''}`].slice(0, 20).join('');
  return {
    ...src,
    slug: `${src.slug}-x${i}`,
    title,
    category: CATEGORY_IDS[i % CATEGORY_IDS.length],
    series: undefined,
    publishedAt: new Date(2024, 0, 1 + i),
  };
});

const model = buildExploreModel([...base, ...fakes]);
assertLayout(model);

console.log(`記事 ${base.length + fakes.length} 本 / 星座 ${model.sky.constellations.length} 個`);
for (const shelf of Object.values(model.shelves)) {
  const lines = shelf.rows.flatMap((r) => r.lines);
  const widest = Math.max(...lines.map((l) => l.reduce((w, s, i) => w + s.width + (i ? 2 : 0), 0)));
  const books = lines.reduce((n, l) => n + l.length, 0);
  console.log(
    `  ${shelf.categoryId.padEnd(12)} ${String(books).padStart(3)} 冊  段 ${shelf.rows.length}  行 ${lines.length}  最大行幅 ${widest}/${SHELF_WIDTH}  shelfBy=${shelf.shelfBy}`,
  );
}
console.log('✓ 100 本相当でもレイアウト検証を通過');
