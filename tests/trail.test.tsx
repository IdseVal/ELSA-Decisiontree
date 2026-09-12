/**
 * The Trail as the Branches above the Bubble (docs/specs/application.md 10.2, core document
 * 3.2 and 10.17), and the share button: the way back, and the link that carries it. What a
 * click does is `tests/browser/trail.spec.ts`; this file is what the server sends.
 *
 * Every fixture is loaded through `openTree` and every address through `parseUrl`, as
 * docs/specs/application.md section 7 requires; nothing here builds a Node by hand.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, test } from 'vitest'
import { chrome, chromeLang } from '../src/chrome.ts'
import { ShareButton } from '../src/components/ShareButton.tsx'
import { TreeView } from '../src/components/TreeView.tsx'
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

/** The markup of the Node the URL names, rendered the way the page renders it. */
async function view(url: string): Promise<string> {
  const { pathname, searchParams } = new URL(url, 'https://example.org')
  const tree = trees.get(pathname.split('/')[1]!)!
  // The `[lang]` segment the rewrite of 4.4 makes of the URL: these languages are all
  // well-formed tags, which it passes through unchanged.
  const address = parseUrl(pathname, searchParams.get('lang') ?? '_', tree)
  if (!address) throw new Error(`${url} is not a page of ${tree.id}`)
  const node = await tree.getNode(address.nodeId)
  if (!node) throw new Error(`${url} names no Node`)
  return renderToStaticMarkup(<TreeView node={node} address={address} tree={tree} />)
}

/** The Trail's markup on its own, or the empty string when the page draws no Trail. */
function trail(html: string): string {
  return /<nav class="trail[^"]*"[\s\S]*?<\/nav>/.exec(html)?.[0] ?? ''
}

/** Every Trail Branch: its `href` and its title, in the order they are on the page. */
function trailBranches(html: string): Array<[href: string, title: string]> {
  return [
    ...trail(html).matchAll(
      /<a class="branch trail-entry" href="([^"]*)"[^>]*><span class="branch-label"><span class="branch-title">(?:<span[^>]*>)?([^<]*)/g,
    ),
  ].map((match) => [match[1]!, match[2]!])
}

/** The Trail Sheet's markup: the whole Trail as a list, behind the collapsed control. */
function sheet(html: string): string {
  return /<li class="trail-more">[\s\S]*?<\/details>/.exec(html)?.[0] ?? ''
}

/** The `start` Node of the full-node fixture, reached by a Trail of `length` visits to itself. */
function walkOf(length: number): string {
  return `/full-node/${Array.from({ length: length + 1 }, () => 'full').join('/')}`
}

