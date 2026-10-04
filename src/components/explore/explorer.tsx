'use client';

import { useEffect, useRef } from 'react';
import type { ExploreModel } from '@/lib/explore-types';
import { BookLevel } from './book-level';
import { Dock } from './dock';
import { ShelfLevel } from './shelf-level';
import { SkyLevel } from './sky-level';
import { useExploreState, type View } from './use-explore-state';
import './explore.css';

// 探索ホーム全体。サーバーで全記事リンクを含む HTML として描画され、クライアントでレベルの切り替えだけを行う。

const paneKeyOf = (view: View) =>
  view.level === 0 ? 'sky' : view.level === 1 ? `shelf:${view.category}` : 'book';

export function Explorer({ model, siteName }: { model: ExploreModel; siteName: string }) {
  const { view, hydrated, descend, replace, ascendTo } = useExploreState(model);
  // 戻ったときにフォーカスを返す先（L1 → 星座の categoryId、L2 → 背表紙の slug）
  const triggers = useRef<Record<number, string | undefined>>({});
  const prevLevel = useRef(0);

  // Esc で一段上がる
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && view.level > 0) ascendTo((view.level - 1) as 0 | 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, ascendTo]);

  // レベルが変わったらフォーカスを移す。潜ったときは新しいレベルの見出しへ（スクリーンリーダーが
  // 見出しを読み上げるので、別途の通知は不要）、戻ったときは元の星座／背表紙へ
  useEffect(() => {
    if (!hydrated) return;
    const wentUp = view.level < prevLevel.current;
    prevLevel.current = view.level;

    if (wentUp) {
      const id = triggers.current[view.level + 1];
      const el = id ? document.querySelector<HTMLElement>(`[data-focus-id="${CSS.escape(id)}"]`) : null;
      el?.focus({ preventScroll: true });
    } else if (view.level > 0) {
      document
        .querySelector<HTMLElement>(`[data-pane-key="${paneKeyOf(view)}"] [data-pane-heading]`)
        ?.focus({ preventScroll: true });
    }
  }, [view, hydrated]);

  return (
    <div className="explore theme-night" data-level={view.level} data-hydrated={hydrated || undefined}>
      <header className="explore-header">
        <h1 className="explore-brand">{siteName}</h1>
        <p className="explore-tagline">夜空の星座から、一冊をえらぶ</p>
      </header>

      <main className="explore-stage" aria-label="記事をさがす">
        <SkyLevel
          model={model}
          active={view.level === 0}
          onSelect={(categoryId) => {
            triggers.current[1] = categoryId;
            descend({ level: 1, category: categoryId });
          }}
        />
        {model.sky.constellations.map((c) => (
          <ShelfLevel
            key={c.categoryId}
            model={model}
            shelf={model.shelves[c.categoryId]}
            constellation={c}
            active={view.level === 1 && view.category === c.categoryId}
            onSelect={(slug) => {
              triggers.current[2] = slug;
              descend({ level: 2, category: c.categoryId, slug });
            }}
          />
        ))}
        <BookLevel
          model={model}
          view={view}
          onSwap={(slug, categoryId) => replace({ level: 2, category: categoryId, slug })}
        />
      </main>

      <Dock model={model} view={view} onAscend={ascendTo} />
    </div>
  );
}
