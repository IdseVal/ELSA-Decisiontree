import { forbidden, notFound, redirect } from 'next/navigation'
import { pageSession } from '../../../../../admin/authenticated.ts'
import { chromeLanguage } from '../../../../../chrome.ts'
import { LoginPage } from '../../../../../components/LoginPage.tsx'
import { store } from '../../../../../config.ts'
import { editorLinks } from '../../../../../editor/links.ts'
import { isStoreError } from '../../../../../store/errors.ts'
import { contentLanguage } from '../../../../../url.ts'

export const dynamic = 'force-dynamic'

/**
 * `/admin/trees/<tree-id>` (docs/specs/application.md 24.1): a 307 to the editor of the
 * root Node, as `/<tree-id>` leads to the public root (4.1). Without a session the login page
 * at this address (24.2); without a role the 403 page.
 */
export default async function EditorRoot({ params }: { params: Promise<{ lang: string; tree: string }> }) {
  const { lang, tree: treeId } = await params
  const session = await pageSession()
  if (!session) return <LoginPage lang={chromeLanguage(lang)} />
  const { drafts } = await store()
  try {
    drafts.permitted(session.account, treeId, 'read')
  } catch (error) {
    if (!isStoreError(error)) throw error
    if (error.status === 404) notFound()
    forbidden()
  }
  const { manifest } = drafts.entry(session.account, treeId)
  if (!manifest) notFound()
  redirect(
    editorLinks().node({
      treeId,
      trail: [],
      nodeId: manifest.root,
      lang: contentLanguage({ manifest }, lang),
      defaultLang: manifest.defaultLanguage,
    }),
  )
}
