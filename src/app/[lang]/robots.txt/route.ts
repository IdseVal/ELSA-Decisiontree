import { headers } from 'next/headers'
import { baseUrl } from '../../../config.ts'
import { robotsTxt } from '../../../findability/robots.ts'

/**
 * `GET /robots.txt` (docs/specs/application.md 16.1). Generated rather than a file in
 * `public/`, because the `Sitemap:` line is an absolute URL and where this deployment is
 * reached is a run-time setting (`ELSA_BASE_URL`, or this request's own origin -- 16).
 *
 * It lives under `[lang]` because every route does (4.4), and it ignores the segment, as
 * the image and theme routes do.
 */
/**
 * Generated at request time, never a file in the repository (application.md 16): the base this deployment is reached at is a run-time setting.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  return new Response(robotsTxt(baseUrl(await headers())), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
