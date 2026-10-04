import type { Category } from '../schema';

// color は src/app/globals.css の --cat-* と同じ値にする（CSS 側はトークン、ここは SVG などで直接使う）
export const categories = [
  { id: 'attraction', name: 'アトラクション', order: 1, icon: 'spire', color: '#ffb4a2' },
  { id: 'show-parade', name: 'ショー・パレード', order: 2, icon: 'sun', color: '#ffe08a' },
  { id: 'character', name: 'キャラクター', order: 3, icon: 'star', color: '#f8a5cf' },
  { id: 'architecture', name: '建築・デザイン', order: 4, icon: 'clock', color: '#9ee6cf' },
  { id: 'film', name: '映画・作品', order: 5, icon: 'moon', color: '#8ed0ff' },
  { id: 'game', name: 'ゲーム', order: 6, icon: 'triangle', color: '#c5b6fd' },
  { id: 'food-goods', name: 'フード・グッズ', order: 7, icon: 'half-circle', color: '#ffc98b' },
  { id: 'other', name: 'その他', order: 99, icon: 'circle', color: '#c2cbea' },
] as const satisfies readonly Category[];

export type CategoryId = (typeof categories)[number]['id'];
