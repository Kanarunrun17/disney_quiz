// 静的書き出し（out/）の検査。実行: npm run check:export（先に npm run build）
//  - ホームの HTML に全記事・全カテゴリのリンクが含まれているか（SEO / JS 無効時の保証）
//  - ホームが読み込む JS の合計（gzip）が予算内か
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import matter from 'gray-matter';

const JS_BUDGET_GZ = 216_000; // Next.js の基礎 ≈ 181KB + 探索ホームの追加分 ≤ 35KB

const html = readFileSync('out/index.html', 'utf8');
const errors = [];

// 公開記事の slug とカテゴリ
const dir = 'content/articles';
const articles = readdirSync(dir)
  .map((name) => {
    const full = join(dir, name);
    const file = statSync(full).isDirectory() ? join(full, 'index.mdx') : full;
    if (!existsSync(file) || !file.endsWith('.mdx')) return null;
    const { data } = matter(readFileSync(file, 'utf8'));
    return data.draft ? null : { slug: name.replace(/\.mdx$/, ''), category: data.category };
  })
  .filter(Boolean);

for (const a of articles) {
  if (!html.includes(`href="/trivia/${a.slug}"`)) errors.push(`記事リンクがありません: /trivia/${a.slug}`);
}
for (const id of new Set(articles.map((a) => a.category))) {
  if (!html.includes(`href="/categories/${id}"`)) errors.push(`カテゴリリンクがありません: /categories/${id}`);
}

// JS 予算
const scripts = [...new Set([...html.matchAll(/src="(\/_next\/static\/[^"]+\.js)"/g)].map((m) => m[1]))];
let total = 0;
for (const src of scripts) total += gzipSync(readFileSync(join('out', src))).length;
console.log(`ホームの JS: ${scripts.length} ファイル / ${(total / 1024).toFixed(1)} KB gz（予算 ${(JS_BUDGET_GZ / 1024).toFixed(0)} KB）`);
if (total > JS_BUDGET_GZ) errors.push(`JS が予算を超えています: ${total} > ${JS_BUDGET_GZ}`);

if (errors.length) {
  errors.forEach((e) => console.error(`✗ ${e}`));
  process.exit(1);
}
console.log(`✓ 記事 ${articles.length} 件・カテゴリ ${new Set(articles.map((a) => a.category)).size} 件のリンクを確認`);
