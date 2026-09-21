import { headers } from 'next/headers'
import { baseUrl, servedTree, treeLastmod } from '../../../config.ts'
import { lastmodDate, sitemapXml } from '../../../findability/sitemap.ts'

/**
 * `GET /sitemap.xml` (docs/specs/application.md 16.2): every Node of the served Tree, in
 * every language it declares, from the Tree the process loaded at start. Never a file in
 * the repository -- a static sitemap would have to be regenerated whenever the Tree
 * changed, which is the step a deployment most easily forgets.
 */
export async function GET() {
  const tree = await servedTree()
  const document = sitemapXml(tree, baseUrl(await headers()), lastmodDate(tree, treeLastmod()))
  return new Response(document, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
