/**
 * The permanently visible "not legal advice" footer (core document 3.2, 8), on every page.
 *
 * It sits here rather than in `layout.tsx` as docs/specs/application.md section 6 sketches,
 * because the content language lives in the query string and a Next.js layout cannot read
 * the query; the two pages that exist each render it. See the PR of issue #7.
 */
import { chrome } from '../chrome.ts'
import { chromeLang } from './NodeView.tsx'

export function Disclaimer({ lang }: { lang: string }) {
  return (
    <footer className="disclaimer" lang={chromeLang(lang)}>
      <p>{chrome(lang).disclaimer}</p>
    </footer>
  )
}
