/**
 * The film manifest.
 *
 * `/films/films.json` is produced by the render pipeline and may not exist
 * yet, may be empty, or may be mid-write. Every one of those is a normal
 * state for this page, so the loader never throws and never guesses: it
 * reports what it found and the gallery decides what to show.
 */

export interface FilmEntry {
  id: string;
  src: string;
  poster?: string;
  lang: 'ar' | 'en' | 'fr';
  dir: 'rtl' | 'ltr';
  kicker: string;
  title: string;
  theme: string;
  family: string;
  look: string;
  duration: number;
  /** The verse as it is typeset in the film, line by line. */
  lines?: string[];
  /** The call to action burned into the last frame. */
  cta?: string;
}

export type FilmsStatus = 'loading' | 'ready' | 'missing' | 'error';

export interface FilmsResult {
  status: FilmsStatus;
  entries: FilmEntry[];
}

const LANGS = new Set(['ar', 'en', 'fr']);

/**
 * The site may be served from the domain root, a GitHub project page at
 * `/athar/`, or any other prefix. Every asset URL is therefore built from
 * Vite's `BASE_URL` rather than written as an absolute `/films/...` path,
 * which would 404 the moment a prefix appears.
 */
const BASE = import.meta.env.BASE_URL;

/** Prefix a site-relative path with the deployment base. */
export function asset(path: string): string {
  if (!path) return '';
  // Absolute URLs, data URIs and blob URLs are already final.
  if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(path) || /^(?:data|blob):/i.test(path)) {
    return path;
  }
  return `${BASE}${path.replace(/^\/+/, '')}`;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function num(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

/** One bad row must not take the whole catalogue down. */
function normalize(raw: unknown): FilmEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = str(r.id);
  const src = str(r.src);
  if (!id || !src) return null;

  const langRaw = str(r.lang).toLowerCase();
  const lang = (LANGS.has(langRaw) ? langRaw : 'ar') as FilmEntry['lang'];
  const dirRaw = str(r.dir).toLowerCase();

  const rawLines = Array.isArray(r.lines) ? r.lines : [];
  const lines = rawLines.map(str).filter(Boolean).slice(0, 6);

  return {
    id,
    src: asset(src),
    poster: asset(str(r.poster)) || undefined,
    lang,
    dir: dirRaw === 'rtl' || dirRaw === 'ltr' ? (dirRaw as FilmEntry['dir']) : lang === 'ar' ? 'rtl' : 'ltr',
    kicker: str(r.kicker),
    title: str(r.title),
    theme: str(r.theme),
    family: str(r.family),
    look: str(r.look),
    duration: num(r.duration),
    lines: lines.length ? lines : undefined,
    cta: str(r.cta) || undefined,
  };
}

export async function loadFilms(signal?: AbortSignal): Promise<FilmsResult> {
  let res: Response;
  try {
    res = await fetch(asset('films/films.json'), {
      signal,
      cache: 'no-cache',
      headers: { accept: 'application/json' },
    });
  } catch (e) {
    if ((e as { name?: string })?.name === 'AbortError') return { status: 'loading', entries: [] };
    return { status: 'error', entries: [] };
  }

  if (!res.ok) {
    return { status: res.status === 404 ? 'missing' : 'error', entries: [] };
  }

  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    // Some static hosts rewrite a missing file to the SPA shell and answer
    // 200 with HTML. That is the manifest being absent, not a broken file.
    const ctype = res.headers.get('content-type') ?? '';
    return { status: ctype.includes('html') ? 'missing' : 'error', entries: [] };
  }

  if (!Array.isArray(raw)) return { status: 'error', entries: [] };

  const entries: FilmEntry[] = [];
  for (const item of raw) {
    const entry = normalize(item);
    if (entry) entries.push(entry);
  }

  return { status: entries.length ? 'ready' : 'missing', entries };
}
