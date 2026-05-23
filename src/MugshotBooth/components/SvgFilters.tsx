// Risograph print-imperfection filters used across the game. Mount once at
// the root.
//
// Approved aesthetic (after iterating with the user): edge wobble ONLY,
// no per-pixel dropouts. Real Riso prints get their texture from the
// halftone process + ink density variation in solids, not from particle
// dropouts — those just look like TV static when applied to UI surfaces.
//
// Filter catalog:
//   mb-rough        — buttons / chips / tape: subtle edge wobble
//   mb-stamp-rough  — stamps (GUILTY, EVIDENCE, FILED): slightly stronger
//                     wobble; reads as "hand-pressed and slightly tilted"
//   mb-headline     — very gentle wobble on hand-painted display type
//   mb-wash         — the red blob behind the headline: big slow turbulence

export default function SvgFilters() {
  return (
    <svg
      aria-hidden="true"
      style={{
        position: 'absolute',
        width: 0,
        height: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <defs>
        <filter id="mb-rough">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.2"
            numOctaves="1"
            seed="3"
            result="t"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="t"
            scale="1.2"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <filter id="mb-stamp-rough">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.2"
            numOctaves="1"
            seed="3"
            result="t"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="t"
            scale="1.5"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <filter id="mb-stamp-rough-b">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.4"
            numOctaves="1"
            seed="17"
            result="t"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="t"
            scale="1.6"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <filter id="mb-headline">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="2.0"
            numOctaves="1"
            seed="7"
            result="t"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="t"
            scale="0.7"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <filter id="mb-wash" x="-12%" y="-12%" width="124%" height="124%">
          <feTurbulence baseFrequency="0.014" numOctaves="2" seed="6" />
          <feDisplacementMap in="SourceGraphic" scale="14" />
        </filter>
        {/* alias kept for older usages in the codebase */}
        <filter id="mb-wash-wobble" x="-12%" y="-12%" width="124%" height="124%">
          <feTurbulence baseFrequency="0.014" numOctaves="2" seed="6" />
          <feDisplacementMap in="SourceGraphic" scale="14" />
        </filter>
      </defs>
    </svg>
  );
}
