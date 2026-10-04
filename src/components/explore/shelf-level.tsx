'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { Constellation, ExploreModel, Shelf } from '@/lib/explore-types';

// L1 本棚：1 カテゴリ分。背表紙は本物の記事リンクで、JS があればクリックを横取りして L2 へ。
// 非活性のときも DOM には残す（hidden + inert）ので、検索エンジンと JS 無効時には普通のリンク一覧になる。

export function ShelfLevel({
  model,
  shelf,
  constellation,
  active,
  exiting,
  onSelect,
}: {
  model: ExploreModel;
  shelf: Shelf;
  constellation: Constellation;
  active: boolean;
  /** 退場アニメーション中は hidden にせず表示し続ける */
  exiting: boolean;
  onSelect: (slug: string) => void;
}) {
  const headingId = `shelf-${shelf.categoryId}`;
  const faceOut = shelf.display === 'face-out';
  return (
    <section
      id={shelf.categoryId}
      className="explore-pane explore-shelf"
      data-pane-key={`shelf:${shelf.categoryId}`}
      data-exiting={exiting || undefined}
      hidden={!active && !exiting}
      inert={!active}
      aria-labelledby={headingId}
      style={{ '--c': constellation.color } as CSSProperties}
    >
      <div className="shelf-inner">
        <h2 id={headingId} className="shelf-title" tabIndex={-1} data-pane-heading>
          {constellation.name}
          <span className="shelf-count">{constellation.stars.length}冊</span>
        </h2>

        {shelf.rows.map((row, i) => (
          <div className="shelf-row" key={row.label ?? i}>
            {row.label && <h3 className="shelf-row-label">{row.label}</h3>}
            {row.lines.map((line, j) => (
              <ul className={faceOut ? 'shelf-line shelf-line-faceout' : 'shelf-line'} role="list" key={j}>
                {line.map((spine) => {
                  const a = model.articles[spine.slug];
                  return (
                    <li key={spine.slug} style={{ '--w': spine.width, '--h': spine.height } as CSSProperties}>
                      <Link
                        href={a.href}
                        className={a.isNew ? 'spine spine-new' : 'spine'}
                        data-focus-id={spine.slug}
                        onNavigate={(e) => {
                          e.preventDefault();
                          onSelect(spine.slug);
                        }}
                      >
                        <span className="spine-title">{a.title}</span>
                        {faceOut && <span className="spine-desc">{a.description}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
