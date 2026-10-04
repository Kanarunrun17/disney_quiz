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


// 表示中のギャラリーで、ステージの中央に最も近いカード（輪は回り続けるので force で押す。
// カードは繰り返し並ぶので、何番目かで特定する）
const centerCard = async (page) => {
  const index = await page.evaluate(() => {
    const stage = document.querySelector('.explore-gallery:not([hidden]) .gallery-stage').getBoundingClientRect();
    const cx = stage.left + stage.width / 2;
    const cy = stage.top + stage.height / 2;
    let best = 0;
    let bestD = Infinity;
    [...document.querySelectorAll('.explore-gallery:not([hidden]) .card')].forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      const d = Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  });
  return page.locator('.explore-gallery:not([hidden]) .card').nth(index);
};

const level = (page) => page.evaluate(() => document.querySelector('.explore')?.dataset.level);

// 星座ラベル同士の重なり（2px 以上）の数
const labelOverlaps = (page) =>
  page.evaluate(() => {
    const rects = [...document.querySelectorAll('.constellation-label')].map((el) => el.getBoundingClientRect());
    let n = 0;
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i];
        const b = rects[j];
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ox > 2 && oy > 2) n++;
      }
    }
    return n;
  });
// レベルの切り替えと、入場アニメーションの完了を待つ（スクリーンショットが途中の状態にならないように）
const waitLevel = async (page, n) => {
  await page.waitForSelector(`.explore[data-level="${n}"][data-hydrated]`, { timeout: 5000 });
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))));
  // 退場中の面が片付く（settle）まで待つ
  await page.waitForFunction(() => !document.querySelector('.explore-pane[data-exiting]'), null, { timeout: 5000 });
};
// 遷移が終わった後に動き続けているアニメーションがないか（will-change の付けっぱなしも含む）。
// クリック位置に残ったマウスの hover トランジションを拾わないよう、先にマウスをどかす
const settled = async (page) => {
  await page.mouse.move(2, 2);
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))));
  return page.evaluate(
    () =>
      document.getAnimations().filter((a) => a.playState === 'running').length === 0 &&
      !document.querySelector('.explore-pane[style*="will-change"]'),
  );
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
  check((await labelOverlaps(page)) === 0, 'L0: 星座のラベルが重ならない');
  check(await page.locator('.skyline').isVisible(), 'L0: スカイラインが表示される');
  check((await page.locator('canvas.stars').count()) === 1, 'L0: 星の canvas がある');
  let small = await smallTexts(page);
  check(small.length === 0, `L0: 12px 未満の文字がない ${small.join(', ')}`);
  await page.screenshot({ path: `${OUT}/l0-mobile.png` });

  await page.locator('.constellation').first().click();
  await waitLevel(page, 1);
  const hash1 = await page.evaluate(() => location.hash);
  check(/^#[a-z-]+$/.test(hash1), `L1: ハッシュが #category になる (${hash1})`);
  check((await page.locator('.explore-gallery:not([hidden]) .card').count()) > 0, 'L1: カードが表示される');
  // スクロールで回る（スクロール位置が輪の回転になる）
  const before = await page.evaluate(() => document.querySelector('.explore-gallery:not([hidden]) .gallery-ring').style.transform);
  await page.evaluate(() => {
    const el = document.querySelector('.explore-gallery:not([hidden]) .gallery-scroller');
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    el.scrollLeft += 160;
  });
  await page.waitForTimeout(120);
  const after = await page.evaluate(() => document.querySelector('.explore-gallery:not([hidden]) .gallery-ring').style.transform);
  check(before !== after, 'L1: スクロールでギャラリーが回る');
  check((await level(page)) === '1', 'L1: スクロールしてもレベルは変わらない');
  check(await settled(page), 'L1: 遷移後に動き続けるアニメーションがなく will-change が外れている');
  small = await smallTexts(page);
  check(small.length === 0, `L1: 12px 未満の文字がない ${small.join(', ')}`);
  await page.screenshot({ path: `${OUT}/l1-mobile.png` });

  await (await centerCard(page)).click({ force: true });
  await waitLevel(page, 2);
  const hash2 = await page.evaluate(() => location.hash);
  check(/^#[a-z-]+\/[a-z0-9-]+$/.test(hash2), `L2: ハッシュが #category/slug になる (${hash2})`);
  check(await page.locator('.cover').isVisible(), 'L2: 表紙が表示される');
  check(await settled(page), 'L2: 遷移後に動き続けるアニメーションがない');
  check(
    await page.evaluate(() => getComputedStyle(document.querySelector('.cover')).transform === 'none'),
    'L2: 表紙の transform が最終状態（none）に戻っている',
  );
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
  await (await centerCard(page)).click({ force: true });
  await waitLevel(page, 2);
  const vtSupported = await page.evaluate(() => {
    const original = document.startViewTransition?.bind(document);
    if (!original) return false;
    window.__vtCalls = 0;
    document.startViewTransition = (...args) => {
      window.__vtCalls++;
      return original(...args);
    };
    return true;
  });
  await page.locator('.cover').click();
  await page.waitForURL(/\/trivia\//, { timeout: 10000 });
  check(await page.locator('article h1').isVisible(), '表紙を押すと記事ページが開く');
  if (vtSupported) check((await page.evaluate(() => window.__vtCalls)) > 0, '表紙 → 記事で View Transition が起動する');
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))));
  await page.screenshot({ path: `${OUT}/article-mobile.png` });
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

  // ---- 背の低いスマホ（iPhone SE 相当） ----
  const short = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  page = await short.newPage();
  await page.goto(`${BASE}/`);
  await waitLevel(page, 0);
  check(await page.locator('.skyline').isHidden(), 'SE: スカイラインを畳む');
  check((await labelOverlaps(page)) === 0, 'SE: 星座のラベルが重ならない');
  check((await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1)), 'SE: スクロールが発生しない');
  await page.screenshot({ path: `${OUT}/l0-se.png` });
  await short.close();

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
  await (await centerCard(page)).click({ force: true });
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
