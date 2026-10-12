/**
 * The chrome bar of the admin area's Tree-less pages (docs/specs/application.md 24.3;
 * ADR-133-admin-routes decision 7): the site's title where a logo would be, the language
 * switch of the chrome languages and -- with a session -- the link to the account page, the
 * accounts page for the administrator, and the logout button. **[#176]** The account link
 * says `account`, "Account"; the caller's name is its description and tooltip
 * (ADR-176-floating-settings-and-to-do). **[#204]** At `/admin` itself, the login page and the
 * creators' overview, `website` ends the bar: a link back to the public overview, which the public
 * pages' "Editor" answers from the same place.
 */
import { headers } from 'next/headers'
import { chrome, type ChromeLanguage } from '../chrome.ts'
import { LogoutButton } from '../editor/LogoutButton.tsx'
import type { Account } from '../store/accounts.ts'
import { adminHref, overviewHref, REQUEST_PATH_HEADER, requested } from '../url.ts'
import { ChromeLanguageSwitch } from './LanguageSwitch.tsx'

export async function AdminChrome({
  lang,
  account,
  website = false,
}: {
  lang: ChromeLanguage
  account: Account | null
  /** **[#204]** The page at `/admin`: `website` at the right end, and the bar's own widths (24.3). */
  website?: boolean
}) {
  const ui = chrome(lang)
  // The page the reader is on, in the other language: the address they asked for, whichever it is.
  const here = requested((await headers()).get(REQUEST_PATH_HEADER)).path
  return (
    <header className={website ? 'page-chrome admin-chrome admin-home' : 'page-chrome admin-chrome'}>
      <span className="tree-title">{ui.siteTitle}</span>
      <div className="page-controls">
        <ChromeLanguageSwitch lang={lang} href={(language) => adminHref(here, language)} />
        {account && (
          <nav className="admin-nav" aria-label={ui.account}>
            <a className="admin-link" href={adminHref('/admin/account', lang)} title={account.name}>
              {ui.account}
            </a>
            {account.administrator && (
              <a className="admin-link" href={adminHref('/admin/accounts', lang)}>
                {ui.accounts}
              </a>
            )}
            <LogoutButton label={ui.logout} to={adminHref('/admin', lang)} />
          </nav>
        )}
        {website && (
          <a className="admin-link" href={overviewHref(lang)}>
            {ui.website}
          </a>
        )}
      </div>
    </header>
  )
}
