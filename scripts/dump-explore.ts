// 探索モデルの中身を目視確認する。実行: npm run explore:dump
import { gzipSync } from 'node:zlib';
import { assertLayout, buildExploreModel } from '../src/lib/explore';

const model = buildExploreModel();
assertLayout(model);

console.log('■ 空（星座）');
for (const c of model.sky.constellations) {
  const strong = c.edges.filter((e) => e.w > 0).length;
  console.log(
    `  ${c.name.padEnd(9, '　')} ${String(c.stars.length).padStart(2)} 冊  中心 (${c.center.x}, ${c.center.y})  星座線 ${c.edges.length} 本（類似 ${strong} / 日付順 ${c.edges.length - strong}）`,
  );
}

console.log('\n■ 本棚');
for (const shelf of Object.values(model.shelves)) {
  const name = model.sky.constellations.find((c) => c.categoryId === shelf.categoryId)?.name;
  console.log(`  [${name}] shelfBy=${shelf.shelfBy} display=${shelf.display}`);
  for (const row of shelf.rows) {
    console.log(`    段「${row.label ?? '（ラベルなし）'}」`);
    row.lines.forEach((line, i) => {
      const titles = line.map((s) => `${model.articles[s.slug].title}(${s.width}/${s.height})`).join(' | ');
      console.log(`      行${i + 1}: ${titles}`);
    });
  }
}

console.log('\n■ 関連する本（例）');
for (const slug of ['splash-mountain', 'fantasia', 'kingdom-hearts-worlds']) {
  const list = model.related[slug] ?? [];
  console.log(`  ${model.articles[slug]?.title}: ${list.map((r) => `${model.articles[r.slug].title}(${r.score})`).join(', ') || 'なし'}`);
}

console.log('\n■ 新着:', model.newest.map((s) => model.articles[s].title).join(' / '));

const json = JSON.stringify(model);
console.log(`\n■ サイズ: ${(json.length / 1024).toFixed(1)} KB / gzip ${(gzipSync(json).length / 1024).toFixed(1)} KB`);
