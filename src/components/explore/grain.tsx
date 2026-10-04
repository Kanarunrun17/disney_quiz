// 紙のざらつき。160px のノイズのタイルを敷き詰める（全面に filter を掛けるより軽い）。

export function Grain() {
  return (
    <svg className="grain" aria-hidden="true" focusable="false">
      <defs>
        <filter id="grain-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <pattern id="grain-tile" width="160" height="160" patternUnits="userSpaceOnUse">
          <rect width="160" height="160" filter="url(#grain-noise)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grain-tile)" />
    </svg>
  );
}
