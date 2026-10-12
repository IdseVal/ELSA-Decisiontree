/**
 * The up arrow on the Bubble's top outline (docs/specs/application.md 10.2, core document
 * 3.2 and 10.17), which replaced the Trail drawn above it (#82), and the share button: the
 * way back, and the link that carries the Trail. What a click does is
 * `tests/browser/trail.spec.ts`; this file is what the server sends.
 *
 * Every fixture is loaded through `openTree` and every address through `parseUrl`, as
 * docs/specs/application.md section 7 requires; nothing here builds a Node by hand.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, test } from 'vitest'
import { chrome, chromeLang } from '../src/chrome.ts'
import { ShareButton } from '../src/components/ShareButton.tsx'
import type { Neighbour } from '../src/components/Slider.tsx'
import { TreeView } from '../src/components/TreeView.tsx'
import { loadPage } from '../src/neighbourhood.ts'
import { openTree, type Tree } from '../src/tree/loader.ts'
import { parseUrl } from '../src/url.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const trees = new Map<string, Tree>()

beforeAll(async () => {
  for (const [id, dir] of [
    ['ai-act-example', path.join(here, '..', 'trees', 'ai-act-example')],
    ['other-languages', path.join(here, 'fixtures', 'other-languages')],
    ['full-node', path.join(here, 'fixtures', 'full-node')],
  ] as const) {
    trees.set(id, await openTree(dir))
  }
})

/** What the page at the URL renders from: its Tree, its address, its Node and its neighbourhood. */
async function page(url: string): Promise<Parameters<typeof TreeView>[0]> {
  const { pathname, searchParams } = new URL(url, 'https://example.org')
  const tree = trees.get(pathname.split('/')[1]!)!
  // The `[lang]` segment the rewrite of 4.4 makes of the URL: these languages are all
  // well-formed tags, which it passes through unchanged.
  const address = parseUrl(pathname, searchParams.get('lang') ?? '_', tree)
  if (!address) throw new Error(`${url} is not a page of ${tree.id}`)
  const page = await loadPage(tree, address)
  if (!page) throw new Error(`${url} names no Node`)
  return { tree, page }
}

/** The markup of the Node the URL names, rendered the way the page renders it. */
async function view(url: string): Promise<string> {
  return renderToStaticMarkup(<TreeView {...await page(url)} />)
}

/**
 * The markup of each neighbour frame the page at the URL hands to the slide (11.3), by the
 * frame's `href`. A frame enters the document only mid-slide, so it is taken from the props
 * `TreeView` gives `Slider` rather than from the page's markup.
 */
async function neighbourFrames(url: string): Promise<Map<string, string>> {
  const layout = TreeView(await page(url)) as ReactElement<{ children: [ReactElement<{ neighbours: Neighbour[] }>] }>
  return new Map(layout.props.children[0].props.neighbours.map((n) => [n.href, renderToStaticMarkup(<>{n.frame}</>)]))
}

/** The up arrow's markup on its own, or the empty string when the page draws none. */
function arrow(html: string): string {
  return /<a class="up-arrow"[\s\S]*?<\/a>/.exec(html)?.[0] ?? ''
}

/** The up arrow's `href`, or null when the page draws none. */
function arrowHref(html: string): string | null {
  return /<a class="up-arrow" href="([^"]*)"/.exec(html)?.[1] ?? null
}

/** The `start` Node of the full-node fixture, reached by a Trail of `length` visits to itself. */
function walkOf(length: number): string {
  return `/full-node/${Array.from({ length: length + 1 }, () => 'full').join('/')}`
}

