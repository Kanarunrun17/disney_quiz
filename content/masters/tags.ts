import type { Tag } from '../schema';

export const tags = [
  // topic: 横断的なテーマ
  { id: 'backstory', name: 'バックグラウンドストーリー', kind: 'topic' },
  { id: 'hidden-mickey', name: '隠れミッキー', kind: 'topic' },
  { id: 'name-origin', name: '名前の由来', kind: 'topic' },
  { id: 'english-joke', name: '英語ジョーク', kind: 'topic' },
  { id: 'past-shows', name: '過去のショー・イベント', kind: 'topic' },
  { id: 'sponsor', name: 'スポンサー', kind: 'topic' },
  { id: 'halloween', name: 'ハロウィーン', kind: 'topic' },
  { id: 'short-film', name: '短編映画', kind: 'topic' },
  { id: 'glossary', name: '用語集', kind: 'topic' },
  { id: 'mickey', name: 'ミッキー', kind: 'topic' },
  { id: 'minnie', name: 'ミニー', kind: 'topic' },
  { id: 'duffy-and-friends', name: 'ダッフィー&フレンズ', kind: 'topic' },
  { id: 'pixar', name: 'ピクサー', kind: 'topic' },

  // work: 作品（将来の作品マスタ候補）
  { id: 'steamboat-willie', name: '蒸気船ウィリー', kind: 'work' },
  { id: 'three-little-pigs', name: '3匹のこぶた', kind: 'work' },
  { id: 'snow-white', name: '白雪姫', kind: 'work' },
  { id: 'pinocchio', name: 'ピノキオ', kind: 'work' },
  { id: 'fantasia', name: 'ファンタジア', kind: 'work' },
  { id: 'dumbo', name: 'ダンボ', kind: 'work' },
  { id: 'cinderella', name: 'シンデレラ', kind: 'work' },
  { id: 'song-of-the-south', name: '南部の唄', kind: 'work' },
  { id: 'little-mermaid', name: 'リトル・マーメイド', kind: 'work' },
  { id: 'aladdin', name: 'アラジン', kind: 'work' },
  { id: 'toy-story', name: 'トイ・ストーリー', kind: 'work' },
  { id: 'finding-nemo', name: 'ファインディング・ニモ', kind: 'work' },
  { id: 'indiana-jones', name: 'インディ・ジョーンズ', kind: 'work' },
  { id: 'kingdom-hearts', name: 'キングダム ハーツ', kind: 'work' },
  { id: 'twisted-wonderland', name: 'ツイステッドワンダーランド', kind: 'work' },
] as const satisfies readonly Tag[];

export type TagId = (typeof tags)[number]['id'];
