import { notFound } from 'next/navigation'
import { servedTree } from '../../../config.ts'

/**
 * The Node page, `/<tree-id>/<...trail>/<node-id>` (docs/specs/application.md 4.1): the
 * last path segment is the Node shown. This is the plain server-rendered page that
 * exercises the loader end to end; the full Node view, the Trail and the language choice
 * are the next issues'. The description is shown as written, without the Markdown subset.
 */
export default async function NodePage({ params }: { params: Promise<{ tree: string; path: string[] }> }) {
  const { tree: treeId, path } = await params
  const tree = await servedTree()
  const nodeId = path[path.length - 1]
  const node = treeId === tree.id && nodeId !== undefined ? await tree.getNode(nodeId) : null
  if (!node) notFound()
  const lang = tree.manifest.defaultLanguage
  return (
    <main>
      <h1>{node.title[lang]}</h1>
      <pre>{node.description[lang]}</pre>
    </main>
  )
}
