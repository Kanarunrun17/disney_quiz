import type { Category } from '../schema';

export const categories = [
  { id: 'attraction', name: 'アトラクション', order: 1 },
  { id: 'show-parade', name: 'ショー・パレード', order: 2 },
  { id: 'character', name: 'キャラクター', order: 3 },
  { id: 'architecture', name: '建築・デザイン', order: 4 },
  { id: 'film', name: '映画・作品', order: 5 },
  { id: 'game', name: 'ゲーム', order: 6 },
  { id: 'food-goods', name: 'フード・グッズ', order: 7 },
  { id: 'other', name: 'その他', order: 99 },
] as const satisfies readonly Category[];

export type CategoryId = (typeof categories)[number]['id'];
