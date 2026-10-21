export type Lang = 'ar' | 'en' | 'fr';

/** Ten visual languages. Each one is a different room, not a different filter. */
export type LookId =
  | 'sakina'
  | 'dhahab'
  | 'hibr'
  | 'fajr'
  | 'layl'
  | 'nur'
  | 'bustan'
  | 'raml'
  | 'bahr'
  | 'waraq';

export interface Verse {
  id: string;
  /** Arabic display lines, already broken where they should breathe. */
  lines: string[];
  sourceAr: string;
  sourceEn: string;
  themes: string[];
}

/**
 * A user photograph used as the picture layer of a story.
 *
 * `ImageBitmap` is preferred (it decodes off the main thread and can be
 * closed explicitly), but a plain `HTMLImageElement` works everywhere.
 */
export type PhotoSource = HTMLImageElement | ImageBitmap;

/** Words the user typed, replacing the verse on the canvas. */
export interface CustomType {
  /** One entry per display line — the renderer never re-wraps. */
  lines: string[];
  /** Optional attribution drawn under the words. */
  source?: string;
  /** Text direction: shaping and bidi follow it. */
  dir?: 'rtl' | 'ltr';
}

export interface Story {
  id: string;
  look: LookId;
  verse: Verse;
  durationMs: number;
  lang: Lang;
  /**
   * Optional picture layer. When absent the renderer paints the vector
   * backdrop exactly as it always has.
   */
  photo?: PhotoSource;
  /** When present, the canvas shows these words instead of the verse. */
  custom?: CustomType;
}
