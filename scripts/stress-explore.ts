// 記事が 100 本以上に増えたときにモデルの生成とレイアウト検証が成立するかを確かめる。
// 実行: npm run explore:stress
import { getArticles, type Article } from '../src/lib/content';
import { assertLayout, buildExploreModel } from '../src/lib/explore';

const CATEGORY_IDS = ['architecture', 'film', 'attraction', 'game', 'other', 'character', 'show-parade', 'food-goods'];
const base = getArticles();

// 既存記事を素材に 100 本の擬似記事を作る（連載なし）
const fakes: Article[] = Array.from({ length: 100 }, (_, i) => {
  const src = base[i % base.length];
  return {
    ...src,
    slug: `${src.slug}-x${i}`,
    title: `${src.title}${i % 3 === 0 ? `と${i + 1}の話` : ''}`,
    category: CATEGORY_IDS[i % CATEGORY_IDS.length],
    series: undefined,
    publishedAt: new Date(2024, 0, 1 + i),
  };
});

const model = buildExploreModel([...base, ...fakes]);
assertLayout(model);

console.log(`記事 ${base.length + fakes.length} 本 / 星座 ${model.sky.constellations.length} 個`);
for (const g of Object.values(model.galleries)) {
  console.log(`  ${g.categoryId.padEnd(12)} ${String(g.slugs.length).padStart(3)} 冊`);
}
console.log('✓ 100 本相当でもレイアウト検証を通過');
