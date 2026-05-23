// "Chunky brick" button — Style A from the mockup review.
// 22px stencil + 2.5px ink border + 5px offset shadow + slight tilt +
// rough edge wobble.
//
// Variants:
//   primary   — red bg (the call-to-action; high contrast)
//   secondary — blue bg (paired secondary action)
//   ghost     — outline only, transparent bg

import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Optional override tilt in degrees. Defaults to a tiny alternating tilt
   *  via the parent .mb-actions block's nth-child rules. */
  tilt?: number;
  children: ReactNode;
}

export default function Chip({
  variant = 'secondary',
  tilt,
  children,
  className = '',
  style,
  ...rest
}: Props) {
  const mod = `mb-chip--${variant}`;
  const inline = tilt !== undefined
    ? { ...style, '--mb-chip-tilt': `${tilt}deg` } as React.CSSProperties
    : style;
  return (
    <button
      type="button"
      className={`mb-chip ${mod} ${className}`}
      style={inline}
      {...rest}
    >
      {children}
    </button>
  );
}
