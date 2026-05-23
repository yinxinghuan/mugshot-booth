// Riso-style halftone treatment of a photograph. Renders to a canvas
// at 2× CSS size for HiDPI sharpness. Variable dot diameter follows
// sqrt(1 - local_luminance) so dark areas get filled dots and bright
// areas leave the paper showing through.
//
// Per-dot imperfection (jitter, alpha variance, occasional dropouts) is
// what gives the printed look — without it, dots look like a CSS gradient.
//
// Mount this component instead of an <img>. It auto-rerenders when src
// or ink color changes.

import { useEffect, useRef } from 'react';

interface Props {
  src: string;
  ink?: string;          // CSS color of the dots. Default cobalt blue.
  cell?: number;         // Dot grid cell in px (at 1×). Default 3.4.
  angle?: number;        // Grid rotation in degrees. Default -8.
  className?: string;
  /** width / height in CSS pixels — defines the layout box. */
  width: number;
  height: number;
}

export default function HalftonePhoto({
  src,
  ink = '#1d33c4',
  cell = 3.4,
  angle = -8,
  className,
  width,
  height,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Internal canvas at 2× for HiDPI sharpness.
    const dpr = 2;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (cancelled) return;
      render(canvas, img, ink, cell * dpr, angle);
    };
    img.onerror = () => {
      // Fall through silently — caller can render a fallback in its own
      // sibling element if the image fails.
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src, ink, cell, angle, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        display: 'block',
        width: `${width}px`,
        height: `${height}px`,
        mixBlendMode: 'multiply',
      }}
      aria-label="halftone mugshot"
    />
  );
}

function render(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  ink: string,
  cell: number,
  angleDeg: number,
): void {
  const W = canvas.width;
  const H = canvas.height;

  // Step 1: cover-fit the image into a scratch canvas at the target size.
  const scratch = document.createElement('canvas');
  scratch.width = W;
  scratch.height = H;
  const sctx = scratch.getContext('2d');
  if (!sctx) return;

  const ar = img.naturalWidth / img.naturalHeight;
  const tar = W / H;
  let sw: number;
  let sh: number;
  let sx: number;
  let sy: number;
  if (ar > tar) {
    sh = img.naturalHeight;
    sw = sh * tar;
    sx = (img.naturalWidth - sw) / 2;
    sy = 0;
  } else {
    sw = img.naturalWidth;
    sh = sw / tar;
    sx = 0;
    // Bias crop slightly upward — faces tend to sit in the upper third.
    sy = Math.max(0, (img.naturalHeight - sh) / 2 - sh * 0.04);
  }
  // Pre-process: hard contrast + slight brightness lift + desaturate.
  // Same recipe as prepareSelfie() so the halftone matches what the API
  // ref looks like. The aggressive contrast turns mid-tones into a more
  // bimodal distribution, which makes dot radii (sqrt(1-lum)) cluster
  // into "clearly inked" vs "clearly empty" — sharper Riso look.
  sctx.filter = 'contrast(1.45) brightness(1.04) saturate(0.7)';
  sctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
  sctx.filter = 'none';

  const data = sctx.getImageData(0, 0, W, H).data;

  // Step 2: draw dots onto the visible canvas.
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = ink;

  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // Deterministic PRNG so renders look identical across remounts.
  let seed = 1234;
  const rnd = (): number => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const jitter = 0.30 * (cell / 3.4);
  const radiusVar = 0.12;
  const gridR = Math.ceil(Math.hypot(W, H) / cell) + 4;

  for (let gy = -gridR; gy <= gridR; gy++) {
    for (let gx = -gridR; gx <= gridR; gx++) {
      const lx = gx * cell;
      const ly = gy * cell;
      const x = lx * cos - ly * sin + W / 2;
      const y = lx * sin + ly * cos + H / 2;
      if (x < -cell || x > W + cell || y < -cell || y > H + cell) continue;

      // 5-sample luminance average within the cell.
      let lum = 0;
      let count = 0;
      for (let s = 0; s < 5; s++) {
        const ox = (s - 2) * (cell / 6);
        const sxp = Math.max(0, Math.min(W - 1, Math.round(x + ox)));
        const syp = Math.max(0, Math.min(H - 1, Math.round(y + ox)));
        const idx = (syp * W + sxp) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        lum += (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        count++;
      }
      lum /= count;
      const inkAmount = Math.max(0, 1 - lum);
      if (inkAmount < 0.06) continue;

      const baseR = (cell / 2) * Math.sqrt(inkAmount);
      const r = baseR * (1 + (rnd() - 0.5) * radiusVar);
      const jx = (rnd() - 0.5) * jitter;
      const jy = (rnd() - 0.5) * jitter;

      // ~2% of dots dropped — print imperfection.
      if (rnd() < 0.02) continue;

      ctx.globalAlpha = 0.82 + rnd() * 0.16;
      ctx.beginPath();
      ctx.arc(x + jx, y + jy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
