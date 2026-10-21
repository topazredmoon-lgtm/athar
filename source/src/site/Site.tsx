import { useEffect, useRef, useState } from 'react';
import { COPY } from '../i18n';
import type { Lang } from '../engine/types';
import Craft from './Craft';
import Credits from './Credits';
import Gallery from './Gallery';
import Hero from './Hero';
import Studio from './Studio';
import { scrollToId } from './hooks';

const LANGS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'EN' },
  { id: 'ar', label: 'العربية' },
  { id: 'fr', label: 'FR' },
];

const SECTIONS = ['top', 'films', 'studio', 'craft', 'credits'] as const;

function MenuGlyph({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}
    </svg>
  );
}

export default function Site() {
  const [lang, setLang] = useState<Lang>('en');
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState<string>('top');
  const t = COPY[lang].site;
  const dir = COPY[lang].dir;

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  // The legacy stylesheet builds a fixed phone frame; the site is a document
  // that scrolls. The class lets the site opt out without touching the study
  // instrument, which still wants the old shell.
  useEffect(() => {
    document.body.classList.add('is-site');
    return () => document.body.classList.remove('is-site');
  }, []);

  // Scroll spy: the nav marks the section the reader is actually in.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.2, 0.6] },
    );
    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const go = (id: string) => {
    setMenuOpen(false);
    scrollToId(id);
  };

  const navItems = [
    { id: 'top', label: t.nav.home },
    { id: 'films', label: t.nav.films },
    { id: 'studio', label: t.nav.studio },
    { id: 'craft', label: t.nav.craft },
    { id: 'credits', label: t.nav.credits },
  ];

  return (
    <div className="site">
      <a className="skip" href="#main">
        {t.nav.home}
      </a>

      <header className="nav">
        <div className="nav-inner">
          <a
            className="brand"
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              go('top');
            }}
          >
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-word">ATHAR</span>
            <span className="brand-ar" lang="ar" dir="rtl">
              أثَر
            </span>
          </a>

          <nav className="nav-links" aria-label={t.nav.menu}>
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`nav-link${active === item.id ? ' is-active' : ''}`}
                aria-current={active === item.id ? 'true' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  go(item.id);
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="nav-right">
            <div className="langs" role="group" aria-label={t.nav.lang}>
              {LANGS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className={`lang-btn${lang === l.id ? ' is-on' : ''}`}
                  aria-pressed={lang === l.id}
                  lang={l.id}
                  onClick={() => setLang(l.id)}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="icon-btn menu-btn"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? t.nav.close : t.nav.menu}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <MenuGlyph open={menuOpen} />
            </button>
          </div>
        </div>

        {menuOpen ? (
          <nav className="nav-drawer" aria-label={t.nav.menu}>
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`nav-link${active === item.id ? ' is-active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  go(item.id);
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>
        ) : null}
      </header>

      <main id="main">
        <Hero t={t} />
        <Gallery t={t} />
        <Studio t={t} siteLang={lang} />
        <Craft t={t} />
        <Credits t={t} />
      </main>

      <footer className="foot">
        <div className="wrap foot-inner">
          <div>
            <p className="foot-tag">{t.footer.tagline}</p>
            <p className="foot-note">{t.footer.note}</p>
          </div>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => go('top')}
          >
            {t.footer.backToTop}
          </button>
        </div>
      </footer>

      <div className="site-grain" aria-hidden="true" />
    </div>
  );
}
