import type { LookId } from './types';

/**
 * Scene layers.
 *
 * A style is not a gradient with a line of text on it. Each one now has a
 * *place*: architecture, landscape, water, a page. The rule for every scene is
 * the same — keep the middle band (38%–62% of the frame) calm, because that is
 * where the verse sits, and put the depth cues at the top and bottom.
 *
 * Everything here is painted once into the cached backdrop, so the cost per
 * frame is zero. No external images: the whole product stays offline and the
 * export stays deterministic.
 */

type Ctx = CanvasRenderingContext2D;

/* ------------------------------------------------------------------ utils */

function poly(ctx: Ctx, pts: [number, number][], fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
}

function dome(ctx: Ctx, cx: number, baseY: number, r: number, fill: string) {
  ctx.fillStyle = fill;
  // drum
  ctx.fillRect(cx - r, baseY - r * 0.3, r * 2, r * 0.3);
  // onion dome
  ctx.beginPath();
  ctx.moveTo(cx - r, baseY - r * 0.3);
  ctx.bezierCurveTo(cx - r * 1.02, baseY - r * 1.22, cx - r * 0.42, baseY - r * 1.5, cx, baseY - r * 1.62);
  ctx.bezierCurveTo(cx + r * 0.42, baseY - r * 1.5, cx + r * 1.02, baseY - r * 1.22, cx + r, baseY - r * 0.3);
  ctx.closePath();
  ctx.fill();
  // finial
  ctx.fillRect(cx - r * 0.045, baseY - r * 1.95, r * 0.09, r * 0.36);
}

function minaret(ctx: Ctx, x: number, baseY: number, h: number, w: number, fill: string) {
  ctx.fillStyle = fill;
  // shaft, tapering
  ctx.beginPath();
  ctx.moveTo(x - w * 0.5, baseY);
  ctx.lineTo(x - w * 0.36, baseY - h * 0.78);
  ctx.lineTo(x + w * 0.36, baseY - h * 0.78);
  ctx.lineTo(x + w * 0.5, baseY);
  ctx.closePath();
  ctx.fill();
  // balcony
  ctx.fillRect(x - w * 0.92, baseY - h * 0.78, w * 1.84, h * 0.035);
  // upper shaft + dome cap + finial
  ctx.fillRect(x - w * 0.3, baseY - h * 0.98, w * 0.6, h * 0.2);
  ctx.beginPath();
  ctx.moveTo(x - w * 0.34, baseY - h * 0.98);
  ctx.bezierCurveTo(x - w * 0.34, baseY - h * 1.12, x + w * 0.34, baseY - h * 1.12, x + w * 0.34, baseY - h * 0.98);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - w * 0.13, baseY - h * 1.1);
  ctx.lineTo(x, baseY - h * 1.2);
  ctx.lineTo(x + w * 0.13, baseY - h * 1.1);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x - w * 0.035, baseY - h * 1.3, w * 0.07, h * 0.11);
}

function camel(ctx: Ctx, x: number, y: number, k: number, fill: string) {
  ctx.fillStyle = fill;
  // body
  ctx.beginPath();
  ctx.ellipse(x, y, 15 * k, 8 * k, 0, 0, Math.PI * 2);
  ctx.fill();
  // hump
  ctx.beginPath();
  ctx.ellipse(x - 1 * k, y - 7 * k, 6 * k, 5 * k, 0, 0, Math.PI * 2);
  ctx.fill();
  // neck + head
  ctx.beginPath();
  ctx.moveTo(x + 10 * k, y - 4 * k);
  ctx.quadraticCurveTo(x + 19 * k, y - 10 * k, x + 18 * k, y - 20 * k);
  ctx.lineTo(x + 22 * k, y - 20 * k);
  ctx.quadraticCurveTo(x + 23 * k, y - 8 * k, x + 15 * k, y + 1 * k);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 21 * k, y - 21 * k, 3.4 * k, 2.2 * k, -0.35, 0, Math.PI * 2);
  ctx.fill();
  // legs
  for (const lx of [-9, -4, 5, 10]) {
    ctx.fillRect(x + lx * k - 1.1 * k, y + 4 * k, 2.2 * k, 12 * k);
  }
  // tail
  ctx.fillRect(x - 16 * k, y - 2 * k, 2 * k, 9 * k);
}

