import type { Metadata, Viewport } from 'next';
import { Explorer } from '@/components/explore/explorer';
import { buildExploreModel } from '@/lib/explore';
import { SITE_NAME } from '@/lib/site';

// ホームだけ夜空の色のステータスバーにする
export const viewport: Viewport = { themeColor: '#0b1230' };

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

// ディープリンク（#category など）で開いたとき、hydration までステージを隠して L0 のちらつきを防ぐ
const INITIAL_HASH_SCRIPT = "if(location.hash&&location.hash.indexOf('#/')!==0)document.documentElement.dataset.exploreHash=''";

export default function HomePage() {
  const model = buildExploreModel();
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: INITIAL_HASH_SCRIPT }} />
      <Explorer model={model} siteName={SITE_NAME} />
    </>
  );
}
