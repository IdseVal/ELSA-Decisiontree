/**
 * The 404 page's own language (docs/specs/application.md 4.3, ADR-19 decision 7).
 *
 * Next.js renders `not-found.tsx` without params, so the page cannot know the content
 * language; everything it says is chrome, which exists in English and Dutch only. It
 * therefore speaks the chrome language of the Tree's **default** language and marks every
 * element it renders with exactly that -- `lang="en"` around English chrome on a `de` Tree,
 * never `lang="de"`. `<html lang>` around it stays the request's content language and is
 * the layout's, not this page's.
 *
 * The page is rendered as it ships. Only `servedTree` is replaced, by a fixture opened with
 * the real `openTree`: the served Tree is one environment setting per process (section 2)
 * and the rule this file is about is only visible on a Tree whose default is not a chrome
 * language.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, test, vi } from 'vitest'
import { openTree, type Tree } from '../src/tree/loader.ts'
import { effectiveLang } from './effective-lang.ts'

const served = vi.hoisted(() => ({ tree: undefined as Tree | undefined }))

vi.mock('../src/config.ts', () => ({ servedTree: async () => served.tree }))

const { default: NotFound } = await import('../src/app/[lang]/not-found.tsx')

const here = path.dirname(fileURLToPath(import.meta.url))
const trees = new Map<string, Tree>()

beforeAll(async () => {
  for (const [id, dir] of [
    ['ai-act-example', path.join(here, '..', 'trees', 'ai-act-example')],
    ['single-language', path.join(here, 'fixtures', 'single-language')],
    ['other-languages', path.join(here, 'fixtures', 'other-languages')],
  ] as const) {
    trees.set(id, await openTree(dir))
  }
})

/** The 404 page as the server renders it for the Tree `id`. */
async function notFoundPage(id: string): Promise<string> {
  served.tree = trees.get(id)
  return renderToStaticMarkup(await NotFound())
}

/** Every element the page renders: what it announces to a reader who cannot see it. */
const MARKERS = ['class="bubble bubble--notice"', 'class="prose"', 'class="branch answer answer--yes"', 'class="disclaimer"']

describe('the 404 page', () => {
  test('is English and says so, on a Tree whose default language the chrome does not speak', async () => {
    // tests/fixtures/other-languages: languages [de, fr], so the default is `de`.
    const html = await notFoundPage('other-languages')

    expect(html).toContain('This step does not exist')
    expect(html).toContain('<main lang="en">')
    for (const marker of MARKERS) expect(effectiveLang(html, marker), marker).toBe('en')
    // The false attribute this rule exists to prevent: English chrome marked as German.
    expect(html).not.toContain('lang="de"')
  })

  test('is Dutch and says so, on a Tree whose default language is Dutch', async () => {
    // tests/fixtures/single-language: languages [nl].
    const html = await notFoundPage('single-language')

    expect(html).toContain('Deze stap bestaat niet')
    expect(html).toContain('<main lang="nl">')
    for (const marker of MARKERS) expect(effectiveLang(html, marker), marker).toBe('nl')
  })

  test('marks its elements even when the chrome language equals the Tree default', async () => {
    const html = await notFoundPage('ai-act-example')

    expect(html).toContain('<main lang="en">')
    for (const marker of MARKERS) expect(effectiveLang(html, marker), marker).toBe('en')
  })

  test('links to the start of the Tree in its default language, which needs no ?lang', async () => {
    expect(await notFoundPage('other-languages')).toContain('href="/other-languages/start"')
  })
})
