import type { LookId } from './types';

/**
 * Ten visual languages.
 *
 * The rule for adding one: it must differ on at least two of four axes —
 * palette, light, ornament, motion — and it must be describable in one
 * sentence a viewer could repeat. A recolour is not a style.
 *
 * Everything static is painted once into a cached backdrop; `motion` runs per
 * frame and is only allowed to do cheap work (sprite blits, a few strokes).
 */

type Ctx = CanvasRenderingContext2D;

export interface LookDef {
  id: LookId;
  /** Dark rooms get a dark UI scrim; waraq is the one light room. */
  dark: boolean;
  fade: string;
  durationMs: number;
  type: {
    family: string;
    weight: number;
    /** Font size as a fraction of frame width. */
    size: number;
    color: string;
    /** Paint the type with the brass gradient instead of a flat colour. */
    foil?: boolean;
  };
  sourceColor: string;
  /** Hibr draws a rule above the verse. */
  rule?: boolean;
  /** Strength of the dark plate behind the verse (0–1). */
  plate: number;
  /** Radius of that plate, in frame widths. Wide looks need a wider plate. */
  plateR?: number;
  /**
   * Camera push over the clip, as a fraction of frame size. 0.03 = the scene
   * ends 3% closer than it started — a Ken Burns move. Enough to feel alive,
   * small enough that nothing important leaves the frame. The verse does not
   * move with it: the words stay put while the room breathes.
   */
  camera?: number;
  /** The gold corner frame drawn by the renderer. Off where the scene already
   *  has its own border (the two paper looks). */
  frame?: boolean;
  /**
   * A large ornament turning slowly behind the verse. It is the single most
   * recognisable device in Islamic greeting-card design, and it gives the flat
   * vector scenes a layer of depth they otherwise lack.
   */
  medallion?: boolean;
  backdrop(ctx: Ctx, w: number, h: number, s: number): void;
  motion?(ctx: Ctx, t: number, w: number, h: number, s: number, seed: string): void;
}

/* ------------------------------------------------------------------ utils */

