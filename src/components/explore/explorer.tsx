'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import type { ExploreModel } from '@/lib/explore-types';
import { BookLevel } from './book-level';
import { GalleryLevel } from './gallery-level';
import { Grain } from './grain';
import { SkyLevel } from './sky-level';
import { Topbar } from './topbar';
import { useExploreState } from './use-explore-state';
import { paneKeyOf, useLevelTransition } from './use-level-transition';
import './explore.css';

// 探索ホーム全体。サーバーで全記事リンクを含む HTML として描画され、クライアントでレベルの切り替えだけを行う。

// 背景の星は装飾なのでサーバーでは描かず、別チャンクで後から読み込む
const Stars = dynamic(() => import('./stars'), { ssr: false });

export function Explorer({ model, siteName }: { model: ExploreModel; siteName: string }) {
  const { view, exiting, hydrated, descend, replace, ascendTo, settle } = useExploreState(model);
  const stageRef = useRef<HTMLElement>(null);
  // 戻ったときにフォーカスを返す先（L1 → 星座の categoryId、L2 → カードの slug）
  const triggers = useRef<Record<number, string | undefined>>({});
  const prevLevel = useRef(0);

  useLevelTransition({ stageRef, view, exiting, settle });

  // Esc で一段上がる
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && view.level > 0) ascendTo((view.level - 1) as 0 | 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, ascendTo]);

  // レベルが変わったらフォーカスを移す。潜ったときは新しいレベルの見出しへ（スクリーンリーダーが
  // 見出しを読み上げるので、別途の通知は不要）、戻ったときは元の星座／カードへ
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

  // PC のみ：ポインタの位置で空がわずかに（±6px）動く
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (!window.matchMedia('(pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const py = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        stage.style.setProperty('--px', px.toFixed(3));
        stage.style.setProperty('--py', py.toFixed(3));
      });
    };
    const onLeave = () => {
      stage.style.setProperty('--px', '0');
      stage.style.setProperty('--py', '0');
    };
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  const isExiting = (key: string) => !!exiting && paneKeyOf(exiting) !== paneKeyOf(view) && paneKeyOf(exiting) === key;
  const bookView = view.level === 2 ? view : exiting?.level === 2 ? exiting : null;

  return (
    <div className="explore theme-night" data-level={view.level} data-hydrated={hydrated || undefined}>
      <Stars />
      <header className="explore-header">
        <h1 className="explore-brand">{siteName}</h1>
        <Link href="/categories" className="explore-menu" aria-label="一覧で見る" title="一覧で見る">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 7h14M5 12h14M5 17h14" />
          </svg>
        </Link>
      </header>
      <Topbar model={model} view={view} onAscend={ascendTo} />

      <main className="explore-stage" aria-label="記事をさがす" ref={stageRef}>
        <SkyLevel
          model={model}
          active={view.level === 0}
          exiting={isExiting('sky')}
          onSelect={(categoryId) => {
            triggers.current[1] = categoryId;
            descend({ level: 1, category: categoryId });
          }}
        />
        {model.sky.constellations.map((c) => (
          <GalleryLevel
            key={c.categoryId}
            model={model}
            gallery={model.galleries[c.categoryId]}
            constellation={c}
            active={view.level === 1 && view.category === c.categoryId}
            exiting={isExiting(`gallery:${c.categoryId}`)}
            onSelect={(slug) => {
              triggers.current[2] = slug;
              descend({ level: 2, category: c.categoryId, slug });
            }}
          />
        ))}
        <BookLevel
          model={model}
          view={bookView}
          active={view.level === 2}
          exiting={isExiting('book')}
          onSwap={(slug, categoryId) => replace({ level: 2, category: categoryId, slug })}
        />
      </main>

      <Grain />
    </div>
  );
}
