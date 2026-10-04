'use client';

import { useLayoutEffect, type RefObject } from 'react';
import type { View } from './use-explore-state';

// レベル間の遷移を WAAPI（element.animate）で行う。
// 方針：動かすのは transform と opacity だけ。退場する面と入場する面の 2 枚と、タップした要素だけを動かす。
// 計測（getBoundingClientRect）は遷移ごとに 1 回。アニメーション中は will-change を付け、終わったら外す。

export const paneKeyOf = (view: View) =>
  view.level === 0 ? 'sky' : view.level === 1 ? `gallery:${view.category}` : 'book';

const EASE_ENTER = 'cubic-bezier(0.2, 0, 0, 1)';
const EASE_EXIT = 'cubic-bezier(0.3, 0, 1, 1)';
const EASE_LIFT = 'cubic-bezier(0.34, 1.3, 0.64, 1)';
const STAGGER_MS = 18;
const STAGGER_MAX = 12;

type Ctx = {
  stage: HTMLElement;
  from: View;
  to: View;
  fromPane: HTMLElement;
  toPane: HTMLElement;
  anims: Animation[];
};

const run = (anims: Animation[], el: Element | null | undefined, keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
  if (!el) return;
  anims.push(el.animate(keyframes, options));
};

/** 要素の中心を、基準要素の左上からの座標で返す（transform-origin 用） */
const originOf = (el: Element, base: Element) => {
  const r = el.getBoundingClientRect();
  const b = base.getBoundingClientRect();
  return `${r.left + r.width / 2 - b.left}px ${r.top + r.height / 2 - b.top}px`;
};

/** from の矩形から to の矩形へ重ねるための transform（to を基準） */
const flipTransform = (from: Element, to: Element) => {
  const f = from.getBoundingClientRect();
  const t = to.getBoundingClientRect();
  if (!t.width || !t.height) return null;
  return `perspective(900px) translate(${f.left - t.left}px, ${f.top - t.top}px) scale(${f.width / t.width}, ${f.height / t.height}) rotateY(24deg)`;
};

const byFocusId = (root: Element, id: string) => root.querySelector<HTMLElement>(`[data-focus-id="${CSS.escape(id)}"]`);

// ---- 遷移ごとの振り付け ----

const zoomIn = ({ from, to, fromPane, toPane, anims }: Ctx) => {
  if (to.level !== 1) return;
  const constellation = byFocusId(fromPane, to.category);
  if (constellation) fromPane.style.transformOrigin = originOf(constellation, fromPane);
  run(anims, fromPane, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.6)', opacity: 0 }], {
    duration: 280,
    easing: EASE_EXIT,
    fill: 'forwards',
  });
  toPane.scrollTop = 0;
  run(anims, toPane, [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], {
    duration: 420,
    delay: 80,
    easing: EASE_ENTER,
    fill: 'backwards',
  });
  const cards = [...toPane.querySelectorAll<HTMLElement>('[data-stagger]')].slice(0, STAGGER_MAX);
  cards.forEach((card, i) =>
    run(anims, card, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], {
      duration: 240,
      delay: 80 + i * STAGGER_MS,
      easing: EASE_ENTER,
      fill: 'backwards',
    }),
  );
  void from;
};