function boat(ctx: Ctx, x: number, y: number, k: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x - 26 * k, y);
  ctx.quadraticCurveTo(x, y + 12 * k, x + 26 * k, y);
  ctx.lineTo(x + 18 * k, y + 5 * k);
  ctx.lineTo(x - 18 * k, y + 5 * k);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x - 1 * k, y - 46 * k, 1.8 * k, 46 * k);
  // lateen sail
  ctx.beginPath();
  ctx.moveTo(x + 1 * k, y - 44 * k);
  ctx.quadraticCurveTo(x + 30 * k, y - 30 * k, x + 26 * k, y - 6 * k);
  ctx.lineTo(x + 2 * k, y - 6 * k);
  ctx.closePath();
  ctx.fill();
}

function cypress(ctx: Ctx, x: number, baseY: number, h: number, w: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x, baseY - h);
  ctx.bezierCurveTo(x + w * 0.72, baseY - h * 0.62, x + w * 0.62, baseY - h * 0.1, x, baseY);
  ctx.bezierCurveTo(x - w * 0.62, baseY - h * 0.1, x - w * 0.72, baseY - h * 0.62, x, baseY - h);
  ctx.fill();
}

function rays(ctx: Ctx, x: number, y: number, spread: number, len: number, n: number, alpha: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i - (n - 1) / 2) * spread;
    const ex = x + Math.cos(a) * len;
    const ey = y + Math.sin(a) * len;
    const g = ctx.createLinearGradient(x, y, ex, ey);
    g.addColorStop(0, `rgba(255,238,200,${alpha})`);
    g.addColorStop(1, 'rgba(255,238,200,0)');
    ctx.strokeStyle = g;
    ctx.lineWidth = len * 0.16;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

function archPath(ctx: Ctx, x: number, y: number, w: number, h: number) {
  const r = w / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + h * 0.42);
  ctx.bezierCurveTo(x, y + h * 0.12, x + w * 0.22, y, x + r, y);
  ctx.bezierCurveTo(x + w * 0.78, y, x + w, y + h * 0.12, x + w, y + h * 0.42);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

