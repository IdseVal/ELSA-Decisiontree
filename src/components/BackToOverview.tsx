/**
 * **[#163]** The way out of a Tree: a round arrow at the left of the chrome bar, before the
 * Tree's mark, that leads to the overview listing every Tree -- the public one from a Node
 * page, the creators' one from the editor. A link, not a history step, so it works on a
 * page opened from a shared link and without JavaScript.
 */
import { chrome, chromeLang } from '../chrome.ts'

export function BackToOverview({
  href,
  lang,
}: {
  /** The overview's address, in the page's chrome language. */
  href: string
  /** The content language of the page: the label is chrome, in the language that follows it. */
  lang: string
}) {
  return (
    <a className="back-to-overview" href={href} aria-label={chrome(lang).toOverview} lang={chromeLang(lang)}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M19 12H5M11 6l-6 6 6 6" />
      </svg>
    </a>
  )
}
