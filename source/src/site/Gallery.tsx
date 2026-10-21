import { useEffect, useMemo, useRef, useState } from 'react';
import type { SiteCopy } from '../i18n';
import { loadFilms, type FilmEntry, type FilmsStatus } from './manifest';
import { useRevealScope } from './hooks';

type LangFilter = 'all' | 'ar' | 'fr' | 'en';

/**
 * One film plays at a time.
 *
 * Hovering across a row of cards would otherwise leave six clips running
 * behind each other, each with its own decoder, on a phone that cannot afford
 * it.
 */
const playing = new Set<HTMLVideoElement>();

function playExclusive(video: HTMLVideoElement) {
  playing.forEach((other) => {
    if (other !== video) other.pause();
  });
  playing.clear();
  playing.add(video);
  video.play().catch(() => undefined);
}

function stopVideo(video: HTMLVideoElement | null) {
  if (!video) return;
  video.pause();
  playing.delete(video);
}

/** Load the clip only once its card is close to the viewport. */
function useNearViewport<T extends HTMLElement>(rootMargin = '320px') {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near, rootMargin]);

  return [ref, near] as const;
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function DownloadGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v11" />
      <path d="M7.5 10.5L12 15l4.5-4.5" />
      <path d="M5 18v1a1 1 0 001 1h12a1 1 0 001-1v-1" />
    </svg>
  );
}

function FilmCard({
  film,
  t,
  onOpen,
}: {
  film: FilmEntry;
  t: SiteCopy;
  onOpen: (film: FilmEntry, trigger: HTMLElement) => void;
}) {
  const [frameRef, near] = useNearViewport<HTMLButtonElement>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [live, setLive] = useState(false);

  const langName = film.lang === 'ar' ? t.films.ar : film.lang === 'fr' ? t.films.fr : t.films.en;

  const start = () => {
    const v = videoRef.current;
    if (!v) return;
    setLive(true);
    playExclusive(v);
  };

  const stop = () => {
    const v = videoRef.current;
    if (!v) return;
    setLive(false);
    stopVideo(v);
  };

  useEffect(() => () => stopVideo(videoRef.current), []);

  return (
    <article className="film-card" data-reveal>
      <button
        ref={frameRef}
        type="button"
        className={`film-frame${live ? ' is-live' : ''}`}
        onClick={(e) => onOpen(film, e.currentTarget)}
        onMouseEnter={start}
        onMouseLeave={stop}
        onFocus={start}
        onBlur={stop}
        aria-label={`${t.films.open}: ${film.title || film.kicker || film.id}`}
      >
        {film.poster ? (
          <img className="film-poster" src={film.poster} alt="" loading="lazy" decoding="async" />
        ) : (
          <span className="film-poster film-poster-empty" aria-hidden="true" />
        )}
        <video
          ref={videoRef}
          className="film-video"
          src={near ? film.src : undefined}
          muted
          loop
          playsInline
          preload="none"
          onPlaying={() => setLive(true)}
          onPause={() => setLive(false)}
          tabIndex={-1}
        />
        <span className="film-lang" lang={film.lang} dir={film.dir}>
          {langName}
        </span>
        <span className="film-play" aria-hidden="true">
          <PlayGlyph />
        </span>
      </button>
      <div className="film-meta">
        {film.kicker ? <p className="film-kicker">{film.kicker}</p> : null}
        {film.title ? (
          <h3 className="film-title" dir={film.dir} lang={film.lang}>
            {film.title}
          </h3>
        ) : null}
      </div>
    </article>
  );
}

function PhonePlayer({ film, t }: { film: FilmEntry; t: SiteCopy }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      const d = v.duration;
      setProgress(d && Number.isFinite(d) ? (v.currentTime / d) * 100 : 0);
    };
    v.addEventListener('timeupdate', onTime);
    return () => v.removeEventListener('timeupdate', onTime);
  }, []);

  const langName = film.lang === 'ar' ? t.films.ar : film.lang === 'fr' ? t.films.fr : t.films.en;

  return (
    <div className="phone">
      <div className="phone-shell">
        <div className="phone-screen">
          <video
            ref={videoRef}
            className="phone-video"
            src={film.src}
            poster={film.poster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
          <div className="phone-bar" aria-hidden="true">
            <i style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
      <div className="phone-meta">
        {film.kicker ? <p className="film-kicker">{film.kicker}</p> : null}
        <h3 className="phone-title" dir={film.dir} lang={film.lang}>
          {film.title || film.id}
        </h3>
        {film.lines?.length ? (
          <figure className="phone-quote">
            <blockquote dir={film.dir} lang={film.lang}>
              {film.lines.map((line, i) => (
                <span key={`${film.id}-l${i}`}>{line}</span>
              ))}
            </blockquote>
            <figcaption>{t.films.quoteLabel}</figcaption>
          </figure>
        ) : null}
        {film.cta ? (
          <p className="phone-cta" dir={film.dir} lang={film.lang}>
            {film.cta}
          </p>
        ) : null}
        <dl className="phone-facts">
          <div>
            <dt>{t.films.langLabel}</dt>
            <dd>{langName}</dd>
          </div>
          {film.theme ? (
            <div>
              <dt>{t.films.themeLabel}</dt>
              <dd>{film.theme}</dd>
            </div>
          ) : null}
          {film.look ? (
            <div>
              <dt>{t.films.lookLabel}</dt>
              <dd>{film.look}</dd>
            </div>
          ) : null}
        </dl>
        <a className="btn btn-gold btn-wide" href={film.src} download>
          <DownloadGlyph />
          <span>{t.films.download}</span>
        </a>
      </div>
    </div>
  );
}

