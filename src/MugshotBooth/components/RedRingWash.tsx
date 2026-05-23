// The signature 360×360 red ring (donut) wash that anchors every screen.
// The hero text passes through it; the photo sits below it.
//
// Filled or hollow:
//   variant="ring"  — red ring with cream hole (default, the A signature)
//   variant="disc"  — solid red disk (for backgrounds behind photo)

interface Props {
  variant?: 'ring' | 'disc';
  /** CSS px width/height of the wash square. */
  size?: number;
  /** Inline style applied to the wrapper. Use it to position absolutely. */
  style?: React.CSSProperties;
  className?: string;
}

export default function RedRingWash({
  variant = 'ring',
  size = 360,
  style,
  className,
}: Props) {
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        width: size,
        height: size,
        pointerEvents: 'none',
        ...style,
      }}
    >
      <svg
        viewBox="0 0 360 360"
        width="100%"
        height="100%"
        style={{ display: 'block' }}
      >
        <g filter="url(#mb-wash)">
          <circle cx="180" cy="180" r="148" fill="#e6311d" opacity="0.92" />
          {variant === 'ring' && (
            <circle cx="180" cy="180" r="78" fill="#efe4c8" />
          )}
        </g>
      </svg>
    </div>
  );
}
