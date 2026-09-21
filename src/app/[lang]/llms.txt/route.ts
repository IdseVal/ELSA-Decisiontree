import { headers } from 'next/headers'
import { text } from '../../../chrome.ts'
import { baseUrl, servedTree } from '../../../config.ts'
import { llmsTxt } from '../../../findability/llms.ts'

/**
 * `GET /llms.txt` (docs/specs/application.md 16.5), generated from the served Tree's
 * manifest at request time: a static file would hard-code one host and one Tree, and its
 * first two lines are Tree data.
 *
 * Markdown content under a plain-text media type, which is what the convention's readers
 * expect: `text/markdown` is not reliably handled by the middle of the internet.
 *
 * **There is no `/llms-full.txt`**, and this file is the reason: the complete content of
 * this site in one document already exists, validated against a published schema, at
 * `/<tree-id>/tree.json`, and the first section here names it (16.5).
 */
/**
 * Generated at request time, never a file in the repository (application.md 16): the Tree and the base are run-time settings.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  const tree = await servedTree()
  // The root Node's description, which the blockquote falls back to when the manifest
  // carries none: it is optional in the format, the root Node's is not (16.5).
  const root = await tree.getNode(tree.manifest.root)
  const lang = tree.manifest.defaultLanguage
  const fallback = root ? text(root.description, lang, `${tree.manifest.root}.description`) : ''

  return new Response(llmsTxt(tree, baseUrl(await headers()), fallback), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
