import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 全ページをビルド時に静的 HTML として書き出す（Vercel 以外の静的ホスティングにも移せるようにする）
  output: 'export',
  images: { unoptimized: true },
};

export default nextConfig;
