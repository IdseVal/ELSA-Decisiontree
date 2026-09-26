/**
 * The tree view (docs/specs/application.md section 10): what each kind of Node puts on the
 * page -- what the Bubble holds, which Branches exist and where they link (10.3) -- as the
 * server sends it. What the layout does with it is `tests/browser/no-scroll.spec.ts`.
 *
 * Every fixture is loaded through `openTree` and every address through `parseUrl`, as
 * docs/specs/application.md section 7 requires; nothing here builds a Node by hand.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, test } from 'vitest'
import { chrome } from '../src/chrome.ts'
import { Bubble } from '../src/components/Bubble.tsx'
import { Disclaimer } from '../src/components/Disclaimer.tsx'
import { TreeView } from '../src/components/TreeView.tsx'
import { loadPage } from '../src/neighbourhood.ts'
import { openTree, type Tree } from '../src/tree/loader.ts'
import type { EditMode } from '../src/editor/mode.ts'
import { contentLanguage, parseUrl, PUBLIC_LINKS } from '../src/url.ts'
import { effectiveLang } from './effective-lang.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const trees = new Map<string, Tree>()

beforeAll(async () => {
  for (const [id, dir] of [
    ['ai-act-example', path.join(here, '..', 'trees', 'ai-act-example')],
    ['single-language', path.join(here, 'fixtures', 'single-language')],
    ['other-languages', path.join(here, 'fixtures', 'other-languages')],
    ['full-node', path.join(here, 'fixtures', 'full-node')],
    ['carousel', path.join(here, 'fixtures', 'carousel')],
    ['cycle', path.join(here, 'fixtures', 'cycle')],
    ['overlay', path.join(here, 'fixtures', 'overlay')],
  ] as const) {
    trees.set(id, await openTree(dir))
  }
})

/**
 * The `[lang]` segment the rewrite of 4.4 makes of a public URL. Every `lang` written in
 * this file is a well-formed tag, which that rule passes through unchanged; an absent one
 * becomes the sentinel.
 */
function langSegment(url: URL): string {
  return url.searchParams.get('lang') ?? '_'
}

/** The markup of the Node the URL names, rendered the way the page renders it; with `edit`, as the editor would. */
async function view(url: string, edit?: EditMode): Promise<string> {
  const target = new URL(url, 'https://example.org')
  const tree = trees.get(target.pathname.split('/')[1]!)!
  const address = parseUrl(target.pathname, langSegment(target), tree)
  if (!address) throw new Error(`${url} is not a page of ${tree.id}`)
  const page = await loadPage(tree, address)
  if (!page) throw new Error(`${url} names no Node`)
  return renderToStaticMarkup(<TreeView page={page} tree={tree} edit={edit} />)
}

/**
 * A whole page: the shell `src/app/[lang]/layout.tsx` renders around the tree view and the
 * footer, resolving its own segment exactly as that layout does. `<html lang>` is therefore
 * the content language of the page (application.md 3.1, 4.4).
 */
async function shell(url: string): Promise<string> {
  const target = new URL(url, 'https://example.org')
  const tree = trees.get(target.pathname.split('/')[1]!)!
  const address = parseUrl(target.pathname, langSegment(target), tree)!
  const page = (await loadPage(tree, address))!
  return renderToStaticMarkup(
    <html lang={contentLanguage(tree, langSegment(target))}>
      <body>
        <main>
          <TreeView page={page} tree={tree} />
        </main>
        <Disclaimer lang={address.lang} />
      </body>
    </html>,
  )
}

/**
 * One element's markup, from its opening tag to its own closing one -- counting the nested
 * elements of the same tag, so a `div` holding `div`s is cut where it ends; '' when it is
 * not there.
 */
function part(html: string, tag: string, className: string): string {
  const open = new RegExp(`<${tag} class="${className}[^"]*"`).exec(html)
  if (!open) return ''
  const tags = new RegExp(`<(/?)${tag}(?=[\\s>])`, 'g')
  tags.lastIndex = open.index
  for (let depth = 0, match = tags.exec(html); match; match = tags.exec(html)) {
    depth += match[1] === '/' ? -1 : 1
    if (depth === 0) return html.slice(open.index, match.index + tag.length + 3)
  }
  throw new Error(`<${tag} class="${className}"> is never closed`)
}

/** The Branches of a class: `[href, title]` for each, in page order. */
function branches(html: string, className: string): Array<[href: string, title: string]> {
  return [
    ...html.matchAll(
      new RegExp(
        `<a class="branch ${className}[^"]*" href="([^"]*)"[^>]*>(?:<img [^>]*>)?<span class="branch-label">(?:<span class="branch-word"[^>]*>[^<]*</span><span class="branch-colon">: </span>)?<span class="branch-title">(?:<span[^>]*>)?([^<]*)`,
        'g',
      ),
    ),
  ].map((match) => [match[1]!, match[2]!])
}

