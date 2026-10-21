import type { PhotoSource } from './types';

/**
 * Loading a user photograph.
 *
 * The rules this file follows:
 *  - decoding is async, so it never blocks the first paint of the page;
 *  - a file that is not an image, or an image that cannot be decoded, fails
 *    with a code the UI can turn into a sentence — never an `alert()`;
 *  - the caller gets a decoded bitmap it can hand straight to the renderer.
 */

export const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp';
export const ACCEPTED_EXT = '.jpg,.jpeg,.png,.webp';

export type PhotoErrorCode = 'type' | 'decode' | 'empty';

export class PhotoError extends Error {
  code: PhotoErrorCode;
  constructor(code: PhotoErrorCode) {
    super(`photo:${code}`);
    this.code = code;
    this.name = 'PhotoError';
  }
}

function isAccepted(file: File): boolean {
  const type = (file.type || '').toLowerCase();
  if (type === 'image/jpeg' || type === 'image/jpg' || type === 'image/png' || type === 'image/webp') {
    return true;
  }
  // Some browsers hand over an empty MIME type for dragged files; fall back to
  // the extension rather than rejecting a perfectly good photograph.
  if (!type) return /\.(jpe?g|png|webp)$/i.test(file.name);
  return false;
}

async function loadViaImageElement(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new PhotoError('decode'));
      el.src = url;
    });
    // `decode()` surfaces a truncated or corrupt file that `onload` may accept.
    if (typeof img.decode === 'function') {
      await img.decode().catch(() => {
        throw new PhotoError('decode');
      });
    }
    return img;
  } finally {
    // The pixels are already decoded and owned by the element; the URL is dead
    // weight from here on.
    URL.revokeObjectURL(url);
  }
}

/**
 * Decode a user file into something the renderer can draw.
 *
 * Throws `PhotoError` with a `code` of `type` (not an image), `decode` (the
 * bytes are not a usable image) or `empty` (no file at all).
 */
export async function loadPhotoFile(file: File | null | undefined): Promise<PhotoSource> {
  if (!file) throw new PhotoError('empty');
  if (!isAccepted(file)) throw new PhotoError('type');

  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through to the <img> path — it is slower but it works */
    }
  }
  return loadViaImageElement(file);
}

/** Release a decoded photo. ImageBitmaps hold GPU memory until closed. */
export function releasePhoto(photo: PhotoSource | null | undefined): void {
  if (photo && typeof ImageBitmap !== 'undefined' && photo instanceof ImageBitmap) {
    photo.close();
  }
}

/**
 * A small preview of the photograph, for the drop zone.
 *
 * Drawn through a canvas rather than shown as the original file: an
 * ImageBitmap has no URL, and a full-resolution photo has no business being
 * decoded again for a thumbnail.
 */
export function makeThumb(photo: PhotoSource, size = 240): string {
  const iw = 'naturalWidth' in photo ? photo.naturalWidth || photo.width : photo.width;
  const ih = 'naturalHeight' in photo ? photo.naturalHeight || photo.height : photo.height;
  if (!iw || !ih) return '';
  const scale = Math.min(1, size / Math.max(iw, ih));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(iw * scale));
  c.height = Math.max(1, Math.round(ih * scale));
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(photo, 0, 0, c.width, c.height);
  try {
    return c.toDataURL('image/jpeg', 0.82);
  } catch {
    return '';
  }
}