describe('the up arrow', () => {
  test('links to the Trail entry directly above, with everything after it discarded (10.2, 10.17)', async () => {
    // A Terminal, not an explanation Node: a path ending at an aside renders its parent's page (10.9).
    expect(arrowHref(await view('/ai-act-example/start/prohibited-practices/prohibited'))).toBe(
      '/ai-act-example/start/prohibited-practices',
    )
    expect(arrowHref(await view('/ai-act-example/start/prohibited-practices'))).toBe('/ai-act-example/start')
    // With an Overlay open by its URL the arrow is still the centre's: it leads to the centre's parent.
    expect(arrowHref(await view('/ai-act-example/start/prohibited-practices/social-scoring'))).toBe('/ai-act-example/start')
    // The language is in the link, not in a cookie.
    expect(arrowHref(await view('/ai-act-example/start/prohibited-practices/prohibited?lang=nl'))).toBe(
      '/ai-act-example/start/prohibited-practices?lang=nl',
    )
  })

  test('is the page the reader came from, and slides up to it: the parent is placed (11.1, 11.2)', async () => {
    expect(arrow(await view('/ai-act-example/start/prohibited-practices/prohibited'))).toMatch(
      /^<a class="up-arrow" href="\/ai-act-example\/start\/prohibited-practices" rel="prev" aria-labelledby="up-label" data-slide="">/,
    )
  })

  test('does not slide where the parent is the Node on screen, which is never its own neighbour', async () => {
    expect(arrow(await view(walkOf(3)))).not.toContain('data-slide')
  })

  test('is the Bubble\'s: it is drawn on its top outline, before the title', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices')
    const bubble = html.indexOf('<article class="bubble')

    expect(html.indexOf('<a class="up-arrow"')).toBeGreaterThan(bubble)
    expect(html.indexOf('<a class="up-arrow"')).toBeLessThan(html.indexOf('<h1'))
  })

  test('is named by the title it leads to, in the language that name is written in', async () => {
    const english = arrow(await view('/ai-act-example/start/prohibited-practices/prohibited'))
    const dutch = arrow(await view('/ai-act-example/start/prohibited-practices/prohibited?lang=nl'))
    const german = arrow(await view('/other-languages/start/anwendbar'))

    expect(english).toContain('<span hidden="" id="up-label">Back to: Does your system do any of the prohibited practices?</span>')
    // Dutch chrome beside Dutch content inherits `nl` from the page (application.md 3.1).
    expect(dutch).toContain('<span hidden="" id="up-label">Terug naar: Verricht uw systeem een van de verboden praktijken?</span>')
    expect(german).toMatch(/<span hidden="" id="up-label" lang="en">Back to: [^<]+<\/span>/)
    // The glyph says nothing a screen reader should read.
    expect(english).toContain('<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">')
  })

  test('at the root Node nothing is drawn: there is nothing above', async () => {
    const html = await view('/ai-act-example/start')

    expect(arrow(html)).toBe('')
    expect(html).not.toContain('up-label')
  })

  test('on a Node opened by its own URL, whatever its kind, nothing is drawn: its Trail is empty', async () => {
    for (const url of ['/ai-act-example/social-scoring', '/ai-act-example/prohibited-practices', '/ai-act-example/covered']) {
      expect(arrow(await view(url)), url).toBe('')
    }
  })

  test('the drawn Trail is gone: no Trail Branch, no collapsed middle, no Trail Sheet (10.2)', async () => {
    const html = await view(walkOf(49))

    expect(html).not.toMatch(/class="[^"]*trail/)
    expect(html).not.toContain('earlier step')
    expect(html.match(/<a class="up-arrow"/g)).toHaveLength(1)
    // Only the link back is in the page; the other 48 entries are in the URL alone.
    expect(arrowHref(html)).toBe(walkOf(48))
  })

  test('a neighbour frame draws its own up arrow, to its own parent, so nothing jumps at the handover (11.3)', async () => {
    const frames = await neighbourFrames('/ai-act-example/start/prohibited-practices')
    let checked = 0
    for (const [href, frame] of frames) {
      const own = await view(href)
      // A frame's ids are prefixed; its link and its name are the page's own.
      expect(arrowHref(frame), href).toBe(arrowHref(own))
      expect(/>[^<]*<\/span><svg/.exec(arrow(frame))?.[0], href).toBe(/>[^<]*<\/span><svg/.exec(arrow(own))?.[0])
      if (arrowHref(own) !== null) checked++
    }
    expect(checked).toBeGreaterThan(0)
  })
})

describe('the share button', () => {
  const words = (lang: string) => {
    const { share, copied, copyFailed } = chrome(lang)
    return { share, copied, copyFailed }
  }

  test('is a button labelled in the chrome language', () => {
    expect(renderToStaticMarkup(<ShareButton ui={words('en')} uiLang={undefined} />)).toContain('>Copy link</button>')
    expect(renderToStaticMarkup(<ShareButton ui={words('nl')} uiLang={undefined} />)).toContain('>Kopieer link</button>')
  })

  test('says nothing about having copied until it has', () => {
    const html = renderToStaticMarkup(<ShareButton ui={words('en')} uiLang={undefined} />)

    expect(html).not.toContain(chrome('en').copied)
    // The confirmation lands in a live region that is on the page from the start, so a
    // screen reader announces it when it appears.
    expect(html).toContain('role="status"')
  })

  test('marks its language only where the chrome does not speak the page\'s language', () => {
    expect(renderToStaticMarkup(<ShareButton ui={words('nl')} uiLang={chromeLang('nl')} />)).toContain('<button class="share" type="button">Kopieer link')
    expect(renderToStaticMarkup(<ShareButton ui={words('de')} uiLang={chromeLang('de')} />)).toContain('lang="en">Copy link')
  })
})
