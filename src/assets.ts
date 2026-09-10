/**
 * How a file from the served Tree's folder becomes an HTTP response: the image route
 * (docs/specs/application.md 5.3) and the theme route (5.5) send the same four headers and
 * differ only in which loader method resolves the name and which extensions they know.
 *
 * The spec states the path-safety rule "once here for both"; this module is that sentence
 * in code. Neither route resolves a path itself -- `imagePath` and `themePath` do, inside
 * the Tree's own folder -- so what is left to share is the streaming and the headers.
 */
import { createReadStream } from 'node:fs'
import { Readable } from 'node:stream'

/** The types the image route serves (tree-format.md 3.5). */
export const IMAGE_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
}

/** The types the theme route serves: a logo or icon, and the one font format (3.6). */
export const THEME_TYPES: Record<string, string> = {
  svg: 'image/svg+xml',
  png: 'image/png',
  webp: 'image/webp',
  ico: 'image/x-icon',
  woff2: 'font/woff2',
}

/**
 * `absolute` streamed with the `Content-Type` its extension names, or 404 when the loader
 * refused the name. A `null` path is every refusal at once -- malformed, not referenced,
 * not there -- with no difference a caller can measure (5.5).
 */
export function assetResponse(absolute: string | null, types: Record<string, string>): Response {
  if (!absolute) return new Response(null, { status: 404 })

  // The extension is read off the resolved path, not off the requested name: the two are
  // the same string by construction, and the resolved one is the file actually opened.
  const extension = absolute.slice(absolute.lastIndexOf('.') + 1).toLowerCase()
  const body = Readable.toWeb(createReadStream(absolute)) as ReadableStream<Uint8Array>
  return new Response(body, {
    headers: {
      'Content-Type': types[extension] ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=3600',
      // A Tree is third-party data and the format allows `.svg`: an SVG opened on its own
      // would otherwise run script on this origin. These two headers make anything either
      // route serves inert whatever its bytes turn out to be.
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline',
    },
  })
}
