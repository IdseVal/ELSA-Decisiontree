/**
 * **[#204]** The way into the admin area from a public page: "Editor" at the right end of the
 * chrome bar, in the share button's look, a link to `/admin` in the page's chrome language
 * (docs/specs/application.md 24.3). The same link for every visitor: `/admin` itself shows the
 * login page without a session and the creators' overview with one (24.1), so a public page
 * never needs to know which, and reads no cookie (20.5).
 */
import { chrome, chromeLang, chromeLanguage } from '../chrome.ts'
import { adminHref } from '../url.ts'

export function ToEditor({
  lang,
}: {
  /** The content language of the page: the word is chrome, in the language that follows it. */
  lang: string
}) {
  return (
    <a className="to-editor" href={adminHref('/admin', chromeLanguage(lang))} lang={chromeLang(lang)}>
      {chrome(lang).editor}
    </a>
  )
}
