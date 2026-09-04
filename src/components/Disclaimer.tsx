/**
 * The permanently visible "not legal advice" footer (core document 3.2, 8), on every page.
 *
 * It sits here rather than in `layout.tsx` as docs/specs/application.md section 6 sketches,
 * because the content language lives in the query string and a Next.js layout cannot read
 * the query; the two pages that exist each render it. See the PR of issue #7.
 *
 * Its `lang` is set unconditionally, unlike the chrome inside the Node view: the footer is a
 * sibling of `<main>`, so the only language it can inherit is the one on `<html>`, which is
 * the Tree's default and not the language of this page (application.md 3.1, and issue #19).
 */
import { chrome, chromeLanguage } from '../chrome.ts'

export function Disclaimer({ lang }: { lang: string }) {
  return (
    <footer className="disclaimer" lang={chromeLanguage(lang)}>
      <p>{chrome(lang).disclaimer}</p>
    </footer>
  )
}