describe('the tree layer', () => {
  test('is one element holding the Bubble with its up arrow, the Branches and the Carousel band, in that order (11.1)', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices')
    const layer = part(html, 'div', 'tree-layer')

    const order = ['class="bubble', 'class="up-arrow"', 'class="options"', 'class="answers"', 'class="carousel"'].map((marker) =>
      layer.indexOf(marker),
    )
    expect(order.every((at) => at >= 0), layer.slice(0, 200)).toBe(true)
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  test('a Branch is marked to slide exactly when the neighbourhood places its target (11.1, 11.2)', async () => {
    const urls = [
      '/ai-act-example/start',
      '/ai-act-example/start/prohibited-practices',
      '/ai-act-example/start/prohibited-practices/emotion-recognition-at-work/social-scoring',
      // A Terminal, whose `startAgain` URL is its grandparent's.
      '/ai-act-example/start/prohibited-practices/prohibited',
      '/ai-act-example/start/prohibited-practices?lang=nl',
      // Every Trail entry is the Node on screen, which is never its own neighbour.
      '/full-node/full/full/full',
    ]
    for (const url of urls) {
      const target = new URL(url, 'https://example.org')
      const tree = trees.get(target.pathname.split('/')[1]!)!
      const address = parseUrl(target.pathname, langSegment(target), tree)!
      const placed = new Set((await loadPage(tree, address))!.neighbours.placed.map((p) => p.href))
      const marked = [...(await view(url)).matchAll(/<a class="(branch [^"]*|up-arrow)" href="([^"]*)"([^>]*)>/g)].map(
        ([, kind, href, rest]) => [kind, href, rest!.includes('data-slide')],
      )
      // `startAgain` has no direction (11.1), even where its URL is the grandparent's.
      const slides = (kind: string, href: string) => kind !== 'branch answer answer--start-again' && placed.has(href)

      expect(marked.length, url).toBeGreaterThan(0)
      expect(marked, url).toEqual(marked.map(([kind, href]) => [kind, href, slides(kind as string, href as string)]))
    }
    const full = await view('/full-node/full/full/full')
    expect(full.match(/<a class="up-arrow"[^>]*data-slide/g), "the full Node's up arrow").toBeNull()
    // An Option is not a Branch and nothing slides to it: it opens an Overlay (10.9, 11.1).
    expect(full.match(/<a class="branch option/g), "the full Node's Options").toBeNull()
    expect(full.match(/data-slide/g), "the full Node's slides").toHaveLength(2)
  })

  test('an Answer back to the parent does not slide, and two Answers to one target both do (11.3)', async () => {
    const answers = async (url: string) =>
      [...(await view(url)).matchAll(/<a class="branch answer (answer--(?:yes|no))" href="([^"]*)"([^>]*)>/g)].map(
        ([, kind, href, rest]) => [kind, href, rest!.includes('data-slide')],
      )

    // `third`'s `yes` is `second`, which the parent placed `up` at its own shorter address:
    // a cycle among question Nodes, which section 7 allows. `second`'s `yes` and `no` name
    // one target, which 5.3 allows, so both its Branches lead to `third`. The `cycle`
    // fixture carried both sentences as a comment until #119; elsa-tree/4 has no comments.
    expect(await answers('/cycle/first/second/third')).toEqual([
      ['answer--yes', '/cycle/first/second/third/second', false],
      ['answer--no', '/cycle/first/second/third/done', true],
    ])
    expect(await answers('/cycle/first/second')).toEqual([
      ['answer--yes', '/cycle/first/second/third', true],
      ['answer--no', '/cycle/first/second/third', true],
    ])
  })

  test('the Carousel band is present on every Node, empty where the Node has no Image, so the Bubble never moves (12.1)', async () => {
    // The `cycle` fixture carries no picture anywhere; since #84 every Node of the example Tree does.
    for (const url of ['/cycle/first', '/cycle/first/second/third/done']) {
      expect(await view(url), url).toContain('<div class="carousel"></div>')
      // So such a Node has no strip, and no empty tab stop without a script either.
      expect(await view(url), url).not.toContain('carousel-strip')
    }
    expect(await view('/ai-act-example/start')).toContain('<section class="carousel">')
  })

  test("an Option's picture is its target's main image: on its button and in its Overlay, not on the Option and not in a strip (tree-format.md 5.4, 10.3, 12.1)", async () => {
    // In elsa-tree/2 `prohibited-practices` carried scoreboard.png on its Option; the
    // migration of #79 moved it to `social-scoring`.
    const html = await view('/ai-act-example/prohibited-practices')
    const fan = part(html, 'ul', 'options')
    expect(fan).toContain(
      '<summary class="sheet-open"><img class="option-image" src="/ai-act-example/images/scoreboard.png" alt="A scoreboard ranking people" width="48" height="48" loading="lazy"/><span class="option-title">Social scoring</span></summary>',
    )
    // Since #84 the second Option's target carries an Image too: no empty slot in this Tree
    // (the `overlay` fixture shows one, below).
    expect(fan.match(/<img class="option-image"/g)).toHaveLength(2)
    expect(fan).toContain('<img class="option-image" src="/ai-act-example/images/emotion-recognition.png"')
    expect(fan).not.toContain('option-image--empty')
    // In the Overlay it is a plain link to the file: the enlarged view is the centre Node's (10.9).
    expect(fan).toContain('<a class="main-image" href="/ai-act-example/images/scoreboard.png" aria-labelledby=')
    expect(html).not.toContain('class="thumbnail"')

    // As the centre, which only a path with no parent makes it, it is the Bubble's main image.
    const own = await view('/ai-act-example/social-scoring')
    expect(part(own, 'article', 'bubble')).toContain('<a class="main-image" href="/ai-act-example/images/scoreboard.png" data-enlarge="0"')
  })

  test('carries the notice for a window at or below the floor, with a sentence per short dimension (10.4)', async () => {
    // The stylesheet shows the notice and, inside it, the sentence for the dimension that
    // ran short: a 1280 x 480 window must not be told it needs 320 by 480.
    expect(await view('/ai-act-example/start')).toContain(
      '<p class="minimum-size">This tool needs a larger window. ' +
        '<span class="minimum-width">Make it wider than 320 pixels.</span> ' +
        '<span class="minimum-height">Make it taller than 480 pixels.</span></p>',
    )
    const nl = await view('/ai-act-example/start?lang=nl')
    expect(nl).toContain('Dit hulpmiddel heeft een groter venster nodig.')
    expect(nl).toContain('<span class="minimum-width">Maak het breder dan 320 pixels.</span>')
    expect(nl).toContain('<span class="minimum-height">Maak het hoger dan 480 pixels.</span>')
  })
})

/** Every match of `pattern`'s first group in `html`, in page order. */
function all(html: string, pattern: RegExp): string[] {
  return [...html.matchAll(pattern)].map((match) => match[1]!)
}

describe('the main image', () => {
  test("is the Node's first Image, above the title, a link to its file named by enlarge and its description and described by its credit (10.3, 12.3)", async () => {
    const bubble = part(await view('/carousel/five?lang=nl'), 'article', 'bubble')

    expect(bubble).toContain(
      '<a class="main-image" href="/carousel/images/orchard.svg" data-enlarge="0" aria-labelledby="main-image-enlarge main-image-picture" aria-describedby="main-image-credit">' +
        '<img id="main-image-picture" src="/carousel/images/orchard.svg" alt="Een boomgaard met drie appelbomen onder een gele zon" width="90" height="60"/></a>',
    )
    expect(bubble).toContain('<span hidden="" id="main-image-enlarge">Vergroten</span>')
    expect(bubble).toContain('<span hidden="" id="main-image-credit">Drawing: Example Studio, CC0 1.0</span>')
    // Above the title, and not loaded lazily: it is on screen whenever the Bubble is.
    expect(bubble.indexOf('class="main-image"')).toBeLessThan(bubble.indexOf('<h1'))
    expect(/<a class="main-image"[^]*?<\/a>/.exec(bubble)![0]).not.toContain('loading=')
  })

  test('a Node without Images shows the empty slot in its place, which says nothing to assistive technology (10.3)', async () => {
    // The `cycle` fixture carries no picture anywhere; since #84 every Node of the example Tree does.
    const bubble = part(await view('/cycle/first'), 'article', 'bubble')
    expect(bubble).toContain('<div class="bubble-text"><span class="main-image main-image--empty" aria-hidden="true"></span><h1 ')
    expect(bubble).not.toContain('<img')
  })

  test('a neighbour frame keeps the slot and names no image file (11.4)', async () => {
    // The Bubble a neighbour frame draws: `two` has Images of its own.
    const node = (await trees.get('carousel')!.getNode('two'))!
    const html = renderToStaticMarkup(<Bubble node={node} treeId="carousel" lang="en" ui={chrome('en')} uiLang={undefined} idPrefix="n0-" pictures={false} up={null} />)
    expect(html).toContain('<div class="bubble-text"><span class="main-image main-image--withheld" aria-hidden="true"></span><h1 id="n0-node-title">')
    expect(html).not.toContain('/images/')
  })
})

describe('the Carousel', () => {
  test("shows the Node's Images after the main one, in the author's order, as thumbnails that link to their files (12.1, 12.2)", async () => {
    const strip = part(await view('/carousel/five'), 'ul', 'carousel-strip')

    // Focusable in the markup, named: the arrow keys scroll it without a script (12.2, 12.3).
    expect(strip).toContain('<ul class="carousel-strip" tabindex="0" aria-labelledby="images-label" data-carousel-strip="">')
    expect(all(strip, /<a class="thumbnail" href="([^"]*)"/g)).toEqual([
      '/carousel/images/greenhouse.svg',
      '/carousel/images/drone.svg',
      '/carousel/images/tractor.svg',
      '/carousel/images/harbour.svg',
    ])
    // Loaded lazily, at the size the strip draws them, so no page asks for what it does not show (12.4).
    expect(strip).toContain(
      '<img id="carousel-image-0" src="/carousel/images/greenhouse.svg" alt="Two greenhouses with rows of seedlings and a shed beside them" width="48" height="48" loading="lazy"/>',
    )
    expect(strip.match(/loading="lazy"/g)).toHaveLength(4)
  })

  test('pictures only: no button, no position text, no caption, and nothing written under a picture (12.2)', async () => {
    const html = await view('/carousel/five')
    const carousel = part(html, 'section', 'carousel')
    const strip = part(html, 'ul', 'carousel-strip')

    expect(carousel).not.toContain('<button')
    expect(carousel).not.toMatch(/carousel-caption|carousel-position|aria-live/)
    // The one caption left is the enlarged view's, inside its Sheet (12.3).
    expect(carousel.match(/<figcaption>/g)).toHaveLength(5)
    expect(part(carousel, 'details', 'sheet carousel-sheet').match(/<figcaption>/g)).toHaveLength(5)
    // Every text inside the strip is hidden: the credit a thumbnail is described by, and nothing else.
    expect(all(strip, />([^<]+)</g)).toEqual([
      'Drawing: Example Studio, CC BY 4.0',
      'Drawing: Example Illustrator, via Example Commons, CC BY-SA 4.0',
      'Drawing: Example Studio, CC0 1.0',
      'Drawing: Example Cartography, public domain',
    ])
    expect(strip.match(/<span hidden="" id="carousel-credit-\d">/g)).toHaveLength(4)
  })

  test('a Node with one Image has no strip and no tab stop there, but its enlarged view (12.1, 12.3)', async () => {
    const carousel = part(await view('/ai-act-example/start'), 'section', 'carousel')
    expect(carousel).not.toContain('carousel-strip')
    expect(carousel).toContain('<details class="sheet carousel-sheet" name="sheet"><summary class="sheet-open"><span>Image 1 of 1</span></summary>')
  })

  test("the full Node's strip holds nine: its ten Images less the main one (12.1)", async () => {
    const node = (await trees.get('full-node')!.getNode('full'))!
    const strip = part(await view('/full-node/full?lang=nl'), 'ul', 'carousel-strip')
    expect(all(strip, /<a class="thumbnail" href="([^"]*)"/g)).toEqual(node.images.slice(1).map((image) => `/full-node/images/${image.file}`))
    expect(strip.match(/<li>/g)).toHaveLength(9)
  })

  test('names the strip and each thumbnail by the enlarge word and its description, described by its credit', async () => {
    const html = await view('/carousel/five?lang=nl')

    // One name, on the focusable strip 12.3 names: on the band as well it would be read twice.
    expect(html).toContain('<section class="carousel">')
    expect(html.match(/aria-labelledby="images-label"/g)).toHaveLength(1)
    expect(html).toContain('<span hidden="" id="images-label">Afbeeldingen</span>')
    expect(html).toContain('<span hidden="" id="carousel-enlarge">Vergroten</span>')
    expect(html).toContain(
      '<a class="thumbnail" href="/carousel/images/drone.svg" data-enlarge="2" aria-labelledby="carousel-enlarge carousel-image-1" aria-describedby="carousel-credit-1">',
    )
    expect(html).toContain('<span hidden="" id="carousel-credit-1">Drawing: Example Illustrator, via Example Commons, CC BY-SA 4.0</span>')
    expect(html).toContain('alt="Een drone die een akker van bovenaf scant"')
  })

  test('the chrome of the enlarged view speaks its own language beside content it does not speak', async () => {
    expect(await view('/carousel/five')).toContain('<summary class="sheet-open"><span>Image 1 of 5</span></summary>')
    expect(await view('/carousel/five?lang=nl')).toContain('<summary class="sheet-open"><span>Afbeelding 1 van 5</span></summary>')
    expect(await view('/other-languages/start')).toContain('<summary class="sheet-open"><span lang="en">Image 1 of 1</span></summary>')
  })

  test("without a script, a stylesheet shows the enlarged view's control beside the strip, so every credit is one disclosure away (14)", async () => {
    expect(part(await view('/carousel/five'), 'section', 'carousel')).toContain(
      '<noscript><style>.carousel-sheet > .sheet-open { display: block; }</style></noscript>',
    )
  })

  test('the enlarged view is a Sheet holding every Image in full, the main image first, its description and credit whole (12.3, 14)', async () => {
    const sheet = part(await view('/full-node/full'), 'details', 'sheet carousel-sheet')
    const node = (await trees.get('full-node')!.getNode('full'))!

    expect(sheet.match(/<figure class="sheet-figure">/g)).toHaveLength(10)
    // Without the script every page after the first is a disclosure: nine of them.
    expect(sheet.match(/<details class="sheet-more">/g)).toHaveLength(9)
    expect(all(sheet, /<img src="([^"]*)"/g)).toEqual(node.images.map((image) => `/full-node/images/${image.file}`))
    for (const image of node.images) {
      expect(sheet).toContain(`<img src="/full-node/images/${image.file}" alt="${image.description.en}" loading="lazy"/>`)
      expect(sheet).toContain(
        `<figcaption><p>${image.description.en}</p><p class="credit"><span class="kind">Credit</span> ${image.credit}</p></figcaption>`,
      )
    }
  })
})

