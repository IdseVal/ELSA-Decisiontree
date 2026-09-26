import { notFound } from 'next/navigation'
import { pageSession } from '../../../../../admin/authenticated.ts'
import { chromeLanguage } from '../../../../../chrome.ts'
import { LoginPage } from '../../../../../components/LoginPage.tsx'

export const dynamic = 'force-dynamic'

/**
 * `/admin/trees/<tree-id>/...` (docs/specs/application.md 24.1, 24.2): the editor's
 * addresses. **[#135]** Without a session, the login page at the address asked for, so that
 * a link to an editor page lands on the form and then on the page. With one, the 404 page
 * until the editor exists (#138), which replaces this file.
 */
export default async function EditorAddress({ params }: { params: Promise<{ lang: string }> }) {
  const lang = chromeLanguage((await params).lang)
  if (!(await pageSession())) return <LoginPage lang={lang} />
  notFound()
}
