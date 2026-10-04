'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, type CSSProperties, type WheelEvent as ReactWheelEvent } from 'react';
import type { Constellation, ExploreModel, Gallery } from '@/lib/explore-types';
import { Motif } from './motifs';

// L1 ギャラリー：カテゴリの記事がカード（題・要約）になり、3 段のグリッドで球面状に並んで右へ流れ続ける。
// スクロール（横スワイプ・ホイール）で動かせる。輪が途切れないよう、少ないカテゴリではカードを繰り返す。
// カードは本物の記事リンクで、JS があればクリックを横取りして L2 へ。

const CELL = 190; // グリッドの 1 マス
const GAP = 16;
const MIN_COLS = 10; // 複数段のときに輪を閉じる列数（36° 刻み）
const MIN_COLS_SINGLE = 6; // 1 段のときの最小列数（60° 刻み。少ない冊数で重複を増やさない）
const ROW_TILT_DEG = 8; // 上下の段のわずかな傾き
const DRIFT_DEG_PER_S = 5; // 右へ流れる速さ
const RESUME_AFTER_MS = 2000; // 触ってからこの時間は流れを止める
const PERIODS = 3; // スクロール領域に輪を何周ぶん用意するか（中央の 1 周を使い、端に寄ったら 1 周ぶん戻す）
const DESKTOP_SCALE = 1.3;

type Layout = { rows: number; cols: number; step: number; radius: number; circumference: number; ringHeight: number };

const layoutOf = (count: number): Layout => {
  // 段数は、同じカードが画面に同時に 2 枚見えないよう、列が十分に取れる範囲で増やす
  const rows = count >= 24 ? 3 : count >= 10 ? 2 : 1;
  const cols = Math.max(Math.ceil(count / rows), rows === 1 ? MIN_COLS_SINGLE : MIN_COLS);
  const step = 360 / cols;
  // 隣のマスが重ならない半径（弦の長さがマス＋隙間になる）
  const radius = Math.max(300, (CELL + GAP) / (2 * Math.sin(((step / 2) * Math.PI) / 180)));
  return { rows, cols, step, radius, circumference: 2 * Math.PI * radius, ringHeight: rows * CELL + (rows - 1) * GAP };
};

// 題から決定的にカードの形と色調を選ぶ（動画のように大きさと色がまちまちに見えるように）
const hashOf = (s: string) => {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.codePointAt(0)!, 16777619);
  return h >>> 0;
};
const SHAPES = ['card-portrait', 'card-square', 'card-landscape'] as const;
const TONES = ['tone-pastel', 'tone-paper', 'tone-ink'] as const;

