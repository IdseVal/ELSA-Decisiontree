/**
 * The permanently visible "not legal advice" footer (core document 3.2, 8), on every page.
 *
 * It sits here rather than in `layout.tsx` as docs/specs/application.md section 6 sketches,
 * and each page renders it: the 404 page says everything it says in the chrome language of
 * the Tree's default (4.3), which is not the content language the layout knows, so a footer
 * owned by the layout would speak a different language than the page around it.
 *
 * Its `lang` is set unconditionally, unlike the chrome inside the Node view: the footer is a
 * sibling of `<main>`, so the only language it can inherit is the one on `<html>` -- the
 * content language (4.4) -- and that is a false statement about this text whenever the
 * chrome does not speak it (application.md 3.1).
 */
import { chrome, chromeLanguage } from '../chrome.ts'

export function Disclaimer({ lang }: { lang: string }) {
  return (
    <footer className="disclaimer" lang={chromeLanguage(lang)}>
      <p>{chrome(lang).disclaimer}</p>
    </footer>
  )
}
