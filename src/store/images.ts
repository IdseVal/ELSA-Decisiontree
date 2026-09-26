/**
 * An uploaded picture (docs/specs/application.md 22.6; ADR-132-editor-api decision 7): its
 * type and size read from its first bytes, and the name the server gives it. Pure: the store
 * writes the file.
 *
 * The type is never taken from the client's file name or declared type -- a `.png` that is a
 * GIF is a GIF -- and SVG is not accepted at all: it is a document that can carry script.
 */
import { createHash } from 'node:crypto'
import { isImageFile } from '../tree/validate.ts'

/** 22.6: one file of at most 5 MiB per request. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

/** What the first bytes say a picture is. */
export interface Sniffed {
  /** The extension the stored file gets. */
  extension: 'png' | 'jpg' | 'gif' | 'webp'
  width: number
  height: number
}

/**
 * The picture `bytes` hold: PNG, JPEG, GIF or WebP with its width and height, or null for
 * anything else -- an SVG, a text file, a truncated header.
 */
export function sniff(bytes: Uint8Array): Sniffed | null {
  try {
    return sniffed(bytes)
  } catch {
    // A header cut short reads past the end: not a picture this server can size.
    return null
  }
}

function sniffed(bytes: Uint8Array): Sniffed | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const ascii = (start: number, length: number): string =>
    String.fromCharCode(...bytes.subarray(start, Math.min(start + length, bytes.length)))
  const size = (extension: Sniffed['extension'], width: number, height: number): Sniffed | null =>
    width > 0 && height > 0 ? { extension, width, height } : null

  if (bytes.length >= 24 && ascii(0, 8) === '\x89PNG\r\n\x1a\n' && ascii(12, 4) === 'IHDR') {
    return size('png', view.getUint32(16), view.getUint32(20))
  }
  if (bytes.length >= 10 && (ascii(0, 6) === 'GIF87a' || ascii(0, 6) === 'GIF89a')) {
    return size('gif', view.getUint16(6, true), view.getUint16(8, true))
  }
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return jpeg(bytes, view)
  if (bytes.length >= 30 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') return webp(bytes, view, ascii)
  return null
}

/** A JPEG's size is in its first start-of-frame segment; every segment before it is skipped. */
function jpeg(bytes: Uint8Array, view: DataView): Sniffed | null {
  let at = 2
  while (at + 9 <= bytes.length) {
    if (bytes[at] !== 0xff) return null
    const marker = bytes[at + 1]!
    // SOF0 to SOF15, except DHT (C4), JPG (C8) and DAC (CC), which share the range.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      const height = view.getUint16(at + 5)
      const width = view.getUint16(at + 7)
      return width > 0 && height > 0 ? { extension: 'jpg', width, height } : null
    }
    at += 2 + view.getUint16(at + 2)
  }
  return null
}

/** A WebP's size is in its first chunk, in one of three layouts: lossy, lossless, extended. */
function webp(bytes: Uint8Array, view: DataView, ascii: (start: number, length: number) => string): Sniffed | null {
  const chunk = ascii(12, 4)
  let width = 0
  let height = 0
  if (chunk === 'VP8 ') {
    width = view.getUint16(26, true) & 0x3fff
    height = view.getUint16(28, true) & 0x3fff
  } else if (chunk === 'VP8L' && bytes[20] === 0x2f) {
    const bits = view.getUint32(21, true)
    width = (bits & 0x3fff) + 1
    height = ((bits >> 14) & 0x3fff) + 1
  } else if (chunk === 'VP8X') {
    const uint24 = (at: number): number => bytes[at]! | (bytes[at + 1]! << 8) | (bytes[at + 2]! << 16)
    width = uint24(24) + 1
    height = uint24(27) + 1
  }
  return width > 0 && height > 0 ? { extension: 'webp', width, height } : null
}

/**
 * The server's name for an upload (22.6): the client's name without its extension,
 * lower-cased, every run of characters outside `[a-z0-9]` one hyphen, no hyphen at either
 * end, at most 100 characters; then a hyphen, the first 8 hex digits of the bytes' SHA-256,
 * and the extension the bytes are. The same bytes always get the same name, so two uploads
 * of one picture are one file, and two pictures called `logo.png` are two.
 *
 * Throws when the result does not match tree-format.md 3.5, which it does by construction:
 * the check is the second of 5.5's two, kept so that a change here cannot open a path.
 */
export function imageName(clientName: string, bytes: Uint8Array, extension: Sniffed['extension']): string {
  const withoutExtension = clientName.replace(/\.[^.]*$/, '')
  const stem =
    withoutExtension
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100)
      .replace(/-+$/, '') || 'image'
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 8)
  const name = `${stem}-${hash}.${extension}`
  if (!isImageFile(name)) throw new Error(`"${name}" is not an image file name of tree-format.md 3.5`)
  return name
}
