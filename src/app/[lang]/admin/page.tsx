import { pageSession } from '../../../admin/authenticated.ts'
import { chrome, chromeLanguage } from '../../../chrome.ts'
import { AdminChrome } from '../../../components/AdminChrome.tsx'
import { Disclaimer } from '../../../components/Disclaimer.tsx'
import { LoginPage } from '../../../components/LoginPage.tsx'
import { Overview } from '../../../components/Overview.tsx'
import { ThemeStyle } from '../../../components/ThemeStyle.tsx'
import { store } from '../../../config.ts'

export const dynamic = 'force-dynamic'

/**
 * `/admin` (docs/specs/application.md 24.1, 26.4): the login page without a session, the
 * creators' overview with one. **[#135]** The overview here is the public one's tile grid
 * under the admin chrome bar; the + tile, the hidden Trees and the state marks are #137's.
 */
export default async function AdminHome({ params }: { params: Promise<{ lang: string }> }) {
  const lang = chromeLanguage((await params).lang)
  const session = await pageSession()
  if (!session) return <LoginPage lang={lang} />
  const served = await store()
  return (
    <>
      <ThemeStyle tree={null} />
      <AdminChrome lang={lang} account={session.account} />
      <main className="overview-page">
        {/* The grid's box is labelled by the page's heading, as on the public overview. */}
        <h1 hidden id="site-title">
          {chrome(lang).siteTitle}
        </h1>
        <Overview trees={served.publishedIds().map((id) => served.published(id)!)} lang={lang} />
      </main>
      <Disclaimer lang={lang} />
    </>
  )
}
