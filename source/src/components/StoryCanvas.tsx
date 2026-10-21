import { useEffect, useRef } from 'react';
import { renderFrame } from '../engine/render';
import type { Story } from '../engine/types';

/**
 * A looping, live canvas preview of a story. No encoding — cheap and smooth.
 *
 * The backing store is always 9:16, whatever the CSS box is, and the box crops
 * with `object-fit: cover`. That means every preview is the *same composition*
 * as the exported video at a different scale — not a re-layout that stretches
 * the frame to the container's aspect.
 *
 * `quality="grid"` is for the ten-card chooser: lower pixel density, 30fps, and
 * it stops entirely when scrolled out of view. Ten full-rate canvases would
 * cook a phone. `quality="picker"` is the same idea one notch further down:
 * ten rooms of the *user's own photograph*, so they run at 1x and 15fps.
 */
export default function StoryCanvas({
  story,
  className,
  quality = 'full',
}: {
  story: Story;
  className?: string;
  quality?: 'full' | 'grid' | 'picker';
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const maxDpr = quality === 'grid' ? 1.5 : quality === 'picker' ? 1 : 2;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const minFrameMs = quality === 'grid' ? 1000 / 30 : quality === 'picker' ? 1000 / 15 : 0;

    let raf = 0;
    let alive = true;
    let visible = true;
    let last = 0;
    const t0 = performance.now();
    const dur = story.durationMs;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const cssW = rect.width || 360;
      canvas.width = Math.max(2, Math.round(cssW * dpr));
      canvas.height = Math.max(2, Math.round(cssW * dpr * (16 / 9)));
    };
    resize();

    const loop = (now: number) => {
      if (!alive) return;
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      if (minFrameMs && now - last < minFrameMs) return;
      last = now;
      const t = ((now - t0) % dur) / 1000;
      renderFrame(ctx, story, t, canvas.width, canvas.height);
    };

    // Paint the first frame only once the Arabic faces are in — otherwise the
    // opening frames show fallback glyphs and then snap.
    const start = () => {
      if (!alive) return;
      resize();
      raf = requestAnimationFrame(loop);
    };
    if (document.fonts?.ready) document.fonts.ready.then(start, start);
    else start();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver((entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (visible) last = 0;
      });
      io.observe(canvas);
    }

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io?.disconnect();
    };
  }, [story, quality]);

  return <canvas ref={ref} className={className} />;
}
