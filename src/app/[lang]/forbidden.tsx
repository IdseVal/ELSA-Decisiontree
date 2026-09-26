import { headers } from 'next/headers'
import { chrome, chromeLanguage, CHROME_LANGUAGES } from '../../chrome.ts'
import { Branch } from '../../components/Branch.tsx'
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
      <header className="page-chrome">
        <span className="tree-title">{ui.siteTitle}</span>
        <div className="page-controls">
          <ChromeLanguageSwitch lang={lang} href={(language) => adminHref(asked.path, language)} />
        </div>
      </header>
      <main lang={lang}>
        <article className="bubble bubble--notice">
          <div className="bubble-text">
            <h1>{ui.forbiddenTitle}</h1>
            <p className="prose">{ui.forbiddenText}</p>
          </div>
        </article>
        <div className="answers">
          <Branch className="answer answer--start-again" href={adminHref('/admin', lang)} title={ui.toOverview} />
        </div>
      </main>
      <Disclaimer lang={lang} />
    </>
  )
}
