/**
 * The chrome bar of the admin area's Tree-less pages (docs/specs/application.md 24.3;
 * ADR-133-admin-routes decision 7): the site's title where a logo would be, the language
 * switch of the chrome languages and -- with a session -- the caller's name as a link to
 * the account page, the accounts page for the administrator, and the logout button.
 */
import { headers } from 'next/headers'
import { chrome, type ChromeLanguage } from '../chrome.ts'
import { LogoutButton } from '../editor/LogoutButton.tsx'
import type { Account } from '../store/accounts.ts'
import { adminHref, REQUEST_PATH_HEADER, requested } from '../url.ts'
import { ChromeLanguageSwitch } from './LanguageSwitch.tsx'

export async function AdminChrome({ lang, account }: { lang: ChromeLanguage; account: Account | null }) {
  const ui = chrome(lang)
  // The page the reader is on, in the other language: the address they asked for, whichever it is.
  const here = requested((await headers()).get(REQUEST_PATH_HEADER)).path
  return (
    <header className="page-chrome">
      <span className="tree-title">{ui.siteTitle}</span>
      <div className="page-controls">
        <ChromeLanguageSwitch lang={lang} href={(language) => adminHref(here, language)} />
        {account && (
          <nav className="admin-nav" aria-label={ui.account}>
            <a className="admin-link" href={adminHref('/admin/account', lang)}>
              {account.name}
            </a>
            {account.administrator && (
              <a className="admin-link" href={adminHref('/admin/accounts', lang)}>
                {ui.accounts}
              </a>
            )}
            <LogoutButton label={ui.logout} to={adminHref('/admin', lang)} />
          </nav>
        )}
      </div>
    </header>
  )
}