describe('the Bubble', () => {
  test('holds the main image, the title as the page heading, the description as rich text, and the Sources', async () => {
    const html = await view('/ai-act-example/start')
    const bubble = part(html, 'article', 'bubble')

    expect(bubble).toContain('<a class="main-image" href="/ai-act-example/images/eu-map.png"')
    expect(bubble).toContain('<h1 id="node-title">Is your AI system within the reach of the AI Act?</h1>')
    expect(bubble).toContain('<p>The AI Act reaches AI systems')
    expect(bubble).toContain('<strong>placed on the market')
    expect(bubble).toContain('<section class="sources"')
    expect(html.match(/<h1 /g)).toHaveLength(1)
  })

  test("marks an explainer's term in the description, its panel beside it (application.md 10.8)", async () => {
    const english = part(await view('/ai-act-example/start'), 'article', 'bubble')
    const dutch = part(await view('/ai-act-example/start?lang=nl'), 'article', 'bubble')

    expect(english).toContain(
      'wherever the <span class="term" tabindex="0" aria-describedby="e-provider">provider</span>' +
        '<span class="explainer" role="tooltip" id="e-provider"><b>provider</b> Someone who develops an AI system, ' +
        'or has one developed, and places it on the market or puts it into service under their own name or trademark.</span> is based.',
    )
    expect(dutch).toContain('waar de <span class="term" tabindex="0" aria-describedby="e-provider">aanbieder</span>')
    expect(dutch).toContain('id="e-provider"><b>aanbieder</b> Wie een AI-systeem ontwikkelt')
    expect(english).not.toContain('](#provider)')
  })

  test('is the article the content language is declared on', async () => {
    expect(await view('/ai-act-example/start?lang=nl')).toContain('<article class="bubble bubble--question" lang="nl" data-node="start">')
  })

  test('shows no metadata: nothing but what 10.3 lists is inside it', async () => {
    expect(await view('/ai-act-example/start')).not.toContain('Version 2.0')
  })
})

