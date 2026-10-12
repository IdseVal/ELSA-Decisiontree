import { headers } from 'next/headers'
import { text } from '../../../chrome.ts'
import { baseUrl, store } from '../../../config.ts'
import { llmsTxt, type LlmsTree } from '../../../findability/llms.ts'

/**
 * `GET /llms.txt` (docs/specs/application.md 16.5, 23.5), generated from the served Trees'
 * manifests at request time: a static file would hard-code one host and one set of Trees.
 *
 * Markdown content under a plain-text media type, which is what the convention's readers
 * expect: `text/markdown` is not reliably handled by the middle of the internet.
 *
 * **There is no `/llms-full.txt`**, and this file is the reason: the complete content of
 * each Tree in one document already exists, validated against a published schema, at
 * `/<tree-id>/tree.json`, and a section here names each (16.5).
 */
/**
 * Generated at request time, never a file in the repository (application.md 16): the Trees and the base are run-time settings.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  const served = await store()
  const trees: LlmsTree[] = await Promise.all(
    served.publishedIds().map(async (id) => {
      const tree = served.published(id)!
      // The root Node's description, which a Tree's entry falls back to when the manifest
      // carries none: it is optional in the format, the root Node's is not (16.5).
      const root = await tree.getNode(tree.manifest.root)
      const lang = tree.manifest.defaultLanguage
      return { tree, rootDescription: root ? text(root.description, lang, `${tree.manifest.root}.description`) : '' }
    }),
  )

  return new Response(llmsTxt(trees, baseUrl(await headers())), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
