'use client';

import type { CSSProperties } from 'react';
import type { ExploreModel } from '@/lib/explore-types';
import type { View } from './use-explore-state';

// ヘッダー直下のバー：戻るとパンくず（空 › カテゴリ › 記事）

export function Topbar({
  model,
  view,
  onAscend,
}: {
  model: ExploreModel;
  view: View;
  onAscend: (level: 0 | 1) => void;
}) {
  const constellation = view.level !== 0 ? model.sky.constellations.find((c) => c.categoryId === view.category) : undefined;
  const title = view.level === 2 ? model.articles[view.slug].title : undefined;
  const backLabel = view.level === 2 ? 'カテゴリへ戻る' : '空へ戻る';

  return (
    <nav className="topbar" aria-label="現在地" style={{ '--c': constellation?.color } as CSSProperties}>
      <button
        type="button"
        className="topbar-back"
        onClick={() => onAscend((view.level - 1) as 0 | 1)}
        disabled={view.level === 0}
        aria-label={backLabel}
        title={backLabel}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </button>

      <ol className="topbar-crumbs">
        <li>
          {view.level === 0 ? (
            <span aria-current="page">空</span>
          ) : (
            <button type="button" onClick={() => onAscend(0)}>
              空
            </button>
          )}
        </li>
        {constellation && (
          <li>
            {view.level === 1 ? (
              <span aria-current="page">{constellation.name}</span>
            ) : (
              <button type="button" onClick={() => onAscend(1)}>
                {constellation.name}
              </button>
            )}
          </li>
        )}
        {title && (
          <li>
            <span aria-current="page">{title}</span>
          </li>
        )}
      </ol>
    </nav>
  );
}