describe('Sources', () => {
  test('are links that open in a new tab and cannot reach back at the page', async () => {
    const html = await view('/ai-act-example/social-scoring')

    for (const url of [
      'https://eur-lex.europa.eu/eli/reg/2024/1689/oj',
      'https://curia.europa.eu/juris/liste.jsf?num=C-634/21',
      'https://arxiv.org/abs/2107.03721',
    ]) {
      expect(part(html, 'section', 'sources')).toContain(
        `<a href="${url}" target="_blank" rel="noopener noreferrer" aria-describedby="sources-new-tab">`,
      )
    }
  })

  test('sit under the chrome heading, which names the group, in both chrome languages (ADR-78-sources-heading)', async () => {
    expect(part(await view('/ai-act-example/social-scoring'), 'section', 'sources')).toMatch(
      /^<section class="sources" aria-labelledby="sources-label"><h2 id="sources-label">Legal sources<\/h2>/,
    )
    expect(part(await view('/ai-act-example/social-scoring?lang=nl'), 'section', 'sources')).toContain(
      '<h2 id="sources-label">Juridische bronnen</h2>',
    )
    // Content in German: the heading is English chrome, and says so (3.1).
    expect(await view('/other-languages/start')).toContain('<h2 id="sources-label" lang="en">Legal sources</h2>')
  })

  test('carry the Case law and Literature labels, not the Legal one, and say that the link leaves the page', async () => {
    const html = await view('/ai-act-example/social-scoring')
    const sources = part(html, 'section', 'sources')

    expect(sources).toContain('<li><a href="https://eur-lex.europa.eu/eli/reg/2024/1689/oj"')
    expect(sources).not.toContain('>Legal</span>')
    expect(sources).toContain('<li><span class="kind">Case law</span> <a href="https://curia.europa.eu')
    expect(sources).toContain('<li><span class="kind">Literature</span> <a href="https://arxiv.org')
    expect(html).toContain('<span hidden="" id="sources-new-tab">opens in a new tab</span>')
    const nl = part(await view('/ai-act-example/social-scoring?lang=nl'), 'section', 'sources')
    expect(nl).not.toContain('>Wetgeving</span>')
    expect(nl).toContain('>Rechtspraak</span>')
  })

  test('are also in the Sheet they collapse to below the guarantee, titled by the same heading, as the same links (10.5, 14)', async () => {
    const sheet = part(await view('/ai-act-example/social-scoring'), 'div', 'sources-collapsed')

    expect(sheet).toContain('<summary class="sheet-open"><span>Legal sources (3)</span></summary>')
    expect(sheet.match(/target="_blank"/g)).toHaveLength(3)
    expect(sheet).toContain('href="https://arxiv.org/abs/2107.03721"')
    expect(sheet).not.toContain('>Legal</span>')
  })

  test('a Node without Sources renders neither the list nor the Sheet', async () => {
    const html = await view('/ai-act-example/covered')

    expect(html).not.toContain('class="sources"')
    expect(html).not.toContain('class="sources-collapsed"')
  })
})

