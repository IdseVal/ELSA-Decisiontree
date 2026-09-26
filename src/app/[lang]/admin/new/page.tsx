import { pageSession } from '../../../../admin/authenticated.ts'
import { newTreeWords } from '../../../../admin/words.ts'
import { chrome, chromeLanguage } from '../../../../chrome.ts'
import { AdminChrome } from '../../../../components/AdminChrome.tsx'
import { Disclaimer } from '../../../../components/Disclaimer.tsx'
import { LoginPage } from '../../../../components/LoginPage.tsx'
import { ThemeStyle } from '../../../../components/ThemeStyle.tsx'
import { NewTreeForm } from '../../../../editor/NewTreeForm.tsx'

export const dynamic = 'force-dynamic'

/**
 * `/admin/new` (docs/specs/application.md 24.1, 27): the new-Tree form behind the + tile,
 * for any logged-in account (21.2: every account may create a Tree). One card in a scroll
 * box -- one of the four carriers of 26.3 -- because the form grows by a title per language.
 */
export default async function NewTreePage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = chromeLanguage((await params).lang)
  const session = await pageSession()
  if (!session) return <LoginPage lang={lang} />
  return (
    <>
      <ThemeStyle tree={null} />
      <AdminChrome lang={lang} account={session.account} />
      <main className="admin-page">
        <noscript>
          <p className="admin-note">{chrome(lang).needsJavaScript}</p>
        </noscript>
        <div className="admin-scroll" data-scroll-box="" tabIndex={0} aria-labelledby="new-tree">
          <NewTreeForm lang={lang} words={newTreeWords(lang)} />
        </div>
      </main>
      <Disclaimer lang={lang} />
    </>
  )
}
