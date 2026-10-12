import { headers } from 'next/headers'
import { chrome, chromeLanguage, CHROME_LANGUAGES } from '../../chrome.ts'
import { Disclaimer } from '../../components/Disclaimer.tsx'
import { ChromeLanguageSwitch } from '../../components/LanguageSwitch.tsx'
import { ThemeStyle } from '../../components/ThemeStyle.tsx'
import { adminHref, REQUEST_PATH_HEADER, requested } from '../../url.ts'

/**
 * The 403 page (docs/specs/application.md 24.2): what a logged-in caller gets at an admin
 * page that is not theirs -- `/admin/accounts` without the administrator flag -- in the
 * chrome language, with a link to `/admin`. Never the login page and never a 404. Rendered
 * by `forbidden()`, which answers status 403.
 *
 * Next.js renders it without params, so the language comes from the path `src/proxy.ts`
 * hands the page, as the 404 page's does.
 */
export default async function Forbidden() {
  const asked = requested((await headers()).get(REQUEST_PATH_HEADER))
  const lang = chromeLanguage(asked.lang ?? CHROME_LANGUAGES[0])
  const ui = chrome(lang)
  return (
    <>
      <ThemeStyle tree={null} />
      <header className="page-chrome admin-chrome">
        <span className="tree-title">{ui.siteTitle}</span>
        <div className="page-controls">
          <ChromeLanguageSwitch lang={lang} href={(language) => adminHref(asked.path, language)} />
        </div>
      </header>
      {/* The login page's card (25.1), holding the refusal instead of the form. */}
      <main className="admin-page admin-page--centred" lang={lang}>
        <section className="admin-card" aria-labelledby="forbidden">
          <h1 id="forbidden">{ui.forbiddenTitle}</h1>
          <p className="admin-note">{ui.forbiddenText}</p>
          <a className="admin-submit admin-submit--link" href={adminHref('/admin', lang)}>
            {ui.toOverview}
          </a>
        </section>
      </main>
      <Disclaimer lang={lang} />
    </>
  )
}