describe('a question Node with Options', () => {
  test('offers yes and no as two buttons below, each labelled and named with its chrome word, a colon and its target title in one run', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices')

    expect(branches(html, 'answer answer--yes')).toEqual([
      ['/ai-act-example/start/prohibited-practices/prohibited', 'This is a prohibited practice'],
    ])
    expect(branches(html, 'answer answer--no')).toEqual([
      ['/ai-act-example/start/prohibited-practices/covered', 'The AI Act applies to your system'],
    ])
    expect(part(html, 'div', 'answers')).toBe(
      '<div class="answers" role="group" aria-labelledby="node-title">' +
        '<a class="branch answer answer--yes" href="/ai-act-example/start/prohibited-practices/prohibited" data-slide="" aria-label="Yes: This is a prohibited practice">' +
        '<span class="branch-label"><span class="branch-word">Yes</span><span class="branch-colon">: </span><span class="branch-title">This is a prohibited practice</span></span></a>' +
        '<a class="branch answer answer--no" href="/ai-act-example/start/prohibited-practices/covered" data-slide="" aria-label="No: The AI Act applies to your system">' +
        '<span class="branch-label"><span class="branch-word">No</span><span class="branch-colon">: </span><span class="branch-title">The AI Act applies to your system</span></span></a>' +
        '</div>',
    )
  })

  test('draws its Options beside the Bubble as the buttons of their Overlays, in Option order, alternating right and left (10.3, 10.9)', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices')
    const fan = part(html, 'ul', 'options')

    expect(fan).toMatch(/^<ul class="options" aria-labelledby="options-label" data-count="2">/)
    expect(all(fan, /<span class="option-title">([^<]*)<\/span>/g)).toEqual([
      'Social scoring',
      'Emotion recognition at work or in education',
    ])
    // The first Option on the right, the second on the left; one row a side.
    expect(all(fan, /<li (data-side="[^"]*" style="[^"]*")/g)).toEqual([
      'data-side="right" style="--i:0;--m:1"',
      'data-side="left" style="--i:0;--m:1"',
    ])
    // Not a link: nothing navigates and nothing slides (11.1).
    expect(fan).not.toContain('<a class="branch option')
    expect(fan.match(/<details class="sheet overlay" name="sheet">/g)).toHaveLength(2)
  })

  test('the fan for one, two, five and eight Options: rows and sides by the numbers of ADR-78 (10.3)', async () => {
    const placements = async (url: string) => all(part(await view(url), 'ul', 'options'), /<li (data-side="[^"]*" style="[^"]*")/g)

    // One Option: on the right, at the Bubble's middle (`opt-one` as the centre, the fourth situation of 10.3).
    expect(await placements('/full-node/opt-one')).toEqual(['data-side="right" style="--i:0;--m:1"'])
    // Two: one each side.
    expect(await placements('/ai-act-example/prohibited-practices')).toEqual([
      'data-side="right" style="--i:0;--m:1"',
      'data-side="left" style="--i:0;--m:1"',
    ])
    // Five: three on the right, two on the left, each side top to bottom in Option order.
    expect(await placements('/overlay/five')).toEqual([
      'data-side="right" style="--i:0;--m:3"',
      'data-side="left" style="--i:0;--m:2"',
      'data-side="right" style="--i:1;--m:3"',
      'data-side="left" style="--i:1;--m:2"',
      'data-side="right" style="--i:2;--m:3"',
    ])
    // Eight: four a side.
    expect(await placements('/full-node/full')).toEqual([
      'data-side="right" style="--i:0;--m:4"',
      'data-side="left" style="--i:0;--m:4"',
      'data-side="right" style="--i:1;--m:4"',
      'data-side="left" style="--i:1;--m:4"',
      'data-side="right" style="--i:2;--m:4"',
      'data-side="left" style="--i:2;--m:4"',
      'data-side="right" style="--i:3;--m:4"',
      'data-side="left" style="--i:3;--m:4"',
    ])
    expect(await view('/full-node/full')).toContain('data-count="8"')
  })

  test("an Option button shows its target's main image, small, or the empty slot where the target has none (10.3)", async () => {
    const html = await view('/full-node/full')
    // `opt-one` leads with one.png: the same file its Overlay's Interior will show (11.4).
    expect(part(html, 'ul', 'options')).toContain(
      '<summary class="sheet-open"><img class="option-image" src="/full-node/images/one.png" alt="Option one, first picture" width="48" height="48" loading="lazy"/><span class="option-title">Option one: a title of sixty characters, the most it may be.</span></summary>',
    )
    // Only the target's first picture is on the button, and its Overlay's main image is that same file (10.9, 11.5).
    expect(new Set(all(part(html, 'ul', 'options').split('</li>')[0]!, /"(\/full-node\/images\/[^"]*)"/g))).toEqual(new Set(['/full-node/images/one.png']))
    // A target without Images, on an Option without any: the empty slot (the fixture's four small asides).
    const five = part(await view('/overlay/five'), 'ul', 'options')
    expect(five.match(/<span class="option-image option-image--empty"><\/span>/g)).toHaveLength(4)
    expect(five.match(/<img class="option-image"/g)).toHaveLength(1)
  })

  test('the Options are named as a group, and are also in the Sheet they collapse to, as plain links to the explanation Nodes (10.5, 10.9, 14)', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices')

    expect(html).toContain('<span hidden="" id="options-label">What this covers</span>')
    expect(html).toContain('<ul class="options" aria-labelledby="options-label"')
    const sheet = part(html, 'div', 'options-collapsed')
    expect(sheet).toContain('<summary class="sheet-open"><span>What this covers (2)</span></summary>')
    expect(sheet).toContain('href="/ai-act-example/start/prohibited-practices/social-scoring"')
    expect(sheet).toContain('href="/ai-act-example/start/prohibited-practices/emotion-recognition-at-work"')
  })
})

