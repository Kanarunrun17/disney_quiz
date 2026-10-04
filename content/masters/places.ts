import type { Place } from '../schema';

// 場所マスタ。resort > park > area > 施設 の階層を parent で表す。
// mapPosition / geo は地図機能の実装時に埋める。
export const places = [
  { id: 'resort', name: '東京ディズニーリゾート', kind: 'resort', status: 'operating', aliases: ['TDR'] },
  { id: 'tdl', name: '東京ディズニーランド', kind: 'park', parent: 'resort', status: 'operating', aliases: ['ランド', '陸', 'TDL'] },
  { id: 'tds', name: '東京ディズニーシー', kind: 'park', parent: 'resort', status: 'operating', aliases: ['シー', '海', 'TDS'] },

  // ---- リゾート直下 ----
  { id: 'ikspiari', name: 'イクスピアリ', kind: 'facility', parent: 'resort', status: 'operating', aliases: ['ピアリ'] },

  // ---- 東京ディズニーランド：エリア ----
  { id: 'world-bazaar', name: 'ワールドバザール', kind: 'area', parent: 'tdl', status: 'operating' },
  { id: 'adventureland', name: 'アドベンチャーランド', kind: 'area', parent: 'tdl', status: 'operating' },
  { id: 'westernland', name: 'ウエスタンランド', kind: 'area', parent: 'tdl', status: 'operating' },
  { id: 'critter-country', name: 'クリッターカントリー', kind: 'area', parent: 'tdl', status: 'operating' },
  { id: 'fantasyland', name: 'ファンタジーランド', kind: 'area', parent: 'tdl', status: 'operating' },
  { id: 'toontown', name: 'トゥーンタウン', kind: 'area', parent: 'tdl', status: 'operating' },
  { id: 'tomorrowland', name: 'トゥモローランド', kind: 'area', parent: 'tdl', status: 'operating' },

  // ---- 東京ディズニーランド：施設 ----
  { id: 'town-center-fashion', name: 'タウンセンター・ファッション', kind: 'shop', parent: 'world-bazaar', status: 'operating' },
  { id: 'grand-emporium', name: 'グランドエンポーリアム', kind: 'shop', parent: 'world-bazaar', status: 'operating' },
  { id: 'pirates-of-the-caribbean', name: 'カリブの海賊', kind: 'attraction', parent: 'adventureland', status: 'operating' },
  { id: 'jungle-cruise', name: 'ジャングルクルーズ：ワイルドライフ・エクスペディション', kind: 'attraction', parent: 'adventureland', status: 'operating', aliases: ['ジャングルクルーズ'] },
  { id: 'camp-woodchuck', name: 'キャンプ・ウッドチャック', kind: 'landmark', parent: 'westernland', status: 'operating' },
  { id: 'splash-mountain', name: 'スプラッシュ・マウンテン', kind: 'attraction', parent: 'critter-country', status: 'operating', aliases: ['スプラッシュマウンテン', 'スプラ'] },
  { id: 'grandma-saras-kitchen', name: 'グランマ・サラのキッチン', kind: 'restaurant', parent: 'critter-country', status: 'operating' },
  { id: 'rackettys-raccoon-saloon', name: 'ラケッティのラクーンサルーン', kind: 'restaurant', parent: 'critter-country', status: 'operating' },
  { id: 'cinderella-castle', name: 'シンデレラ城', kind: 'landmark', parent: 'fantasyland', status: 'operating' },
  { id: 'cinderellas-fairy-tale-hall', name: 'シンデレラのフェアリーテイル・ホール', kind: 'attraction', parent: 'fantasyland', status: 'operating' },
  { id: 'castle-carrousel', name: 'キャッスルカルーセル', kind: 'attraction', parent: 'fantasyland', status: 'operating' },
  { id: 'haunted-mansion', name: 'ホーンテッドマンション', kind: 'attraction', parent: 'fantasyland', status: 'operating' },
  { id: 'pinocchios-daring-journey', name: 'ピノキオの冒険旅行', kind: 'attraction', parent: 'fantasyland', status: 'operating' },
  { id: 'dumbo-the-flying-elephant', name: '空飛ぶダンボ', kind: 'attraction', parent: 'fantasyland', status: 'operating' },
  { id: 'mickeys-philharmagic', name: 'ミッキーのフィルハーマジック', kind: 'attraction', parent: 'fantasyland', status: 'operating', aliases: ['フィルハーマジック'] },
  { id: 'minnies-style-studio', name: 'ミニーのスタイルスタジオ', kind: 'facility', parent: 'toontown', status: 'operating' },
  { id: 'buzz-lightyears-astro-blasters', name: 'バズ・ライトイヤーのアストロブラスター', kind: 'attraction', parent: 'tomorrowland', status: 'operating', aliases: ['バズ'] },

  // ---- 東京ディズニーシー：エリア ----
  { id: 'mediterranean-harbor', name: 'メディテレーニアンハーバー', kind: 'area', parent: 'tds', status: 'operating' },
  { id: 'american-waterfront', name: 'アメリカンウォーターフロント', kind: 'area', parent: 'tds', status: 'operating' },
  { id: 'port-discovery', name: 'ポートディスカバリー', kind: 'area', parent: 'tds', status: 'operating' },
  { id: 'lost-river-delta', name: 'ロストリバーデルタ', kind: 'area', parent: 'tds', status: 'operating' },
  { id: 'arabian-coast', name: 'アラビアンコースト', kind: 'area', parent: 'tds', status: 'operating' },
  { id: 'mermaid-lagoon', name: 'マーメイドラグーン', kind: 'area', parent: 'tds', status: 'operating' },
  { id: 'mysterious-island', name: 'ミステリアスアイランド', kind: 'area', parent: 'tds', status: 'operating' },
  { id: 'fantasy-springs', name: 'ファンタジースプリングス', kind: 'area', parent: 'tds', status: 'operating' },

  // ---- 東京ディズニーシー：施設 ----
  // アクアスフィアはエントランス（ディズニーシー・プラザ）にあるためパーク直下に置く
  { id: 'aquasphere', name: 'アクアスフィア', kind: 'landmark', parent: 'tds', status: 'operating' },
  { id: 'piazza-topolino', name: 'ピアッツァ・トッポリーノ', kind: 'landmark', parent: 'mediterranean-harbor', status: 'operating', aliases: ['ミッキー広場'] },
  { id: 'ss-columbia', name: 'S.S.コロンビア号', kind: 'landmark', parent: 'american-waterfront', status: 'operating' },
  { id: 'disneysea-electric-railway', name: 'ディズニーシー・エレクトリックレールウェイ', kind: 'attraction', parent: 'port-discovery', status: 'operating', aliases: ['エレクトリックレールウェイ'] },
  { id: 'horizon-bay-restaurant', name: 'ホライズンベイ・レストラン', kind: 'restaurant', parent: 'port-discovery', status: 'operating' },
  { id: 'nemo-and-friends-searider', name: 'ニモ&フレンズ・シーライダー', kind: 'attraction', parent: 'port-discovery', status: 'operating', aliases: ['シーライダー'] },
  { id: 'indiana-jones-adventure', name: 'インディ・ジョーンズ・アドベンチャー：クリスタルスカルの魔宮', kind: 'attraction', parent: 'lost-river-delta', status: 'operating', aliases: ['インディ', 'クリスタルスカルの魔宮'] },
  { id: 'yucatan-base-camp-grill', name: 'ユカタン・ベースキャンプ・グリル', kind: 'restaurant', parent: 'lost-river-delta', status: 'operating' },
  { id: 'magic-lamp-theater', name: 'マジックランプシアター', kind: 'attraction', parent: 'arabian-coast', status: 'operating' },
  { id: 'mount-prometheus', name: 'プロメテウス火山', kind: 'landmark', parent: 'mysterious-island', status: 'operating' },
] as const satisfies readonly Place[];

export type PlaceId = (typeof places)[number]['id'];

const byId = new Map<string, Place>(places.map((p) => [p.id, p]));

export const getPlace = (id: string): Place | undefined => byId.get(id);

/** 自身を含む祖先を近い順に返す（例: splash-mountain → critter-country → tdl → resort） */
export const getPlaceLineage = (id: string): Place[] => {
  const lineage: Place[] = [];
  const seen = new Set<string>();
  for (let cur = byId.get(id); cur && !seen.has(cur.id); cur = cur.parent ? byId.get(cur.parent) : undefined) {
    seen.add(cur.id);
    lineage.push(cur);
  }
  return lineage;
};

/** 所属パーク（リゾート直下の施設やリゾート自体は undefined） */
export const getParkOf = (id: string): Place | undefined =>
  getPlaceLineage(id).find((p) => p.kind === 'park');
