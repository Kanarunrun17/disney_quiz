'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import type { Constellation, ExploreModel, Gallery } from '@/lib/explore-types';
import { Motif } from './motifs';

// L1 ギャラリー：カテゴリの記事がカード（題・要約）になって 3D の輪に浮かぶ。
// 冊数が多ければ輪が閉じてゆっくり流れ、少なければ正面の弧にゆれて止まる。指で回せる。
// カードは本物の記事リンクで、JS があればクリックを横取りして L2 へ。

const CARD_W = 150;
const CARD_H = 200;
const GAP = 16;
const STEP_MAX = 45; // 隣のカードとの角度（輪が閉じないときはこの間隔）
const FULL_MIN_COLS = 8; // この列数以上で輪が閉じる
const DRIFT_DEG_PER_S = 3; // 閉じた輪がひとりでに流れる速さ
const SWAY_DEG = 5; // 開いた弧のゆれ幅
const SWAY_PERIOD_S = 9;
const DRAG_DEG_PER_PX = 0.35;
const DRAG_THRESHOLD_PX = 6;
const RESUME_AFTER_MS = 2000;

type Layout = { rows: number; cols: number; full: boolean; step: number; radius: number };

const layoutOf = (count: number): Layout => {
  const rows = count <= 6 ? 1 : 2;
  const cols = Math.ceil(count / rows);
  const full = cols >= FULL_MIN_COLS;
  const step = full ? 360 / cols : STEP_MAX;
  // 隣のカードが重ならない半径（弦の長さがカード幅＋隙間になる）
  const radius = Math.max(240, (CARD_W + GAP) / (2 * Math.sin(((step / 2) * Math.PI) / 180)));
  return { rows, cols, full, step, radius };
};

const angleOf = (col: number, { cols, full, step }: Layout) => (full ? col * step : (col - (cols - 1) / 2) * step);
// 静止したときに正面に 1 枚来る回転角（列数が偶数だと 2 枚が中央をまたぐので半歩ずらす）
const restOf = ({ cols, full, step }: Layout) => (full || cols % 2 === 1 ? 0 : step / 2);

const PARK_NAMES: Record<string, string> = { tdl: 'ランド', tds: 'シー' };

type Drag = { x: number; phi: number; moved: boolean };

