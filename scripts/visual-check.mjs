// 探索ホームの動作をブラウザで検査する。実行: npm run check:visual（先に npm run build）
// スクリーンショットは .artifacts/ に保存される。
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const PORT = 3999;
const BASE = `http://localhost:${PORT}`;
const OUT = '.artifacts';
const MIN_FONT_PX = 12;
mkdirSync(OUT, { recursive: true });

const failures = [];
const check = (ok, message) => {
  console.log(`${ok ? '✓' : '✗'} ${message}`);
  if (!ok) failures.push(message);
};

// 活性レベル内の見える文字が全て MIN_FONT_PX 以上か
const smallTexts = (page) =>
  page.evaluate((min) => {
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent.trim()) continue;
      const el = node.parentElement;
      if (!el || el.closest('[hidden], [inert], .sr-only')) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      const size = parseFloat(getComputedStyle(el).fontSize);
      if (size < min) out.push(`${node.textContent.trim().slice(0, 12)}…(${size}px)`);
    }
    return out;
  }, MIN_FONT_PX);

const level = (page) => page.evaluate(() => document.querySelector('.explore')?.dataset.level);
// レベルの切り替えと、入場アニメーションの完了を待つ（スクリーンショットが途中の状態にならないように）
const waitLevel = async (page, n) => {
  await page.waitForSelector(`.explore[data-level="${n}"][data-hydrated]`, { timeout: 5000 });
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))));
};

const serve = spawn('npx', ['-y', 'serve', 'out', '-l', String(PORT)], { stdio: 'ignore' });
try {
  for (let i = 0; i < 40; i++) {
    try {
      await fetch(BASE);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  const browser = await chromium.launch();

  // ---- スマホ ----
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  let page = await mobile.newPage();
  await page.goto(`${BASE}/`);
  await waitLevel(page, 0);
  check((await page.locator('.constellation:visible').count()) === 7, 'L0: 星座が 7 つ表示される');
  check((await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1)), 'L0: スクロールが発生しない');
  let small = await smallTexts(page);
  check(small.length === 0, `L0: 12px 未満の文字がない ${small.join(', ')}`);
  await page.screenshot({ path: `${OUT}/l0-mobile.png` });

  await page.locator('.constellation').first().click();
  await waitLevel(page, 1);
  const hash1 = await page.evaluate(() => location.hash);
  check(/^#[a-z-]+$/.test(hash1), `L1: ハッシュが #category になる (${hash1})`);
  check((await page.locator('.spine:visible').count()) > 0, 'L1: 背表紙が表示される');
  small = await smallTexts(page);
  check(small.length === 0, `L1: 12px 未満の文字がない ${small.join(', ')}`);
  await page.screenshot({ path: `${OUT}/l1-mobile.png` });

  await page.locator('.spine').first().click();
  await waitLevel(page, 2);
  const hash2 = await page.evaluate(() => location.hash);
  check(/^#[a-z-]+\/[a-z0-9-]+$/.test(hash2), `L2: ハッシュが #category/slug になる (${hash2})`);
  check(await page.locator('.cover').isVisible(), 'L2: 表紙が表示される');
  small = await smallTexts(page);
  check(small.length === 0, `L2: 12px 未満の文字がない ${small.join(', ')}`);
  await page.screenshot({ path: `${OUT}/l2-mobile.png` });

  // 戻るボタン
  await page.goBack();
  await waitLevel(page, 1);
  check((await level(page)) === '1', '戻る 1 回目で L1');
  await page.goBack();
  await waitLevel(page, 0);
  check((await level(page)) === '0' && (await page.evaluate(() => location.hash)) === '', '戻る 2 回目で L0、ハッシュなし');

  // 表紙 → 記事ページ → 戻ると L2
  await page.locator('.constellation').first().click();
  await waitLevel(page, 1);
  await page.locator('.spine').first().click();
  await waitLevel(page, 2);
  await page.locator('.cover').click();
  await page.waitForURL(/\/trivia\//, { timeout: 10000 });
  check(await page.locator('article h1').isVisible(), '表紙を押すと記事ページが開く');
  await page.goBack();
  await waitLevel(page, 2);
  check((await level(page)) === '2', '記事から戻ると L2 に復帰する');

  // ディープリンク・旧形式
  await page.goto(`${BASE}/#film`);
  await waitLevel(page, 1);
  check((await page.locator('.explore-sky').isHidden()), 'ディープリンク #film で L1 が開き、空は隠れる');
  await page.goto(`${BASE}/?c=attraction`);
  await waitLevel(page, 1);
  check((await page.evaluate(() => location.hash)) === '#attraction', '旧形式 ?c=attraction が #attraction に変換される');

  // キーボード
  await page.goto(`${BASE}/`);
  await waitLevel(page, 0);
  await page.locator('.constellation').first().focus();
  await page.keyboard.press('Enter');
  await waitLevel(page, 1);
  check(await page.evaluate(() => document.activeElement?.hasAttribute('data-pane-heading')), 'Enter で潜ると本棚の見出しにフォーカス');
  await page.keyboard.press('Escape');
  await waitLevel(page, 0);
  check(await page.evaluate(() => document.activeElement?.classList.contains('constellation')), 'Esc で戻ると元の星座にフォーカス');

  // reduced-motion
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${BASE}/`);
  await waitLevel(page, 0);
  await page.locator('.constellation').first().click();
  await waitLevel(page, 1);
  check((await page.evaluate(() => document.getAnimations().length)) === 0, 'reduced-motion でアニメーションが動かない');
  await mobile.close();

  // ---- デスクトップ ----
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  page = await desktop.newPage();
  await page.goto(`${BASE}/`);
  await waitLevel(page, 0);
  small = await smallTexts(page);
  check(small.length === 0, `PC L0: 12px 未満の文字がない ${small.join(', ')}`);
  await page.screenshot({ path: `${OUT}/l0-desktop.png` });
  await page.locator('.constellation').first().click();
  await waitLevel(page, 1);
  await page.screenshot({ path: `${OUT}/l1-desktop.png` });
  await page.locator('.spine').first().click();
  await waitLevel(page, 2);
  await page.screenshot({ path: `${OUT}/l2-desktop.png` });
  await desktop.close();

  await browser.close();
} finally {
  serve.kill();
}

if (failures.length) {
  console.error(`\n${failures.length} 件の失敗`);
  process.exit(1);
}
console.log('\nすべて通過。スクリーンショット: .artifacts/');