function stars(ctx: Ctx, w: number, n: number, seed: number, y0: number, y1: number) {
  let a = seed;
  const rnd = () => {
    a = (a * 1664525 + 1013904223) >>> 0;
    return a / 4294967296;
  };
  for (let i = 0; i < n; i++) {
    const x = rnd() * w;
    const y = y0 + rnd() * (y1 - y0);
    const r = 0.8 + rnd() * 1.8;
    ctx.fillStyle = `rgba(226,236,255,${(0.25 + rnd() * 0.6).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ----------------------------------------------------------------- scenes */

export const SCENES: Partial<Record<LookId, (ctx: Ctx, w: number, h: number, s: number) => void>> = {
  /** A dim prayer hall: one window, one beam, a floor that catches it. */
  sakina(ctx, w, h, s) {
    const wx = w * 0.5;
    const wy = h * 0.06;
    const ww = w * 0.34;
    const wh = h * 0.2;

    // Window niche, lit from outside.
    ctx.save();
    archPath(ctx, wx - ww / 2, wy, ww, wh);
    ctx.clip();
    const wg = ctx.createLinearGradient(0, wy, 0, wy + wh);
    wg.addColorStop(0, 'rgba(214,255,238,0.55)');
    wg.addColorStop(0.6, 'rgba(120,220,190,0.18)');
    wg.addColorStop(1, 'rgba(60,160,130,0.05)');
    ctx.fillStyle = wg;
    ctx.fillRect(wx - ww / 2, wy, ww, wh);
    // mullions
    ctx.strokeStyle = 'rgba(6,18,14,0.85)';
    ctx.lineWidth = 4 * s;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(wx - ww / 2 + (ww / 4) * i, wy);
      ctx.lineTo(wx - ww / 2 + (ww / 4) * i, wy + wh);
      ctx.stroke();
    }
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(wx - ww / 2, wy + (wh / 3) * i);
      ctx.lineTo(wx + ww / 2, wy + (wh / 3) * i);
      ctx.stroke();
    }
    ctx.restore();

    // The beam that comes through it.
    rays(ctx, wx, wy + wh * 0.5, 0.17, h * 0.86, 7, 0.055);

    // Floor: a soft pool where the light lands.
    const fg = ctx.createRadialGradient(wx, h * 0.98, 0, wx, h * 0.98, w * 0.75);
    fg.addColorStop(0, 'rgba(214,255,238,0.13)');
    fg.addColorStop(1, 'rgba(214,255,238,0)');
    ctx.fillStyle = fg;
    ctx.fillRect(0, h * 0.6, w, h * 0.4);

    // Two columns, near-black, framing the hall.
    ctx.fillStyle = 'rgba(3,8,6,0.92)';
    ctx.fillRect(0, 0, w * 0.055, h);
    ctx.fillRect(w * 0.945, 0, w * 0.055, h);
  },

  /** Golden hour: a low sun, three dune ridges, a caravan on the far one. */
  dhahab(ctx, w, h, s) {
    const sunY = h * 0.735;
    const sunR = w * 0.075;

    const glow = ctx.createRadialGradient(w * 0.5, sunY, 0, w * 0.5, sunY, w * 0.62);
    glow.addColorStop(0, 'rgba(255,226,168,0.55)');
    glow.addColorStop(0.3, 'rgba(226,168,90,0.22)');
    glow.addColorStop(1, 'rgba(226,168,90,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(255,240,206,0.92)';
    ctx.beginPath();
    ctx.arc(w * 0.5, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();

    const ridge = (y: number, amp: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, h * y);
      ctx.bezierCurveTo(w * 0.3, h * (y - amp * 1.7), w * 0.62, h * (y + amp * 1.1), w, h * (y - amp * 0.6));
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
    };
    ridge(0.775, 0.028, 'rgba(74,48,24,0.5)');
    ridge(0.835, 0.032, 'rgba(46,29,14,0.8)');
    // The caravan walks the second ridge.
    camel(ctx, w * 0.29, h * 0.828, 1.05 * s, 'rgba(22,13,5,0.92)');
    camel(ctx, w * 0.35, h * 0.832, 0.9 * s, 'rgba(22,13,5,0.92)');
    camel(ctx, w * 0.4, h * 0.835, 0.75 * s, 'rgba(22,13,5,0.92)');
    ridge(0.93, 0.03, 'rgba(16,10,5,0.96)');
  },

  /** A manuscript page: a brush swash above, a seal below, a ruled border. */
  hibr(ctx, w, h, s) {
    // Ruled page border, like a book margin.
    ctx.strokeStyle = 'rgba(244,237,225,0.09)';
    ctx.lineWidth = 1.2 * s;
    ctx.strokeRect(w * 0.07, h * 0.055, w * 0.86, h * 0.89);
    ctx.strokeStyle = 'rgba(244,237,225,0.05)';
    ctx.strokeRect(w * 0.085, h * 0.068, w * 0.83, h * 0.864);

    // The swash: one heavy stroke, the way a reed pen lands.
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(214,179,106,0.42)';
    ctx.lineWidth = 7 * s;
    ctx.beginPath();
    ctx.moveTo(w * 0.17, h * 0.155);
    ctx.bezierCurveTo(w * 0.34, h * 0.095, w * 0.55, h * 0.19, w * 0.7, h * 0.135);
    ctx.bezierCurveTo(w * 0.78, h * 0.108, w * 0.8, h * 0.115, w * 0.83, h * 0.128);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(214,179,106,0.18)';
    ctx.lineWidth = 2.4 * s;
    ctx.beginPath();
    ctx.moveTo(w * 0.21, h * 0.19);
    ctx.bezierCurveTo(w * 0.38, h * 0.155, w * 0.58, h * 0.225, w * 0.74, h * 0.175);
    ctx.stroke();
    ctx.restore();

    // A seal at the foot: rings, ticks, a star.
    const sy = h * 0.845;
    ctx.save();
    ctx.strokeStyle = 'rgba(214,179,106,0.32)';
    ctx.lineWidth = 1.8 * s;
    for (const r of [40, 33, 25]) {
      ctx.beginPath();
      ctx.arc(w * 0.5, sy, r * s, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.lineWidth = 1.2 * s;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.5 + Math.cos(a) * 33 * s, sy + Math.sin(a) * 33 * s);
      ctx.lineTo(w * 0.5 + Math.cos(a) * 40 * s, sy + Math.sin(a) * 40 * s);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(214,179,106,0.4)';
    for (const rot of [0, Math.PI / 4]) {
      ctx.save();
      ctx.translate(w * 0.5, sy);
      ctx.rotate(rot);
      ctx.strokeRect(-13 * s, -13 * s, 26 * s, 26 * s);
      ctx.restore();
    }
    ctx.restore();
  },

  /** Dawn over a sleeping city: two ridges of domes and minarets. */
  fajr(ctx, w, h, s) {
    const far = 'rgba(64,34,44,0.6)';
    const mid = 'rgba(42,22,30,0.82)';
    const near = 'rgba(24,12,18,0.96)';

    // Far ridge of houses.
    poly(ctx, [[0, h * 0.735], [w, h * 0.735], [w, h], [0, h]], far);
    for (const [bx, bw, bh] of [
      [0.08, 0.1, 0.035],
      [0.3, 0.08, 0.05],
      [0.52, 0.12, 0.03],
      [0.74, 0.09, 0.045],
    ] as [number, number, number][]) {
      ctx.fillStyle = far;
      ctx.fillRect(w * bx, h * (0.735 - bh), w * bw, h * bh);
    }
    dome(ctx, w * 0.2, h * 0.7, w * 0.055, far);
    minaret(ctx, w * 0.42, h * 0.735, h * 0.2, w * 0.013, far);
    minaret(ctx, w * 0.86, h * 0.735, h * 0.16, w * 0.011, far);

    // Middle band: the mosque itself.
    poly(ctx, [[0, h * 0.8], [w, h * 0.8], [w, h], [0, h]], mid);
    ctx.fillStyle = mid;
    ctx.fillRect(w * 0.3, h * 0.775, w * 0.4, h * 0.03);
    dome(ctx, w * 0.5, h * 0.775, w * 0.11, mid);
    dome(ctx, w * 0.32, h * 0.79, w * 0.055, mid);
    dome(ctx, w * 0.68, h * 0.79, w * 0.055, mid);
    minaret(ctx, w * 0.24, h * 0.8, h * 0.26, w * 0.016, mid);
    minaret(ctx, w * 0.76, h * 0.8, h * 0.26, w * 0.016, mid);

    // Near rooftops, and a few windows already awake.
    poly(ctx, [[0, h * 0.885], [w * 0.18, h * 0.87], [w * 0.36, h * 0.895], [w * 0.55, h * 0.875], [w * 0.74, h * 0.9], [w, h * 0.88], [w, h], [0, h]], near);
    for (const [wx, wy] of [
      [0.12, 0.905],
      [0.16, 0.915],
      [0.44, 0.9],
      [0.48, 0.912],
      [0.66, 0.918],
      [0.86, 0.9],
    ] as [number, number][]) {
      ctx.fillStyle = 'rgba(255,206,140,0.35)';
      ctx.fillRect(w * wx, h * wy, w * 0.012, h * 0.008);
    }

    // Birds.
    ctx.strokeStyle = 'rgba(40,20,26,0.6)';
    ctx.lineWidth = 1.8 * s;
    for (const [bx, by, bk] of [
      [0.3, 0.36, 1],
      [0.35, 0.32, 0.8],
      [0.4, 0.38, 0.65],
    ] as [number, number, number][]) {
      ctx.beginPath();
      ctx.moveTo(w * bx - 8 * s * bk, h * by);
      ctx.quadraticCurveTo(w * bx, h * by - 5 * s * bk, w * bx + 8 * s * bk, h * by);
      ctx.stroke();
    }
  },

  /** Night water: moon, path of light, far shore. */
  layl(ctx, w, h, s) {
    const my = h * 0.15;
    const mx = w * 0.72;

    const halo = ctx.createRadialGradient(mx, my, 0, mx, my, w * 0.3);
    halo.addColorStop(0, 'rgba(220,232,255,0.4)');
    halo.addColorStop(0.4, 'rgba(160,186,235,0.1)');
    halo.addColorStop(1, 'rgba(160,186,235,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(240,246,255,0.95)';
    ctx.beginPath();
    ctx.arc(mx, my, w * 0.045, 0, Math.PI * 2);
    ctx.fill();
    // crescent shadow
    ctx.fillStyle = 'rgba(10,16,36,0.92)';
    ctx.beginPath();
    ctx.arc(mx + w * 0.018, my - w * 0.012, w * 0.04, 0, Math.PI * 2);
    ctx.fill();

    stars(ctx, w, 150, 7, 0, h * 0.32);

    // Far shore.
    poly(
      ctx,
      [[0, h * 0.705], [w * 0.2, h * 0.69], [w * 0.45, h * 0.7], [w * 0.75, h * 0.685], [w, h * 0.7], [w, h * 0.715], [0, h * 0.715]],
      'rgba(6,10,24,0.9)',
    );

    // Water.
    ctx.fillStyle = 'rgba(6,10,26,0.72)';
    ctx.fillRect(0, h * 0.712, w, h * 0.29);

    // Moon path on the water.
    ctx.save();
    for (let i = 0; i < 22; i++) {
      const y = h * (0.72 + i * 0.0125);
      const ww = w * (0.02 + i * 0.0035) * (0.6 + 0.4 * Math.sin(i * 1.7));
      ctx.fillStyle = `rgba(226,236,255,${(0.16 - i * 0.005).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(mx, y, ww, 1.6 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  },

  /** A fanous hanging in the dark — the light source is the subject. */
  nur(ctx, w, h, s) {
    const cx = w * 0.5;
    const capY = h * 0.115;
    const bodyTop = h * 0.145;
    const bodyBot = h * 0.3;
    const topW = w * 0.085;
    const botW = w * 0.115;

    // Chain.
    ctx.strokeStyle = 'rgba(214,179,106,0.4)';
    ctx.lineWidth = 1.6 * s;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, capY);
    ctx.stroke();
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.ellipse(cx, (capY / 7) * i + capY / 14, 3.4 * s, 2.2 * s, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Cap: a brass dome with a finial.
    ctx.fillStyle = '#B9934C';
    ctx.beginPath();
    ctx.moveTo(cx - topW * 0.72, bodyTop);
    ctx.bezierCurveTo(cx - topW * 0.7, capY - 6 * s, cx + topW * 0.7, capY - 6 * s, cx + topW * 0.72, bodyTop);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, capY - 8 * s, 4.5 * s, 0, Math.PI * 2);
    ctx.fill();

    // Glass body: a tapered hexagon.
    const body = () => {
      ctx.beginPath();
      ctx.moveTo(cx - topW, bodyTop);
      ctx.lineTo(cx + topW, bodyTop);
      ctx.lineTo(cx + botW, bodyBot);
      ctx.lineTo(cx - botW, bodyBot);
      ctx.closePath();
    };
    body();
    const g = ctx.createLinearGradient(0, bodyTop, 0, bodyBot);
    g.addColorStop(0, 'rgba(255,248,220,0.95)');
    g.addColorStop(0.45, 'rgba(255,214,140,0.8)');
    g.addColorStop(1, 'rgba(232,158,76,0.55)');
    ctx.fillStyle = g;
    ctx.fill();

    // Brass frame: top band, bottom band, three ribs.
    ctx.fillStyle = '#C9A25E';
    ctx.fillRect(cx - topW * 1.06, bodyTop - 5 * s, topW * 2.12, 9 * s);
    ctx.fillRect(cx - botW * 1.08, bodyBot - 4 * s, botW * 2.16, 9 * s);
    ctx.strokeStyle = 'rgba(70,48,18,0.7)';
    ctx.lineWidth = 3.2 * s;
    for (const t of [-0.5, 0, 0.5]) {
      ctx.beginPath();
      ctx.moveTo(cx + topW * t, bodyTop);
      ctx.lineTo(cx + botW * t * 1.1, bodyBot);
      ctx.stroke();
    }
    // Bottom finial.
    ctx.fillStyle = '#B9934C';
    ctx.beginPath();
    ctx.moveTo(cx - botW * 0.42, bodyBot + 5 * s);
    ctx.lineTo(cx, bodyBot + 20 * s);
    ctx.lineTo(cx + botW * 0.42, bodyBot + 5 * s);
    ctx.closePath();
    ctx.fill();

    // The light it throws.
    const glow = ctx.createRadialGradient(cx, (bodyTop + bodyBot) / 2, 0, cx, (bodyTop + bodyBot) / 2, w * 0.5);
    glow.addColorStop(0, 'rgba(255,222,160,0.4)');
    glow.addColorStop(0.35, 'rgba(232,170,90,0.13)');
    glow.addColorStop(1, 'rgba(232,170,90,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  },

  /** A garden arch: vines, cypresses, a tiled floor. */
  bustan(ctx, w, h, s) {
    // Distant light through the arch.
    const g = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, w * 0.7);
    g.addColorStop(0, 'rgba(140,220,170,0.16)');
    g.addColorStop(1, 'rgba(140,220,170,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    cypress(ctx, w * 0.14, h * 0.78, h * 0.42, w * 0.075, 'rgba(6,26,16,0.85)');
    cypress(ctx, w * 0.86, h * 0.78, h * 0.42, w * 0.075, 'rgba(6,26,16,0.85)');

    // Floor.
    poly(ctx, [[0, h * 0.86], [w, h * 0.86], [w, h], [0, h]], 'rgba(5,20,13,0.85)');
    ctx.strokeStyle = 'rgba(201,162,94,0.13)';
    ctx.lineWidth = 1.4 * s;
    for (let i = -6; i <= 6; i++) {
      ctx.beginPath();
      ctx.moveTo(w * 0.5 + i * w * 0.09, h * 0.86);
      ctx.lineTo(w * 0.5 + i * w * 0.2, h);
      ctx.stroke();
    }
    for (const y of [0.89, 0.93, 0.97]) {
      ctx.beginPath();
      ctx.moveTo(0, h * y);
      ctx.lineTo(w, h * y);
      ctx.stroke();
    }

    // A vine climbing the left jamb.
    ctx.save();
    ctx.strokeStyle = 'rgba(201,162,94,0.3)';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.98);
    ctx.bezierCurveTo(w * 0.06, h * 0.8, w * 0.02, h * 0.6, w * 0.09, h * 0.42);
    ctx.stroke();
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      const lx = w * (0.02 + 0.05 * Math.sin(t * 5));
      const ly = h * (0.95 - t * 0.5);
      ctx.fillStyle = 'rgba(120,200,150,0.18)';
      ctx.beginPath();
      ctx.ellipse(lx, ly, 9 * s, 4 * s, t * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  },

  /** Dunes at low sun, one figure on the ridge. */
  raml(ctx, w, h, s) {
    const sunY = h * 0.745;
    const glow = ctx.createRadialGradient(w * 0.62, sunY, 0, w * 0.62, sunY, w * 0.26);
    glow.addColorStop(0, 'rgba(255,226,180,0.34)');
    glow.addColorStop(1, 'rgba(255,226,180,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(255,236,196,0.75)';
    ctx.beginPath();
    ctx.arc(w * 0.62, sunY, w * 0.055, 0, Math.PI * 2);
    ctx.fill();

    // Dune ridges with long shadows.
    // Crests must stay below the verse block (which ends at ~0.68h).
    const dunes: [number, number, number, string][] = [
      [0.78, 0.03, 0.62, 'rgba(168,116,66,0.55)'],
      [0.855, 0.04, 0.3, 'rgba(126,82,44,0.75)'],
      [0.93, 0.045, 0.18, 'rgba(74,46,24,0.9)'],
    ];
    for (const [y, amp, , color] of dunes) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, h * y);
      ctx.bezierCurveTo(w * 0.26, h * (y - amp * 2.1), w * 0.58, h * (y + amp * 1.4), w, h * (y - amp * 0.7));
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    }

    camel(ctx, w * 0.34, h * 0.772, 0.62 * s, 'rgba(26,14,6,0.85)');
  },

  /** A calm sea at dusk with one boat. */
  bahr(ctx, w, h, s) {
    const hy = h * 0.655;

    // Afterglow at the horizon.
    const g = ctx.createLinearGradient(0, hy - h * 0.2, 0, hy);
    g.addColorStop(0, 'rgba(140,220,220,0)');
    g.addColorStop(1, 'rgba(160,235,235,0.22)');
    ctx.fillStyle = g;
    ctx.fillRect(0, hy - h * 0.2, w, h * 0.2);

    // Sea.
    const sea = ctx.createLinearGradient(0, hy, 0, h);
    sea.addColorStop(0, 'rgba(16,64,74,0.9)');
    sea.addColorStop(0.5, 'rgba(8,38,48,0.95)');
    sea.addColorStop(1, 'rgba(3,16,24,1)');
    ctx.fillStyle = sea;
    ctx.fillRect(0, hy, w, h - hy);

    // Horizon rule.
    ctx.strokeStyle = 'rgba(180,240,240,0.4)';
    ctx.lineWidth = 1.6 * s;
    ctx.beginPath();
    ctx.moveTo(0, hy);
    ctx.lineTo(w, hy);
    ctx.stroke();

    boat(ctx, w * 0.66, hy + h * 0.035, 0.9 * s, 'rgba(4,18,24,0.95)');

    // Long swell lines.
    for (let i = 0; i < 7; i++) {
      const y = hy + h * (0.05 + i * 0.048);
      ctx.strokeStyle = `rgba(180,240,240,${(0.1 - i * 0.011).toFixed(3)})`;
      ctx.lineWidth = (1 + i * 0.5) * s;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 16 * s) {
        const yy = y + Math.sin(x / (110 * s) + i * 0.9) * (3 + i * 2.4) * s;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  },

  /** A manuscript page: illuminated frame, shamsa at the head. */
  waraq(ctx, w, h, s) {
    // Shamsa: a small gold rosette at the head.
    const cx = w * 0.5;
    const cy = h * 0.135;
    const R = w * 0.075;
    ctx.save();
    ctx.strokeStyle = 'rgba(176,138,74,0.65)';
    ctx.fillStyle = 'rgba(214,179,106,0.16)';
    ctx.lineWidth = 1.6 * s;
    for (const rot of [0, Math.PI / 4]) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.rect(-R * 0.72, -R * 0.72, R * 1.44, R * 1.44);
      ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Gold rules under the shamsa, closed with diamonds.
    ctx.strokeStyle = 'rgba(176,138,74,0.45)';
    ctx.lineWidth = 1.2 * s;
    ctx.beginPath();
    ctx.moveTo(w * 0.24, h * 0.245);
    ctx.lineTo(w * 0.44, h * 0.245);
    ctx.moveTo(w * 0.56, h * 0.245);
    ctx.lineTo(w * 0.76, h * 0.245);
    ctx.stroke();
    ctx.fillStyle = 'rgba(176,138,74,0.6)';
    for (const x of [0.24, 0.76]) {
      ctx.beginPath();
      ctx.moveTo(w * x, h * 0.245 - 4 * s);
      ctx.lineTo(w * x + 4 * s, h * 0.245);
      ctx.lineTo(w * x, h * 0.245 + 4 * s);
      ctx.lineTo(w * x - 4 * s, h * 0.245);
      ctx.closePath();
      ctx.fill();
    }

    // A small medallion at the foot, so the page is composed top and bottom.
    const fy = h * 0.855;
    ctx.strokeStyle = 'rgba(176,138,74,0.4)';
    ctx.beginPath();
    ctx.arc(w * 0.5, fy, w * 0.028, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w * 0.5, fy, w * 0.045, 0, Math.PI * 2);
    ctx.stroke();
  },
};
