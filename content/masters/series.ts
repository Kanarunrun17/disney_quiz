import type { Series } from '../schema';

export const series = [
  {
    id: 'kingdom-hearts',
    name: 'キングダムハーツ解説',
    description: 'キングダム ハーツのワールド・キャラクター・時系列を紹介する連載',
  },
] as const satisfies readonly Series[];

export type SeriesId = (typeof series)[number]['id'];
