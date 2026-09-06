import { notFound, redirect } from 'next/navigation'
import { servedTree } from '../../../config.ts'
import { rootHref } from '../../../url.ts'

/**
 * Rendered per request: the Tree is a run-time setting, so nothing here may be baked into
 * the build (docs/specs/application.md section 2).
 */
export const dynamic = 'force-dynamic'

/** `/<tree-id>` redirects to that Tree's root Node; any other Tree id answers 404 (4.1). */
export default async function TreeRoot({
  params,
}: {
  params: Promise<{ lang: string; tree: string }>
}) {
  const tree = await servedTree()
  const { lang, tree: treeId } = await params
  if (treeId !== tree.id) notFound()
  redirect(rootHref(tree, lang))
}
