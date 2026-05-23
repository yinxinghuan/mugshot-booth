// Procedural booth audio — camera shutter, typewriter clack, stamp thud,
// ambient precinct hum. Web Audio synthesised on demand; no asset files.
//
// First-touch unlocked from the user pointerdown handler upstream — we don't
// auto-start on mount (preload safety).

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx) return ctx;
  const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
  if (!Ctx) return null;
  ctx = new Ctx();
  return ctx;
}

function resumeCtx(): AudioContext | null {
  const c = getCtx();
  if (!c) return null;
  if (c.state === 'suspended') c.resume().catch(() => { /* ignore */ });
  return c;
}

/** SLR-style camera shutter — short clack with two transients. */
export function playShutter(): void {
  const c = resumeCtx();
  if (!c) return;
  const now = c.currentTime;
  const out = c.createGain();
  out.gain.value = 0.6;
  out.connect(c.destination);

  // First click — high-pass burst.
  for (const offset of [0, 0.045]) {
    const buf = noiseBuffer(c, 0.06);
    const src = c.createBufferSource();
    src.buffer = buf;
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1600;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, now + offset);
    g.gain.exponentialRampToValueAtTime(0.5, now + offset + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.07);
    src.connect(hp).connect(g).connect(out);
    src.start(now + offset);
    src.stop(now + offset + 0.08);
  }
}

/** Typewriter key clack — short pitched click. */
export function playTypewriter(): void {
  const c = resumeCtx();
  if (!c) return;
  const now = c.currentTime;
  const noise = c.createBufferSource();
  noise.buffer = noiseBuffer(c, 0.03);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1800 + Math.random() * 600;
  bp.Q.value = 4;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.18, now + 0.002);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  noise.connect(bp).connect(g).connect(c.destination);
  noise.start(now);
  noise.stop(now + 0.05);
}

/** Heavy rubber-stamp thud — low thump + paper-slap noise. */
export function playStamp(): void {
  const c = resumeCtx();
  if (!c) return;
  const now = c.currentTime;
  // Low body.
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(45, now + 0.16);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.55, now + 0.008);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  osc.connect(g).connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.24);
  // Slap noise.
  const noise = c.createBufferSource();
  noise.buffer = noiseBuffer(c, 0.08);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 600;
  bp.Q.value = 0.7;
  const gn = c.createGain();
  gn.gain.setValueAtTime(0.0001, now);
  gn.gain.exponentialRampToValueAtTime(0.4, now + 0.003);
  gn.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  noise.connect(bp).connect(gn).connect(c.destination);
  noise.start(now);
  noise.stop(now + 0.12);
}

/** Small UI click — used on most button taps. */
export function playClick(): void {
  const c = resumeCtx();
  if (!c) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  osc.type = 'square';
  osc.frequency.value = 920;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.08, now + 0.003);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  osc.connect(g).connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.05);
}

// ─── Ambient precinct hum — fluorescent buzz + distant typewriters ────────

let ambientStop: (() => void) | null = null;

export function startAmbient(): void {
  const c = resumeCtx();
  if (!c) return;
  if (ambientStop) return;

  // Fluorescent buzz: 60Hz sawtooth, very faint, gentle swell.
  const buzz = c.createOscillator();
  buzz.type = 'sawtooth';
  buzz.frequency.value = 60;
  const buzzFilter = c.createBiquadFilter();
  buzzFilter.type = 'lowpass';
  buzzFilter.frequency.value = 180;
  const buzzGain = c.createGain();
  buzzGain.gain.value = 0;
  buzz.connect(buzzFilter).connect(buzzGain).connect(c.destination);
  buzz.start();

  // Slow LFO-style swell: 6s rise → 12s hold → 8s fade → 14s silence, looped.
  // Implemented with chained setValueAtTime so it's bounded (no setInterval).
  function schedule(at: number): number {
    const peak = 0.012 + Math.random() * 0.008;
    buzzGain.gain.setValueAtTime(0.0001, at);
    buzzGain.gain.exponentialRampToValueAtTime(peak, at + 5 + Math.random() * 2);
    buzzGain.gain.setValueAtTime(peak, at + 5 + 8 + Math.random() * 4);
    buzzGain.gain.exponentialRampToValueAtTime(0.0001, at + 5 + 8 + 4 + 6 + Math.random() * 3);
    return at + 5 + 8 + 4 + 6 + 6 + Math.random() * 5;
  }

  const ctxRef = c;
  let nextAt = ctxRef.currentTime + 1.5;
  const ticks: ReturnType<typeof setTimeout>[] = [];
  function chain() {
    const end = schedule(nextAt);
    const wait = (end - ctxRef.currentTime) * 1000;
    ticks.push(setTimeout(() => {
      nextAt = end + 0.5 + Math.random() * 2;
      chain();
    }, wait));
  }
  chain();

  ambientStop = () => {
    buzz.stop();
    buzz.disconnect();
    buzzGain.disconnect();
    for (const t of ticks) clearTimeout(t);
  };
}

export function stopAmbient(): void {
  if (ambientStop) {
    try { ambientStop(); } catch { /* ignore */ }
    ambientStop = null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function noiseBuffer(c: AudioContext, durSec: number): AudioBuffer {
  const sampleRate = c.sampleRate;
  const len = Math.max(1, Math.floor(sampleRate * durSec));
  const buf = c.createBuffer(1, len, sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buf;
}
