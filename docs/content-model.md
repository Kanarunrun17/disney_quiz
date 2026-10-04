# コンテンツモデル

記事データの構成と書き方のルール。スキーマの実体は [content/schema.ts](../content/schema.ts)。

## 基本方針

- 記事は **1記事1ファイルの MDX** でリポジトリに蓄積する（Git が履歴になる）
- カテゴリ・タグ・連載・場所は **マスタ（TS ファイル）** に定義し、記事からは ID で参照する
- **場所は記事から切り離す。** 地図のピンは記事ではなく場所に立て、ピンを押すとその場所の記事一覧が出る形にする
- スキーマはフレームワークに依存しない。Next.js 側のコンテンツローダー（Velite など）からも `content/` を import して使う
- 記事が増えて自分以外も書くようになったら、ヘッドレス CMS（microCMS など）への移行を検討する。データ構造はそのまま移せるように保つ

## ディレクトリ構成

```
content/
  schema.ts              スキーマ（zod）と型
  index.ts               まとめて export
  masters/
    categories.ts        カテゴリ
    tags.ts              タグ（topic / work）
    series.ts            連載
    places.ts            場所（resort > park > area > 施設）＋階層をたどるヘルパー
  articles/
    <slug>.mdx           画像のない記事
    <slug>/index.mdx     画像付きの記事（画像も同じフォルダに置く）
scripts/
  validate-content.ts    検証（npm run content:validate）
  migrate-legacy.ts      旧データ（src/data）からの一回限りの移行スクリプト
```

## 記事（frontmatter）

| フィールド | 型 | 必須 | 説明 |
|---|---|:-:|---|
| （slug） | — | ✓ | ファイル名（またはフォルダ名）で決まる。英語の kebab-case。URL は `/trivia/<slug>` |
| `title` | string | ✓ | タイトル |
| `description` | string（120字まで） | ✓ | 記事カード・OGP・検索結果に出す要約 |
| `category` | カテゴリ ID | ✓ | 1記事につき1つ |
| `tags` | タグ ID[] | | 横断的な分類 |
| `places` | 場所 ID[] | | 関連する場所。パーク・エリア・施設のどの階層でも指定できる。地図のピンの元になる |
| `series` | `{ id, order }` | | 連載。`order` は連載内の順番（1始まり、重複不可） |
| `cover` | `{ src, alt, credit? }` | | カバー画像。`src` は記事ファイルからの相対パスか URL |
| `sources` | `{ title, url }[]` | | 参考にした情報源 |
| `publishedAt` | 日付 | ✓ | 公開日。旧記事は SNS に投稿した日 |
| `updatedAt` | 日付 | | 内容を更新した日 |
| `legacyId` | number | | 旧サイトの ID。旧 URL（`#/trivia/3`）から転送するため |
| `draft` | boolean | | `true` なら本番では非公開 |

定義にないキーを書くとエラーになる（打ち間違いの防止）。

保存せずビルド時に計算するもの：所属パーク（`places` の親をたどる）、読了時間、関連記事（同じ場所・タグ・連載）。

### 例

```mdx
---
title: "スプラッシュマウンテン"
description: "ランド最速のアトラクションのストーリー、原作「南部の唄」、チカピンヒルが水しぶきの山になった理由まで。"
category: attraction
tags: [backstory, song-of-the-south, name-origin]
places: [splash-mountain, grandma-saras-kitchen, rackettys-raccoon-saloon]
publishedAt: 2022-08-02
legacyId: 3
---

1992年10月1日にクリッターカントリーと同時にオープンしたアトラクション
…

## ストーリー
…
```

## マスタ

### カテゴリ（categories.ts）

`id` / `name` / `order`（表示順）/ `icon`・`color`（デザインで決めたら設定）

| ID | 名前 |
|---|---|
| `attraction` | アトラクション |
| `show-parade` | ショー・パレード |
| `character` | キャラクター |
| `architecture` | 建築・デザイン |
| `film` | 映画・作品 |
| `game` | ゲーム |
| `food-goods` | フード・グッズ |
| `other` | その他 |

### タグ（tags.ts）

`id` / `name` / `kind`

- `topic`：横断的なテーマ（隠れミッキー、名前の由来、過去のショー など）
- `work`：映画などの作品。作品マスタは作らず当面タグで代用する。記事が増えてアトラクションと原作をつなぐ機能が欲しくなったら、`kind: 'work'` のタグを作品マスタに昇格させる

表記ゆれを防ぐため、新しいタグは必ずマスタに追加してから使う。

### 連載（series.ts）

`id` / `name` / `description`

### 場所（places.ts）

