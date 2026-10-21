import { VERSES } from '../content/corpus';
import { LOOKS, LOOK_ORDER } from '../engine/looks';
import type { Lang, Story } from '../engine/types';

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A wish maps to a *theme*, never to free-form scripture. The theme then
 * selects from the locked corpus. This makes misquoting structurally
 * impossible.
 */
const THEME_KEYWORDS: Record<string, string[]> = {
  gratitude: ['شكر', 'حمد', 'نعمة', 'gratitude', 'thank', 'merci', 'reconnaiss'],
  patience: ['صبر', 'صابر', 'patience', 'patient'],
  hope: ['أمل', 'فرج', 'hope', 'espoir', 'عسر', 'يسر'],
  ease: ['قلق', 'هم', 'ضيق', 'خوف', 'تعب', 'صعب', 'anxiety', 'stress', 'peur', 'angoisse', 'fatigu'],
  trust: ['توكل', 'ثقة', 'trust', 'tawakkal', 'confiance'],
  remembrance: ['ذكر', 'طمأنينة', 'سكينة', 'peace', 'calm', 'طمأن'],
  dua: ['دعاء', 'ادعي', 'dua', 'pray', 'prière', 'دعوة'],
  presence: ['وحدة', 'وحيد', 'lonely', 'seul', 'قرب', 'معية'],
  health: ['صحة', 'شفاء', 'مرض', 'health', 'heal', 'santé', 'malade'],
  family: ['أمي', 'أبي', 'والدتي', 'والدي', 'أولادي', 'mother', 'father', 'famille', 'mère', 'père'],
};

export function themeFromWish(wish: string): string | null {
  const w = (wish || '').toLowerCase();
  if (!w.trim()) return null;
  for (const [theme, words] of Object.entries(THEME_KEYWORDS)) {
    if (words.some((word) => w.includes(word.toLowerCase()))) return theme;
  }
  return null;
}

/**
 * One verse, ten visual languages.
 *
 * The chooser is a *style* choice, so every card must carry the same words —
 * otherwise you are comparing verses, not styles. The verse is deterministic
 * for a given (wish, day, language, salt); "change the story" bumps the salt.
 */
export function generateTakes(wish: string, lang: Lang, date = new Date(), salt = 0): Story[] {
  const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  const seed = hash(`${(wish || '').trim().toLowerCase()}|${dateKey}|${lang}${salt ? `|${salt}` : ''}`);
  const rnd = mulberry32(seed);
  const theme = themeFromWish(wish);

  const pool = theme ? VERSES.filter((v) => v.themes.includes(theme)) : VERSES.slice();
  const verse = pool.length ? pool[Math.floor(rnd() * pool.length)] : VERSES[0];

  return LOOK_ORDER.map((look) => ({
    id: `${look}-${verse.id}-${seed}`,
    look,
    verse,
    durationMs: LOOKS[look].durationMs,
    lang,
  }));
}

export function dailyTakes(date = new Date(), lang: Lang = 'ar'): Story[] {
  return generateTakes('', lang, date);
}
