/**
 * The Trail (docs/CORE_DOCUMENT.md 3.2, 10.17) and the share button: the way back, and the
 * link that carries it. What a click does is `tests/browser/trail.spec.ts`; this file is
 * what the server sends.
 *
 * Every fixture is loaded through `openTree` and every address through `parseUrl`, as
 * docs/specs/application.md section 7 requires; nothing here builds a Node by hand.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, test } from 'vitest'
import { chrome } from '../src/chrome.ts'
import { chromeLang, NodeView } from '../src/components/NodeView.tsx'
import { ShareButton } from '../src/components/ShareButton.tsx'
import { openTree, type Tree } from '../src/tree/loader.ts'
import { parseUrl } from '../src/url.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const trees = new Map<string, Tree>()

beforeAll(async () => {
  for (const [id, dir] of [
    ['ai-act-example', path.join(here, '..', 'trees', 'ai-act-example')],
    ['other-languages', path.join(here, 'fixtures', 'other-languages')],
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
  return renderToStaticMarkup(
    <NodeView
      node={node}
      address={address}
      rootId={tree.manifest.root}
      trailTitles={address.trail.map((id) => tree.getTitle(id)!)}
    />,
  )
}

/** The Trail's markup on its own, or the empty string when the page draws no Trail. */
function trail(html: string): string {
  return /<nav class="trail"[\s\S]*?<\/nav>/.exec(html)?.[0] ?? ''
}

/** The `href` of every Trail entry, in the order they are on the page. */
function trailLinks(html: string): string[] {
  return [...trail(html).matchAll(/href="([^"]*)"/g)].map((match) => match[1]!)
}

/** The text of every Trail entry, in the order they are on the page. */
function trailTitles(html: string): string[] {
  return [...trail(html).matchAll(/<a [^>]*>([^<]*)<\/a>/g)].map((match) => match[1]!)
}

describe('the Trail', () => {
  test('lists the Nodes visited to reach this one, by their titles, in the order visited', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices/social-scoring')

    expect(trailTitles(html)).toEqual([
      'Is your AI system within the reach of the AI Act?',
      'Does your system do any of the prohibited practices?',
    ])
  })

  test('rises above the current Node: it comes before the title on the page', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices')

    expect(html.indexOf('<nav class="trail"')).toBeLessThan(html.indexOf('<h1'))
  })

  test('each entry jumps back to that Node with everything after it discarded (10.17)', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices/social-scoring')

    expect(trailLinks(html)).toEqual([
      '/ai-act-example/start',
      '/ai-act-example/start/prohibited-practices',
    ])
  })

  test('shows the titles in the language the page is in', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices/social-scoring?lang=nl')

    expect(trailTitles(html)).toEqual([
      'Valt uw AI-systeem binnen het bereik van de AI-verordening?',
      'Verricht uw systeem een van de verboden praktijken?',
    ])
    expect(trailLinks(html)).toEqual([
      '/ai-act-example/start?lang=nl',
      '/ai-act-example/start/prohibited-practices?lang=nl',
    ])
  })

  test('is as long as the walk: a three-entry Trail draws three entries', async () => {
    // Any sequence of Node ids is a Trail; adjacency is not checked (application.md 4.3).
    const html = await view('/ai-act-example/start/prohibited-practices/covered/social-scoring')

    expect(trailLinks(html)).toHaveLength(3)
    expect(trailLinks(html)[2]).toBe('/ai-act-example/start/prohibited-practices/covered')
  })

  test('offers the way into the walk on a Node opened by its own URL', async () => {
    // A shared link to a Node on its own carries no Trail; the reader still gets a way in.
    const html = await view('/ai-act-example/social-scoring')

    expect(trailLinks(html)).toEqual(['/ai-act-example/start'])
    expect(trailTitles(html)).toEqual(['Start'])
  })

  test('offers it on every kind of Node, not just the explanation Nodes #7 covered', async () => {
    // The way in depends on the Trail being empty, never on the kind of Node: a question
    // and an outcome are the likeliest things to share, and neither may strand its reader.
    for (const [kind, url] of [
      ['question', '/ai-act-example/prohibited-practices'],
      ['terminal', '/ai-act-example/covered'],
    ] as const) {
      const html = await view(url)

      expect(trailLinks(html), kind).toEqual(['/ai-act-example/start'])
      expect(trailTitles(html), kind).toEqual(['Start'])
    }
  })

  test('the root Node with no Trail draws none: there is nothing to go back to', async () => {
    expect(await view('/ai-act-example/start')).not.toContain('class="trail"')
  })

  test('is named for a reader who cannot see it, in the language that name is written in', async () => {
    const english = await view('/ai-act-example/start/prohibited-practices')
    const dutch = await view('/ai-act-example/start/prohibited-practices?lang=nl')
    const german = await view('/other-languages/start/inverkehrbringen')

    expect(english).toContain('<nav class="trail" aria-labelledby="trail-label">')
    expect(english).toContain('id="trail-label">Your path</span>')
    // Dutch chrome beside Dutch content inherits `nl` from the article; only chrome in
    // another language than the content around it marks itself (application.md 3.1).
    expect(dutch).toContain('id="trail-label">Uw pad</span>')
    expect(german).toContain('id="trail-label" lang="en">Your path</span>')
  })

  test('is an ordered list of links, so a keyboard and a screen reader both walk it', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices/social-scoring')

    expect(trail(html)).toMatch(/<span[^>]*>[^<]*<\/span><ol>/)
    expect(trail(html)).not.toContain('tabindex="-1"')
    // Every anchor of the Trail has a target: none of them is a dead control.
    expect(trail(html)).not.toMatch(/<a(?=[\s>])(?![^>]*\shref=)/)
    expect(trailLinks(html)).toHaveLength(trailTitles(html).length)
  })

  test('the interim "back" control of issue #7 is gone: the Trail is the one way back', async () => {
    for (const url of [
      '/ai-act-example/start',
      '/ai-act-example/social-scoring',
      '/ai-act-example/start/prohibited-practices/social-scoring',
    ]) {
      expect(await view(url), url).not.toContain('class="back"')
    }
  })
})

describe('the share button', () => {
  test('is a button labelled in the chrome language', () => {
    expect(renderToStaticMarkup(<ShareButton ui={chrome('en')} uiLang={undefined} />)).toContain(
      '>Copy link</button>',
    )
    expect(renderToStaticMarkup(<ShareButton ui={chrome('nl')} uiLang={undefined} />)).toContain(
      '>Kopieer link</button>',
    )
  })

  test('says nothing about having copied until it has', () => {
    const html = renderToStaticMarkup(<ShareButton ui={chrome('en')} uiLang={undefined} />)

    expect(html).not.toContain(chrome('en').copied)
    // The confirmation lands in a live region that is on the page from the start, so a
    // screen reader announces it when it appears.
    expect(html).toContain('role="status"')
  })

  test('is on every Node page, beside the Node it would share', async () => {
    for (const url of ['/ai-act-example/start', '/ai-act-example/start/outside-scope']) {
      expect(await view(url), url).toContain('class="share"')
    }
  })

  test('marks its language only where the chrome does not speak the page\'s language', async () => {
    expect(await view('/ai-act-example/start?lang=nl')).toContain('Kopieer link')
    expect(await view('/other-languages/start')).toContain(`lang="${chromeLang('de')}">Copy link`)
  })
})
