import { forbidden, notFound, redirect } from 'next/navigation'
import { pageSession } from '../../../../../admin/authenticated.ts'
import { chromeLanguage } from '../../../../../chrome.ts'
import { LoginPage } from '../../../../../components/LoginPage.tsx'
import { store } from '../../../../../config.ts'
import { previewLinks } from '../../../../../editor/links.ts'
import { isStoreError } from '../../../../../store/errors.ts'
import { contentLanguage } from '../../../../../url.ts'

export const dynamic = 'force-dynamic'

/**
 * **[#205]** `/admin/preview/<tree-id>` (docs/specs/application.md 40.1): a 307 to the preview of
 * the root Node, `?lang` kept, as `/admin/trees/<tree-id>` leads to the root's editor (24.1).
 * Without a session the login page at this address (24.2); without a role the 403 page.
 */
export default async function PreviewRoot({ params }: { params: Promise<{ lang: string; tree: string }> }) {
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
    previewLinks().node({
      treeId,
      trail: [],
      nodeId: manifest.root,
      lang: contentLanguage({ manifest }, lang),
      defaultLang: manifest.defaultLanguage,
    }),
  )
}
