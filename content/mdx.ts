import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

// 本文の改行はそのまま改行として表示する（SNS 投稿と同じ感覚で書けるように）
export const remarkPlugins = [remarkGfm, remarkBreaks];
