import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * The page's motion vocabulary.
 *
 * Everything here is deliberately small: one observer for reveals, one rAF for
 * counting, one media query for reduced motion. No animation library, and no
 * motion that a reader who asked for less of it cannot switch off.
 */

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduced;
}

/**
 * Reveal every `[data-reveal]` descendant of `root` when it scrolls into view.
 *
 * The observer is rebuilt whenever `deps` change, so elements that arrive
 * later — the gallery, for instance — are picked up without a second pass.
 */
export function useRevealScope<T extends HTMLElement>(root: RefObject<T>, deps: unknown[] = []): void {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const targets = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!targets.length) return;

    if (typeof IntersectionObserver === 'undefined') {
      targets.forEach((t) => t.classList.add('is-in'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = entry.target as HTMLElement;
          target.classList.add('is-in');
          io.unobserve(target);
        });
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.1 },
    );

    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, ...deps]);
}

/** True once the element has entered the viewport. */
export function useInView<T extends HTMLElement>(options?: IntersectionObserverInit): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      options ?? { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, options]);
  return [ref, seen];
}

/**
 * Count a number up when it comes into view. Reduced motion gets the final
 * value immediately — the number matters, the animation does not.
 */
export function useCountUp(target: number, active: boolean, duration = 1400): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setValue(Math.round(target * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return value;
}

/** Scroll to a section by id, honouring reduced motion. */
export function scrollToId(id: string): void {
  const target = document.getElementById(id);
  if (!target) return;
  const reduced =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
}
