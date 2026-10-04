// カテゴリの幾何形（Mary Blair 風の平面的なかたち）。塗りのみ、線なし。
// categories.ts の icon と対応する。表紙の右上の透かしなどに使う。

const star8 = (() => {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8 - Math.PI / 2;
    const r = i % 2 === 0 ? 20 : 8;
    pts.push(`${(24 + Math.cos(a) * r).toFixed(1)} ${(24 + Math.sin(a) * r).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
})();

const SHAPES: Record<string, React.ReactNode> = {
  circle: <circle cx={24} cy={24} r={18} />,
  'half-circle': <path d="M6 30a18 18 0 0 1 36 0z" />,
  triangle: <path d="M24 6 42 40H6z" />,
  spire: (
    <>
      <path d="M24 2 31 18H17z" />
      <rect x={17} y={18} width={14} height={28} />
    </>
  ),
  clock: (
    <>
      <circle cx={24} cy={24} r={18} />
      <circle cx={24} cy={24} r={13} className="motif-hole" />
      <circle cx={24} cy={24} r={2.5} />
    </>
  ),
  star: <path d={star8} />,
  moon: <path d="M30 4a20 20 0 1 0 14 34A16 16 0 0 1 30 4z" />,
  sun: (
    <>
      <circle cx={24} cy={24} r={10} />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={22.5} y={2} width={3} height={8} rx={1.5} transform={`rotate(${i * 45} 24 24)`} />
      ))}
    </>
  ),
};

export function Motif({ icon, className }: { icon: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false" fill="currentColor">
      {SHAPES[icon] ?? SHAPES.circle}
    </svg>
  );
}
