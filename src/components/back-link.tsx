'use client';

import { useRouter } from 'next/navigation';

// 一つ前の画面へ戻る矢印。このセッションでサイト内を回遊していれば履歴を戻り、
// 記事を直接開いた場合は fallbackHref（探索ホームの該当カテゴリ）へ
export function BackLink({ fallbackHref, label }: { fallbackHref: string; label: string }) {
  const router = useRouter();
  return (
    <a
      href={fallbackHref}
      className="back-link"
      aria-label={label}
      title={label}
      onClick={(e) => {
        let visited = false;
        try {
          visited = !!sessionStorage.getItem('explore:visited');
        } catch {
          /* プライベートモードなどで読めない場合はフォールバック先へ */
        }
        if (visited && window.history.length > 1) {
          e.preventDefault();
          router.back();
        }
      }}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 6l-6 6 6 6" />
      </svg>
    </a>
  );
}
