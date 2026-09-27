/**
 * **[#163]** The arrow at the left of a Node page's chrome bar that leads out of the Tree to
 * the overview. What a click does is `tests/browser/node-view.spec.ts`; this is what the
 * server sends: a plain link, named in the chrome language, marked when that differs from
 * the content's.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'vitest'
import { BackToOverview } from '../src/components/BackToOverview.tsx'
import { overviewHref } from '../src/url.ts'

describe('the way back to the overview', () => {
  test('is a link to the overview, named in English, on an English page', () => {
    const html = renderToStaticMarkup(<BackToOverview href={overviewHref('en')} lang="en" />)

    expect(html).toContain('<a class="back-to-overview" href="/" aria-label="All decision trees">')
    expect(html).not.toContain(' lang=')
  })

  test('is named in Dutch on a Dutch page', () => {
    const html = renderToStaticMarkup(<BackToOverview href={overviewHref('nl')} lang="nl" />)

    expect(html).toContain('href="/?lang=nl" aria-label="Alle beslisbomen"')
  })

  test('marks its English name on a page whose content the chrome does not speak', () => {
    const html = renderToStaticMarkup(<BackToOverview href={overviewHref('en')} lang="de" />)

    expect(html).toContain('aria-label="All decision trees" lang="en"')
  })

  test('draws its arrow hidden from a screen reader, which reads the name instead', () => {
    const html = renderToStaticMarkup(<BackToOverview href="/" lang="en" />)

    expect(html).toContain('<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">')
  })
})
