// The classic precinct height-ruler running floor-to-ceiling. Used as a
// background element on the booth + wall + (faintly) the case file.

export default function HeightRuler() {
  // Marks at every inch, taller at every foot. 8 feet tall total.
  const ft = [3, 4, 5, 6, 7]; // labeled feet
  const inchPerFoot = 12;
  const totalInches = 8 * inchPerFoot;

  const marks: Array<{ y: number; w: number; label?: string }> = [];
  for (let i = 0; i <= totalInches; i++) {
    const yPct = 100 - (i / totalInches) * 100;
    let w = 6;
    let label: string | undefined;
    if (i % 12 === 0) {
      w = 22;
      const f = Math.floor(i / 12);
      if (ft.includes(f)) label = `${f}'`;
    } else if (i % 6 === 0) {
      w = 14;
    } else if (i % 3 === 0) {
      w = 10;
    }
    marks.push({ y: yPct, w, label });
  }

  return (
    <svg
      className="mb-ruler"
      viewBox="0 0 60 320"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <pattern id="mb-noise" patternUnits="userSpaceOnUse" width="4" height="4">
          <rect width="4" height="4" fill="#c9bea4" />
          <circle cx="1.5" cy="1.5" r="0.3" fill="#a89c80" opacity="0.6" />
          <circle cx="3" cy="3" r="0.2" fill="#8d8268" opacity="0.4" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="60" height="320" fill="url(#mb-noise)" />
      <line x1="2" y1="0" x2="2" y2="320" stroke="#1a1612" strokeWidth="1" />
      {marks.map((m, i) => (
        <g key={i}>
          <line
            x1="2"
            y1={(m.y / 100) * 320}
            x2={2 + m.w}
            y2={(m.y / 100) * 320}
            stroke="#1a1612"
            strokeWidth="1"
          />
          {m.label && (
            <text
              x={2 + m.w + 4}
              y={(m.y / 100) * 320 + 4}
              fontFamily="Stardos Stencil, sans-serif"
              fontSize="10"
              fill="#1a1612"
              fontWeight="700"
            >
              {m.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
