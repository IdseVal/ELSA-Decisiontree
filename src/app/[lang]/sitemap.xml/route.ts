import { headers } from 'next/headers'
import { baseUrl, store } from '../../../config.ts'
import { sitemapXml } from '../../../findability/sitemap.ts'

/**
 * `GET /sitemap.xml` (docs/specs/application.md 16.2, 23.4): the overview, then every Node
 * of every served Tree in every language it declares, from the Trees the store holds.
 * Never a file in the repository -- a static sitemap would have to be regenerated whenever
 * a Tree changed, which is the step a deployment most easily forgets.
 */
/**
 * Generated at request time, never a file in the repository (application.md 16): the Trees and the base are run-time settings.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  const served = await store()
  const trees = served.publishedIds().map((id) => served.published(id)!)
  return new Response(sitemapXml(trees, baseUrl(await headers())), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