export default function Gallery({ t }: { t: SiteCopy }) {
  const [status, setStatus] = useState<FilmsStatus>('loading');
  const [entries, setEntries] = useState<FilmEntry[]>([]);
  const [lang, setLang] = useState<LangFilter>('all');
  const [theme, setTheme] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<FilmEntry | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    loadFilms(ac.signal).then((res) => {
      if (ac.signal.aborted) return;
      setStatus(res.status);
      setEntries(res.entries);
    });
    return () => ac.abort();
  }, []);

  useRevealScope(rootRef, [status, entries.length, lang, theme, query]);

  // Escape closes the detail view, and the reader gets their place back.
  useEffect(() => {
    if (!selected) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  useEffect(() => {
    if (selected) return;
    triggerRef.current?.focus?.();
  }, [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((f) => {
      if (lang !== 'all' && f.lang !== lang) return false;
      if (theme !== 'all' && f.theme !== theme) return false;
      if (!q) return true;
      return (
        f.title.toLowerCase().includes(q) ||
        f.kicker.toLowerCase().includes(q) ||
        f.theme.toLowerCase().includes(q)
      );
    });
  }, [entries, lang, theme, query]);

  /** Every theme actually present in the index, so the control never offers a void. */
  const themes = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((f) => {
      if (f.theme) set.add(f.theme);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [entries]);

  const langFilters: { id: LangFilter; label: string }[] = [
    { id: 'all', label: t.films.all },
    { id: 'ar', label: t.films.ar },
    { id: 'fr', label: t.films.fr },
    { id: 'en', label: t.films.en },
  ];

  const openDetail = (film: FilmEntry, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setSelected(film);
  };

  return (
    <section className="section films" id="films" ref={rootRef}>
      <div className="wrap">
        <header className="section-head" data-reveal>
          <span className="rule" aria-hidden="true" />
          <h2 className="section-title">{t.films.title}</h2>
          <p className="section-lede">{t.films.lede}</p>
        </header>

        <div className="film-tools" data-reveal>
          <div className="film-filters" role="group" aria-label={t.films.filters}>
            {langFilters.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`chip${lang === f.id ? ' is-on' : ''}`}
                aria-pressed={lang === f.id}
                onClick={() => setLang(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          {themes.length > 0 ? (
            <div className="film-theme">
              <label className="sr-only" htmlFor="film-theme">
                {t.films.themeFilter}
              </label>
              <select
                id="film-theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                aria-label={t.films.themeFilter}
              >
                <option value="all">{t.films.allThemes}</option>
                {themes.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="film-search">
            <label className="sr-only" htmlFor="film-search">
              {t.films.search}
            </label>
            <input
              id="film-search"
              type="search"
              value={query}
              placeholder={t.films.searchPlaceholder}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
          {status === 'ready' ? (
            <p className="film-count">{t.films.count.replace('{n}', String(filtered.length))}</p>
          ) : null}
        </div>

        {status === 'loading' ? (
          <div className="film-grid" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <div className="film-skeleton" key={i}>
                <span />
              </div>
            ))}
          </div>
        ) : null}

        {status !== 'loading' && entries.length === 0 ? (
          <div className="empty" data-reveal>
            <span className="empty-mark" aria-hidden="true" />
            <h3>{t.films.emptyTitle}</h3>
            <p>{t.films.emptyBody}</p>
            <p className="empty-note">{t.films.emptyNote}</p>
          </div>
        ) : null}

        {status !== 'loading' && entries.length > 0 && filtered.length === 0 ? (
          <div className="empty" data-reveal>
            <span className="empty-mark" aria-hidden="true" />
            <h3>{t.films.noResults}</h3>
          </div>
        ) : null}

        {filtered.length > 0 ? (
          <div className="film-grid">
            {filtered.map((f) => (
              <FilmCard key={f.id} film={f} t={t} onOpen={openDetail} />
            ))}
          </div>
        ) : null}
      </div>

      {selected ? (
        <div
          className="detail"
          role="dialog"
          aria-modal="true"
          aria-label={t.films.detail}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="detail-inner">
            <button
              ref={closeRef}
              type="button"
              className="icon-btn detail-close"
              onClick={() => setSelected(null)}
              aria-label={t.films.close}
            >
              <CloseGlyph />
            </button>
            <PhonePlayer film={selected} t={t} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