const zoomOut = ({ from, fromPane, toPane, anims }: Ctx) => {
  if (from.level !== 1) return;
  run(anims, fromPane, [{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: EASE_EXIT, fill: 'forwards' });
  const constellation = byFocusId(toPane, from.category);
  if (constellation) toPane.style.transformOrigin = originOf(constellation, toPane);
  run(anims, toPane, [{ transform: 'scale(1.6)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], {
    duration: 320,
    easing: EASE_ENTER,
  });
};

const lift = ({ to, fromPane, toPane, anims }: Ctx) => {
  if (to.level !== 2) return;
  const card = byFocusId(fromPane, to.slug);
  const cover = toPane.querySelector<HTMLElement>('.cover');
  const start = card && cover ? flipTransform(card, cover) : null;
  if (cover && start) {
    cover.style.transformOrigin = 'top left';
    run(anims, cover, [{ transform: start }, { transform: 'none' }], { duration: 360, easing: EASE_LIFT });
    // 表紙が飛び立つ間、元のカードは隠す（終わるとギャラリーごと hidden になる）
    run(anims, card, [{ opacity: 0 }, { opacity: 0 }], { duration: 360, fill: 'none' });
  } else {
    run(anims, cover, [{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: EASE_ENTER });
  }
  run(anims, fromPane, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.96)' }], {
    duration: 360,
    easing: EASE_EXIT,
    fill: 'forwards',
  });
  run(anims, toPane.querySelector('.related'), [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], {
    duration: 280,
    delay: 200,
    easing: EASE_ENTER,
    fill: 'backwards',
  });
};

const putBack = ({ from, fromPane, toPane, anims }: Ctx) => {
  if (from.level !== 2) return;
  const card = byFocusId(toPane, from.slug);
  const cover = fromPane.querySelector<HTMLElement>('.cover');
  const end = card && cover ? flipTransform(card, cover) : null;
  if (cover && end) {
    cover.style.transformOrigin = 'top left';
    run(anims, cover, [{ transform: 'none', opacity: 1 }, { transform: end, opacity: 0.6 }], {
      duration: 300,
      easing: EASE_EXIT,
      fill: 'forwards',
    });
    run(anims, card, [{ opacity: 0, offset: 0 }, { opacity: 0, offset: 0.8 }, { opacity: 1, offset: 1 }], { duration: 320 });
  }
  run(anims, fromPane.querySelector('.related'), [{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: EASE_EXIT, fill: 'forwards' });
  run(anims, toPane, [{ opacity: 0, transform: 'scale(0.96)' }, { opacity: 1, transform: 'none' }], {
    duration: 320,
    easing: EASE_ENTER,
  });
};

const swap = ({ toPane, anims }: Ctx) => {
  run(anims, toPane.querySelector('.book-inner'), [{ opacity: 0, transform: 'translateX(24px)' }, { opacity: 1, transform: 'none' }], {
    duration: 280,
    easing: EASE_ENTER,
  });
};

const crossfade = ({ fromPane, toPane, anims }: Ctx, duration: number) => {
  if (fromPane !== toPane) run(anims, fromPane, [{ opacity: 1 }, { opacity: 0 }], { duration, easing: 'linear', fill: 'forwards' });
  run(anims, toPane, [{ opacity: 0 }, { opacity: 1 }], { duration, easing: 'linear' });
};

export function useLevelTransition({
  stageRef,
  view,
  exiting,
  settle,
}: {
  stageRef: RefObject<HTMLElement | null>;
  view: View;
  exiting: View | null;
  settle: () => void;
}) {
  useLayoutEffect(() => {
    if (!exiting) return;
    const stage = stageRef.current;
    const fromPane = stage?.querySelector<HTMLElement>(`[data-pane-key="${paneKeyOf(exiting)}"]`);
    const toPane = stage?.querySelector<HTMLElement>(`[data-pane-key="${paneKeyOf(view)}"]`);
    if (!stage || !fromPane || !toPane) {
      settle();
      return;
    }

    const ctx: Ctx = { stage, from: exiting, to: view, fromPane, toPane, anims: [] };
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fromL = exiting.level;
    const toL = view.level;

    stage.style.pointerEvents = 'none';
    fromPane.style.willChange = toPane.style.willChange = 'transform, opacity';

    if (reduce) crossfade(ctx, 150);
    else if (fromL === 0 && toL === 1) zoomIn(ctx);
    else if (fromL === 1 && toL === 0) zoomOut(ctx);
    else if (fromL === 1 && toL === 2) lift(ctx);
    else if (fromL === 2 && toL === 1) putBack(ctx);
    else if (fromL === 2 && toL === 2) swap(ctx);
    else crossfade(ctx, 200);

    let cancelled = false;
    const finish = () => {
      if (cancelled) return;
      stage.style.pointerEvents = '';
      fromPane.style.willChange = toPane.style.willChange = '';
      fromPane.style.transformOrigin = toPane.style.transformOrigin = '';
      // fill: forwards の退場アニメーションを解放する（面は hidden になるので見た目は変わらない）
      ctx.anims.forEach((a) => a.cancel());
      settle();
    };
    Promise.all(ctx.anims.map((a) => a.finished.catch(() => {}))).then(finish);

    return () => {
      cancelled = true;
      stage.style.pointerEvents = '';
      fromPane.style.willChange = toPane.style.willChange = '';
      ctx.anims.forEach((a) => a.cancel());
    };
  }, [stageRef, view, exiting, settle]);
}