describe('the Overlay (10.9)', () => {
  test("is a closed Sheet behind each Option button, holding the target's Interior through the Bubble's own component, its heading a link to the target's address", async () => {
    const html = await view('/ai-act-example/start/prohibited-practices')
    const fan = part(html, 'ul', 'options')
    const overlay = part(fan, 'details', 'sheet overlay')

    expect(overlay).not.toContain('<details class="sheet overlay" name="sheet" open')
    const interior = part(overlay, 'div', 'overlay-interior')
    expect(interior).toMatch(/^<div class="overlay-interior" lang="en" data-node="social-scoring">/)
    expect(interior).toContain('<h2 id="a0-node-title"><a href="/ai-act-example/start/prohibited-practices/social-scoring">Social scoring</a></h2>')
    expect(interior).toContain('<div class="prose"><p>')
    // The Sources through the same component as the Bubble's, inline; not a second Sheet inside this one.
    expect(interior).toContain('<section class="sources" aria-labelledby="a0-sources-label">')
    expect(interior).toContain('aria-describedby="a0-sources-new-tab"')
    expect(interior).not.toContain('sources-collapsed')
    // One page, so no paging and no nested disclosure without the script (14).
    expect(overlay).not.toContain('sheet-more')
    // The one h1 on the page is the Bubble's.
    expect(html.match(/<h1 /g)).toHaveLength(1)
  })

  test("carries the target's own Options as plain links to the deeper address, which renders this page with that Overlay open", async () => {
    const html = await view('/full-node/full')
    const first = part(part(html, 'ul', 'options'), 'details', 'sheet overlay')
    const list = part(first, 'ul', 'overlay-options')

    expect(list).toContain('<a href="/full-node/full/opt-one/opt-two">Option two: a title of sixty characters, the most it may be.</a>')
    expect(list.match(/<li>/g)).toHaveLength(1)
    // The list's name sits beside it, not in it: a `ul` holds `li` and nothing else.
    expect(list).toMatch(/^<ul class="overlay-options" aria-labelledby="a0-options-label"><li>/)
    expect(list).not.toContain('<span hidden')
    expect(first).toContain('<span hidden="" id="a0-options-label">What this covers</span><ul class="overlay-options"')
  })

  test("an explanation Node's URL renders its parent's page with that Overlay open, and the parent's Branches built from the path up to the parent (10.9)", async () => {
    const html = await view('/ai-act-example/start/prohibited-practices/social-scoring')

    // The centre is the parent: its title is the page heading, its Answers are below.
    expect(html).toContain('<h1 id="node-title">Does your system do any of the prohibited practices?</h1>')
    expect(branches(html, 'answer answer--yes')).toEqual([
      ['/ai-act-example/start/prohibited-practices/prohibited', 'This is a prohibited practice'],
    ])
    // The way back is the parent's too: the up arrow leads above the centre, not to the centre (10.2).
    expect(html).toContain('<a class="up-arrow" href="/ai-act-example/start" rel="prev"')
    // The aside the path names is the one Overlay open; the other stays closed.
    const overlays = [...part(html, 'ul', 'options').matchAll(/<details class="sheet overlay" name="sheet"( open="")?>/g)].map((m) => m[1] === ' open=""')
    expect(overlays).toEqual([true, false])
    expect(html).not.toContain('overlay--unbuttoned')
  })

  test('a second-level explanation Node in the path is an Overlay of its own, open, with no button; the first stays closed', async () => {
    const html = await view('/full-node/full/opt-one/opt-two')
    const fan = part(html, 'ul', 'options')

    expect(fan).not.toContain(' open=""')
    const extra = part(html, 'div', 'options-extra')
    expect(extra).toContain('<details class="sheet overlay overlay--unbuttoned" name="sheet" open="">')
    expect(extra).toContain('<h2 id="ax-node-title"><a href="/full-node/full/opt-one/opt-two">Option two: a title of sixty characters, the most it may be.</a></h2>')
    expect(extra).toContain('data-node="opt-two"')
    // The centre's Branches are built from the path up to the centre: the asides never join the Trail.
    expect(branches(html, 'answer answer--yes')).toEqual([
      ['/full-node/full/applies', 'The rules apply: a Terminal whose title is also eighty characters long The rule.'],
    ])
  })

  test("a neighbour frame draws the Option buttons with empty slots and no Overlay interior behind them (11.3, 11.4)", async () => {
    const html = await view('/ai-act-example/start')
    // The `yes` neighbour is the question Node with Options: its frame is in the Slider's props, not the markup at rest.
    expect(html).not.toContain('overlay-interior')
    const tree = trees.get('ai-act-example')!
    const address = parseUrl('/ai-act-example/start', '_', tree)!
    const page = (await loadPage(tree, address))!
    const frames = (TreeView({ page, tree }) as { props: { children: [{ props: { neighbours: { href: string; frame: unknown }[] } }] } })
      .props.children[0].props.neighbours
    const question = renderToStaticMarkup(<>{frames.find((n) => n.href === '/ai-act-example/start/prohibited-practices')!.frame as never}</>)
    expect(question.match(/<span class="option-image option-image--empty"><\/span>/g)).toHaveLength(2)
    expect(question).not.toContain('overlay-interior')
    expect(question).not.toContain('/images/')
  })
})

