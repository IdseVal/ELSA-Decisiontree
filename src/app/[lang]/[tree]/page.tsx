import { notFound, redirect } from 'next/navigation'
import { store } from '../../../config.ts'
import { rootHref } from '../../../url.ts'

/**
 * Rendered per request: which Trees are published is the store's, and changes without a
 * build (docs/specs/application.md 18.2).
 */
export const dynamic = 'force-dynamic'

/**
 * `/<tree-id>` redirects to that Tree's root Node; an id that is not a served Tree answers
 * 404, a hidden one exactly as an unknown one (4.1, 23.1).
 */
export default async function TreeRoot({
  params,
}: {
  params: Promise<{ lang: string; tree: string }>
}) {
  const { lang, tree: treeId } = await params
  const tree = (await store()).published(treeId)
  if (!tree) notFound()
  redirect(rootHref(tree, lang))
}