export function GalleryLevel({
  model,
  gallery,
  constellation,
  active,
  exiting,
  onSelect,
}: {
  model: ExploreModel;
  gallery: Gallery;
  constellation: Constellation;
  active: boolean;
  /** 退場アニメーション中は hidden にせず表示し続ける */
  exiting: boolean;
  onSelect: (slug: string) => void;
}) {
  const layout = useMemo(() => layoutOf(gallery.slugs.length), [gallery.slugs.length]);
  const ringRef = useRef<HTMLUListElement>(null);
  const state = useRef({ phi: restOf(layout), drag: null as Drag | null, lastInteract: -Infinity, interacted: false, focusTarget: null as number | null, swallowClick: false });
  const headingId = `gallery-${gallery.categoryId}`;
  const limit = layout.full ? Infinity : ((layout.cols - 1) / 2) * layout.step;
  const clamp = (v: number) => Math.max(-limit, Math.min(limit, v));

  // 回転のループ。閉じた輪は流れ、開いた弧は触られるまでゆれる。フォーカスしたカードは正面へ
  useEffect(() => {
    const ring = ringRef.current;
    if (!active || !ring) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const s = state.current;
    const rest = restOf(layout);
    // PC では輪ごと少し大きく見せる（CSS の --gallery-scale）
    const scale = parseFloat(getComputedStyle(ring).getPropertyValue('--gallery-scale')) || 1;
    let raf = 0;
    let last = performance.now();
    const t0 = last;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!s.drag) {
        if (s.focusTarget !== null) {
          s.phi += (s.focusTarget - s.phi) * Math.min(1, dt * 8);
          if (Math.abs(s.focusTarget - s.phi) < 0.05) {
            s.phi = s.focusTarget;
            s.focusTarget = null;
          }
        } else if (!reduce && now - s.lastInteract > RESUME_AFTER_MS) {
          if (layout.full) s.phi -= DRIFT_DEG_PER_S * dt;
          else if (!s.interacted) {
            const target = rest + SWAY_DEG * Math.sin(((now - t0) / 1000) * ((2 * Math.PI) / SWAY_PERIOD_S));
            s.phi += (target - s.phi) * Math.min(1, dt * 2);
          }
        }
      }
      ring.style.transform = `scale(${scale}) translateZ(${-layout.radius}px) rotateY(${s.phi.toFixed(3)}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, layout]);

  const onPointerDown = (e: ReactPointerEvent) => {
    const s = state.current;
    s.drag = { x: e.clientX, phi: s.phi, moved: false };
    s.lastInteract = performance.now();
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const s = state.current;
    if (!s.drag) return;
    const dx = e.clientX - s.drag.x;
    if (Math.abs(dx) > DRAG_THRESHOLD_PX) s.drag.moved = true;
    if (s.drag.moved) s.phi = clamp(s.drag.phi + dx * DRAG_DEG_PER_PX);
  };
  const onPointerEnd = () => {
    const s = state.current;
    if (!s.drag) return;
    s.swallowClick = s.drag.moved;
    s.interacted = s.interacted || s.drag.moved;
    s.drag = null;
    s.lastInteract = performance.now();
  };
  // 回した直後のクリックはカードの選択にしない
  const onClickCapture = (e: React.MouseEvent) => {
    const s = state.current;
    if (!s.swallowClick) return;
    s.swallowClick = false;
    e.preventDefault();
    e.stopPropagation();
  };
  // キーボードでカードにフォーカスしたら、そのカードを正面へ回す（時刻はイベントのものを使う）
  const focusCard = (angle: number, at: number) => {
    const s = state.current;
    let target = -angle;
    if (layout.full) {
      while (target - s.phi > 180) target -= 360;
      while (target - s.phi < -180) target += 360;
    }
    s.focusTarget = clamp(target);
    s.lastInteract = at;
    s.interacted = true;
  };

  return (
    <section
      id={gallery.categoryId}
      className="explore-pane explore-gallery"
      data-pane-key={`gallery:${gallery.categoryId}`}
      data-exiting={exiting || undefined}
      hidden={!active && !exiting}
      inert={!active}
      aria-labelledby={headingId}
      style={{ '--c': constellation.color } as CSSProperties}
    >
      <h2 id={headingId} className="gallery-title" tabIndex={-1} data-pane-heading>
        {constellation.name}
        <span className="gallery-count">{gallery.slugs.length}冊</span>
      </h2>

      <div
        className="gallery-stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onPointerLeave={onPointerEnd}
        onClickCapture={onClickCapture}
      >
        <ul
          ref={ringRef}
          className="gallery-ring"
          role="list"
          style={{ '--card-w': `${CARD_W}px`, '--card-h': `${CARD_H}px`, '--radius': `${layout.radius}px` } as CSSProperties}
        >
          {gallery.slugs.map((slug, i) => {
            const a = model.articles[slug];
            const col = Math.floor(i / layout.rows);
            const row = i % layout.rows;
            const angle = angleOf(col, layout);
            const rowY = layout.rows === 1 ? 0 : (row - 0.5) * (CARD_H + GAP);
            return (
              <li key={slug} className="gallery-slot" style={{ '--angle': `${angle}deg`, '--row-y': `${rowY}px` } as CSSProperties}>
                <Link
                  href={a.href}
                  className={a.isNew ? 'card card-new' : 'card'}
                  data-focus-id={slug}
                  data-stagger
                  draggable={false}
                  onFocus={(e) => focusCard(angle, e.timeStamp)}
                  onNavigate={(e) => {
                    e.preventDefault();
                    onSelect(slug);
                  }}
                >
                  <Motif icon={constellation.icon} className="card-motif" />
                  <span className="card-title">{a.title}</span>
                  <span className="card-desc">{a.description}</span>
                  <span className="card-meta">
                    {a.parkIds.map((id) => PARK_NAMES[id] ?? id).join('・')}
                    {a.parkIds.length > 0 && ' ・ '}約{a.readingMinutes}分
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
