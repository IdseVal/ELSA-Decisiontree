/**
 * The 404 page (docs/specs/application.md 4.3, 23.1, 24.3; ADR-19 decision 7).
 *
 * **[#134]** One page for every 404 -- an unknown Node, an unknown Tree, a hidden one -- so
 * it names no Tree: the site's title in the chrome bar, the default Theme, a link to the
 * overview. Everything it says is chrome, which exists in English and Dutch only, so it
 * speaks the chrome language of the request's `?lang` and marks every element it renders
 * with exactly that -- `lang="en"` around English chrome asked for in `de`, never `lang="de"`.
 *
 * Next.js renders `not-found.tsx` without params; the page reads the path `src/proxy.ts`
 * hands it. Here that header is the one thing replaced, and the page is rendered as it ships.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test, vi } from 'vitest'
import { REQUEST_PATH_HEADER } from '../src/url.ts'
import { effectiveLang } from './effective-lang.ts'

const asked = vi.hoisted(() => ({ path: '/' }))

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ [REQUEST_PATH_HEADER]: asked.path }),
}))

const { default: NotFound } = await import('../src/app/[lang]/not-found.tsx')

/** The 404 page as the server renders it for a request of `path`. */
async function notFoundPage(path: string): Promise<string> {
  asked.path = path
  return renderToStaticMarkup(await NotFound())
}

/** Every element the page renders: what it announces to a reader who cannot see it. */
const MARKERS = ['class="bubble bubble--notice"', 'class="prose"', 'class="branch answer answer--start-again"', 'class="disclaimer"']

describe('the 404 page', () => {
  test('is English and says so, when the language asked for is one the chrome does not speak', async () => {
    const html = await notFoundPage('/other-languages/nowhere?lang=de')

    expect(html).toContain('This step does not exist')
    expect(html).toContain('<main lang="en">')
    for (const marker of MARKERS) expect(effectiveLang(html, marker), marker).toBe('en')
    // The false attribute this rule exists to prevent: English chrome marked as German.
    expect(html).not.toContain('lang="de"')
  })

  test('is Dutch and says so, when Dutch is asked for', async () => {
    const html = await notFoundPage('/single-language/nowhere?lang=nl')

    expect(html).toContain('Deze stap bestaat niet')
    expect(html).toContain('<main lang="nl">')
    for (const marker of MARKERS) expect(effectiveLang(html, marker), marker).toBe('nl')
  })

  test('marks its elements when no language is asked for, in English', async () => {
    const html = await notFoundPage('/ai-act-example/nowhere')

    expect(html).toContain('<main lang="en">')
    for (const marker of MARKERS) expect(effectiveLang(html, marker), marker).toBe('en')
  })

  test('names no Tree: the site title in the chrome bar, and a link to the overview in its language', async () => {
    const english = await notFoundPage('/ai-act-example/nowhere')
    const dutch = await notFoundPage('/ai-act-example/nowhere?lang=nl')

    expect(english).toContain('<span class="tree-title">ELSA decision trees</span>')
    expect(english).not.toContain('ai-act-example/start')
    expect(english).toMatch(/<a class="branch answer answer--start-again" href="\/"/)
    expect(dutch).toMatch(/<a class="branch answer answer--start-again" href="\/\?lang=nl"/)
  })

  test('a hidden Tree and an unknown one get the same page (23.1)', async () => {
    // Only the path a caller typed differs, in the language switch's links; nothing the
    // store knows about either id reaches the page.
    const hidden = await notFoundPage('/hidden-draft/start')
    const unknown = await notFoundPage('/never-a-tree/start')

    expect(hidden.replaceAll('/hidden-draft/start', '/x')).toBe(unknown.replaceAll('/never-a-tree/start', '/x'))
  })

  test("its language switch keeps the reader's path, and never leaves the site", async () => {
    expect(await notFoundPage('/some/where')).toContain('href="/some/where?lang=nl"')
    // `//host` in a link is another origin; the path is always given one leading slash.
    const html = await notFoundPage('//evil.example/x')
    expect(html).toContain('href="/evil.example/x?lang=nl"')
    expect(html).not.toContain('href="//')
  })
})
