import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import { BASE_H, BASE_W, ensureFonts, renderFrame } from './render';
import type { Story } from './types';

const FPS = 30;

/**
 * Encode tiers. The verse is 8.6% of frame width, so even the smallest tier
 * keeps the type enormous — and WhatsApp re-encodes Status anyway. Dropping a
 * tier is a speed decision, not a quality cliff.
 */
const TIERS = [
  { w: 1080, h: 1920 },
  { w: 810, h: 1440 },
  { w: 720, h: 1280 },
];
/** Frames per second the probe must clear to use a tier. */
const TIER_FPS = [8, 4];
const PROBE_FRAMES = 12;
/** Frames fed before the clock starts: the first frames of any encoder are
 *  cold-start (GPU/codec init), and timing them understates the device. */
const PROBE_WARMUP = 6;

/**
 * H.264 levels that can actually carry 1080x1920.
 *
 * The old config asked for `avc1.42001f` — Baseline **level 3.1**, whose macroblock
 * ceiling is 720p. `isConfigSupported()` correctly refused it, the WebCodecs path
 * returned null, and every export silently fell through to MediaRecorder (real-time,
 * wall-clock timestamps). That is the exact failure the WebCodecs path was added to
 * fix, so the app was still exposed to it. Level 4.0 is the floor for 1080x1920@30.
 */
const AVC_CANDIDATES = [
  'avc1.640028', // High 4.0
  'avc1.4d0028', // Main 4.0
  'avc1.420028', // Baseline 4.0
  'avc1.640032', // High 5.1
  'avc1.420034', // Baseline 5.2
];

export type EncodePath = 'webcodecs' | 'mediarecorder';

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    p.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      },
    );
  });
}

/**
 * Measure how fast this device can actually encode, then choose the largest tier
 * it can keep up with. A 15s clip that takes two minutes to produce is not a
 * premium experience, and on a low-end Android it is the difference between
 * publishing and giving up.
 */
const TIER_KEY = 'athar.encodeTier.v1';

function cachedTier(): { w: number; h: number } | null {
  try {
    const raw = sessionStorage.getItem(TIER_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw);
    const hit = TIERS.find((x) => x.w === t.w && x.h === t.h);
    return hit || null;
  } catch {
    return null;
  }
}

async function pickTier(
  VE: any,
  config: any,
  story: Story,
): Promise<{ w: number; h: number }> {
  // The device does not change between stories, so probe once per session.
  const cached = cachedTier();
  if (cached) return cached;

  const VF: any = (globalThis as any).VideoFrame;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  let best = TIERS[TIERS.length - 1];

  for (let i = 0; i < TIERS.length - 1; i++) {
    const tier = TIERS[i];
    const min = TIER_FPS[i];

    canvas.width = tier.w;
    canvas.height = tier.h;
    renderFrame(ctx, story, 0, tier.w, tier.h);

    const enc = new VE({ output: () => {}, error: () => {} });
    enc.configure({ ...config, width: tier.w, height: tier.h });
    const t0 = performance.now();
    let fps = 0;
    try {
      for (let f = 0; f < PROBE_WARMUP + PROBE_FRAMES; f++) {
        renderFrame(ctx, story, f / FPS, tier.w, tier.h);
        const frame = new VF(canvas, { timestamp: Math.round((f * 1e6) / FPS) });
        enc.encode(frame, { keyFrame: f === 0 });
        // A frame that is never closed stalls the encoder — do not let the probe
        // become the thing that makes publishing slow.
        frame.close();
      }
      await enc.flush();
      // Time only the frames after warm-up.
      const warmSecs = (performance.now() - t0) / 1000 * (PROBE_WARMUP / (PROBE_WARMUP + PROBE_FRAMES));
      fps = PROBE_FRAMES / Math.max(0.001, (performance.now() - t0) / 1000 - warmSecs);
    } catch {
      best = tier; // this tier is the ceiling — use its own resolution
      break;
    } finally {
      try {
        enc.close();
      } catch {
        /* ignore */
      }
    }
    if (import.meta.env.DEV) console.info(`[athar] encode probe ${tier.w}x${tier.h}: ${fps.toFixed(1)} fps`);
    if (fps >= min) {
      best = tier;
      break;
    }
  }

  try {
    sessionStorage.setItem(TIER_KEY, JSON.stringify(best));
  } catch {
    /* ignore */
  }
  return best;
}

async function pickAvcConfig(VE: any): Promise<any | null> {
  for (const codec of AVC_CANDIDATES) {
    const config = {
      codec,
      width: BASE_W,
      height: BASE_H,
      bitrate: 12_000_000,
      framerate: FPS,
    };
    try {
      const support = await VE.isConfigSupported(config);
      if (support?.supported) return config;
    } catch {
      /* try the next level */
    }
  }
  return null;
}

