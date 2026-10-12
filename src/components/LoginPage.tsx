/**
 * The login page (docs/specs/application.md 24.2, 25.1; ADR-133-login-and-account-pages
 * decision 1): rendered, with status 200, at whatever admin address a visitor without a
 * session asked for, so that a successful login reloads that address. One centred card in
 * the default Theme, and under it the sentence that says where an account comes from.
 * **[#204]** At `/admin` itself its bar carries `website`, back to the public overview (24.3).
 */
import { chrome, type ChromeLanguage } from '../chrome.ts'
import { loginWords } from '../admin/words.ts'
import { LoginForm } from '../editor/LoginForm.tsx'
import { AdminChrome } from './AdminChrome.tsx'
import { Disclaimer } from './Disclaimer.tsx'
import { ThemeStyle } from './ThemeStyle.tsx'

export function LoginPage({
  lang,
  website = false,
}: {
  lang: ChromeLanguage
  /** **[#204]** Set at the address `/admin` only: the bar's way back to the public overview. */
  website?: boolean
}) {
  const ui = chrome(lang)
  return (
    <>
      <ThemeStyle tree={null} />
      <AdminChrome lang={lang} account={null} website={website} />
      <main className="admin-page admin-page--centred">
        <section className="admin-card" aria-labelledby="sign-in">
          <h1 id="sign-in">{ui.signIn}</h1>
          <noscript>
            <p className="admin-note">{ui.needsJavaScript}</p>
          </noscript>
          <LoginForm words={loginWords(lang)} />
        </section>
        <p className="admin-help">{ui.loginHelp}</p>
      </main>
      <Disclaimer lang={lang} />
    </>
  )
}
