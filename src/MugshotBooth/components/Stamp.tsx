// A stamp / chip element. Variants:
//   guilty   — large double-ring red GUILTY-style stamp with subtext.
//              Used for the main verdict stamp.
//   solid    — filled rectangular chip (WANTED / EVIDENCE / MOST WANTED).
//   outline  — outlined rectangular chip (FREE BOOKING / PROCESSED).
//
// All variants apply the edge-wobble (mb-stamp-rough) SVG filter so they
// read as hand-pressed.

import type { CSSProperties, ReactNode } from 'react';

export type StampVariant = 'guilty' | 'solid' | 'outline';
export type StampColor = 'red' | 'blue';

interface BaseProps {
  variant: StampVariant;
  color?: StampColor;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
  /** Optional sub-text for the 'guilty' variant. */
  sub?: string;
}

export default function Stamp({
  variant,
  color = 'red',
  style,
  className,
  children,
  sub,
}: BaseProps) {
  const tint = color === 'red' ? 'var(--mb-red)' : 'var(--mb-blue-deep)';

  if (variant === 'guilty') {
    return (
      <div
        className={`mb-stamp mb-stamp--guilty ${className ?? ''}`}
        style={{
          color: tint,
          borderColor: tint,
          ...style,
        }}
        aria-hidden="true"
      >
        <div className="mb-stamp__big">{children}</div>
        {sub && <div className="mb-stamp__sub">{sub}</div>}
      </div>
    );
  }

  if (variant === 'solid') {
    return (
      <div
        className={`mb-stamp mb-stamp--solid ${className ?? ''}`}
        style={{
          background: color === 'red' ? 'var(--mb-red)' : 'var(--mb-blue)',
          color: 'var(--mb-paper)',
          ...style,
        }}
        aria-hidden="true"
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`mb-stamp mb-stamp--outline ${className ?? ''}`}
      style={{
        color: tint,
        borderColor: tint,
        ...style,
      }}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}
