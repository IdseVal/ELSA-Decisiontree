import { redirect } from 'next/navigation'
import { servedTree } from '../config.ts'
import { rootHref } from '../url.ts'

/**
 * Rendered per request: the Tree is a run-time setting, so nothing here may be baked into
 * the build (docs/specs/application.md section 2).
 */
export const dynamic = 'force-dynamic'

/** `/` redirects to the root Node of the served Tree, keeping `lang` (application.md 4.1). */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const tree = await servedTree()
  const { lang } = await searchParams
  redirect(rootHref(tree, typeof lang === 'string' ? lang : null))
}
