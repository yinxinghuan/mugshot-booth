// Subtle ink-residue speckles overlay — 4-5 tiny dots scattered across
// the page. Pure decoration. Z-index: 1.

export default function Residue() {
  return (
    <svg
      className="mb-residue"
      viewBox="0 0 414 896"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <circle cx="22"  cy="430" r="1.5" fill="#e6311d" opacity=".55" />
      <circle cx="386" cy="74"  r="1.0" fill="#1d33c4" opacity=".5"  />
      <circle cx="298" cy="800" r="1.2" fill="#1d33c4" opacity=".5"  />
      <circle cx="186" cy="860" r="1.0" fill="#e6311d" opacity=".5"  />
      <ellipse cx="370" cy="500" rx="6" ry="2" fill="#1d33c4" opacity=".18" transform="rotate(28 370 500)"/>
    </svg>
  );
}
