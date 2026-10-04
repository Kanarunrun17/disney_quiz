'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { ExploreModel } from '@/lib/explore-types';
import type { View } from './use-explore-state';

// L2 手に取る：1 冊の表紙と、つながる本（最大 3 冊）。表紙を押すと記事ページへ本物の遷移をする。

const dateFormat = new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Tokyo' });
const PARK_NAMES: Record<string, string> = { tdl: 'ランド', tds: 'シー' };

export function BookLevel({
  model,
  view,
  onSwap,
}: {
  model: ExploreModel;
  view: View;
  onSwap: (slug: string, categoryId: string) => void;
}) {
  const active = view.level === 2;
  const article = active ? model.articles[view.slug] : undefined;
  const constellation = article ? model.sky.constellations.find((c) => c.categoryId === article.categoryId) : undefined;
  const related = article ? model.related[article.slug] : [];

  return (
    <section
      className="explore-pane explore-book"
      data-pane-key="book"
      hidden={!active}
      inert={!active}
      aria-labelledby="book-heading"
      style={{ '--c': constellation?.color } as CSSProperties}
    >
      {article && constellation && (
        <div className="book-inner">
          <h2 id="book-heading" className="sr-only" tabIndex={-1} data-pane-heading>
            「{article.title}」を手に取っています
          </h2>

          <Link href={article.href} className="cover" data-focus-id={`cover:${article.slug}`}>
            <span className="cover-chip">{constellation.name}</span>
            <span className="cover-title">{article.title}</span>
            <span className="cover-desc">{article.description}</span>
            <span className="cover-meta">
              {article.parkIds.map((id) => PARK_NAMES[id] ?? id).join('・')}
              {article.parkIds.length > 0 && ' ・ '}約{article.readingMinutes}分 ・{' '}
              <time dateTime={article.publishedAt}>{dateFormat.format(new Date(article.publishedAt))}</time>
            </span>
            <span className="cover-open">ひらく</span>
          </Link>

          {related.length > 0 && (
            <div className="related">
              <h3 className="related-title">つながる本</h3>
              <ul className="related-list" role="list">
                {related.map((r) => {
                  const b = model.articles[r.slug];
                  const c = model.sky.constellations.find((x) => x.categoryId === b.categoryId);
                  const thread = r.score >= 3 ? 4 : r.score >= 2 ? 3 : 2;
                  return (
                    <li key={r.slug}>
                      <button
                        type="button"
                        className="related-book"
                        style={{ '--c': c?.color, '--thread': `${thread}px` } as CSSProperties}
                        onClick={() => onSwap(r.slug, b.categoryId)}
                      >
                        <span className="related-book-category">{c?.name}</span>
                        <span className="related-book-title">{b.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
