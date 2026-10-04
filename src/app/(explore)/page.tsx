import type { Metadata, Viewport } from 'next';
import { Explorer } from '@/components/explore/explorer';
import { buildExploreModel } from '@/lib/explore';
import { SITE_NAME } from '@/lib/site';

// ホームだけ夜空の色のステータスバーにする
export const viewport: Viewport = { themeColor: '#0b1230' };

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

// 描画前に行う 2 つの印付け（React を待たずに CSS だけで効かせるためインラインで実行する）
//  - ディープリンク（#category など）で開いたとき、hydration までステージを隠して L0 のちらつきを防ぐ
//  - セッションで最初の訪問なら、窓が灯り星座線が描かれる演出を有効にする
const INITIAL_SCRIPT = [
  "if(location.hash&&location.hash.indexOf('#/')!==0)document.documentElement.dataset.exploreHash='';",
  "try{if(!sessionStorage.getItem('explore:visited')){document.documentElement.dataset.exploreFirst='';sessionStorage.setItem('explore:visited','1')}}catch(e){}",
].join('');

export default function HomePage() {
  const model = buildExploreModel();
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: INITIAL_SCRIPT }} />
      <Explorer model={model} siteName={SITE_NAME} />
    </>
  );
}
