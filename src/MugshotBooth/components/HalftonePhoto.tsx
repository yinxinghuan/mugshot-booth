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

import { useEffect, useRef, useState } from 'react';

interface Props {
  src: string;
  ink?: string;          // CSS color of the dots. Default cobalt blue.
  cell?: number;         // Dot grid cell in px (at 1×). Default 2.2.
  angle?: number;        // Grid rotation in degrees. Default -8.
  className?: string;
  /** width / height in CSS pixels — defines the layout box. */
  width: number;
  height: number;
}

export default function HalftonePhoto({
  src,
  ink = '#1d33c4',
  cell = 2.2,
  angle = -8,
  className,
  width,
  height,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // canvasDrew flips to true when the CORS-anonymous image loaded AND
  // we successfully called render() — at that point we hide the <img>
  // fallback so the canvas halftone is the only thing showing.
  const [canvasDrew, setCanvasDrew] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setCanvasDrew(false);

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
      try {
        render(canvas, img, ink, cell * dpr, angle);
        setCanvasDrew(true);
      } catch {
        // getImageData may throw SecurityError on a tainted canvas even
        // if the image loaded. Treat as failure → leave img fallback on.
        setCanvasDrew(false);
      }
    };
    img.onerror = () => {
      // CORS-anonymous load failed (host has no Access-Control-Allow-
      // Origin). The plain <img> fallback below still loads the asset.
      setCanvasDrew(false);
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src, ink, cell, angle, width, height]);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: `${width}px`,
        height: `${height}px`,
        display: 'block',
      }}
    >
      {/* Fallback <img> — only shown when the canvas couldn't draw
          (CORS-blocked host like images.aiwaves.tech). When canvas
          succeeded we hide this so the halftone is the only thing
          visible (original aesthetic). */}
      {!canvasDrew && (
        <img
          src={src}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'grayscale(1) contrast(1.25) brightness(1.02)',
            mixBlendMode: 'multiply',
            zIndex: 1,
          }}
        />
      )}
      {/* Halftone canvas. Requires CORS — if the image can't be read for
          luminance sampling, this canvas stays empty and the <img>
          fallback above shows through. */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'block',
          width: `${width}px`,
          height: `${height}px`,
          mixBlendMode: 'multiply',
          zIndex: 2,
        }}
        aria-label="halftone mugshot"
      />
    </div>
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
  // Mild contrast lift + slight desaturation. Hard contrast pushed
  // mid-tones into binary 0/1 territory and destroyed face features —
  // user reported the rendered photo no longer looked like the source.
  // Halftone dots already provide the bimodal print look; we don't need
  // to crush the source image to get there.
  sctx.filter = 'contrast(1.12) brightness(1.02) saturate(0.85)';
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
      // Lower threshold = mid-tones still produce small dots instead
      // of being treated as paper. Crucial for showing facial detail.
      if (inkAmount < 0.025) continue;

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