| フィールド | 説明 |
|---|---|
| `id` | kebab-case |
| `name` | 表示名（公式表記に合わせる） |
| `kind` | `resort` / `park` / `area` / `attraction` / `restaurant` / `shop` / `show` / `landmark` / `hotel` / `facility` |
| `parent` | 親の場所。`resort` 以外は必須 |
| `status` | `operating` / `closed` / `upcoming`。クローズした施設の記事も扱えるようにする |
| `aliases` | 検索用の別名・略称（「スプラ」「ミッキー広場」など） |
| `mapPosition` | 自作マップ上の位置 `{ x, y }`（左上原点の %）。**地図の実装時に埋める** |
| `geo` | 実座標 `{ lat, lng }`（任意） |

階層のルール（検証スクリプトで確認）：

- `resort`：親なし
- `park`：親は `resort`
- `area`：親は `park`
- 施設（上記以外）：親は `resort` / `park` / `area` のどれか。エリアに属さない施設はパーク直下（例：アクアスフィア）、パーク外の施設はリゾート直下（例：イクスピアリ）に置く

`getPlaceLineage(id)`（自身から resort までの祖先）と `getParkOf(id)`（所属パーク）で階層をたどれる。

## 地図機能への備え

地図は、通常のサイトが完成した後にサイドバーから「地図モード」として追加する。今の段階で決めてあるのは次の点。

- ピンは **場所（施設）単位** で立てる。1つの場所に記事が何本あってもピンは1つで、タップするとボトムシートでその場所の記事一覧を出す
- エリアやパークを指す記事は、そのエリア・パークの範囲にまとめて表示できる（階層があるため、エリアを選ぶと配下の施設の記事もまとめて出せる）
- 地図の描き方は **自作のイラストマップ（SVG）** を想定し、ピンの位置は `mapPosition`（%）で持つ。実際の地図（MapLibre など）を使う場合に備えて `geo` も持てるようにしてある
- 公式のパークマップの画像は使わない（著作権）

地図の実装時にやること：主要な場所に `mapPosition` を入れ、記事の `places` を見直す（現在はクローズや名称変更を確認せず、すべて `operating` にしてある）。

## 本文の書き方

- **改行はそのまま改行として表示する**（`remark-breaks`）。SNS に投稿するときと同じ感覚で書ける。段落を分けたいときは空行を入れる
- 見出しは `##`（大見出し）と `###`（小見出し）。記事タイトルが `#` になるので、本文では `#` を使わない
- 箇条書きは `- `、物語などの引用は `> `
- URL はそのまま書けばリンクになる（`remark-gfm`）
- MDX では `<` と `{` `}` が特別な意味を持つ。本文でそのまま使うときは `\<`、`\{`、`\}` と書く（例：`\<ミッキー保護法>`）
- 行頭の `*` は箇条書きとして解釈されるので、記号として使うときは `\*` と書く

## 新しい記事の追加手順

1. `content/articles/<slug>.mdx` を作る（画像付きなら `<slug>/index.mdx` と画像ファイル）
2. frontmatter を書く。新しいタグ・場所が必要ならマスタに追加する
3. `npm run content:validate` を実行する

検証スクリプトで確認していること：frontmatter の形式、マスタとの参照整合性、slug・`legacyId`・連載番号の重複、場所の階層（親の種類と循環）、カバー画像の存在、`updatedAt` と `publishedAt` の前後関係、MDX としてコンパイルできるか。未使用のマスタは警告を出す。

## 旧データからの移行メモ

- `src/data/*.ts` の34件を `scripts/migrate-legacy.ts` で変換した。本文の文字は変えず、見出し（`<…>`、`///…///`、`・項目`）・引用（`///` で囲まれた部分）・箇条書き（連続する `・`）だけを Markdown に置き換えている。記号と空白を除いた本文が旧データと一致することを確認済み
- 移行スクリプトは一回限りのもの。変換後の MDX を手で直したあとに再実行すると上書きされるので、再実行しない。新サイトに切り替えたら `src/data` と一緒に削除する
- 旧 `category` の対応：エリア・建築 → `architecture`、映画 → `film`、ほかは同名のカテゴリ
- 旧 `id` は `legacyId` に残した。新サイトでは `#/trivia/<id>` へのアクセスを、クライアント側で `/trivia/<slug>` に転送する（ハッシュはサーバーに届かないため、サーバー側のリダイレクトでは対応できない）
- 旧記事は SNS の画像付き投稿が元になっており、本文に「(2枚目)」のような画像への言及が残っている（アストロブラスター、イクスピアリ、マジックランプシアター、3匹のこぶた）。画像を追加するか、言い回しを直す
- 本文の情報は投稿時点のもの。古くなった記述を直したら `updatedAt` を入れる
