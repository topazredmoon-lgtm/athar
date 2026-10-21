/**
 * Dev-only probes. Imported behind `import.meta.env.DEV`, so none of this
 * reaches the production bundle (the encode probe base64s a whole video).
 */
import { generateTakes } from './ai/director';
import { encodeStory } from './engine/encode';
import { BASE_H, BASE_W, renderFrame } from './engine/render';
import { LOOKS } from './engine/looks';

// Perf probe: average ms to paint one 1080x1920 frame.
(window as any).__atharPerf = () => {
  const stories = generateTakes('شكر', 'ar', new Date());
  const s = stories[0];
  const c = document.createElement('canvas');
  c.width = BASE_W;
  c.height = BASE_H;
  const ctx = c.getContext('2d')!;
  renderFrame(ctx, s, 0, BASE_W, BASE_H);
  const t0 = performance.now();
  for (let i = 0; i < 30; i++) renderFrame(ctx, s, i / 30, BASE_W, BASE_H);
  return (performance.now() - t0) / 30;
};

// Contrast probe: measures the worst-pixel contrast over the ACTUAL glyph box,
// across 1-, 2- and 3-line verses and across the whole clip. Position changes
// with line count, and position is what decides contrast.
(window as any).__atharContrast = (look?: string) => {
  const all = generateTakes('شكر', 'ar', new Date());
  const base = all.find((s) => s.look === look) || all[0];

  const hexToRgb = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const def = LOOKS[base.look];
  const family = def.type.family;
  const weight = def.type.weight;
  // Foil type is a gradient: measure against its darkest stop, which is the
  // one that decides the worst pixel.
  const textRGB = def.type.foil ? [220, 186, 116] : hexToRgb(def.type.color);

  const lin = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  const L = (r: number, g: number, b: number) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const Lt = L(textRGB[0], textRGB[1], textRGB[2]);

  const c = document.createElement('canvas');
  c.width = BASE_W;
  c.height = BASE_H;
  const ctx = c.getContext('2d')!;

  let worst = 99;
  let maxRGB = [0, 0, 0];
  let maxL = -1;
  let at = 0;
  let linesN = 0;

  const times = [0.2, 0.5, 0.8, 1.1, 1.5, 2.0, 2.6, 3.4, 4.5, 6, 8, 10, 12];

  for (const n of [1, 2, 3]) {
    const lines: string[] = [];
    for (let i = 0; i < n; i++) lines.push(base.verse.lines[i % base.verse.lines.length]);
    const story = { ...base, id: `${base.id}-n${n}`, verse: { ...base.verse, lines } };

    // Replicate the renderer's fit so the box matches the real glyph box.
    let size = BASE_W * def.type.size;
    const maxW = BASE_W * 0.78;
    while (size > 20) {
      ctx.font = `${weight} ${size}px ${family}`;
      let widest = 0;
      for (const l of lines) widest = Math.max(widest, ctx.measureText(l).width);
      if (widest <= maxW) break;
      size -= 3;
    }
    const lh = size * 2.15;
    const blockH = n * lh;
    const y0 = Math.max(0, Math.round(BASE_H * 0.5 - blockH / 2 - 0.35 * size));
    const y1 = Math.min(BASE_H, Math.round(BASE_H * 0.5 + blockH / 2 + 0.35 * size));
    const x0 = Math.round(BASE_W * 0.11);
    const zw = Math.round(BASE_W * 0.78);
    const zh = y1 - y0;

    for (const tt of times) {
      if (tt > story.durationMs / 1000) continue;
      renderFrame(ctx, story, tt, BASE_W, BASE_H, { text: false });
      const data = ctx.getImageData(x0, y0, zw, zh).data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const Lb = L(r, g, b);
        const cr = (Math.max(Lt, Lb) + 0.05) / (Math.min(Lt, Lb) + 0.05);
        if (cr < worst) worst = cr;
        if (Lb > maxL) {
          maxL = Lb;
          maxRGB = [r, g, b];
          at = tt;
          linesN = n;
        }
      }
    }
  }
  return { worst: +worst.toFixed(2), maxRGB, at, linesN };
};

// Test hook: lets an automated check encode a story and read the exact blob,
// bypassing the share/download path.
(window as any).__atharTest = async (look?: string, date?: string) => {
  // `date` (ISO yyyy-mm-dd) makes the story reproducible across runs, which is
  // what the HyperFrames parity check needs to compare the same frame twice.
  const stories = generateTakes('شكر', 'ar', date ? new Date(date + 'T00:00:00') : new Date());
  const story = stories.find((s) => s.look === look) || stories[0];
  const { blob, ext } = await encodeStory(story);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return { ext, b64: btoa(bin), size: blob.size, durationMs: story.durationMs };
};