describe('the Trail', () => {
  test('is the Nodes visited to reach this one, as Branches, by their titles, oldest first', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices/social-scoring')

    expect(trailBranches(html)).toEqual([
      ['/ai-act-example/start', 'Is your AI system within the reach of the AI Act?'],
      ['/ai-act-example/start/prohibited-practices', 'Does your system do any of the prohibited practices?'],
    ])
  })

  test('is above the Bubble: it comes before the title on the page', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices')

    expect(html.indexOf('<nav class="trail')).toBeLessThan(html.indexOf('<h1'))
  })

  test('each Branch jumps back to that Node with everything after it discarded (10.17)', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices/social-scoring?lang=nl')

    expect(trailBranches(html).map(([href]) => href)).toEqual([
      '/ai-act-example/start?lang=nl',
      '/ai-act-example/start/prohibited-practices?lang=nl',
    ])
    expect(trailBranches(html).map(([, title]) => title)).toEqual([
      'Valt uw AI-systeem binnen het bereik van de AI-verordening?',
      'Verricht uw systeem een van de verboden praktijken?',
    ])
  })

  test('the parent -- the entry nearest the Bubble -- is the page the reader came from', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices/social-scoring')

    expect(trail(html)).toContain('<a class="branch trail-entry" href="/ai-act-example/start/prohibited-practices" rel="prev">')
    expect(trail(html).match(/rel="prev"/g)).toHaveLength(1)
  })

  test('at the root Node there is no Trail: the row holds the Tree title instead (10.2)', async () => {
    const html = await view('/ai-act-example/start')

    expect(html).not.toContain('<nav class="trail')
    expect(html).toContain('<div class="trail trail--root"><p class="tree-name">Does the EU AI Act apply to my AI system? (example)</p></div>')
  })

  test('offers the way into the walk on a Node opened by its own URL, whatever its kind', async () => {
    // A shared link to a Node on its own carries no Trail; the reader still gets a way in,
    // and a question and an outcome are the likeliest things to share.
    for (const url of ['/ai-act-example/social-scoring', '/ai-act-example/prohibited-practices', '/ai-act-example/covered']) {
      const html = await view(url)

      expect(trailBranches(html), url).toEqual([['/ai-act-example/start', 'Start']])
      expect(sheet(html), url).toBe('')
    }
  })

  test('a Trail of one to five entries draws exactly those, with no collapsed middle', async () => {
    for (const length of [1, 2, 5]) {
      const html = await view(walkOf(length))

      expect(trailBranches(html), `${length}`).toHaveLength(length)
      expect(trail(html), `${length}`).not.toContain('trail--long')
      expect(trail(html), `${length}`).not.toContain('trail-more-wide')
    }
  })

  test('a longer Trail keeps every entry in the markup and marks start and the last four as kept (10.2)', async () => {
    const html = await view(walkOf(9))
    const steps = [...trail(html).matchAll(/<li class="trail-step"([^>]*)>/g)].map((match) => match[1]!)

    expect(trail(html)).toContain('class="trail trail--long trail--collapsible"')
    expect(steps).toHaveLength(9)
    expect(steps.map((attributes) => attributes.includes('data-kept'))).toEqual([
      true, false, false, false, false, true, true, true, true,
    ])
    // The collapsed middle says how many it hides: nine minus the five that stay.
    expect(trail(html)).toContain('<span class="trail-more-wide">4 earlier steps</span>')
    // The one-Branch collapse of the short viewport (10.5, step 1) hides all but the parent.
    expect(trail(html)).toContain('<span class="trail-more-short">8 earlier steps</span>')
  })

  test('the Trail Sheet lists the whole Trail as links, newest first', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices/social-scoring')
    const links = [...sheet(html).matchAll(/<a href="([^"]*)"/g)].map((match) => match[1])

    expect(links).toEqual(['/ai-act-example/start/prohibited-practices', '/ai-act-example/start'])
    expect(sheet(html)).toContain('<span class="trail-more-short">1 earlier step</span>')
  })

  test('a Trail of forty-nine entries -- the most a URL carries -- renders every one of them', async () => {
    const html = await view(walkOf(49))

    expect(trailBranches(html)).toHaveLength(49)
    expect(sheet(html).match(/<a href="/g)).toHaveLength(49)
    expect(trail(html)).toContain('44 earlier steps')
  })

  test('is a navigation landmark named for a reader who cannot see it, in the language that name is written in', async () => {
    const english = await view('/ai-act-example/start/prohibited-practices')
    const dutch = await view('/ai-act-example/start/prohibited-practices?lang=nl')
    const german = await view('/other-languages/start/inverkehrbringen')

    expect(english).toContain('<nav class="trail" aria-labelledby="trail-label">')
    expect(english).toContain('id="trail-label">Your path</span>')
    // Dutch chrome beside Dutch content inherits `nl` from the page; only chrome in another
    // language than the content around it marks itself (application.md 3.1).
    expect(dutch).toContain('id="trail-label">Uw pad</span>')
    expect(german).toContain('id="trail-label" lang="en">Your path</span>')
  })

  test('is an ordered list of links, so a keyboard and a screen reader both walk it', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices/social-scoring')

    expect(trail(html)).toMatch(/<span[^>]*>[^<]*<\/span><ol>/)
    expect(trail(html)).not.toContain('tabindex="-1"')
    // Every anchor of the Trail has a target: none of them is a dead control.
    expect(trail(html)).not.toMatch(/<a(?=[\s>])(?![^>]*\shref=)/)
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
