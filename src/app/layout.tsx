import type { Metadata } from 'next';
import { Zen_Maru_Gothic } from 'next/font/google';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import './globals.css';

// 見出し・星座名・本の題に使う丸ゴシック。日本語のグリフは unicode-range で必要な分だけ遅延配信される。
// preload を有効にすると日本語の全スライス（120 ファイル）が事前読み込みされてしまうため無効にする
const zenMaru = Zen_Maru_Gothic({
  weight: ['500', '700'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-zen-maru',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: { siteName: SITE_NAME, locale: 'ja_JP', type: 'website' },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ja" className={`${zenMaru.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
