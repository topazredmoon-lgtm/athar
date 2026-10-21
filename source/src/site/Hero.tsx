import { useEffect, useRef, useState } from 'react';
import type { SiteCopy } from '../i18n';
import { scrollToId, useCountUp, useInView, useReducedMotion } from './hooks';
import { asset } from './manifest';

/** The hero film. If the file is not there yet, the poster stands in. */
const HERO_SRC = asset('films/hero.mp4');

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z" />
    </svg>
  );
}

function Stat({
  label,
  count,
  suffix,
  text,
  index,
}: {
  label: string;
  count?: number;
  suffix?: string;
  text?: string;
  index: number;
}) {
  const [ref, seen] = useInView<HTMLDivElement>();
  const value = useCountUp(count ?? 0, seen && typeof count === 'number');

  return (
    <div className="stat" ref={ref} data-reveal style={{ ['--i' as string]: index }}>
      <div className="stat-value">
        {typeof count === 'number' ? (
          <>
            {value}
            {suffix ? <span className="stat-suffix">{suffix}</span> : null}
          </>
        ) : (
          text
        )}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function Hero({ t }: { t: SiteCopy }) {
  const reduced = useReducedMotion();
  const [filmOk, setFilmOk] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // The hero film is a large asset: it is only requested when motion is
  // welcome, and it is never fetched at all if the reader asked for less.
  useEffect(() => {
    if (reduced) {
      setFilmOk(false);
      return;
    }
    const v = videoRef.current;
    if (!v) return;
    const play = () => {
      v.play().catch(() => undefined);
    };
    v.addEventListener('canplay', play);
    return () => v.removeEventListener('canplay', play);
  }, [reduced]);

  const words = t.hero.title.split(/\s+/).filter(Boolean);

  return (
    <section className="hero" id="top">
      <div className={`hero-stage${filmOk ? ' has-film' : ''}`} aria-hidden="true">
        {!reduced && (
          <video
            ref={videoRef}
            className="hero-film"
            src={HERO_SRC}
            muted
            loop
            playsInline
            preload="metadata"
            onError={() => setFilmOk(false)}
            onLoadedData={() => setFilmOk(true)}
          />
        )}
        <div className="hero-scrim" />
      </div>

      <div className="hero-inner">
        <p className="hero-eyebrow">
          <SparkIcon />
          <span>{t.hero.eyebrow}</span>
        </p>

        <h1 className="hero-title">
          {words.map((w: string, i: number) => (
            <span className="hero-word" key={`${w}-${i}`} style={{ ['--i' as string]: i }}>
              {w}
            </span>
          ))}
        </h1>

        <p className="hero-sub">{t.hero.sub}</p>

        <div className="hero-cta">
          <button className="btn btn-gold" onClick={() => scrollToId('films')}>
            <PlayIcon />
            <span>{t.hero.ctaFilms}</span>
          </button>
          <button className="btn btn-ghost" onClick={() => scrollToId('studio')}>
            <span>{t.hero.ctaStudio}</span>
          </button>
        </div>

        <p className="hero-editorial">{t.hero.editorial}</p>
      </div>

      <div className="hero-stats">
        {t.stats.map((s, i) => (
          <Stat key={s.label} label={s.label} count={s.count} suffix={s.suffix} text={s.text} index={i} />
        ))}
      </div>
    </section>
  );
}
