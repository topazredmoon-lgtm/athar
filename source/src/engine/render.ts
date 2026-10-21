import { LOOKS, hash, mulberry32, plate, goldFrame, getRosette } from './looks';
import { SCENES } from './scenes';
import type { PhotoSource, Story } from './types';

const BASE_W = 1080;
const BASE_H = 1920;

/**
 * Make sure the Arabic faces are actually loaded before we render or record.
 * Otherwise an exported video can bake fallback glyphs in its opening frames.
 */
export async function ensureFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  const specs = [
    '400 40px Amiri',
    '700 40px Amiri',
    '500 40px "Reem Kufi"',
    '300 24px "IBM Plex Sans Arabic"',
    '500 24px "IBM Plex Sans Arabic"',
  ];
  await Promise.all(specs.map((s) => document.fonts.load(s).catch(() => undefined)));
  try {
    await document.fonts.ready;
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ noise */

let noiseCanvas: HTMLCanvasElement | null = null;

function getNoise(): HTMLCanvasElement {
  if (noiseCanvas) return noiseCanvas;
  const n = document.createElement('canvas');
  n.width = 180;
  n.height = 180;
  const nc = n.getContext('2d')!;
  const img = nc.createImageData(180, 180);
  // Fixed seed, not Math.random(): the same story must export the same bytes
  // every time, or a regression lock can never tell a real change from grain.
  const rnd = mulberry32(0x5eed1a7);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + rnd() * 145;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  nc.putImageData(img, 0, 0);
  noiseCanvas = n;
  return n;
}

/* -------------------------------------------------------------- backdrops */

const backdropCache = new Map<string, HTMLCanvasElement>();

/**
 * The room itself: the look's backdrop, the scene in it, and the designed
 * edge. Split out of `makeBackdrop` so the photo path can reuse the look's
 * texture without inheriting the scene.
 */
function paintRoom(ctx: CanvasRenderingContext2D, lookId: Story['look'], w: number, h: number, s: number) {
  const look = LOOKS[lookId];
  look.backdrop(ctx, w, h, s);
  // The place itself: architecture, landscape, water, page.
  SCENES[lookId]?.(ctx, w, h, s);

  // A fine gold rule with a diamond at each corner, so every room has a
  // designed edge rather than a raw border.
  if (look.frame !== false) goldFrame(ctx, w, h, s);
}

/** Vignette: dark rooms fall off to black, the paper room warms at the edge. */
function paintVignette(ctx: CanvasRenderingContext2D, look: (typeof LOOKS)[Story['look']], w: number, h: number) {
  if (look.dark) {
    const vg = ctx.createRadialGradient(w * 0.5, h * 0.4, w * 0.2, w * 0.5, h * 0.4, w * 0.85);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.40)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  } else {
    const vg = ctx.createRadialGradient(w * 0.5, h * 0.45, w * 0.25, w * 0.5, h * 0.45, w * 0.9);
    vg.addColorStop(0, 'rgba(120,90,50,0)');
    vg.addColorStop(1, 'rgba(120,90,50,0.13)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }
}

/**
 * Grain, baked in. Measured: a moving field of film noise is the single most
 * expensive thing to hand a software H.264 encoder (39s -> 91s for the same
 * 15s clip), and at 4.2% alpha over a 3% camera push nobody can tell which
 * layer it lives on.
 */
function paintGrain(ctx: CanvasRenderingContext2D, look: (typeof LOOKS)[Story['look']], w: number, h: number) {
  const pat = ctx.createPattern(getNoise(), 'repeat');
  if (pat) {
    ctx.save();
    ctx.globalAlpha = look.dark ? 0.042 : 0.03;
    ctx.globalCompositeOperation = look.dark ? 'overlay' : 'multiply';
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

function makeBackdrop(lookId: Story['look'], w: number, h: number): HTMLCanvasElement {
  const key = `${lookId}:${w}x${h}`;
  const hit = backdropCache.get(key);
  if (hit) return hit;

  const look = LOOKS[lookId];
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  const s = w / BASE_W;

  paintRoom(ctx, lookId, w, h, s);

  if (look.plate > 0) plate(ctx, w, h, look.plate, look.plateR);

  paintVignette(ctx, look, w, h);
  paintGrain(ctx, look, w, h);

  backdropCache.set(key, c);
  return c;
}

/* ------------------------------------------------------------ photo layer */

/**
 * The look's own backdrop, painted alone — no scene.
 *
 * Over a photograph the scene would be a second place fighting the first, so
 * only the room's colour and ornament survive: the gradient becomes a grade,
 * the arabesque becomes texture, the star screen becomes a pattern of light.
 */
const gradeCache = new Map<string, HTMLCanvasElement>();

function makePhotoGrade(lookId: Story['look'], w: number, h: number): HTMLCanvasElement {
  const key = `${lookId}:${w}x${h}`;
  const hit = gradeCache.get(key);
  if (hit) return hit;

  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  LOOKS[lookId].backdrop(ctx, w, h, w / BASE_W);
  gradeCache.set(key, c);
  return c;
}

/** Intrinsic size of a photo, whichever kind of source it is. */
function photoSize(p: PhotoSource): { w: number; h: number } {
  if ('naturalWidth' in p) {
    return { w: p.naturalWidth || p.width, h: p.naturalHeight || p.height };
  }
  return { w: p.width, h: p.height };
}

/**
 * Draw a photo with object-fit: cover semantics — the frame is always filled,
 * the overflow is cropped from the centre, and the aspect ratio is never
 * distorted.
 */
export function drawPhotoCover(
  ctx: CanvasRenderingContext2D,
  photo: PhotoSource,
  w: number,
  h: number,
) {
  const { w: iw, h: ih } = photoSize(photo);
  if (!iw || !ih) return;
  const scale = Math.max(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(photo, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

/**
 * The picture layer.
 *
 * The photograph goes down first and takes the same camera push the vector
 * backdrop gets. The look's grade, scrim, ornament and grain are then laid
 * over it — unmoved, exactly as they sit over the vector room — so the result
 * reads as a composed frame rather than a photograph with text on it.
 */
function paintPhoto(
  ctx: CanvasRenderingContext2D,
  story: Story,
  t: number,
  w: number,
  h: number,
  s: number,
  cam: number,
  dur: number,
) {
  const look = LOOKS[story.look];
  const photo = story.photo;
  if (!photo) return;

  // 1. the picture, with the camera push
  ctx.save();
  if (cam > 0) {
    const z = 1 + cam * Math.max(0, Math.min(1, t / dur));
    ctx.translate(w * 0.5, h * 0.5);
    ctx.scale(z, z);
    ctx.translate(-w * 0.5, -h * 0.5);
  }
  drawPhotoCover(ctx, photo, w, h);
  ctx.restore();

  // 2. the room's own colour and ornament, graded over the picture
  const grade = makePhotoGrade(story.look, w, h);
  ctx.save();
  ctx.globalCompositeOperation = look.dark ? 'overlay' : 'multiply';
  ctx.globalAlpha = look.dark ? 0.34 : 0.2;
  ctx.drawImage(grade, 0, 0);
  ctx.restore();

  // 3. cinematic falloff, so the frame has a top and a bottom
  const sg = ctx.createLinearGradient(0, 0, 0, h);
  sg.addColorStop(0, 'rgba(4,6,10,0.42)');
  sg.addColorStop(0.44, 'rgba(4,6,10,0)');
  sg.addColorStop(0.7, 'rgba(4,6,10,0)');
  sg.addColorStop(1, 'rgba(4,6,10,0.5)');
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, w, h);

  // 4. the scrim the verse has always sat on
  if (look.plate > 0) plate(ctx, w, h, look.plate, look.plateR);

  // 5. the designed edge, drawn over the picture rather than under it
  if (look.frame !== false) goldFrame(ctx, w, h, s);

  paintVignette(ctx, look, w, h);
  paintGrain(ctx, look, w, h);
}


/* ------------------------------------------------------------------- type */

const sizeCache = new Map<string, number>();

function fitFont(
  ctx: CanvasRenderingContext2D,
  cacheKey: string,
  lines: string[],
  maxW: number,
  start: number,
  weight: number,
  family: string,
): number {
  const cached = sizeCache.get(cacheKey);
  if (cached) return cached;
  let size = start;
  while (size > 20) {
    ctx.font = `${weight} ${size}px ${family}`;
    let widest = 0;
    for (const l of lines) widest = Math.max(widest, ctx.measureText(l).width);
    if (widest <= maxW) break;
    size -= 3;
  }
  sizeCache.set(cacheKey, size);
  return size;
}

function drawVerse(
  ctx: CanvasRenderingContext2D,
  story: Story,
  t: number,
  w: number,
  h: number,
  s: number,
) {
  const look = LOOKS[story.look];
  const { family, weight, size: base, color, foil } = look.type;
  const custom = story.custom;
  const lines = custom ? custom.lines : story.verse.lines;
  // Nothing to typeset: the picture stands alone. (A story without `custom`
  // always has the corpus verse, so this never touches the vector path.)
  if (!lines.length) return;
  // The corpus is Arabic, so a verse is always shaped and ordered RTL. The
  // user's own words follow the direction of the text they typed.
  const lineDir = custom ? custom.dir ?? (story.lang === 'ar' ? 'rtl' : 'ltr') : 'rtl';
  const maxW = w * 0.78;
  const fitKey = custom
    ? `${story.look}:${story.id}:${w}:${lines.join('\u0001')}`
    : `${story.look}:${story.id}:${w}`;
  const size = fitFont(
    ctx,
    fitKey,
    lines,
    maxW,
    w * base,
    weight,
    family,
  );
  // Arabic verse needs >=2.1: Amiri's tashkeel occupies ~1.9em vertically, and
  // anything tighter makes diacritics of adjacent lines collide.
  const lh = size * 2.15;
  const blockH = lines.length * lh;
  const cx = w * 0.5;
  const startY = h * 0.5 - blockH / 2 + lh * 0.5;

  ctx.save();
  ctx.direction = lineDir;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (look.rule) {
    const rk = Math.max(0, Math.min(1, (t - 0.25) / 0.75));
    const rw = 44 * s * (1 - Math.pow(1 - rk, 3));
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#D6B36A';
    ctx.fillRect(cx - rw / 2, startY - lh * 0.95, rw, Math.max(1, 2 * s));
    ctx.globalAlpha = 1;
  }

  let fill: string | CanvasGradient = color;
  if (foil) {
    const fg = ctx.createLinearGradient(0, startY - lh, 0, startY + blockH);
    fg.addColorStop(0, '#FBF3DF');
    fg.addColorStop(0.32, '#E6CB8E');
    fg.addColorStop(0.52, '#DCC084');
    fg.addColorStop(0.76, '#E8CF95');
    fg.addColorStop(1, '#F7EBC9');
    fill = fg;
  }

  // The pace is part of the language: still / light-first / type-led.
  const hibr = story.look === 'hibr';
  const dhahab = story.look === 'dhahab';
  const lineStart = hibr ? 1.0 : dhahab ? 2.4 : 0.9;
  const stagger = hibr ? 0.34 : dhahab ? 0.3 : 0.45;
  const lineDur = hibr ? 0.6 : dhahab ? 0.8 : 1.2;

  lines.forEach((line, i) => {
    const st = lineStart + i * stagger;
    const k = Math.max(0, Math.min(1, (t - st) / lineDur));
    const e = 1 - Math.pow(1 - k, 3);
    const alpha = hibr ? Math.min(1, Math.max(0, (t - st) / 0.4)) : e;
    const dy = (1 - e) * 26 * s;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `${weight} ${size}px ${family}`;
    ctx.fillStyle = fill;
    ctx.fillText(line, cx, startY + i * lh + dy);
    ctx.restore();
  });

  const srcStart = hibr ? 2.3 : lineStart + lines.length * stagger + 0.35;
  const sk = Math.max(0, Math.min(1, (t - srcStart) / 0.8));
  const se = 1 - Math.pow(1 - sk, 3);
  const src = custom
    ? custom.source || ''
    : story.lang === 'ar'
      ? story.verse.sourceAr
      : story.verse.sourceEn;
  // The user's own words may carry no attribution; the verse always does.
  if (src) {
    const srcSize = Math.round(w * 0.0315);
    const srcY = startY + (lines.length - 1) * lh + lh * 0.62;
    ctx.globalAlpha = se * 0.92;
    ctx.font = `500 ${srcSize}px "IBM Plex Sans Arabic", sans-serif`;
    ctx.fillStyle = look.sourceColor;
    const srcW = ctx.measureText(src).width;
    // 40px hairlines flanking the reference, each closed with a diamond.
    const gap = 22 * s;
    const len = 40 * s;
    ctx.strokeStyle = look.dark ? 'rgba(214,179,106,0.5)' : 'rgba(138,107,47,0.55)';
    ctx.lineWidth = Math.max(1, s);
    ctx.beginPath();
    ctx.moveTo(cx - srcW / 2 - gap - len, srcY);
    ctx.lineTo(cx - srcW / 2 - gap, srcY);
    ctx.moveTo(cx + srcW / 2 + gap, srcY);
    ctx.lineTo(cx + srcW / 2 + gap + len, srcY);
    ctx.stroke();

    const dr = 3.4 * s;
    ctx.fillStyle = look.dark ? 'rgba(240,220,168,0.6)' : 'rgba(138,107,47,0.65)';
    for (const dir of [-1, 1]) {
      const dx = cx + dir * (srcW / 2 + gap + len);
      ctx.beginPath();
      ctx.moveTo(dx, srcY - dr);
      ctx.lineTo(dx + dr, srcY);
      ctx.lineTo(dx, srcY + dr);
      ctx.lineTo(dx - dr, srcY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.direction = custom ? lineDir : story.lang === 'ar' ? 'rtl' : 'ltr';
    ctx.fillText(src, cx, srcY);
  }
  ctx.restore();
}

/* -------------------------------------------------------------- main draw */

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  story: Story,
  t: number,
  w: number,
  h: number,
  opts?: { text?: boolean },
) {
  const s = w / BASE_W;
  const look = LOOKS[story.look];
  const dur = story.durationMs / 1000;
  const cam = look.camera ?? 0;

  if (story.photo) {
    // The picture layer stands in for the room: the photograph first, with the
    // same camera push, then the look's grade, scrim and ornament over it.
    paintPhoto(ctx, story, t, w, h, s, cam, dur);
  } else {
    const bd = makeBackdrop(story.look, w, h);

    // The camera push. The scene ends a few percent closer than it began, so no
    // clip is ever a still; the verse is drawn afterwards and does not move with
    // it — the words stay put while the room breathes.
    if (cam > 0) {
      const z = 1 + cam * Math.max(0, Math.min(1, t / dur));
      ctx.save();
      ctx.translate(w * 0.5, h * 0.5);
      ctx.scale(z, z);
      ctx.translate(-w * 0.5, -h * 0.5);
      ctx.drawImage(bd, 0, 0);
      ctx.restore();
    } else {
      ctx.drawImage(bd, 0, 0);
    }
  }

  // The ornament layer: a 16-point medallion turning once a minute behind the
  // verse. Subtle enough to read as paper, present enough to feel composed.
  if (look.medallion) {
    const size = Math.round(w * 1.05);
    const sprite = getRosette(size);
    ctx.save();
    ctx.globalAlpha = 0.09;
    ctx.translate(w * 0.5, h * 0.5);
    ctx.rotate((t / 60) * Math.PI * 2);
    ctx.drawImage(sprite, -size / 2, -size / 2);
    ctx.restore();
  }

  // The ornament layer: a 16-point medallion turning once a minute behind the
  // verse. Subtle enough to read as paper, present enough to feel composed.
  if (look.medallion) {
    const size = Math.round(w * 1.05);
    const sprite = getRosette(size);
    ctx.save();
    ctx.globalAlpha = 0.09;
    ctx.translate(w * 0.5, h * 0.5);
    ctx.rotate((t / 60) * Math.PI * 2);
    ctx.drawImage(sprite, -size / 2, -size / 2);
    ctx.restore();
  }

  look.motion?.(ctx, t, w, h, s, `${story.id}:${story.look}`);

  if (!opts || opts.text !== false) drawVerse(ctx, story, t, w, h, s);

  const fadeIn = Math.min(1, t / 0.6);
  const fadeOut = Math.min(1, Math.max(0, (dur - t) / 0.7));
  const a = Math.min(fadeIn, fadeOut);
  if (a < 1) {
    ctx.save();
    ctx.globalAlpha = 1 - a;
    ctx.fillStyle = look.fade;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

export { BASE_W, BASE_H, hash };
