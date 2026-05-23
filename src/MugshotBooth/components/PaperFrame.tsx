// Common cream-paper frame + 4 small residue speckles + corner dash
// brush marks. Wraps each screen's content. Sized to fill the parent
// (typically the .mb-root viewport).

import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Show top-left dash brush mark. */
  dashTL?: boolean;
  dashTR?: boolean;
  dashML?: boolean;
  dashMR?: boolean;
}

export default function PaperFrame({
  children,
  dashTL = true,
  dashTR = true,
  dashML = false,
  dashMR = false,
}: Props) {
  return (
    <div className="mb-paper">
      <Residue />
      {dashTL && <div className="mb-dash mb-dash--tl" aria-hidden="true">– – – –</div>}
      {dashTR && <div className="mb-dash mb-dash--tr" aria-hidden="true">– – – –</div>}
      {dashML && <div className="mb-dash mb-dash--ml" aria-hidden="true">– – – –</div>}
      {dashMR && <div className="mb-dash mb-dash--mr" aria-hidden="true">– – – –</div>}
      {children}
    </div>
  );
}

function Residue() {
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
