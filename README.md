# ディズニー トリビア

ディズニーの映画やパークにまつわる雑学を紹介する、個人運営のファンサイト。

## 技術構成

| 役割 | 技術 |
|---|---|
| フレームワーク | Next.js（App Router）。全ページを静的 HTML として書き出す（`output: 'export'`） |
| スタイル | Tailwind CSS v4。色や文字はトークンとして `src/app/globals.css` にまとめている |
| 記事 | `content/articles/*.mdx`。スキーマは zod で定義し、ビルド前に検証する |
| ホスティング | Vercel（Hobby プラン） |

記事データの構成と書き方は [docs/content-model.md](docs/content-model.md) を参照。

## 開発

```bash
npm install
npm run dev               # http://localhost:3000
npm run content:validate  # 記事とマスタの検証
npm run lint
npm run typecheck
npm run build             # 検証 → 静的書き出し（out/）
npm start                 # out/ をローカルで配信して確認
```

## ディレクトリ

```
content/        記事（MDX）・マスタ・スキーマ
docs/           設計ドキュメント
scripts/        検証スクリプト
src/app/        ページ
src/components/ 共通部品
src/lib/        記事の読み込み・MDX の描画・サイト設定
```

## デプロイ

`main` に push すると Vercel が自動でビルド・公開する（プルリクエストごとにプレビュー URL も発行される）。

初回のみ：Vercel にログイン →「Add New… → Project」→ このリポジトリを Import。設定は自動で検出されるので変更不要。

### 無料で使い続けるための条件（Vercel Hobby プラン）

- **商用利用は不可。** 広告（Google AdSense など）を載せる、商品を宣伝する、アフィリエイトリンクが主目的になる、といった使い方は規約違反になる。寄付の募集は商用利用に当たらない
- 上限（転送量 月100GB など）を超えても課金はされず、機能が一時停止する
- 将来広告などを載せたくなったら、商用利用も無料で許されている Cloudflare などの静的ホスティングに移す。静的書き出しにしているのはそのため（`out/` をそのまま置ける）
