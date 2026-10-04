'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { Constellation, ExploreModel } from '@/lib/explore-types';

// L0 空：カテゴリの星座。星＝記事、線＝類似。ラベルは固定の 13px、位置と星だけが --u で拡大縮小する

function ConstellationArt({ c, model }: { c: Constellation; model: ExploreModel }) {
  const r = c.radius;
  const star = new Map(c.stars.map((s) => [s.slug, s]));
  const glowId = `glow-${c.categoryId}`;
  return (
    <svg className="constellation-art" viewBox={`${-r} ${-r} ${r * 2} ${r * 2}`} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={glowId}>
          <stop offset="0" stopColor={c.color} stopOpacity="0.55" />
          <stop offset="1" stopColor={c.color} stopOpacity="0" />
        </radialGradient>
      </defs>
      {c.edges.map((e) => {
        const a = star.get(e.a)!;
        const b = star.get(e.b)!;
        return (
          <line
            key={`${e.a}-${e.b}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            className={e.w > 0 ? 'constellation-edge' : 'constellation-edge constellation-edge-faint'}
          />
        );
      })}
      {c.stars.map((s) => {
        const isNew = model.articles[s.slug]?.isNew;
        return (
          <g key={s.slug} className={isNew ? 'star star-new' : 'star'}>
            <circle cx={s.x} cy={s.y} r={isNew ? 9 : 6} fill={`url(#${glowId})`} />
            <circle cx={s.x} cy={s.y} r={isNew ? 3 : 2.2} className="star-core" />
          </g>
        );
      })}
    </svg>
  );
}

export function SkyLevel({
  model,
  active,
  exiting,
  onSelect,
}: {
  model: ExploreModel;
  active: boolean;
  /** 退場アニメーション中は hidden にせず表示し続ける */
  exiting: boolean;
  onSelect: (categoryId: string) => void;
}) {
  const { box, constellations } = model.sky;
  return (
    <section
      className="explore-pane explore-sky"
      data-pane-key="sky"
      data-exiting={exiting || undefined}
      hidden={!active && !exiting}
      inert={!active}
      aria-labelledby="sky-heading"
      style={{ '--box-w': box.w, '--box-h': box.h } as CSSProperties}
    >
      <h2 id="sky-heading" className="sr-only" tabIndex={-1} data-pane-heading>
        カテゴリの星座
      </h2>
      <ul className="sky-field" role="list">
        {constellations.map((c) => (
          <li
            key={c.categoryId}
            className="sky-slot"
            style={{ '--x': c.center.x, '--y': c.center.y, '--c': c.color } as CSSProperties}
          >
            <Link
              href={c.href}
              className="constellation"
              data-focus-id={c.categoryId}
              onNavigate={(e) => {
                e.preventDefault();
                onSelect(c.categoryId);
              }}
            >
              <ConstellationArt c={c} model={model} />
              <span className="constellation-label">
                <span className="constellation-name">{c.name}</span>
                <span className="constellation-count" aria-label={`${c.stars.length}冊`}>
                  {c.stars.length}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
