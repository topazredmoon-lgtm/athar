import { useEffect, useMemo, useRef, useState } from 'react';
import type { SiteCopy } from '../i18n';
import { useRevealScope } from './hooks';
import { asset } from './manifest';

interface Credit {
  id: string;
  title?: string;
  creator?: string;
  license?: string;
  source?: string;
  page?: string;
}

/**
 * Photo credits.
 *
 * The 108 new films are built on real photographs sourced from Wikimedia
 * Commons and Openverse. Several of those licences (CC BY, CC BY-SA) require
 * the creator and the licence to travel with the work, so the list is
 * published here rather than kept in a build artefact.
 */
export default function Credits({ t }: { t: SiteCopy }) {
  const rootRef = useRef<HTMLElement>(null);
  useRevealScope(rootRef, []);

  const [rows, setRows] = useState<Credit[] | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    fetch(asset('films/credits.json'), {
      signal: ac.signal,
      cache: 'no-cache',
      headers: { accept: 'application/json' },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (ac.signal.aborted) return;
        setRows(Array.isArray(d) ? (d as Credit[]) : []);
      })
      .catch(() => {
        if (!ac.signal.aborted) setRows([]);
      });
    return () => ac.abort();
  }, []);

  const shown = useMemo(() => (rows ?? []).filter((r) => r.creator || r.title), [rows]);

  return (
    <section className="section credits" id="credits" ref={rootRef}>
      <div className="wrap">
        <header className="section-head" data-reveal>
          <span className="rule" aria-hidden="true" />
          <h2 className="section-title">{t.credits.title}</h2>
          <p className="section-lede">{t.credits.lede}</p>
        </header>

        {rows === null || shown.length === 0 ? (
          <p className="credits-note" data-reveal>
            {t.credits.empty}
          </p>
        ) : (
          <>
            <p className="credits-count" data-reveal>
              {t.credits.count.replace('{n}', String(shown.length))}
            </p>
            <ol className="credits-list" data-reveal>
              {shown.map((c) => (
                <li key={c.id} className="credit">
                  <span className="credit-id">{c.id}</span>
                  <span className="credit-main">
                    <span className="credit-title">{c.title || c.id}</span>
                    <span className="credit-meta">
                      {c.creator ? <span>{c.creator}</span> : null}
                      {c.license ? (
                        <span>
                          {t.credits.license}: {c.license}
                        </span>
                      ) : null}
                      {c.source ? (
                        <span>
                          {t.credits.source}: {c.source}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  {c.page ? (
                    <a
                      className="credit-link"
                      href={c.page}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={c.title || c.id}
                    >
                      ↗
                    </a>
                  ) : null}
                </li>
              ))}
            </ol>
            <p className="credits-note" data-reveal>
              {t.credits.note}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