describe('a question Node without Options', () => {
  test('has the same two Answer Branches and no Option columns at all', async () => {
    const html = await view('/ai-act-example/start')

    expect(branches(html, 'answer answer--yes')).toEqual([
      ['/ai-act-example/start/prohibited-practices', 'Does your system do any of the prohibited practices?'],
    ])
    expect(branches(html, 'answer answer--no')).toEqual([['/ai-act-example/start/outside-scope', 'The AI Act does not apply']])
    expect(html).not.toContain('class="options')
    expect(html).not.toContain('options-collapsed')
  })
})

describe('an explanation Node as the centre (only a path with no parent in it, 10.9)', () => {
  test('shows its Interior in the Bubble, no hint, no up arrow, and one startAgain button below to the root with an empty Trail', async () => {
    const html = await view('/ai-act-example/social-scoring')

    expect(html).toContain('<h1 id="node-title">Social scoring</h1>')
    expect(html).not.toContain('class="hint"')
    expect(html).not.toContain('answer--yes')
    expect(html).not.toContain('answer--no')
    expect(branches(html, 'answer')).toEqual([['/ai-act-example/start', 'Is your AI system within the reach of the AI Act?']])
    expect(html).toContain(
      '<a class="branch answer answer--start-again" href="/ai-act-example/start" aria-label="Start again: Is your AI system within the reach of the AI Act?">',
    )
    // Its Trail is empty, so there is no entry above and no up arrow (10.2).
    expect(html).not.toContain('class="up-arrow"')
  })

  test('draws its own Options fanned out, like a question Node', async () => {
    const html = await view('/full-node/opt-one/opt-two')
    // The path's first entry is the centre when nothing in it is a question Node or a Terminal; the rest is its chain.
    expect(html).toContain('<h1 id="node-title">Option one: a title of sixty characters, the most it may be.</h1>')
    expect(all(part(html, 'ul', 'options'), /<span class="option-title">([^<]*)<\/span>/g)).toEqual([
      'Option two: a title of sixty characters, the most it may be.',
    ])
  })
})

describe('a Terminal', () => {
  test('shows its outcome as a badge on the rim, outside the text area, and offers no yes or no', async () => {
    const html = await view('/ai-act-example/start/outside-scope')

    expect(part(html, 'article', 'bubble')).toContain('<p class="outcome outcome--not-applicable">Does not apply</p>')
    expect(part(html, 'div', 'bubble-text')).not.toContain('class="outcome')
    expect(html).not.toContain('answer--yes')
    expect(html).not.toContain('answer--no')
  })

  test('each outcome gets its own name and style', async () => {
    expect(await view('/ai-act-example/prohibited')).toContain('class="outcome outcome--prohibited">Prohibited</p>')
    expect(await view('/ai-act-example/covered')).toContain('class="outcome outcome--applicable">Applies</p>')
  })

  test('offers startAgain to the root with an empty Trail, and the up arrow back to the Trail entry above', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices/prohibited?lang=nl')

    expect(branches(html, 'answer')).toEqual([
      ['/ai-act-example/start?lang=nl', 'Valt uw AI-systeem binnen het bereik van de AI-verordening?'],
    ])
    expect(html).toContain('<span class="branch-word">Opnieuw beginnen</span><span class="branch-colon">: </span>')
    expect(html).toContain('<a class="up-arrow" href="/ai-act-example/start/prohibited-practices?lang=nl" rel="prev"')
  })

  test('with no Trail entry above it shows startAgain alone, and no up arrow', async () => {
    const html = await view('/ai-act-example/covered')

    expect(branches(html, 'answer')).toHaveLength(1)
    expect(branches(html, 'answer answer--start-again')).toHaveLength(1)
    expect(html).not.toContain('class="up-arrow"')
  })

  test('never draws Options', async () => {
    expect(await view('/ai-act-example/start/outside-scope')).not.toContain('class="options')
  })
})