export function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lin(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

function rad(ctx: Ctx, x: number, y: number, r: number, stops: [number, string][]) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

function plate(ctx: Ctx, w: number, h: number, strength: number, radius = 0.62) {
  const sc = rad(ctx, w * 0.5, h * 0.47, w * radius, [
    [0, `rgba(4,6,5,${strength})`],
    [0.7, `rgba(4,6,5,${strength * 0.45})`],
    [1, 'rgba(4,6,5,0)'],
  ]);
  ctx.fillStyle = sc;
  ctx.fillRect(0, 0, w, h);
}

function motes(
  ctx: Ctx,
  seed: string,
  t: number,
  w: number,
  h: number,
  s: number,
  strength: number,
  color = '247,235,201',
) {
  const rnd = mulberry32(hash(seed));
  for (let i = 0; i < 14; i++) {
    const bx = rnd() * w;
    const by = rnd() < 0.55 ? rnd() * h * 0.26 : h * (0.74 + rnd() * 0.26);
    const phase = rnd() * Math.PI * 2;
    const amp = (8 + rnd() * 18) * s;
    const spd = 0.22 + rnd() * 0.3;
    const x = bx + Math.sin(t * spd + phase) * amp;
    const y = by + Math.cos(t * spd * 0.8 + phase) * amp;
    const r = (1 + rnd() * 2.2) * s;
    const a = (0.12 + 0.32 * (0.5 + 0.5 * Math.sin(t * 0.6 + phase))) * strength;
    ctx.fillStyle = `rgba(${color},${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Bokeh: large soft orbs of light, drifting. This is what reads as "filmed"
 * rather than "drawn" — 1px motes are invisible on a phone.
 */
export function bokeh(
  ctx: Ctx,
  seed: string,
  t: number,
  w: number,
  h: number,
  s: number,
  strength: number,
  color = '255,232,190',
) {
  const rnd = mulberry32(hash(seed));
  for (let i = 0; i < 16; i++) {
    const bx = rnd() * w;
    // Top and bottom bands only: never the verse.
    const by = rnd() < 0.5 ? rnd() * h * 0.3 : h * (0.7 + rnd() * 0.28);
    const ph = rnd() * Math.PI * 2;
    const speed = 0.05 + rnd() * 0.09;
    const x = bx + Math.sin(t * speed + ph) * w * 0.1;
    const y = by + Math.cos(t * speed * 0.8 + ph) * h * 0.05;
    const r = w * (0.026 + rnd() * 0.075);
    const a = (0.09 + 0.16 * (0.5 + 0.5 * Math.sin(t * 0.5 + ph))) * strength;
    const g = rad(ctx, x, y, r, [
      [0, `rgba(${color},${a.toFixed(3)})`],
      [0.55, `rgba(${color},${(a * 0.35).toFixed(3)})`],
      [1, `rgba(${color},0)`],
    ]);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * A soft band of light crossing the frame. Used on the looks whose subject is
 * light itself; without it they read as stills.
 */
export function lightSweep(ctx: Ctx, t: number, w: number, h: number, period: number, alpha: number, color = '255,236,200') {
  const k = (t % period) / period;
  if (k > 0.55) return;
  const p = k / 0.55;
  const x = -w * 0.5 + p * w * 2;
  const g = ctx.createLinearGradient(x - w * 0.32, 0, x + w * 0.32, h);
  g.addColorStop(0, `rgba(${color},0)`);
  g.addColorStop(0.5, `rgba(${color},${alpha})`);
  g.addColorStop(1, `rgba(${color},0)`);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** A fine gold rule inset from the frame edge, closed with a diamond at each
 *  corner. It gives every room a designed edge instead of a raw border. */
export function goldFrame(ctx: Ctx, w: number, h: number, s: number, alpha = 0.3) {
  const m = Math.round(34 * s);
  ctx.save();
  ctx.strokeStyle = `rgba(214,179,106,${alpha})`;
  ctx.lineWidth = Math.max(1, 1.1 * s);
  ctx.strokeRect(m, m, w - m * 2, h - m * 2);
  const d = 5 * s;
  ctx.fillStyle = `rgba(240,220,168,${alpha + 0.15})`;
  for (const [cx, cy] of [
    [m, m],
    [w - m, m],
    [m, h - m],
    [w - m, h - m],
  ]) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - d);
    ctx.lineTo(cx + d, cy);
    ctx.lineTo(cx, cy + d);
    ctx.lineTo(cx - d, cy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Eight-fold star: two squares, one rotated 45°. */
function starScreen(ctx: Ctx, cx: number, cy: number, r: number, alpha: number, lw: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = `rgba(214,179,106,${alpha})`;
  ctx.lineWidth = lw;
  for (const rot of [0, Math.PI / 4]) {
    ctx.save();
    ctx.rotate(rot);
    ctx.strokeRect(-r * 0.7071, -r * 0.7071, r * 1.4142, r * 1.4142);
    ctx.restore();
  }
  ctx.restore();
}

/* ---------------------------------------------------------------- sprites */

let glowSprite: HTMLCanvasElement | null = null;
export function getGlowSprite(): HTMLCanvasElement {
  if (glowSprite) return glowSprite;
  const n = 512;
  const c = document.createElement('canvas');
  c.width = n;
  c.height = n;
  const x = c.getContext('2d')!;
  x.fillStyle = rad(x, n / 2, n / 2, n / 2, [
    [0, 'rgba(127,216,188,1)'],
    [0.62, 'rgba(127,216,188,0)'],
  ]);
  x.fillRect(0, 0, n, n);
  glowSprite = c;
  return c;
}

let warmGlow: HTMLCanvasElement | null = null;
export function getWarmGlow(): HTMLCanvasElement {
  if (warmGlow) return warmGlow;
  const n = 512;
  const c = document.createElement('canvas');
  c.width = n;
  c.height = n;
  const x = c.getContext('2d')!;
  x.fillStyle = rad(x, n / 2, n / 2, n / 2, [
    [0, 'rgba(255,222,160,1)'],
    [0.55, 'rgba(255,196,120,0)'],
  ]);
  x.fillRect(0, 0, n, n);
  warmGlow = c;
  return c;
}

const sweepCache = new Map<string, HTMLCanvasElement>();
function getSweep(w: number, h: number): HTMLCanvasElement {
  const key = `${w}x${h}`;
  const hit = sweepCache.get(key);
  if (hit) return hit;
  const bw = Math.max(64, Math.round(w * 0.44));
  const bh = Math.max(48, Math.round(h * 0.28));
  const c = document.createElement('canvas');
  c.width = bw;
  c.height = bh;
  const x = c.getContext('2d')!;
  x.fillStyle = lin(x, 0, 0, bw, 0, [
    [0, 'rgba(247,235,201,0)'],
    [0.5, 'rgba(247,235,201,0.14)'],
    [1, 'rgba(247,235,201,0)'],
  ]);
  x.fillRect(0, 0, bw, bh);
  sweepCache.set(key, c);
  return c;
}

const rosetteCache = new Map<string, HTMLCanvasElement>();
export function getRosette(size: number): HTMLCanvasElement {
  const hit = rosetteCache.get(String(size));
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const x = c.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.47;
  x.strokeStyle = 'rgba(214,179,106,0.13)';
  x.lineWidth = Math.max(1, size * 0.0022);

  // 16-point star, drawn as two rings of triangles.
  for (let ring = 0; ring < 2; ring++) {
    const rr = R * (ring === 0 ? 1 : 0.66);
    const n = 16;
    for (let i = 0; i < n; i++) {
      const a0 = (i * Math.PI * 2) / n;
      const a1 = ((i + 0.5) * Math.PI * 2) / n;
      const a2 = ((i + 1) * Math.PI * 2) / n;
      x.beginPath();
      x.moveTo(cx + Math.cos(a0) * rr, cy + Math.sin(a0) * rr);
      x.lineTo(cx + Math.cos(a1) * rr * 0.62, cy + Math.sin(a1) * rr * 0.62);
      x.lineTo(cx + Math.cos(a2) * rr, cy + Math.sin(a2) * rr);
      x.stroke();
    }
  }
  x.beginPath();
  x.arc(cx, cy, R * 0.33, 0, Math.PI * 2);
  x.stroke();
  rosetteCache.set(String(size), c);
  return c;
}

/* ------------------------------------------------------------------ looks */

export const LOOKS: Record<LookId, LookDef> = {
  sakina: {
    id: 'sakina',
    medallion: true,
    camera: 0.022,
    dark: true,
    fade: '#050706',
    durationMs: 15000,
    type: { family: 'Amiri,"Noto Naskh Arabic",serif', weight: 400, size: 0.086, color: '#F4EDE1' },
    sourceColor: '#D6B36A',
    plate: 0.4,
    backdrop(ctx, w, h, s) {
      ctx.fillStyle = lin(ctx, 0, 0, 0, h, [
        [0, '#0A2E24'],
        [0.45, '#08231B'],
        [1, '#04100C'],
      ]);
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = rad(ctx, w * 0.5, h * 0.04, w * 1.3, [
        [0, 'rgba(64,214,176,0.52)'],
        [0.34, 'rgba(31,140,116,0.26)'],
        [0.66, 'rgba(23,89,74,0)'],
      ]);
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = rad(ctx, w * 0.5, h * 1.04, w * 0.7, [
        [0, 'rgba(31,111,92,0.24)'],
        [1, 'rgba(31,111,92,0)'],
      ]);
      ctx.fillRect(0, 0, w, h);

      // The shaft: a single beam falling through the room.
      ctx.save();
      ctx.translate(w * 0.5, h * 0.34);
      ctx.rotate((6 * Math.PI) / 180);
      const sw = 150 * s;
      const sh = h * 0.92;
      ctx.fillStyle = lin(ctx, 0, -sh / 2, 0, sh / 2, [
        [0, 'rgba(244,237,225,0.16)'],
        [0.55, 'rgba(244,237,225,0.03)'],
        [1, 'rgba(244,237,225,0)'],
      ]);
      ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
      ctx.restore();

      starScreen(ctx, w * 0.5, h * 0.5, w * 0.62, 0.055, Math.max(1, 1.4 * s));
    },
    motion(ctx, t, w, h, s, seed) {
      bokeh(ctx, seed, t, w, h, s, 1.1);
      lightSweep(ctx, t, w, h, 11, 0.05);
      const pulse = 0.5 + 0.5 * Math.sin((t / 9) * Math.PI * 2);
      const r = w * 0.3 * (1 + 0.06 * pulse);
      ctx.save();
      ctx.globalAlpha = 0.07 + 0.07 * pulse;
      ctx.drawImage(getGlowSprite(), w * 0.5 - r, h * 0.16 - r, r * 2, r * 2);
      ctx.restore();
      motes(ctx, seed, t, w, h, s, 0.9);
    },
  },

  dhahab: {
    id: 'dhahab',
    camera: 0.016,
    dark: true,
    fade: '#050706',
    durationMs: 15000,
    type: {
      family: 'Amiri,"Noto Naskh Arabic",serif',
      weight: 400,
      size: 0.086,
      color: '#DCBA74',
      foil: true,
    },
    sourceColor: '#E8CF95',
    plate: 0.87,
    plateR: 1.0,
    backdrop(ctx, w, h, s) {
      ctx.fillStyle = lin(ctx, 0, 0, 0, h, [
        [0, '#150D05'],
        [0.38, '#2E1D0A'],
        [0.7, '#54380F'],
        [1, '#120B04'],
      ]);
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = rad(ctx, w * 0.5, h * 0.82, w * 0.95, [
        [0, 'rgba(214,179,106,0.30)'],
        [0.42, 'rgba(138,107,47,0.20)'],
        [0.74, 'rgba(138,107,47,0)'],
      ]);
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = rad(ctx, w * 0.5, h, w * 0.6, [
        [0, 'rgba(247,235,201,0.18)'],
        [1, 'rgba(247,235,201,0)'],
      ]);
      ctx.fillRect(0, 0, w, h);

      // Horizon + rays: the light has a source and a direction.
      const y = h * 0.795;
      ctx.strokeStyle = lin(ctx, 0, 0, w, 0, [
        [0, 'rgba(214,179,106,0)'],
        [0.5, 'rgba(240,220,168,0.30)'],
        [1, 'rgba(214,179,106,0)'],
      ]);
      ctx.lineWidth = Math.max(1, 1.2 * s);
      ctx.beginPath();
      ctx.moveTo(w * 0.12, y);
      ctx.lineTo(w * 0.88, y);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(240,220,168,0.05)';
      for (let i = -2; i <= 2; i++) {
        const spread = i * w * 0.42;
        ctx.beginPath();
        ctx.moveTo(w * 0.5 + spread * 0.1, y);
        ctx.lineTo(w * 0.5 + spread, y - h * 0.82);
        ctx.stroke();
      }
    },
    motion(ctx, t, w, h, s, seed) {
      bokeh(ctx, seed, t, w, h, s, 1.3, '255,226,168');
      lightSweep(ctx, t, w, h, 9, 0.06);
      const travel = Math.min(1, t / 2.2);
      const eased = 1 - Math.pow(1 - travel, 3);
      const cx = w * (-0.35 + eased * 1.7);
      const sprite = getSweep(w, h);
      ctx.drawImage(sprite, cx - sprite.width / 2, h - sprite.height);
      motes(ctx, seed, t, w, h, s, 0.7);
    },
  },

  hibr: {
    id: 'hibr',
    frame: false,
    camera: 0.03,
    dark: true,
    fade: '#050706',
    durationMs: 12000,
    type: {
      family: '"Reem Kufi","IBM Plex Sans Arabic",sans-serif',
      weight: 500,
      size: 0.078,
      color: '#F4EDE1',
    },
    sourceColor: '#D6B36A',
    rule: true,
    plate: 0.4,
    backdrop(ctx, w, h, s) {
      ctx.fillStyle = lin(ctx, 0, 0, 0, h, [
        [0, '#15110C'],
        [0.5, '#100D08'],
        [1, '#0B0906'],
      ]);
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = rad(ctx, w * 0.08, 0, w, [
        [0, 'rgba(31,111,92,0.11)'],
        [1, 'rgba(31,111,92,0)'],
      ]);
      ctx.fillRect(0, 0, w, h);

      // Laid paper: hibr's signature is the absence of light.
      ctx.strokeStyle = 'rgba(244,237,225,0.013)';
      ctx.lineWidth = Math.max(1, 1.1 * s);
      for (let y = 0; y < h; y += 10 * s) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    },
  },

  fajr: {
    id: 'fajr',
    medallion: true,
    camera: 0.02,
    dark: true,
    fade: '#0E0A14',
    durationMs: 15000,
    type: { family: 'Amiri,"Noto Naskh Arabic",serif', weight: 400, size: 0.086, color: '#FFF3E2' },
    sourceColor: '#F0C89A',
    plate: 0.8,
    plateR: 1.0,
    backdrop(ctx, w, h, s) {
      ctx.fillStyle = lin(ctx, 0, 0, 0, h, [
        [0, '#0E0A14'],
        [0.3, '#2A1622'],
        [0.55, '#6E3A34'],
        [0.68, '#C97C4E'],
        [0.72, '#E8A76B'],
        [0.78, '#3A2018'],
        [1, '#140C10'],
      ]);
      ctx.fillRect(0, 0, w, h);

      // A low sun under the horizon, and the light it throws up the sky.
      ctx.fillStyle = rad(ctx, w * 0.5, h * 0.74, w * 0.8, [
        [0, 'rgba(255,214,160,0.34)'],
        [0.4, 'rgba(226,140,90,0.14)'],
        [1, 'rgba(226,140,90,0)'],
      ]);
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(255,224,178,0.35)';
      ctx.lineWidth = Math.max(1, 1.2 * s);
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.725);
      ctx.lineTo(w * 0.92, h * 0.725);
      ctx.stroke();

      // Cloud bands, flat and wide.
      const rnd = mulberry32(0xfa1a);
      for (let i = 0; i < 5; i++) {
        const y = h * (0.5 + rnd() * 0.2);
        const hh = (10 + rnd() * 26) * s;
        ctx.fillStyle = `rgba(255,206,166,${(0.03 + rnd() * 0.05).toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(w * (0.2 + rnd() * 0.6), y, w * (0.3 + rnd() * 0.3), hh, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    motion(ctx, t, w, h, s) {
      const rise = 0.5 + 0.5 * Math.sin((t / 14) * Math.PI * 2);
      ctx.save();
      ctx.globalAlpha = 0.1 + 0.08 * rise;
      const r = w * 0.5;
      ctx.drawImage(getGlowSprite(), w * 0.5 - r, h * 0.74 - r, r * 2, r * 2);
      ctx.restore();
    },
  },

  layl: {
    id: 'layl',
    medallion: true,
    camera: 0.026,
    dark: true,
    fade: '#04060E',
    durationMs: 15000,
    type: { family: 'Amiri,"Noto Naskh Arabic",serif', weight: 400, size: 0.086, color: '#E4EBF7' },
    sourceColor: '#9FB6D8',
    plate: 0.52,
    backdrop(ctx, w, h, s) {
      ctx.fillStyle = lin(ctx, 0, 0, 0, h, [
        [0, '#0B1430'],
        [0.5, '#132052'],
        [1, '#070C1E'],
      ]);
      ctx.fillRect(0, 0, w, h);


      const rnd = mulberry32(0x1a71);
      for (let i = 0; i < 260; i++) {
        const x = rnd() * w;
        // Top and bottom bands only: a star behind a glyph is a 1.4:1 pixel.
        const y = rnd() < 0.55 ? rnd() * h * 0.3 : h * (0.72 + rnd() * 0.28);
        const r = (0.9 + rnd() * 2.4) * s;
        const a = 0.25 + rnd() * 0.65;
        ctx.fillStyle = `rgba(226,236,255,${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    motion(ctx, t, w, h, s) {
      const rnd = mulberry32(0x77aa);
      for (let i = 0; i < 26; i++) {
        const x = rnd() * w;
        const y = rnd() < 0.55 ? rnd() * h * 0.28 : h * (0.74 + rnd() * 0.26);
        const ph = rnd() * Math.PI * 2;
        const r = (0.9 + rnd() * 1.8) * s;
        const a = 0.25 + 0.55 * Math.abs(Math.sin(t * 0.9 + ph));
        ctx.fillStyle = `rgba(240,246,255,${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },

  nur: {
    id: 'nur',
    camera: 0.012,
    dark: true,
    fade: '#070605',
    durationMs: 15000,
    type: { family: 'Amiri,"Noto Naskh Arabic",serif', weight: 400, size: 0.09, color: '#F0DCA8' },
    sourceColor: '#D6B36A',
    plate: 0.44,
    backdrop(ctx, w, h) {
      ctx.fillStyle = lin(ctx, 0, 0, 0, h, [
        [0, '#1B1206'],
        [0.5, '#241706'],
        [1, '#0E0903'],
      ]);
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = rad(ctx, w * 0.5, h * 0.5, w * 0.75, [
        [0, 'rgba(214,179,106,0.08)'],
        [0.6, 'rgba(138,107,47,0.03)'],
        [1, 'rgba(138,107,47,0)'],
      ]);
      ctx.fillRect(0, 0, w, h);
    },
    motion(ctx, t, w, h) {
      // A lantern does not rotate; it breathes. A slow flicker in the glow.
      const f = 0.86 + 0.14 * Math.sin(t * 1.7) * Math.sin(t * 0.61);
      ctx.save();
      ctx.globalAlpha = f;
      const r = w * 0.42;
      ctx.drawImage(getWarmGlow(), w * 0.5 - r, h * 0.22 - r, r * 2, r * 2);
      ctx.restore();
    },
  },

  bustan: {
    id: 'bustan',
    medallion: true,
    camera: 0.032,
    dark: true,
    fade: '#05100A',
    durationMs: 12000,
    type: { family: 'Amiri,"Noto Naskh Arabic",serif', weight: 400, size: 0.084, color: '#F2EFE2' },
    sourceColor: '#C9A25E',
    plate: 0.46,
    backdrop(ctx, w, h, s) {
      ctx.fillStyle = lin(ctx, 0, 0, 0, h, [
        [0, '#0C3A27'],
        [0.55, '#0A2E1E'],
        [1, '#061A11'],
      ]);
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = rad(ctx, w * 0.5, h * 0.18, w * 0.9, [
        [0, 'rgba(46,139,116,0.20)'],
        [1, 'rgba(46,139,116,0)'],
      ]);
      ctx.fillRect(0, 0, w, h);

      // Arabesque: a scrolling vine on a 240px grid, drawn twice, offset.
      ctx.strokeStyle = 'rgba(201,162,94,0.17)';
      ctx.lineWidth = Math.max(1, 1.2 * s);
      const cell = 240 * s;
      for (let gy = -1; gy < h / cell + 1; gy++) {
        for (let gx = -1; gx < w / cell + 1; gx++) {
          const x = gx * cell;
          const y = gy * cell;
          ctx.beginPath();
          ctx.moveTo(x, y + cell * 0.5);
          ctx.bezierCurveTo(x + cell * 0.25, y, x + cell * 0.75, y, x + cell, y + cell * 0.5);
          ctx.bezierCurveTo(x + cell * 0.75, y + cell, x + cell * 0.25, y + cell, x, y + cell * 0.5);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + cell * 0.5, y + cell * 0.5, cell * 0.09, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    },
  },

  raml: {
    id: 'raml',
    medallion: true,
    camera: 0.018,
    dark: true,
    fade: '#1A1008',
    durationMs: 15000,
    type: { family: 'Amiri,"Noto Naskh Arabic",serif', weight: 400, size: 0.086, color: '#FFF1DE' },
    sourceColor: '#E8C49A',
    plate: 0.86,
    backdrop(ctx, w, h, s) {
      ctx.fillStyle = lin(ctx, 0, 0, 0, h, [
        [0, '#3A2110'],
        [0.42, '#6B4423'],
        [0.7, '#A96F3C'],
        [0.88, '#D9A566'],
        [1, '#4A2E18'],
      ]);
      ctx.fillRect(0, 0, w, h);

      // Dunes: three soft arcs, each a shade apart.
      const dunes = [
        { y: 0.78, amp: 0.05, c: 'rgba(232,196,154,0.16)' },
        { y: 0.85, amp: 0.04, c: 'rgba(160,110,66,0.28)' },
        { y: 0.93, amp: 0.03, c: 'rgba(90,58,32,0.5)' },
      ];
      for (const d of dunes) {
        ctx.fillStyle = d.c;
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(0, h * d.y);
        ctx.quadraticCurveTo(w * 0.35, h * (d.y - d.amp), w * 0.62, h * d.y);
        ctx.quadraticCurveTo(w * 0.85, h * (d.y + d.amp * 0.6), w, h * (d.y - d.amp * 0.4));
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = rad(ctx, w * 0.5, h * 0.82, w * 0.55, [
        [0, 'rgba(255,226,180,0.14)'],
        [1, 'rgba(255,226,180,0)'],
      ]);
      ctx.fillRect(0, 0, w, h);
    },
    motion(ctx, t, w, h, s, seed) {
      bokeh(ctx, seed, t, w, h, s, 1.5, '255,232,190');
      lightSweep(ctx, t, w, h, 10, 0.055);
      motes(ctx, seed, t, w, h, s, 0.5, '255,238,214');
    },
  },

  bahr: {
    id: 'bahr',
    medallion: true,
    camera: 0.02,
    dark: true,
    fade: '#04121A',
    durationMs: 15000,
    type: {
      family: '"Reem Kufi","IBM Plex Sans Arabic",sans-serif',
      weight: 500,
      size: 0.078,
      color: '#E2F6F6',
    },
    sourceColor: '#8FD8D8',
    plate: 0.56,
    backdrop(ctx, w, h, s) {
      ctx.fillStyle = lin(ctx, 0, 0, 0, h, [
        [0, '#0A3040'],
        [0.45, '#0D3E4C'],
        [0.72, '#104A56'],
        [1, '#062028'],
      ]);
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = rad(ctx, w * 0.5, h * 0.16, w * 0.7, [
        [0, 'rgba(143,216,216,0.16)'],
        [1, 'rgba(143,216,216,0)'],
      ]);
      ctx.fillRect(0, 0, w, h);

      // Still water: six horizontal rules of different weight.
      ctx.strokeStyle = 'rgba(143,216,216,0.10)';
      for (let i = 0; i < 6; i++) {
        ctx.lineWidth = Math.max(1, (0.8 + i * 0.5) * s);
        const y = h * (0.8 + i * 0.032);
        ctx.beginPath();
        ctx.moveTo(w * 0.05, y);
        ctx.lineTo(w * 0.95, y);
        ctx.stroke();
      }
    },
    motion(ctx, t, w, h, s) {
      ctx.save();
      ctx.strokeStyle = 'rgba(190,240,240,0.16)';
      ctx.lineWidth = Math.max(1, 1.4 * s);
      for (let i = 0; i < 4; i++) {
        const y = h * (0.82 + i * 0.036);
        const amp = (4 + i * 2) * s;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 12 * s) {
          const yy = y + Math.sin(x / (90 * s) + t * 0.8 + i) * amp;
          if (x === 0) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      ctx.restore();
    },
  },

  waraq: {
    id: 'waraq',
    frame: false,
    camera: 0.036,
    dark: false,
    fade: '#F3EAD9',
    durationMs: 12000,
    type: { family: 'Amiri,"Noto Naskh Arabic",serif', weight: 400, size: 0.086, color: '#1C1712' },
    sourceColor: '#8A6B2F',
    plate: 0,
    backdrop(ctx, w, h, s) {
      ctx.fillStyle = lin(ctx, 0, 0, 0, h, [
        [0, '#F7F0E2'],
        [0.5, '#F3EAD9'],
        [1, '#EADFC9'],
      ]);
      ctx.fillRect(0, 0, w, h);

      // Paper fibres.
      const rnd = mulberry32(0x9a9a);
      for (let i = 0; i < 240; i++) {
        const x = rnd() * w;
        const y = rnd() * h;
        const len = (6 + rnd() * 26) * s;
        ctx.strokeStyle = `rgba(120,96,60,${(0.02 + rnd() * 0.03).toFixed(3)})`;
        ctx.lineWidth = Math.max(0.6, 0.8 * s);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + len, y + (rnd() - 0.5) * 3);
        ctx.stroke();
      }

      // A double brass rule, inset like a page.
      const m = 54 * s;
      ctx.strokeStyle = 'rgba(176,138,74,0.55)';
      ctx.lineWidth = Math.max(1, 1.2 * s);
      ctx.strokeRect(m, m, w - m * 2, h - m * 2);
      ctx.strokeStyle = 'rgba(176,138,74,0.22)';
      ctx.strokeRect(m + 7 * s, m + 7 * s, w - (m + 7 * s) * 2, h - (m + 7 * s) * 2);

      // Corner diamonds on the inner rule.
      const d = 7 * s;
      ctx.fillStyle = 'rgba(176,138,74,0.5)';
      for (const [cx, cy] of [
        [m + 7 * s, m + 7 * s],
        [w - m - 7 * s, m + 7 * s],
        [m + 7 * s, h - m - 7 * s],
        [w - m - 7 * s, h - m - 7 * s],
      ]) {
        ctx.beginPath();
        ctx.moveTo(cx, cy - d);
        ctx.lineTo(cx + d, cy);
        ctx.lineTo(cx, cy + d);
        ctx.lineTo(cx - d, cy);
        ctx.closePath();
        ctx.fill();
      }
    },
  },
};

export const LOOK_ORDER: LookId[] = [
  'sakina',
  'dhahab',
  'hibr',
  'fajr',
  'layl',
  'nur',
  'bustan',
  'raml',
  'bahr',
  'waraq',
];

/** The three the TDT protocol pre-registered; the study still tests these. */
export const STUDY_LOOKS: LookId[] = ['sakina', 'dhahab', 'hibr'];

export { plate };
