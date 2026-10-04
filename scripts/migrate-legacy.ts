// 旧データ（src/data/*.ts）を content/articles/*.mdx に変換する一回限りのスクリプト。
// 本文の文章は変えず、見出し・引用・箇条書きなどの構造だけを Markdown に置き換える。
// 変換済みの MDX を手で直した後に再実行すると上書きされるので注意。
// 実行: npx tsx scripts/migrate-legacy.ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { allTrivias } from '../src/data/all_data';

type Meta = {
  slug: string;
  category: string;
  description: string;
  tags?: string[];
  places?: string[];
  series?: { id: string; order: number };
  // /// の扱い。quote: 対になった /// を引用ブロックにする（既定）
  // separator: メッセージと解説の区切り線として使われている（スポンサー記事）
  slashes?: 'quote' | 'separator';
  // 記事固有の構造を変換後の本文に適用する
  fix?: (body: string) => string;
};

const meta: Record<number, Meta> = {
  1: { slug: 'cinderella-castle-and-mount-prometheus', category: 'architecture', places: ['cinderella-castle', 'mount-prometheus', 'aquasphere'],
    description: 'ランドとシーのシンボルは同じ51m？ 地盤沈下を考慮した高さの噂と、シーの本当のシンボルを紹介。' },
  2: { slug: 'pixar-production-babies', category: 'film', tags: ['pixar', 'toy-story'],
    description: 'ピクサー映画のスタッフロールにある「PRODUCTION BABIES」。消えかけたトイ・ストーリーのデータを救ったエピソードとは。' },
  3: { slug: 'splash-mountain', category: 'attraction', tags: ['backstory', 'song-of-the-south', 'name-origin'], places: ['splash-mountain', 'grandma-saras-kitchen', 'rackettys-raccoon-saloon'],
    description: 'ランド最速のアトラクションのストーリー、原作「南部の唄」、チカピンヒルが水しぶきの山になった理由まで。' },
  4: { slug: 'italian-place-names-in-tokyo-disneysea', category: 'architecture', tags: ['name-origin'], places: ['mediterranean-harbor', 'piazza-topolino'],
    description: 'ピアッツァ・トッポリーノ＝ミッキー広場。メディテレーニアンハーバーに隠れたキャラクター名のイタリア語地名を紹介。' },
  5: { slug: 'steamboat-willie', category: 'film', tags: ['mickey', 'steamboat-willie', 'short-film'],
    description: 'ミッキーのデビュー作として知られる「蒸気船ウィリー」。本当のデビュー作や、ヒットの理由、著作権の話まで。' },
  6: { slug: 'pirates-of-the-caribbean', category: 'attraction', tags: ['backstory'], places: ['pirates-of-the-caribbean'],
    description: 'バトー、2回のタイムスリップ、義足の足跡。有名度の星付きで紹介するカリブの海賊の豆知識。' },
  7: { slug: 'ss-columbia', category: 'architecture', tags: ['backstory', 'past-shows'], places: ['ss-columbia'],
    description: 'タイタニック号がモデルのS.S.コロンビア号。姉妹船、沈没したガルガンチュア号、タグボートのヘラクレス号の物語。' },
  8: { slug: 'kingdom-hearts-worlds', category: 'game', tags: ['kingdom-hearts'], series: { id: 'kingdom-hearts', order: 1 },
    description: 'スクウェア・エニックスとディズニーのコラボ作品キングダム ハーツ。各作品で訪れるディズニーのワールドを一覧で紹介。' },
  9: { slug: 'three-little-pigs', category: 'film', tags: ['three-little-pigs', 'short-film', 'english-joke'], places: ['toontown'],
    description: '映像に隠された3匹のこぶたの両親の行方、3匹の見分け方、トゥーンタウンにある「その後」の会社まで。' },
  10: { slug: 'camp-woodchuck', category: 'architecture', tags: ['backstory', 'hidden-mickey'], places: ['camp-woodchuck'],
    description: 'ジュニア・ウッドチャックの世界本部、キャンプ・ウッドチャック。入口の切り株の意味と青い鳥ティッタートゥイルの話。' },
  11: { slug: 'port-discovery', category: 'architecture', tags: ['backstory', 'finding-nemo'], places: ['port-discovery', 'disneysea-electric-railway', 'horizon-bay-restaurant', 'nemo-and-friends-searider'],
    description: '100年前の人が考えた未来の港。タイムスリップする電車、海中レースの優勝艇、あえて東京湾を見せる工夫。' },
  12: { slug: 'the-band-concert-and-thru-the-mirror', category: 'film', tags: ['mickey', 'short-film', 'twisted-wonderland'], places: ['toontown', 'mickeys-philharmagic'],
    fix: (b) =>
      b
        .replace(/^## あらすじ$/gm, '### あらすじ')
        .replace(/^「(ミッキーの大演奏会|ミッキーの夢物語)(.+)$/gm, '## $1\n\n「$1$2'),
    description: '短編「ミッキーの大演奏会」と「ミッキーの夢物語」。トゥーンタウンの噴水やフィルハーマジック、ツイステとの関係も。' },
  13: { slug: 'lost-river-delta', category: 'architecture', tags: ['backstory', 'indiana-jones', 'name-origin'], places: ['lost-river-delta', 'indiana-jones-adventure', 'yucatan-base-camp-grill'],
    description: '3本の橋、複葉機の「C-3PO」、若さの泉の正体、クリスタルスカルに挑んだ男性と婚約者の悲しい物語。' },
  14: { slug: 'snow-white', category: 'film', tags: ['snow-white'],
    description: '世界初の長編カラーアニメーション「白雪姫」。頬の色付け、金髪の予定だった話、没になった曲、7つのオスカー像。' },
  15: { slug: 'haunted-mansion', category: 'attraction', tags: ['backstory', 'english-joke'], places: ['haunted-mansion'],
    description: '999人の亡霊が暮らす館。13分待ちの表示、伸びる部屋、ペッパーズゴーストなど、Qラインから出口までの仕掛け。' },
  16: { slug: 'magic-lamp-theater', category: 'attraction', tags: ['aladdin', 'hidden-mickey', 'past-shows'], places: ['magic-lamp-theater'],
    description: 'シャバーンとジーニーのマジックショー。隠れミッキー・隠れジーニーの場所や、アシームとシャバーンが出た別のショー。' },
  17: { slug: 'pinocchio', category: 'film', tags: ['pinocchio'], places: ['pinocchios-daring-journey'],
    description: '本来は第3作の予定だった「ピノキオ」。デザイン誕生の裏話、鼻が伸びるシーンの数、アトラクション周辺の再現。' },
  18: { slug: 'kingdom-hearts-characters', category: 'game', tags: ['kingdom-hearts'], series: { id: 'kingdom-hearts', order: 2 },
    description: '島組・鎧組・黄昏組。キングダム ハーツの光勢力のキャラクターを、名前の由来や伏線とともに紹介（ネタバレあり）。' },
  19: { slug: 'toontown-downtown', category: 'architecture', tags: ['backstory'], places: ['toontown'],
    description: 'トゥーンタウンのダウンタウンに並ぶ、スクルージの投資カウンセラーや義足専門店などのお店の設定を紹介。' },
  20: { slug: 'mermaid-lagoon', category: 'architecture', tags: ['backstory', 'little-mermaid'], places: ['mermaid-lagoon'],
    description: 'トリトン王が引き上げたお城。アンダー・ザ・シーで息ができる理由や、深く潜っていく演出の工夫を紹介。' },
  21: { slug: 'fantasia', category: 'film', tags: ['fantasia', 'mickey', 'past-shows', 'name-origin'],
    description: '最もパークに導入されている作品「ファンタジア」。7つのパートと、パークで見られるファンタジアの要素を紹介。' },
  22: { slug: 'buzz-lightyears-astro-blasters', category: 'attraction', tags: ['toy-story', 'pixar', 'hidden-mickey', 'sponsor'], places: ['buzz-lightyears-astro-blasters'],
    description: '赤外線の仕組みから座る位置、当てやすい高得点の的まで。アストロブラスターで高得点を取るコツをQ&Aで紹介。' },
  23: { slug: 'mysterious-island', category: 'architecture', tags: ['backstory', 'name-origin'], places: ['mysterious-island', 'mount-prometheus'],
    description: 'ネモ船長の秘密基地。クルーの挨拶「モビリス」と、資料から考察する謎のエネルギー源ネモニウムの正体。' },
  24: { slug: 'dumbo', category: 'film', tags: ['dumbo'], places: ['dumbo-the-flying-elephant'],
    description: '声優がいないダンボ、ピンクの象になるはずだったアトラクション、24分でリピートされるBGM全12曲。' },
  25: { slug: 'kingdom-hearts-timeline', category: 'game', tags: ['kingdom-hearts'], series: { id: 'kingdom-hearts', order: 3 },
    description: 'ダークロードで明らかになった新情報のまとめと、キングダム ハーツ全作品の時系列、最低限プレイしてほしい作品。' },
  26: { slug: 'ikspiari', category: 'architecture', tags: ['backstory', 'name-origin'], places: ['ikspiari'],
    fix: (b) =>
      b
        .replace(/^## /gm, '### ')
        .replace(/^(\d)\.(.+)$/gm, '## $1. $2')
        .replace(/^オススメのレストランを紹介$/m, '## オススメのレストラン'),
    description: '名前の由来、曜日を表す惑星のモニュメント、ゾーンごとの物語。イクスピアリの街並みとおすすめレストラン。' },
  27: { slug: 'sponsor-messages', category: 'other', tags: ['sponsor', 'english-joke'], slashes: 'separator',
    description: 'アトラクションの出口に刻まれたスポンサーのメッセージ。各社らしさが込められた言葉を紹介。' },
  28: { slug: 'duffy-and-friends', category: 'character', tags: ['duffy-and-friends'],
    description: 'ディズニーベアからダッフィーへ。シェリーメイからリーナ・ベルまで、ダッフィー&フレンズの歴史を振り返る。' },
  29: { slug: 'halloween-shows-ranking', category: 'show-parade', tags: ['halloween', 'past-shows'], places: ['tdl', 'tds'],
    fix: (b) => b.replace(/^(\d位)　(.+)$/gm, '### $1 $2'),
    description: '2004年以降のランドとシーのハロウィーンのショー・パレードから、個人的に好きなものをランキングで紹介。' },
  30: { slug: 'minnie-fashion-spots', category: 'architecture', tags: ['minnie', 'english-joke'], places: ['town-center-fashion', 'grand-emporium', 'minnies-style-studio'],
    description: 'タウンセンターファッション、マドモアゼル・ミニー、ミニーのスタイルスタジオ。ファッションデザイナー・ミニーの才能。' },
  31: { slug: 'mediterranean-harbor-bridges', category: 'architecture', tags: ['backstory', 'name-origin', 'past-shows'], places: ['mediterranean-harbor'],
    description: 'ポルト・パラディーゾの名前の由来となったダニエラ姫の物語と、メディテレーニアンハーバーにかかる8つの橋。' },
  32: { slug: 'cinderella', category: 'film', tags: ['cinderella', 'name-origin'], places: ['cinderellas-fairy-tale-hall', 'castle-carrousel', 'cinderella-castle'],
    description: 'ウォルト自身のシンデレラストーリー、名前の意味、ドレスが青い理由。フェアリーテイル・ホールの写真の撮り方も。' },
  33: { slug: 'jungle-cruise', category: 'attraction', tags: ['backstory', 'hidden-mickey', 'english-joke'], places: ['jungle-cruise'],
    description: '貿易会社から始まった探検ツアー。13艘のボートの名前、乗れたらラッキーなボート、スキッパーの献立まで。' },
  70: { slug: 'disney-fan-glossary', category: 'other', tags: ['glossary'],
    description: 'インパ、キャラグリ、トゥルった、チケブ。SNSでよく見るディズニーファンの専門用語を、基本編からまとめて解説。' },
};

const normalize = (s: string) => s.replace(/[\s　]/g, '');

// 本文の構造変換
const convertBody = (title: string, body: string, slashes: Meta['slashes'] = 'quote'): string => {
  let lines = body.split('\n').map((l) => l.replace(/\s+$/, '').replace(/^ +/, ''));

  // 本文1行目がタイトルと同じなら重複なので削除
  if (lines[0] && normalize(lines[0]) === normalize(title)) lines = lines.slice(1);

  const hasSection =
    slashes === 'separator' || lines.some((l) => /^<[^<>]+>$/.test(l) || /^\/{2,}[^/]+\/{2,}$/.test(l));
  const labelLevel = hasSection ? '###' : '##';

  const out: string[] = [];
  let inQuote = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1] ?? '';

    // <見出し> / ///見出し/// → ##
    let m = line.match(/^<([^<>]+)>$/) ?? line.match(/^\/{2,}([^/]+)\/{2,}$/);
    if (m) {
      out.push('', `## ${m[1].trim()}`, '');
      continue;
    }
    if (slashes === 'separator') {
      // /// は段落の区切りとして扱う
      if (line === '///') {
        out.push('');
        continue;
      }
      // 空行の直後にあり、次の行が ・ラベル の行 → グループ見出し（会社名）
      const prev = lines[i - 1] ?? '';
      if (line !== '' && !/^[・*]/.test(line) && (prev === '' || prev === '///') && /^・/.test(next)) {
        out.push('', `## ${line}`, '');
        continue;
      }
    }

    // /// 単独 → 引用ブロックの開始・終了、///ラベル → ラベル付きで引用開始
    m = line.match(/^\/{3}(.*)$/);
    if (m) {
      if (inQuote) {
        inQuote = false;
        out.push('');
      } else {
        inQuote = true;
        out.push('');
        if (m[1].trim()) out.push(`> **${m[1].trim()}**`, '>');
      }
      continue;
    }

    let text = line.replace(/</g, '\\<').replace(/[{}]/g, (c) => `\\${c}`);

    if (!inQuote) {
      const label = text.match(/^[・*](.+)$/);
      const prev = lines[i - 1] ?? '';
      // ・項目 の次行が →説明 → 太字の項目名（用語集・考察の形式）
      if (label && /^→/.test(next)) {
        out.push('', `**${label[1].trim()}**`);
        continue;
      }
      // ・ラベル / *ラベル の直後に説明が続く短い行 → 小見出し（直前も ・ なら箇条書きの最後の項目）
      const nextIsBody = next !== '' && !/^[・*]/.test(next);
      if (label && nextIsBody && !/^・/.test(prev) && label[1].length <= 30) {
        out.push('', `${labelLevel} ${label[1].trim()}`, '');
        continue;
      }
      // ・が連続する行（説明を挟まない）→ 箇条書き
      if (/^・/.test(text)) text = `- ${text.slice(1)}`;
      else if (/^\*/.test(text)) text = `\\${text}`;
    }

    out.push(inQuote ? (text === '' ? '>' : `> ${text}`) : text);
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
};

const yamlString = (s: string) => JSON.stringify(s);
const yamlList = (xs: string[] = []) => `[${xs.join(', ')}]`;

const dir = join(process.cwd(), 'content/articles');
mkdirSync(dir, { recursive: true });

for (const t of allTrivias) {
  const m = meta[t.id];
  if (!m) throw new Error(`meta がありません: id=${t.id} ${t.title}`);
  const fm = [
    '---',
    `title: ${yamlString(t.title)}`,
    `description: ${yamlString(m.description)}`,
    `category: ${m.category}`,
    `tags: ${yamlList(m.tags)}`,
    `places: ${yamlList(m.places)}`,
    ...(m.series ? [`series: { id: ${m.series.id}, order: ${m.series.order} }`] : []),
    `publishedAt: ${t.date}`,
    `legacyId: ${t.id}`,
    '---',
  ].join('\n');
  const body = convertBody(t.title, t.body, m.slashes);
  writeFileSync(join(dir, `${m.slug}.mdx`), `${fm}\n\n${m.fix ? m.fix(body) : body}`);
}

console.log(`${allTrivias.length} 件を書き出しました → content/articles/`);
