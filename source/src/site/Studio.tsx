import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generateTakes } from '../ai/director';
import StoryCanvas from '../components/StoryCanvas';
import { encodeStory } from '../engine/encode';
import { LOOK_ORDER } from '../engine/looks';
import { loadPhotoFile, makeThumb, releasePhoto, type PhotoErrorCode } from '../engine/photo';
import { ensureFonts } from '../engine/render';
import type { LookId, PhotoSource, Story } from '../engine/types';
import { VERSES } from '../content/corpus';
import type { SiteCopy } from '../i18n';
import { useRevealScope } from './hooks';

/** The studio renders to the same spec as the collection: 1080×1920, 6.00s. */
const STUDIO_DURATION = 6000;

type Mode = 'photo' | 'verse';
type TextLang = 'ar' | 'en' | 'fr';

function UploadGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 16V5" />
      <path d="M7.5 9L12 4.5 16.5 9" />
      <path d="M4 15v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
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

function MicGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0013 0" />
      <path d="M12 18v3.5" />
      <path d="M8.5 21.5h7" />
    </svg>
  );
}

function linesOf(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export default function Studio({ t, siteLang }: { t: SiteCopy; siteLang: 'ar' | 'en' | 'fr' }) {
  const [mode, setMode] = useState<Mode>('photo');
  const rootRef = useRef<HTMLDivElement>(null);
  useRevealScope(rootRef, [mode]);

  /* ------------------------------------------------------------- photograph */

  const [photo, setPhoto] = useState<PhotoSource | null>(null);
  const [thumb, setThumb] = useState<string | null>(null);
  const [photoErr, setPhotoErr] = useState<PhotoErrorCode | null>(null);
  const photoRef = useRef<PhotoSource | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [look, setLook] = useState<LookId>('sakina');
  const [text, setText] = useState('');
  const [attr, setAttr] = useState('');
  const [textLang, setTextLang] = useState<TextLang>('ar');

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    ensureFonts();
    return () => releasePhoto(photoRef.current);
  }, []);

  const acceptPhoto = useCallback(async (file: File | null | undefined) => {
    setPhotoErr(null);
    setNote(null);
    try {
      const next = await loadPhotoFile(file);
      releasePhoto(photoRef.current);
      photoRef.current = next;
      setPhoto(next);
      setThumb(makeThumb(next));
    } catch (e) {
      const code = (e as { code?: PhotoErrorCode })?.code;
      setPhotoErr((code as PhotoErrorCode) || 'decode');
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer?.files?.[0];
      void acceptPhoto(file);
    },
    [acceptPhoto],
  );

  const clearPhoto = useCallback(() => {
    releasePhoto(photoRef.current);
    photoRef.current = null;
    setPhoto(null);
    setThumb(null);
    setPhotoErr(null);
  }, []);

  const lines = useMemo(() => linesOf(text), [text]);
  const dir: 'rtl' | 'ltr' = textLang === 'ar' ? 'rtl' : 'ltr';

  /** One story per look, so the picker can draw every room with the photo. */
  const stories = useMemo<Story[]>(
    () =>
      LOOK_ORDER.map((id) => ({
        id: `studio-${id}`,
        look: id,
        verse: VERSES[0],
        durationMs: STUDIO_DURATION,
        lang: textLang,
        photo: photo ?? undefined,
        custom: { lines, source: attr.trim() || undefined, dir },
      })),
    [photo, lines, attr, dir, textLang],
  );

  const story = stories[LOOK_ORDER.indexOf(look)] ?? stories[0];

  const exportMp4 = useCallback(async () => {
    if (!photo) return;
    setBusy(true);
    setProgress(0);
    setNote(null);
    try {
      const { blob, ext } = await encodeStory(story, setProgress);
      const name = `athar-${story.look}.${ext}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 5000);
      setNote(t.studio.ready);
    } catch (e) {
      const msg = String((e as { message?: string })?.message || e);
      setNote(msg === 'no-recorder' ? t.studio.unsupported : t.studio.failed);
    } finally {
      setBusy(false);
    }
  }, [photo, story, t]);

  /* ------------------------------------------------------------------ verse */

  const [wish, setWish] = useState('');
  const [takes, setTakes] = useState<Story[]>([]);
  const [takeIndex, setTakeIndex] = useState(0);
  const [salt, setSalt] = useState(0);
  const [listening, setListening] = useState(false);
  const [verseBusy, setVerseBusy] = useState(false);
  const [verseProgress, setVerseProgress] = useState(0);
  const [verseNote, setVerseNote] = useState<string | null>(null);

  const compose = useCallback(
    (w: string, nextSalt = 0) => {
      setTakes(generateTakes(w, siteLang, new Date(), nextSalt));
      setTakeIndex(0);
      setSalt(nextSalt);
      setVerseNote(null);
    },
    [siteLang],
  );

  const reroll = useCallback(() => {
    compose(wish.trim(), salt + 1);
  }, [compose, wish, salt]);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setVerseNote(t.studio.speakUnavailable);
      return;
    }
    try {
      const rec = new SR();
      rec.lang = siteLang === 'ar' ? 'ar-SA' : siteLang === 'fr' ? 'fr-FR' : 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onstart = () => setListening(true);
      rec.onend = () => setListening(false);
      rec.onerror = () => {
        setListening(false);
        setVerseNote(t.studio.speakUnavailable);
      };
      rec.onresult = (e: any) => {
        const said = (e.results?.[0]?.[0]?.transcript as string) || '';
        setWish(said);
        compose(said);
      };
      rec.start();
    } catch {
      setVerseNote(t.studio.speakUnavailable);
    }
  }, [compose, siteLang, t]);

  const publish = useCallback(async () => {
    const take = takes[takeIndex];
    if (!take) return;
    setVerseBusy(true);
    setVerseProgress(0);
    setVerseNote(null);
    try {
      const { blob, ext } = await encodeStory(take, setVerseProgress);
      const file = new File([blob], `athar-${take.look}.${ext}`, { type: blob.type });
      const nav = navigator as any;
      if (nav.canShare && nav.canShare({ files: [file] })) {
        try {
          await nav.share({ files: [file], title: 'Athar' });
          setVerseNote(t.studio.verseReady);
        } catch (e: any) {
          if (e && e.name !== 'AbortError') setVerseNote(t.studio.verseDownloaded);
        }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 5000);
        setVerseNote(t.studio.verseDownloaded);
      }
    } catch (e: any) {
      const msg = String(e?.message || e);
      setVerseNote(msg === 'no-recorder' ? t.studio.unsupported : t.studio.failed);
    } finally {
      setVerseBusy(false);
    }
  }, [takes, takeIndex, t]);

  const take = takes[takeIndex];
  const errText = photoErr === 'type' ? t.studio.errType : photoErr === 'decode' ? t.studio.errDecode : t.studio.errEmpty;

  return (
    <section className="section studio" id="studio" ref={rootRef}>
      <div className="wrap">
        <header className="section-head" data-reveal>
          <span className="rule" aria-hidden="true" />
          <h2 className="section-title">{t.studio.title}</h2>
          <p className="section-lede">{t.studio.lede}</p>
        </header>

        <div className="studio-tabs" role="tablist" aria-label={t.studio.title} data-reveal>
          <button
            type="button"
            role="tab"
            id="tab-photo"
            aria-selected={mode === 'photo'}
            aria-controls="panel-photo"
            className={`tab${mode === 'photo' ? ' is-on' : ''}`}
            onClick={() => setMode('photo')}
          >
            {t.studio.tabPhoto}
          </button>
          <button
            type="button"
            role="tab"
            id="tab-verse"
            aria-selected={mode === 'verse'}
            aria-controls="panel-verse"
            className={`tab${mode === 'verse' ? ' is-on' : ''}`}
            onClick={() => setMode('verse')}
          >
            {t.studio.tabVerse}
          </button>
        </div>

        {mode === 'photo' ? (
          <div className="studio-grid" id="panel-photo" role="tabpanel" aria-labelledby="tab-photo">
            <div className="studio-controls" data-reveal>
              <div
                className={`drop${dragOver ? ' is-over' : ''}${photo ? ' has-photo' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
              >
                {photo ? (
                  <>
                    <img className="drop-thumb" src={thumb ?? ''} alt={t.studio.dropTitle} />
                    <div className="drop-actions">
                      <button type="button" className="btn btn-quiet" onClick={() => fileRef.current?.click()}>
                        {t.studio.dropChange}
                      </button>
                      <button type="button" className="btn btn-quiet" onClick={clearPhoto}>
                        {t.studio.dropRemove}
                      </button>
                    </div>
                  </>
                ) : (
                  <button type="button" className="drop-inner" onClick={() => fileRef.current?.click()}>
                    <UploadGlyph />
                    <strong>{t.studio.dropTitle}</strong>
                    <span>{t.studio.dropHint}</span>
                  </button>
                )}
                <input
                  ref={fileRef}
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    void acceptPhoto(file);
                    e.target.value = '';
                  }}
                />
              </div>
              {photoErr ? (
                <p className="field-error" role="alert">
                  {errText}
                </p>
              ) : null}

              <div className="field">
                <label className="field-label" htmlFor="studio-text">
                  {t.studio.textLabel}
                </label>
                <textarea
                  id="studio-text"
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t.studio.textPlaceholder}
                  dir={dir}
                  lang={textLang}
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="studio-attr">
                  {t.studio.attrLabel}
                </label>
                <input
                  id="studio-attr"
                  value={attr}
                  onChange={(e) => setAttr(e.target.value)}
                  placeholder={t.studio.attrPlaceholder}
                  dir={dir}
                  lang={textLang}
                />
              </div>

              <div className="field">
                <span className="field-label">{t.studio.textLang}</span>
                <div className="seg" role="group" aria-label={t.studio.textLang}>
                  {(['ar', 'en', 'fr'] as TextLang[]).map((l) => (
                    <button
                      key={l}
                      type="button"
                      className={`seg-btn${textLang === l ? ' is-on' : ''}`}
                      aria-pressed={textLang === l}
                      onClick={() => setTextLang(l)}
                    >
                      {l === 'ar' ? 'العربية' : l === 'en' ? 'English' : 'Français'}
                    </button>
                  ))}
                </div>
              </div>

              <button className="btn btn-gold btn-wide" onClick={exportMp4} disabled={busy || !photo}>
                <DownloadGlyph />
                <span>{busy ? t.studio.exporting : t.studio.exportBtn}</span>
              </button>

              {busy ? (
                <div
                  className="progress"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress * 100)}
                  aria-label={t.studio.exporting}
                >
                  <i style={{ width: `${Math.round(progress * 100)}%` }} />
                </div>
              ) : null}

              {note ? (
                <p className="field-note" role="status">
                  {note}
                </p>
              ) : null}

              <p className="field-spec">{t.studio.spec}</p>
            </div>

            <div className="studio-stage" data-reveal>
              <div className="phone">
                <div className="phone-shell">
                  <div className="phone-screen">
                    <StoryCanvas story={story} className="phone-canvas" />
                    <div className="phone-bar" aria-hidden="true">
                      <i style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="studio-looks" data-reveal>
              <h3 className="studio-looks-title">{t.studio.lookLabel}</h3>
              <div className="look-grid">
                {stories.map((s) => (
                  <button
                    key={s.look}
                    type="button"
                    className={`look-card${s.look === look ? ' is-on' : ''}`}
                    onClick={() => setLook(s.look)}
                    aria-pressed={s.look === look}
                  >
                    <span className="look-frame">
                      <StoryCanvas story={s} className="look-canvas" quality="picker" />
                    </span>
                    <span className="look-name">{s.look}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="studio-grid" id="panel-verse" role="tabpanel" aria-labelledby="tab-verse">
            <div className="studio-controls" data-reveal>
              <h3 className="studio-looks-title">{t.studio.verseTitle}</h3>
              <p className="studio-sub">{t.studio.verseLede}</p>
              <form
                className="compose"
                onSubmit={(e) => {
                  e.preventDefault();
                  compose(wish.trim(), salt);
                }}
              >
                <label className="sr-only" htmlFor="studio-wish">
                  {t.studio.versePlaceholder}
                </label>
                <input
                  id="studio-wish"
                  value={wish}
                  onChange={(e) => setWish(e.target.value)}
                  placeholder={t.studio.versePlaceholder}
                  dir={siteLang === 'ar' ? 'rtl' : 'ltr'}
                  lang={siteLang}
                />
                <button type="submit" className="btn btn-gold">
                  {t.studio.verseCompose}
                </button>
                <button
                  type="button"
                  className="btn btn-quiet icon-only"
                  onClick={startListening}
                  aria-label={listening ? t.studio.verseListen : t.studio.verseMic}
                >
                  <MicGlyph />
                </button>
              </form>
              {takes.length ? (
                <button type="button" className="btn btn-quiet" onClick={reroll}>
                  {t.studio.verseChange}
                </button>
              ) : null}
              {verseNote ? (
                <p className="field-note" role="status">
                  {verseNote}
                </p>
              ) : null}
            </div>

            <div className="studio-stage" data-reveal>
              {take ? (
                <div className="phone">
                  <div className="phone-shell">
                    <div className="phone-screen">
                      <StoryCanvas story={take} className="phone-canvas" />
                      <div className="phone-bar" aria-hidden="true">
                        <i style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>
                  <p className="stage-note">{t.studio.verseNote}</p>
                  <button className="btn btn-gold btn-wide" onClick={publish} disabled={verseBusy}>
                    <DownloadGlyph />
                    <span>{verseBusy ? t.studio.versePreparing : t.studio.versePublish}</span>
                  </button>
                  {verseBusy ? (
                    <div
                      className="progress"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(verseProgress * 100)}
                      aria-label={t.studio.versePreparing}
                    >
                      <i style={{ width: `${Math.round(verseProgress * 100)}%` }} />
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="empty empty-inline">
                  <span className="empty-mark" aria-hidden="true" />
                  <h3>{t.studio.verseTakes}</h3>
                  <p>{t.studio.verseSub}</p>
                </div>
              )}
            </div>

            {takes.length ? (
              <div className="studio-looks" data-reveal>
                <h3 className="studio-looks-title">{t.studio.verseTakes}</h3>
                <div className="look-grid">
                  {takes.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`look-card${i === takeIndex ? ' is-on' : ''}`}
                      onClick={() => setTakeIndex(i)}
                      aria-pressed={i === takeIndex}
                    >
                      <span className="look-frame">
                        <StoryCanvas story={s} className="look-canvas" quality="picker" />
                      </span>
                      <span className="look-name">{s.look}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
