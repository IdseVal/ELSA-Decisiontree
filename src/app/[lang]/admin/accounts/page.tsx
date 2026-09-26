import { forbidden } from 'next/navigation'
import { pageSession } from '../../../../admin/authenticated.ts'
import { accountWords } from '../../../../admin/words.ts'
import { chrome, chromeLanguage } from '../../../../chrome.ts'
import { AdminChrome } from '../../../../components/AdminChrome.tsx'
import { Disclaimer } from '../../../../components/Disclaimer.tsx'
import { LoginPage } from '../../../../components/LoginPage.tsx'
import { ThemeStyle } from '../../../../components/ThemeStyle.tsx'
import { store } from '../../../../config.ts'
import { AccountsList } from '../../../../editor/AccountsList.tsx'

export const dynamic = 'force-dynamic'

/**
 * `/admin/accounts` (docs/specs/application.md 25.3): the administrator's list of every
 * account, with the create form and the two row actions; the 403 page for anyone else.
 */
export default async function AccountsPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = chromeLanguage((await params).lang)
  const session = await pageSession()
  if (!session) return <LoginPage lang={lang} />
  if (!session.account.administrator) forbidden()
  const ui = chrome(lang)
  const accounts = (await store()).accounts
    .all()
    .map(({ id, name, login, active, administrator }) => ({ id, name, login, active, administrator }))
  return (
    <>
      <ThemeStyle tree={null} />
      <AdminChrome lang={lang} account={session.account} />
      <main className="admin-page">
        <h1 className="admin-heading">{ui.accounts}</h1>
        <noscript>
          <p className="admin-note">{ui.needsJavaScript}</p>
        </noscript>
        <AccountsList accounts={accounts} words={accountWords(lang)} />
      </main>
      <Disclaimer lang={lang} />
    </>
  )
}
