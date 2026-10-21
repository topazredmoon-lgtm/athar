/**
 * The film gallery.
 *
 * Moved out of `Films.tsx` because `Films.tsx` and `films.ts` differ only in
 * casing, and a case-insensitive filesystem cannot tell the component from
 * the manifest loader. The old path stays as an alias.
 */
export { default } from './Gallery';
