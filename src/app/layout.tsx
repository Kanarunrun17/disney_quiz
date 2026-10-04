import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@/components/site-nav';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: { siteName: SITE_NAME, locale: 'ja_JP', type: 'website' },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full">
        <div className="mx-auto flex max-w-6xl flex-col md:flex-row">
          {/* PC: サイドバー / スマホ: 上部ヘッダー */}
          <aside className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
            <div className="flex items-center justify-between gap-4 px-4 py-3 md:flex-col md:items-stretch md:px-5 md:py-8">
              <Link href="/" className="text-lg font-bold tracking-wide">
                {SITE_NAME}
              </Link>
              <div className="md:hidden">
                <SiteNav direction="row" />
              </div>
              <div className="hidden md:mt-6 md:block">
                <SiteNav direction="column" />
              </div>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <main className="w-full flex-1 px-4 py-8 md:px-10 md:py-12">{children}</main>
            <footer className="border-t border-border px-4 py-8 text-xs leading-relaxed text-muted md:px-10">
              <p>
                当サイトは個人が運営する非公式のファンサイトです。ウォルト・ディズニー・カンパニーおよび株式会社オリエンタルランドとは関係ありません。
              </p>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