/**
 * Preferred path: WebCodecs + MP4 muxer. We assign each frame an explicit
 * timestamp, so the clip is exactly the intended length no matter how long a
 * frame takes to paint. MediaRecorder timestamps are wall-clock, which is why
 * a slow render stretched a 15s clip to 28s.
 */
async function encodeWebCodecs(
  story: Story,
  onProgress?: (p: number) => void,
): Promise<Blob | null> {
  const VE: any = (globalThis as any).VideoEncoder;
  const VF: any = (globalThis as any).VideoFrame;
  if (!VE || !VF) return null;

  const config = await pickAvcConfig(VE);
  if (!config) return null;

  const tier = await pickTier(VE, config, story);
  const W = tier.w;
  const H = tier.h;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const durSec = story.durationMs / 1000;
  const totalFrames = Math.max(1, Math.round(durSec * FPS));

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width: W, height: H },
    fastStart: 'in-memory',
  });

  let errored: Error | null = null;
  const encoder = new VE({
    output: (chunk: any, meta: any) => muxer.addVideoChunk(chunk, meta),
    error: (e: Error) => {
      errored = e;
    },
  });
  encoder.configure({ ...config, width: W, height: H });

  for (let i = 0; i < totalFrames; i++) {
    if (errored) throw errored;
    renderFrame(ctx, story, i / FPS, W, H);
    const frame = new VF(canvas, {
      timestamp: Math.round((i * 1_000_000) / FPS),
      duration: Math.round(1_000_000 / FPS),
    });
    encoder.encode(frame, { keyFrame: i % (FPS * 2) === 0 });
    frame.close();
    onProgress?.((i + 1) / totalFrames);
    // Yield periodically so the encoder can drain.
    if (i % 8 === 0) await new Promise((r) => setTimeout(r, 0));
  }

  await encoder.flush();
  encoder.close();
  if (errored) throw errored;
  muxer.finalize();

  const buf = (muxer.target as any).buffer as ArrayBuffer | undefined;
  if (!buf || buf.byteLength === 0) return null;
  return new Blob([buf], { type: 'video/mp4' });
}

function pickMime(): string {
  const candidates = [
    'video/mp4;codecs=avc1.42001E',
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  if (typeof MediaRecorder === 'undefined') return '';
  for (const m of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m;
    } catch {
      /* keep looking */
    }
  }
  return '';
}

/** Fallback for browsers without WebCodecs. Never allowed to hang. */
async function encodeMediaRecorder(
  story: Story,
  onProgress?: (p: number) => void,
): Promise<{ blob: Blob; ext: string }> {
  const mime = pickMime();
  const canvas = document.createElement('canvas');
  canvas.width = BASE_W;
  canvas.height = BASE_H;
  const ctx = canvas.getContext('2d')!;

  if (!mime || typeof (canvas as any).captureStream !== 'function') {
    throw new Error('no-recorder');
  }

  const durSec = story.durationMs / 1000;
  const totalFrames = Math.max(1, Math.round(durSec * FPS));

  renderFrame(ctx, story, 0, BASE_W, BASE_H);
  const stream = (canvas as any).captureStream(0) as MediaStream;
  const track = stream.getVideoTracks()[0] as any;
  if (!track) throw new Error('no-track');
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12_000_000 });
  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  const done = new Promise<Blob>((resolve, reject) => {
    rec.onstop = () => resolve(new Blob(chunks, { type: mime }));
    rec.onerror = () => reject(new Error('recorder-error'));
  });

  rec.start();
  const frameMs = 1000 / FPS;
  const t0 = performance.now();
  for (let i = 0; i < totalFrames; i++) {
    renderFrame(ctx, story, i / FPS, BASE_W, BASE_H);
    if (track.requestFrame) track.requestFrame();
    onProgress?.(i / totalFrames);
    const target = t0 + (i + 1) * frameMs;
    const wait = target - performance.now();
    await new Promise((r) => setTimeout(r, Math.max(0, wait)));
  }
  await new Promise((r) => setTimeout(r, 150));
  rec.stop();
  stream.getTracks().forEach((tr) => tr.stop());

  // A recorder that never fires `stop` used to hang the publish button forever.
  const blob = await withTimeout(done, 15_000, 'recorder');
  if (!blob.size) throw new Error('empty-recording');
  return { blob, ext: mime.includes('mp4') ? 'mp4' : 'webm' };
}

export interface EncodeResult {
  blob: Blob;
  ext: string;
  path: EncodePath;
}

export async function encodeStory(
  story: Story,
  onProgress?: (p: number) => void,
): Promise<EncodeResult> {
  // Never record before the Arabic faces are ready.
  await ensureFonts();
  try {
    const mp4 = await encodeWebCodecs(story, onProgress);
    if (mp4 && mp4.size > 0) return { blob: mp4, ext: 'mp4', path: 'webcodecs' };
  } catch {
    /* fall through to MediaRecorder */
  }
  const out = await encodeMediaRecorder(story, onProgress);
  return { ...out, path: 'mediarecorder' };
}