const PARK_NAMES: Record<string, string> = { tdl: 'ランド', tds: 'シー' };

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
  const count = gallery.slugs.length;
  const layout = useMemo(() => layoutOf(count), [count]);
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLUListElement>(null);
  const state = useRef({ started: false, lastInteract: -Infinity, focusTarget: null as number | null });
  const headingId = `gallery-${gallery.categoryId}`;

  // スクロール位置 → 輪の回転。右へ流れ続け、端に寄ったら 1 周ぶん戻して無限にする
  useEffect(() => {
    const stage = stageRef.current;
    const scroller = scrollerRef.current;
    const ring = ringRef.current;
    if (!active || !stage || !scroller || !ring) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const s = state.current;
    const C = layout.circumference;
    const home = C * (PERIODS / 2); // 回転 0 に対応するスクロール位置
    if (!s.started) {
      scroller.scrollLeft = home;
      s.started = true;
    }

    let scale = 1;
    const fit = () => {
      const max = window.matchMedia('(min-width: 768px)').matches ? DESKTOP_SCALE : 1;
      scale = Math.min(max, Math.max(0.7, (stage.clientHeight - 32) / layout.ringHeight));
    };
    fit();
    window.addEventListener('resize', fit);

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      let x = scroller.scrollLeft;
      // 中央の 1 周から外れたら、見た目を変えずに 1 周ぶん戻す
      if (x < home - C / 2) x += C;
      else if (x > home + C / 2) x -= C;
      if (s.focusTarget !== null) {
        x += (s.focusTarget - x) * Math.min(1, dt * 8);
        if (Math.abs(s.focusTarget - x) < 0.5) {
          x = s.focusTarget;
          s.focusTarget = null;
        }
      } else if (!reduce && now - s.lastInteract > RESUME_AFTER_MS) {
        x -= (C * DRIFT_DEG_PER_S * dt) / 360; // 右へ流れる＝左へスクロール
      }
      if (Math.abs(x - scroller.scrollLeft) >= 0.01) scroller.scrollLeft = x;
      const phi = -((scroller.scrollLeft - home) / C) * 360;
      ring.style.transform = `scale(${scale}) translateZ(${-layout.radius}px) rotateY(${phi.toFixed(3)}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', fit);
    };
  }, [active, layout]);

  const touched = (at: number) => {
    state.current.lastInteract = at;
    state.current.focusTarget = null;
  };
  // PC の縦ホイールも横の移動にする（横トラックパッドはそのままネイティブにスクロールされる）
  const onWheel = (e: ReactWheelEvent) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) scroller.scrollLeft += e.deltaY;
    touched(e.timeStamp);
  };
  // キーボードでカードにフォーカスしたら、そのカードを正面へ
  const focusCard = (angle: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const C = layout.circumference;
    const home = C * (PERIODS / 2);
    // 回転 -angle に対応するスクロール位置のうち、今の位置に最も近いもの
    let target = home + (angle / 360) * C;
    while (target - scroller.scrollLeft > C / 2) target -= C;
    while (target - scroller.scrollLeft < -C / 2) target += C;
    state.current.focusTarget = target;
  };

  // マス目を列優先で埋め、足りない分は先頭から繰り返す（重複は支援技術からは隠す）
  const slots = Array.from({ length: layout.cols * layout.rows }, (_, i) => {
    const col = Math.floor(i / layout.rows);
    const row = i % layout.rows;
    return { slug: gallery.slugs[i % count], col, row, duplicate: i >= count };
  });

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
        <span className="gallery-count">{count}冊</span>
      </h2>

      <div className="gallery-stage" ref={stageRef}>
        <div
          className="gallery-scroller"
          ref={scrollerRef}
          onWheel={onWheel}
          onPointerDown={(e) => touched(e.timeStamp)}
          onTouchMove={(e) => touched(e.timeStamp)}
        >
          <div className="gallery-track" style={{ width: `${Math.round(layout.circumference * PERIODS)}px` }} aria-hidden="true" />
          <ul
            ref={ringRef}
            className="gallery-ring"
            role="list"
            style={{ '--cell': `${CELL}px`, '--radius': `${layout.radius}px` } as CSSProperties}
          >
            {slots.map(({ slug, col, row, duplicate }, i) => {
              const a = model.articles[slug];
              const angle = col * layout.step;
              const rowY = (row - (layout.rows - 1) / 2) * (CELL + GAP);
              const tilt = layout.rows === 1 ? 0 : -(row - (layout.rows - 1) / 2) * ROW_TILT_DEG;
              const h = hashOf(slug);
              const shape = SHAPES[h % SHAPES.length];
              const tone = TONES[(h >>> 3) % TONES.length];
              return (
                <li
                  key={`${slug}-${i}`}
                  className="gallery-slot"
                  style={{ '--angle': `${angle}deg`, '--row-y': `${rowY}px`, '--tilt': `${tilt}deg` } as CSSProperties}
                  aria-hidden={duplicate || undefined}
                >
                  <Link
                    href={a.href}
                    className={`card ${shape} ${tone}${a.isNew ? ' card-new' : ''}`}
                    data-slug={slug}
                    data-focus-id={duplicate ? undefined : slug}
                    data-stagger
                    tabIndex={duplicate ? -1 : undefined}
                    draggable={false}
                    onClick={(e) => e.currentTarget.setAttribute('data-selected', '')}
                    onFocus={() => focusCard(angle)}
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
      </div>
    </section>
  );
}
