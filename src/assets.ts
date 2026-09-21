/**
 * How a file from the served Tree's folder becomes an HTTP response: the image route
 * (docs/specs/application.md 5.3) and the theme route (5.5) send the same four headers and
 * differ only in which loader method resolves the name and which extensions they know.
 *
 * The spec states the path-safety rule "once here for both"; this module is that sentence
 * in code. Neither route resolves a path itself -- `imagePath` and `themePath` do, inside
 * the Tree's own folder -- so what is left to share is the streaming and the headers.
 *
 * **[#121]** The dataset endpoint and the schema route of 15.1 are two more files served
 * from here, with the extra headers of 15.2: the licence the bytes carry, the contract
 * they are described by, the `ETag` that makes a crawler's second fetch free, and the
 * cross-origin permission that makes a dataset fetchable by another lab's page.
 */
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile } from 'node:fs/promises'
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

/** The licences the two routes of 15.1 announce on the bytes themselves (15.2). */
export const CONTENT_LICENCE_URL = 'https://creativecommons.org/licenses/by/4.0/'
export const CODE_LICENCE_URL = 'https://opensource.org/license/mit'

/** One file of section 15, and what its headers say about it. */
export interface Dataset {
  /** Absolute path of the file to serve; `null` is the 404 every refusal shares (15.1). */
  path: string | null
  /**
   * The `rel="license"` URL. The licence travels with the bytes and not only with the page
   * that links to them: a crawler that fetches only the JSON never sees a page (15.2).
   */
  licence: string
  /** The `rel="describedby"` URL: the contract, one hop from the data. Absent on the contract itself. */
  describedBy?: string
}

/**
 * One file of section 15 as an HTTP response: the header table of 15.2 in full, a strong
 * `ETag` over the bytes, and `304` when the caller already holds them.
 *
 * The file is read rather than streamed because the `ETag` is a tag over the bytes (15.2)
 * and must be computed from them; the same read answers the request, so the file is opened
 * once. A Tree file is a few hundred kilobytes at the sizes this project holds, and an
 * hour of caching plus the `ETag` makes a daily crawl cost one read.
 *
 * `Access-Control-Allow-Credentials` is never sent, and `Set-Cookie` never: a cross-origin
 * read here reaches nothing a plain `curl` does not, because this origin has no cookie, no
 * session and no header that carries authority (15.2, core document 4 and 8).
 */
export async function datasetResponse(dataset: Dataset, request: Request): Promise<Response> {
  if (!dataset.path) return new Response(null, { status: 404 })

  let bytes: Buffer
  try {
    bytes = await readFile(dataset.path)
  } catch (error) {
    // The Tree file was read and validated at server start (5.4) and the schema is a
    // constant of the build, so either one missing now is a broken deployment rather than
    // a bad request. The reader still gets the 404 every refusal of 15.1 shares.
    console.error(`${dataset.path} could not be read: ${(error as Error).message}`)
    return new Response(null, { status: 404 })
  }

  const etag = `"${createHash('sha256').update(bytes).digest('base64url')}"`
  const links = [`<${dataset.licence}>; rel="license"`]
  if (dataset.describedBy) links.push(`<${dataset.describedBy}>; rel="describedby"`)
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    Link: links.join(', '),
    'Cache-Control': 'public, max-age=3600',
    ETag: etag,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD',
    // The same two headers the image and theme routes send, so there is one header set in
    // this module and not two: the route decides the type, the bytes never do (5.3).
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
    // Data to look at, not a file to save: a crawler that follows the link should get a
    // document it can read (15.2).
    'Content-Disposition': 'inline',
  }

  // The whole set, not a subset: a `304` that dropped the licence or the contract would be
  // the one answer a returning crawler sees, and it would see less than the first did.
  if (offeredTags(request).includes(etag)) return new Response(null, { status: 304, headers })
  // A Buffer's backing store is typed as `ArrayBufferLike` -- it could in principle be
  // shared memory, which a response body may not be -- and `readFile` never returns one.
  // The view is over the same bytes and copies none of them.
  const body = new Uint8Array(bytes.buffer as ArrayBuffer, bytes.byteOffset, bytes.byteLength)
  return new Response(body, { headers })
}

/** The tags an `If-None-Match` offers; a caller may send the list it holds, not only one. */
function offeredTags(request: Request): string[] {
  return (request.headers.get('if-none-match') ?? '').split(',').map((tag) => tag.trim())
}
