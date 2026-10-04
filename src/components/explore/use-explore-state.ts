'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useLayoutEffect, useReducer, useSyncExternalStore } from 'react';
import type { ExploreModel } from '@/lib/explore-types';

// 探索の状態は URL のハッシュが唯一の情報源。
//   ""                 → L0 空
//   "#category"        → L1 本棚
//   "#category/slug"   → L2 手に取る
// 潜るときは pushState、ブラウザの戻る（popstate）で一段上がる。
// 直前の view は `exiting` として保持し、退場アニメーションが終わったら settle() で消す。

export type View =
  | { level: 0 }
  | { level: 1; category: string }
  | { level: 2; category: string; slug: string };

type HistoryState = { exploreDepth?: number } | null;

export const parseHash = (hash: string, model: ExploreModel): View => {
  const raw = decodeURIComponent(hash.replace(/^#/, ''));
  if (!raw) return { level: 0 };
  const [category, slug] = raw.split('/');
  if (!model.galleries[category]) return { level: 0 };
  if (slug && model.articles[slug]?.categoryId === category) return { level: 2, category, slug };
  return { level: 1, category };
};

export const hashOf = (view: View) =>
  view.level === 0 ? '' : view.level === 1 ? `#${view.category}` : `#${view.category}/${view.slug}`;

export const viewKey = hashOf;

export const parentOf = (view: View): View =>
  view.level === 2 ? { level: 1, category: view.category } : { level: 0 };

const depthOf = () => (window.history.state as HistoryState)?.exploreDepth ?? 0;
const urlFor = (view: View) => `${window.location.pathname}${hashOf(view)}`;

// サーバー描画と hydration 中は false、その後 true になる（ディープリンク時のちらつき防止の CSS に使う）
const subscribeNoop = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

type State = { view: View; exiting: View | null };
type Action = { type: 'go'; view: View; instant?: boolean } | { type: 'settle' };

const reducer = (state: State, action: Action): State => {
  if (action.type === 'settle') return state.exiting ? { ...state, exiting: null } : state;
  if (viewKey(action.view) === viewKey(state.view)) return state;
  return { view: action.view, exiting: action.instant ? null : state.view };
};

export function useExploreState(model: ExploreModel) {
  const router = useRouter();
  const [{ view, exiting }, dispatch] = useReducer(reducer, { view: { level: 0 }, exiting: null });
  const hydrated = useHydrated();

  // 最初の描画の前にハッシュを反映する（useLayoutEffect なので L0 が一瞬見えることはない）
  useLayoutEffect(() => {
    const fromHash = (instant: boolean) =>
      dispatch({ type: 'go', view: parseHash(window.location.hash, model), instant });

    // 旧サイトの記事 URL（#/trivia/<id>）は新しい記事ページへ
    const legacy = window.location.hash.match(/^#\/trivia\/(\d+)$/);
    if (legacy) {
      const article = Object.values(model.articles).find((a) => a.legacyId === Number(legacy[1]));
      router.replace(article?.href ?? '/');
      return;
    }
    // 旧形式のクエリ（?c=category）はハッシュに置き換える
    const c = new URLSearchParams(window.location.search).get('c');
    if (c && model.galleries[c]) window.history.replaceState(window.history.state, '', `${window.location.pathname}#${c}`);

    fromHash(true);
    const onPop = () => fromHash(false);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [model, router]);

  /** 一段潜る（履歴を積む） */
  const descend = useCallback((next: View) => {
    window.history.pushState({ exploreDepth: depthOf() + 1 }, '', urlFor(next));
    dispatch({ type: 'go', view: next });
  }, []);

  /** 同じ深さで差し替える（関連本への移動など。履歴は積まない） */
  const replace = useCallback((next: View) => {
    window.history.replaceState({ exploreDepth: depthOf() }, '', urlFor(next));
    dispatch({ type: 'go', view: next });
  }, []);

  /** 指定レベルまで上がる。自分で積んだ履歴があれば戻る操作で、なければ置き換えで */
  const ascendTo = useCallback(
    (level: 0 | 1) => {
      const steps = view.level - level;
      if (steps <= 0) return;
      if (depthOf() >= steps) {
        window.history.go(-steps);
        return;
      }
      let target: View = view;
      for (let i = 0; i < steps; i++) target = parentOf(target);
      window.history.replaceState({ exploreDepth: 0 }, '', urlFor(target));
      dispatch({ type: 'go', view: target });
    },
    [view],
  );

  /** 退場アニメーションの完了を知らせ、直前の view を片付ける */
  const settle = useCallback(() => dispatch({ type: 'settle' }), []);

  return { view, exiting, hydrated, descend, replace, ascendTo, settle };
}
