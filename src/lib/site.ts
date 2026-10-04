export const SITE_NAME = 'ディズニー トリビア';
export const SITE_DESCRIPTION =
  'ディズニーの映画やパークにまつわる雑学を紹介する、個人運営のファンサイトです。';

// 本番 URL。独自ドメインにしたら NEXT_PUBLIC_SITE_URL で上書きする
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');

const dateFormat = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'Asia/Tokyo',
});

export const formatDate = (d: Date) => dateFormat.format(d);
