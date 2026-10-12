/**
 * An uneditable Tree (docs/specs/application.md 19.5): the blocking violations of its hand-edited
 * draft, and the way out. **[#205]** Its editor's address and its preview's both show it (40.1).
 */
import { chrome } from '../chrome.ts'
import { adminHref } from '../url.ts'
import { AdminChrome } from './AdminChrome.tsx'
import { Disclaimer } from './Disclaimer.tsx'
import { ThemeStyle } from './ThemeStyle.tsx'

/**
 * The page in the chrome language `lang`, listing `messages`. **[#213]** Under the 403 page's bar,
 * which the body's first grid row is sized for: without a bar the card was laid out in that row
 * and cut off (10.1).
 */
export function Uneditable({ lang, messages }: { lang: 'en' | 'nl'; messages: string[] }) {
  const ui = chrome(lang)
  return (
    <>
      <ThemeStyle tree={null} />
      <AdminChrome lang={lang} account={null} />
      <main className="admin-page admin-page--centred" lang={lang}>
        {/* **[#213]** Every admin page says so (24.2), and this one stands at the editor's address. */}
        <noscript>
          <p className="admin-note">{ui.needsJavaScript}</p>
        </noscript>
        <section className="admin-card" aria-labelledby="uneditable">
          <h1 id="uneditable">{ui.notEditable}</h1>
          <ul className="admin-note">
            {messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
          <a className="admin-submit admin-submit--link" href={adminHref('/admin', lang)}>
            {ui.toOverview}
          </a>
        </section>
      </main>
      <Disclaimer lang={lang} />
    </>
  )
}
