import { pageSession } from '../../../../admin/authenticated.ts'
import { accountWords } from '../../../../admin/words.ts'
import { chrome, chromeLanguage } from '../../../../chrome.ts'
import { AdminChrome } from '../../../../components/AdminChrome.tsx'
import { Disclaimer } from '../../../../components/Disclaimer.tsx'
import { LoginPage } from '../../../../components/LoginPage.tsx'
import { ThemeStyle } from '../../../../components/ThemeStyle.tsx'
import { AccountForms } from '../../../../editor/AccountForms.tsx'

export const dynamic = 'force-dynamic'

/** `/admin/account` (docs/specs/application.md 25.2): any logged-in account's own name and password. */
export default async function AccountPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = chromeLanguage((await params).lang)
  const session = await pageSession()
  if (!session) return <LoginPage lang={lang} />
  const { id, name, login } = session.account
  return (
    <>
      <ThemeStyle tree={null} />
      <AdminChrome lang={lang} account={session.account} />
      <main className="admin-page admin-page--centred">
        <noscript>
          <p className="admin-note">{chrome(lang).needsJavaScript}</p>
        </noscript>
        <AccountForms id={id} name={name} login={login} words={accountWords(lang)} />
      </main>
      <Disclaimer lang={lang} />
    </>
  )
}
