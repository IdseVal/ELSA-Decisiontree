import { headers } from 'next/headers'
import { chrome, chromeLanguage, CHROME_LANGUAGES, type ChromeLanguage } from '../../chrome.ts'
import { Branch } from '../../components/Branch.tsx'
import { Disclaimer } from '../../components/Disclaimer.tsx'
import { ChromeLanguageSwitch } from '../../components/LanguageSwitch.tsx'
import { ThemeStyle } from '../../components/ThemeStyle.tsx'
import { overviewHref, REQUEST_PATH_HEADER, requested } from '../../url.ts'

/**
 * Rendered per request: the language it speaks is the request's (docs/specs/application.md 24.3).
 */
export const dynamic = 'force-dynamic'

/**
 * The 404 page (docs/specs/application.md 4.3, 23.1, 24.3): a small page in the chrome
 * language, in the default Theme, with the site's title in the chrome bar and a link to
 * the overview. **[#134]** One page for every 404 -- an unknown Node, an unknown Tree, a
 * hidden one -- so it names no Tree: a hidden Tree's logo on its 404 would tell a caller
 * the id exists (23.1).
 *
 * Next.js renders `not-found.tsx` without params, so the language comes from the path
 * `src/proxy.ts` hands the page: `?lang`, when it is one of the chrome's.
 */
export default async function NotFound() {
  const asked = requested((await headers()).get(REQUEST_PATH_HEADER))
  const lang = chromeLanguage(asked.lang ?? CHROME_LANGUAGES[0])
  const ui = chrome(lang)
  const inLang = (language: ChromeLanguage): string =>
    language === CHROME_LANGUAGES[0] ? asked.path : `${asked.path}?lang=${language}`
  return (
    <>
      <ThemeStyle tree={null} />
      {/* The chrome bar of every page: the body's first grid row is its height (10.1), and a
          page without one would be laid out from the wrong row. */}
      <header className="page-chrome">
        <span className="tree-title">{ui.siteTitle}</span>
        <div className="page-controls">
          <ChromeLanguageSwitch lang={lang} href={inLang} />
        </div>
      </header>
      <main lang={lang}>
        <article className="bubble bubble--notice">
          <div className="bubble-text">
            <h1>{ui.notFoundTitle}</h1>
            <p className="prose">{ui.notFoundText}</p>
          </div>
        </article>
        <div className="answers">
          <Branch className="answer answer--start-again" href={overviewHref(lang)} title={ui.toOverview} />
        </div>
      </main>
      <Disclaimer lang={lang} />
    </>
  )
}
