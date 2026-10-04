// 地平線のスカイライン。紙切り絵のように 3 層の平面的なシルエットを重ねる。
// 形は円・半円・三角・箱・尖塔・時計盤だけ。実在のファサードやキャラクターは描かない。
// 中層の塔には小窓があり、初回訪問時に 7 群に分かれて順に灯る（CSS の --g で群を指定）。

const BASE = 130; // viewBox の高さ＝地面の y
const WINDOW_COLORS = [
  'var(--cat-attraction)',
  'var(--cat-show-parade)',
  'var(--cat-character)',
  'var(--cat-architecture)',
  'var(--cat-film)',
  'var(--cat-game)',
  'var(--cat-other)',
];

type Tower = { x: number; w: number; h: number; roof: 'spire' | 'dome' | 'flat' | 'clock'; cols: number; rows: number };

const TOWERS: Tower[] = [
  { x: 28, w: 34, h: 70, roof: 'dome', cols: 2, rows: 3 },
  { x: 96, w: 22, h: 96, roof: 'spire', cols: 1, rows: 5 },
  { x: 150, w: 46, h: 58, roof: 'flat', cols: 3, rows: 3 },
  { x: 232, w: 28, h: 84, roof: 'clock', cols: 2, rows: 4 },
  { x: 300, w: 40, h: 64, roof: 'dome', cols: 2, rows: 3 },
  { x: 356, w: 18, h: 76, roof: 'spire', cols: 1, rows: 4 },
];

function Roof({ t }: { t: Tower }) {
  const top = BASE - t.h;
  const cx = t.x + t.w / 2;
  switch (t.roof) {
    case 'spire':
      return (
        <>
          <path d={`M${t.x} ${top} L${cx} ${top - 18} L${t.x + t.w} ${top} Z`} />
          <circle cx={cx} cy={top - 21} r={2.5} />
        </>
      );
    case 'dome':
      return <path d={`M${t.x} ${top} A${t.w / 2} ${t.w / 2} 0 0 1 ${t.x + t.w} ${top} Z`} />;
    case 'clock':
      return (
        <>
          <rect x={t.x + 6} y={top - 10} width={t.w - 12} height={10} />
          <circle cx={cx} cy={top - 18} r={9} />
          <circle cx={cx} cy={top - 18} r={6} className="skyline-face" />
          <circle cx={cx} cy={top - 18} r={1.5} />
        </>
      );
    default:
      return null;
  }
}

// 街は 390 幅で描き、左右に 2 つずつ複製して 5 枚分の幅にする。
// 等倍（slice）で中央を見せるので、PC では横に長く続き、スマホでは中央の 1 枚が見える
const TILE = 390;
const TILES = 5;

export function Skyline() {
  let windowIndex = 0;
  return (
    <svg
      className="skyline"
      viewBox={`${-TILE * 2} 0 ${TILE * TILES} ${BASE}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      {[-2, -1, 1, 2].map((i) => (
        <use key={i} href="#skyline-city" x={i * TILE} />
      ))}
      <g id="skyline-city">
      {/* 奥：低いドームと箱 */}
      <g className="skyline-back">
        <rect x={0} y={BASE - 40} width={390} height={40} />
        <path d={`M120 ${BASE - 40} A40 40 0 0 1 200 ${BASE - 40} Z`} />
        <path d={`M268 ${BASE - 40} A26 26 0 0 1 320 ${BASE - 40} Z`} />
        <path d={`M60 ${BASE - 40} L72 ${BASE - 86} L84 ${BASE - 40} Z`} />
        <path d={`M330 ${BASE - 40} L338 ${BASE - 74} L346 ${BASE - 40} Z`} />
      </g>

      {/* 中：窓のある塔 */}
      <g className="skyline-mid">
        {TOWERS.map((t) => (
          <g key={t.x}>
            <rect x={t.x} y={BASE - t.h} width={t.w} height={t.h} />
            <Roof t={t} />
          </g>
        ))}
      </g>
      <g className="skyline-windows">
        {TOWERS.flatMap((t) => {
          const gapX = (t.w - t.cols * 4) / (t.cols + 1);
          const gapY = 8;
          return Array.from({ length: t.rows }, (_, r) =>
            Array.from({ length: t.cols }, (_, c) => {
              const i = windowIndex++;
              return (
                <rect
                  key={`${t.x}-${r}-${c}`}
                  className="window"
                  x={t.x + gapX + c * (4 + gapX)}
                  y={BASE - t.h + 8 + r * (5 + gapY)}
                  width={4}
                  height={5}
                  rx={0.5}
                  fill={WINDOW_COLORS[(i * 3) % WINDOW_COLORS.length]}
                  style={{ ['--g' as string]: i % 7 }}
                />
              );
            }),
          );
        })}
      </g>

      {/* 手前：低い街並み */}
      <g className="skyline-front">
        <rect x={0} y={BASE - 18} width={390} height={18} />
        <rect x={120} y={BASE - 26} width={60} height={8} />
        <rect x={250} y={BASE - 24} width={40} height={6} />
        <path d={`M196 ${BASE - 26} L204 ${BASE - 44} L212 ${BASE - 26} Z`} />
        <circle cx={204} cy={BASE - 47} r={2} />
      </g>
      </g>
    </svg>
  );
}
