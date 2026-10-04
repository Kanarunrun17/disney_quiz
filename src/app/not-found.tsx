import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold">ページが見つかりません</h1>
      <p className="mt-3 text-muted">お探しのページは移動または削除された可能性があります。</p>
      <Link href="/" className="mt-6 inline-block text-accent hover:underline">
        ホームに戻る
      </Link>
    </div>
  );
}