describe('the chrome speaks its own language beside content it does not speak', () => {
  test('the Branch words, the group names and the badge carry lang="en" on a German page', async () => {
    const html = await view('/other-languages/inverkehrbringen/start?lang=de')

    expect(html).toContain('<span class="branch-word" lang="en">Yes</span>')
    expect(html).toMatch(/<span hidden="" id="up-label" lang="en">Back to: [^<]+<\/span>/)
    expect(html).toContain('id="options-label" lang="en">')
    expect(html).toContain('<p class="minimum-size" lang="en">')
  })

  test('and stays silent about it where the chrome and the content agree', async () => {
    const html = await view('/ai-act-example/start/outside-scope?lang=nl')

    expect(html).toContain('<p class="outcome outcome--not-applicable">Niet van toepassing</p>')
    expect(html).toContain('<span hidden="" id="up-label">Terug naar: ')
    expect(html).toContain('<span class="branch-word">Opnieuw beginnen</span>')
  })
})

describe('the document language', () => {
  test('is the language of the content, not the Tree default (application.md 3.1)', async () => {
    expect(await shell('/ai-act-example/start?lang=nl')).toContain('<html lang="nl">')
    expect(await shell('/ai-act-example/start')).toContain('<html lang="en">')
  })

  test('is the Tree default when the segment names a language it does not declare', async () => {
    expect(await shell('/ai-act-example/start?lang=de')).toContain('<html lang="en">')
    expect(await shell('/other-languages/start?lang=de')).toContain('<html lang="de">')
  })
})

describe('the permanent disclaimer', () => {
  test('says the tool is not legal advice, in the chrome language', async () => {
    expect(renderToStaticMarkup(<Disclaimer lang="en" />)).toContain('This is not legal advice.')
    expect(renderToStaticMarkup(<Disclaimer lang="nl" />)).toContain('Dit is geen juridisch advies.')
  })

  test('falls back to English beside content in a language the chrome does not speak', () => {
    const html = renderToStaticMarkup(<Disclaimer lang="de" />)

    expect(html).toContain('This is not legal advice.')
    expect(html).toContain('lang="en"')
  })

  test('names its own language every time, including when it equals the content language', () => {
    expect(renderToStaticMarkup(<Disclaimer lang="nl" />)).toContain('lang="nl"')
    expect(renderToStaticMarkup(<Disclaimer lang="en" />)).toContain('lang="en"')
  })

  test('is announced in Dutch on a Dutch page of a Tree whose default is English', async () => {
    const html = await shell('/ai-act-example/start?lang=nl')

    expect(html).toContain('Dit is geen juridisch advies.')
    expect(effectiveLang(html, 'class="bubble bubble--question"')).toBe('nl')
    expect(effectiveLang(html, 'class="disclaimer"')).toBe('nl')
  })

  test('is announced in English beside German content, which stays German', async () => {
    const html = await shell('/other-languages/start?lang=de')

    expect(effectiveLang(html, 'class="bubble bubble--question"')).toBe('de')
    expect(effectiveLang(html, 'class="disclaimer"')).toBe('en')
  })
})

describe('everything on the page is reachable by keyboard', () => {
  test('every control is a link with a target, a button or a summary, and none is taken out of the tab order', async () => {
    for (const url of [
      '/ai-act-example/start',
      '/ai-act-example/start/prohibited-practices',
      '/ai-act-example/start/prohibited-practices/social-scoring',
      '/ai-act-example/social-scoring',
      '/ai-act-example/start/outside-scope',
      '/full-node/full/full/full/full/full/full/full',
      '/full-node/full/opt-one/opt-two',
    ]) {
      const html = await view(url)

      expect(html, url).not.toMatch(/<a(?=[\s>])(?![^>]*\shref=)/)
      expect(html, url).not.toContain('tabindex="-1"')
      expect(html, url).not.toMatch(/<(div|span)[^>]*role="button"/)
    }
  })

  test('nothing is clipped off screen to be read: a hidden name is hidden, not one pixel wide (10.6)', async () => {
    // A `.visually-hidden` element is by construction wider than itself, which the no-scroll
    // test measures on every element; `hidden` elements are read as names and descriptions
    // all the same and have no box.
    expect(await view('/ai-act-example/start/prohibited-practices/social-scoring')).not.toContain('visually-hidden')
  })
})

describe('the reuse rule (application.md 34.8, ADR-133-reuse-rule decision 8)', () => {
  const pages = [
    '/ai-act-example/start',
    '/ai-act-example/start/prohibited-practices/social-scoring',
    '/ai-act-example/start/outside-scope',
    '/ai-act-example/social-scoring',
    '/full-node/full/full/full/full/full/full/full',
    '/full-node/full/opt-one/opt-two',
    '/carousel/five',
    '/overlay/five/big',
    '/single-language/start',
    '/other-languages/start?lang=fr',
  ]

  test('a public render contains no editor element: no [data-field], no contenteditable, no editor- class', async () => {
    for (const url of pages) {
      const html = await view(url)

      expect(html, url).not.toContain('data-field')
      expect(html, url).not.toContain('contenteditable')
      expect(html, url).not.toMatch(/class="[^"]*editor-/)
    }
  })

  test('the same fixtures with an edit whose slots are all absent and whose links are the public ones give the same markup', async () => {
    const words = Object.fromEntries(
      Object.keys({
        missingText: 0, characters: 0, lines: 0, addSource: 0, editSource: 0, removeSource: 0, sourceKind: 0, sourceUrl: 0, sourceLegal: 0,
        sourceCaseLaw: 0, sourceLiterature: 0, outcome: 0, outcomeNotApplicable: 0, outcomeApplicable: 0, outcomeProhibited: 0, outcomeRefer: 0,
        saving: 0, saved: 0, notSaved: 0, retrying: 0, retry: 0, notEditable: 0, changedElsewhere: 0, sessionExpired: 0, publicBehind: 0, toOverview: 0,
      }).map((key) => [key, key]),
    ) as EditMode['words']
    for (const url of pages) {
      const treeId = url.split('/')[1]!
      const edit: EditMode = { treeId, links: PUBLIC_LINKS, languages: trees.get(treeId)!.manifest.languages, words, slots: {} }

      expect(await view(url, edit), url).toBe(await view(url))
    }
  })
})
