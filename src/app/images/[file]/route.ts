import { createReadStream } from 'node:fs'
import { Readable } from 'node:stream'
import { servedTree } from '../../../config.ts'

/**
 * `GET /images/<file>` (docs/specs/application.md 5.3). The loader resolves the name inside
 * the served Tree's own `images/` folder and answers `null` for anything else, so this route
 * can serve no file the Tree does not list.
 */
const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  const tree = await servedTree()
  const absolute = tree.imagePath(file)
  if (!absolute) return new Response(null, { status: 404 })

  const extension = file.slice(file.lastIndexOf('.') + 1).toLowerCase()
  const body = Readable.toWeb(createReadStream(absolute)) as ReadableStream<Uint8Array>
  return new Response(body, {
    headers: {
      'Content-Type': CONTENT_TYPES[extension] ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=3600',
      // Tree images come from third-party authors and an SVG opened on its own would
      // otherwise run script on this origin.
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
