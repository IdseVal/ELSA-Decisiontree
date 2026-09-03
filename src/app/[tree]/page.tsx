import { notFound, redirect } from 'next/navigation'
import { servedTree } from '../../config.ts'
import { rootHref } from '../../url.ts'

/**
 * Rendered per request: the Tree is a run-time setting, so nothing here may be baked into
 * the build (docs/specs/application.md section 2).
 */
export const dynamic = 'force-dynamic'

/** `/<tree-id>` redirects to that Tree's root Node; any other Tree id answers 404 (4.1). */
export default async function TreeRoot({
  params,
  searchParams,
}: {
  params: Promise<{ tree: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const tree = await servedTree()
  const { tree: treeId } = await params
  if (treeId !== tree.id) notFound()
  const { lang } = await searchParams
  redirect(rootHref(tree, typeof lang === 'string' ? lang : null))
}
