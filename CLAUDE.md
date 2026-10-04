@AGENTS.md

# プロジェクトのルール

- 記事データの構成・本文の書き方は docs/content-model.md に従う。記事やマスタを変更したら `npm run content:validate` を通す
- 全ページ静的書き出し（`output: 'export'`）。リダイレクト・Proxy・Server Actions・デフォルトの画像最適化など、サーバーが必要な機能は使わない
- 色や文字はトークン（`src/app/globals.css`）で参照し、画面側に直接書かない
