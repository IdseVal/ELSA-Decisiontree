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
import { Disclaimer } from '../src/components/Disclaimer.tsx'
import { TreeView } from '../src/components/TreeView.tsx'
import { neighbourhood } from '../src/neighbourhood.ts'
import { openTree, type Tree } from '../src/tree/loader.ts'
import { contentLanguage, parseUrl } from '../src/url.ts'
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

/** The markup of the Node the URL names, rendered the way the page renders it. */
async function view(url: string): Promise<string> {
  const target = new URL(url, 'https://example.org')
  const tree = trees.get(target.pathname.split('/')[1]!)!
  const address = parseUrl(target.pathname, langSegment(target), tree)
  if (!address) throw new Error(`${url} is not a page of ${tree.id}`)
  const node = await tree.getNode(address.nodeId)
  if (!node) throw new Error(`${url} names no Node`)
  return renderToStaticMarkup(<TreeView node={node} address={address} tree={tree} neighbours={await neighbourhood(tree, address, node)} />)
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
  const node = (await tree.getNode(address.nodeId))!
  return renderToStaticMarkup(
    <html lang={contentLanguage(tree, langSegment(target))}>
      <body>
        <main>
          <TreeView node={node} address={address} tree={tree} neighbours={await neighbourhood(tree, address, node)} />
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
        `<a class="branch ${className}[^"]*" href="([^"]*)"[^>]*>(?:<img [^>]*>)?<span class="branch-label">(?:<span class="branch-word"[^>]*>[^<]*</span>: )?<span class="branch-title">(?:<span[^>]*>)?([^<]*)`,
        'g',
      ),
    ),
  ].map((match) => [match[1]!, match[2]!])
}

describe('the tree layer', () => {
  test('is one element holding the Bubble with its up arrow, the Branches and the Carousel row, in that order (11.1)', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices')
    const layer = part(html, 'div', 'tree-layer')

    const order = ['class="bubble', 'class="up-arrow"', 'class="options', 'class="answers"', 'class="carousel"'].map((marker) =>
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
      const placed = new Set((await neighbourhood(tree, address, (await tree.getNode(address.nodeId))!)).map((p) => p.href))
      const marked = [...(await view(url)).matchAll(/<a class="(branch [^"]*|up-arrow)" href="([^"]*)"([^>]*)>/g)].map(
        ([, kind, href, rest]) => [kind, href, rest!.includes('data-slide')],
      )
      // `startAgain` has no direction (11.1), even where its URL is the grandparent's.
      const slides = (kind: string, href: string) => kind !== 'branch answer answer--start-again' && placed.has(href)

      expect(marked.length, url).toBeGreaterThan(0)
      expect(marked, url).toEqual(marked.map(([kind, href]) => [kind, href, slides(kind as string, href as string)]))
    }
    const full = await view('/full-node/full/full/full')
    expect(full.match(/<a class="up-arrow"[^>]*data-slide/g), 'the full Node\'s up arrow').toBeNull()
    expect(full.match(/<a class="branch option"[^>]*data-slide/g), 'the full Node\'s Options').toHaveLength(8)
  })

  test('an Answer back to the parent does not slide, and two Answers to one target both do (11.3)', async () => {
    const answers = async (url: string) =>
      [...(await view(url)).matchAll(/<a class="branch answer (answer--(?:yes|no))" href="([^"]*)"([^>]*)>/g)].map(
        ([, kind, href, rest]) => [kind, href, rest!.includes('data-slide')],
      )

    // `third`'s `yes` is `second`, which the parent placed `up` at its own shorter address.
    expect(await answers('/cycle/first/second/third')).toEqual([
      ['answer--yes', '/cycle/first/second/third/second', false],
      ['answer--no', '/cycle/first/second/third/done', true],
    ])
    expect(await answers('/cycle/first/second')).toEqual([
      ['answer--yes', '/cycle/first/second/third', true],
      ['answer--no', '/cycle/first/second/third', true],
    ])
  })

  test('the Carousel row is present on every Node, empty where neither the Node nor its Options carry a picture, so the Bubble never moves (12.1)', async () => {
    for (const url of ['/ai-act-example/covered', '/ai-act-example/social-scoring']) {
      expect(await view(url), url).toContain('<div class="carousel"></div>')
      // So such a Node has no strip, and no empty tab stop without a script either.
      expect(await view(url), url).not.toContain('carousel-strip')
    }
    expect(await view('/ai-act-example/start')).toContain('<section class="carousel">')
  })

  test("an Option's picture is on its Branch and in the Carousel row, its caption naming the Option (10.3, 12.1)", async () => {
    // `prohibited-practices` carries scoreboard.png on an Option and no Image of its own.
    const html = await view('/ai-act-example/prohibited-practices')
    expect(html).toContain(
      '<img class="branch-image option-image" src="/images/scoreboard.png" alt="A scoreboard ranking people"',
    )
    expect(all(part(html, 'ul', 'carousel-strip'), /<a class="thumbnail" href="([^"]*)"/g)).toEqual(['/images/scoreboard.png'])
    expect(captions(html, 'caption-wide')[0]).toMatch(/^Social scoring: A scoreboard ranking people — \S/)
    // The caption line's copy is hidden from assistive technology, so the thumbnail's own name carries the Option too.
    expect(part(html, 'ul', 'carousel-strip')).toContain(
      '<img id="carousel-image-0" src="/images/scoreboard.png" alt="Social scoring: A scoreboard ranking people"',
    )
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

/** The text a caption variant shows: its markup without the tags. */
function captions(html: string, variant: 'caption-wide' | 'caption-narrow'): string[] {
  return all(html, new RegExp(`<span class="${variant}">(.*?)</span></span>`, 'g')).map((inner) =>
    `${inner}</span>`.replace(/<[^>]+>/g, ''),
  )
}

describe('the Carousel', () => {
  test("shows the Node's own Images in the author's order, each a thumbnail that links to its file (12.1, 12.3)", async () => {
    const html = await view('/carousel/five')
    const strip = part(html, 'ul', 'carousel-strip')

    // Focusable in the markup, named as the row is: the arrow keys scroll it without a script (12.2, 12.3).
    expect(strip).toContain('<ul class="carousel-strip" tabindex="0" aria-labelledby="images-label" data-carousel-strip="">')
    expect(all(strip, /<a class="thumbnail" href="([^"]*)"/g)).toEqual([
      '/images/orchard.svg',
      '/images/greenhouse.svg',
      '/images/drone.svg',
      '/images/tractor.svg',
      '/images/harbour.svg',
    ])
    // Loaded lazily, with the size the row draws them at, so no page asks for what it does not show (12.4).
    expect(strip).toContain(
      '<img id="carousel-image-0" src="/images/orchard.svg" alt="An orchard of three apple trees under a yellow sun" width="80" height="60" loading="lazy"/>',
    )
    expect(strip.match(/loading="lazy"/g)).toHaveLength(5)
  })

  test("after the Node's own Images come its Options' pictures, the one each Branch shows, in Option order (12.1)", async () => {
    // The full Node: ten Images of its own and eight Options with a picture each, 18 in all.
    const tree = trees.get('full-node')!
    const node = (await tree.getNode('full'))!
    const html = await view('/full-node/full?lang=nl')
    const expected = [...node.images, ...node.options.map((option) => option.images[0]!)].map((image) => `/images/${image.file}`)
    expect(expected).toHaveLength(18)
    expect(all(part(html, 'ul', 'carousel-strip'), /<a class="thumbnail" href="([^"]*)"/g)).toEqual(expected)

    // Only the first picture of an Option is on its Branch, so only the first joins the strip.
    expect(html).not.toContain('Optie een, tweede afbeelding')
    // Each Option picture's caption names its Option before the description, and the credit is whole.
    const wide = captions(html, 'caption-wide')
    const narrow = captions(html, 'caption-narrow')
    for (const [index, option] of node.options.entries()) {
      const caption = wide[node.images.length + index]!
      const image = option.images[0]!
      expect(caption.length, caption).toBeLessThanOrEqual(170)
      expect(caption.endsWith(image.credit), caption).toBe(true)
      expect(`${option.title.nl}: ${image.description.nl}`.startsWith(caption.slice(0, -(image.credit.length + ' — '.length + 1)))).toBe(true)
      // Below the guaranteed width the credit stays whole too; Options two to eight carry a
      // 120-character credit, which fills the line, so their Option's title gives way with the description.
      const line = narrow[node.images.length + index]!
      expect(line.length, line).toBeLessThanOrEqual(123)
      expect(line.endsWith(image.credit), line).toBe(true)
      if (index > 0) {
        expect(image.credit).toHaveLength(120)
        expect(line).toBe(image.credit)
      }
      // Whole in the thumbnail's name, which is where assistive technology reads it.
      expect(html).toContain(`alt="${option.title.nl}: ${image.description.nl}"`)
    }
    expect(html).toContain('<summary class="sheet-open"><span>Afbeelding 1 van 18</span></summary>')
  })

  test('names the strip and not the row around it, and names each thumbnail by the enlarge word and its description, described by its credit', async () => {
    const html = await view('/carousel/five?lang=nl')

    // One name, on the focusable strip 12.3 names: on the row as well it would be read twice.
    expect(html).toContain('<section class="carousel">')
    expect(html.match(/aria-labelledby="images-label"/g)).toHaveLength(1)
    expect(html).toContain('<span hidden="" id="images-label">Afbeeldingen</span>')
    expect(html).toContain('<span hidden="" id="carousel-enlarge">Vergroten</span>')
    expect(html).toContain(
      '<a class="thumbnail" href="/images/drone.svg" aria-labelledby="carousel-enlarge carousel-image-2" aria-describedby="carousel-credit-2">',
    )
    expect(html).toContain('<span id="carousel-credit-2">Drawing: Example Illustrator, via Example Commons, CC BY-SA 4.0</span>')
    expect(html).toContain('alt="Een drone die een akker van bovenaf scant"')
  })

  test('the chrome of the Carousel speaks its own language beside content it does not speak', async () => {
    // other-languages carries no Image on a Node; the example's Dutch page is the chrome's own language.
    expect(await view('/carousel/five')).toContain('<summary class="sheet-open"><span>Image 1 of 5</span></summary>')
    expect(await view('/carousel/five?lang=nl')).toContain('<summary class="sheet-open"><span>Afbeelding 1 van 5</span></summary>')
  })

  test('gives every Image a caption of its whole description and its credit when both fit the line', async () => {
    expect(captions(await view('/carousel/five'), 'caption-wide')).toEqual([
      'An orchard of three apple trees under a yellow sun — Drawing: Example Studio, CC0 1.0',
      'Two greenhouses with rows of seedlings and a shed beside them — Drawing: Example Studio, CC BY 4.0',
      'A drone scanning a field from above — Drawing: Example Illustrator, via Example Commons, CC BY-SA 4.0',
      'A red tractor on a dirt track — Drawing: Example Studio, CC0 1.0',
      'A fishing harbour at sunset with a boat leaving the quay — Drawing: Example Cartography, public domain',
    ])
  })

  test('the caption is at most 170 characters, the credit whole and the description shortened to fit (12.2)', async () => {
    // The full Node: descriptions and credits of 120 characters each, 243 with the separator.
    const tree = trees.get('full-node')!
    const node = (await tree.getNode('full'))!
    for (const lang of ['en', 'nl']) {
      const html = await view(`/full-node/full${lang === 'en' ? '' : `?lang=${lang}`}`)
      const wide = captions(html, 'caption-wide')
      const narrow = captions(html, 'caption-narrow')
      expect(wide).toHaveLength(18)

      for (const [index, image] of node.images.entries()) {
        const description = image.description[lang]!
        expect(wide[index]!.length, wide[index]).toBeLessThanOrEqual(170)
        expect(wide[index]!.endsWith(image.credit), wide[index]).toBe(true)
        // At the guaranteed width the description keeps the 47 characters 12.2 promises, and says it was cut.
        const shown = wide[index]!.slice(0, -(image.credit.length + ' — '.length))
        expect(shown.endsWith('…'), shown).toBe(true)
        expect(shown.length).toBeGreaterThanOrEqual(47)
        expect(description.startsWith(shown.slice(0, -1))).toBe(true)
        // Below it a 120-character credit and its separator fill the line: the credit stays
        // whole and the description has no room (the next test).
        expect(narrow[index]).toBe(image.credit)
      }
    }
  })

  test('below the guaranteed width the caption is at most 123 characters, so every credit the format allows is whole (12.2)', async () => {
    for (const url of ['/carousel/five', '/carousel/five/two/long']) {
      const narrow = captions(await view(url), 'caption-narrow')
      expect(narrow.length, url).toBeGreaterThan(0)
      expect(narrow.filter((line) => line.length > 123), url).toEqual([])
    }
    // Both fit whole on the narrow line too: 101 characters with the separator.
    expect(captions(await view('/carousel/five'), 'caption-narrow')[2]).toBe(
      'A drone scanning a field from above — Drawing: Example Illustrator, via Example Commons, CC BY-SA 4.0',
    )

    const narrow = captions(await view('/carousel/five/two/long'), 'caption-narrow')
    // A credit of 120 characters leaves the description no room: the credit alone, never cut.
    expect(narrow[0]).toBe(
      'Photograph: Example Agricultural Research Station, Department of Soil and Water, via Example Commons, licence CC BY 4.0.',
    )
    // A short credit leaves 86 characters: the description gives way, and says so.
    expect(narrow[1]).toBe(
      'A solar-powered pump beside a pond, its panel tilted towards the sun and a pipe leadi… — Drawing: Example Studio, CC BY 4.0',
    )
  })

  test('the shortened description is for the eye: the whole one is the thumbnail\'s name, so the copy is hidden from assistive technology', async () => {
    const html = await view('/full-node/full')
    expect(html).toContain('<span class="caption-wide"><span aria-hidden="true">Picture 1 of ten: a description of one hundred…')
  })

  test('the row collapses by width alone: nothing in the markup keys it to the length of a credit (10.5, step 2)', async () => {
    for (const url of ['/full-node/full', '/carousel/five/two/long', '/carousel/five']) {
      expect(await view(url), url).not.toContain('data-long-credit')
    }
  })

  test('the enlarged view is a Sheet holding each Image in full, one page each, its description and credit whole (12.3, 14)', async () => {
    const html = await view('/full-node/full')
    const sheet = part(html, 'details', 'sheet carousel-sheet')
    const tree = trees.get('full-node')!
    const node = (await tree.getNode('full'))!

    expect(sheet.match(/<figure class="sheet-figure">/g)).toHaveLength(18)
    // Without the script every page after the first is a disclosure: seventeen of them.
    expect(sheet.match(/<details class="sheet-more">/g)).toHaveLength(17)
    for (const image of node.images) {
      expect(sheet).toContain(`<img src="/images/${image.file}" alt="${image.description.en}" loading="lazy"/>`)
      expect(sheet).toContain(`<p class="credit"><span class="kind">Credit</span> ${image.credit}</p>`)
    }
    // An Option's picture is enlarged with its Option's name before the whole description.
    const option = node.options[1]!
    expect(sheet).toContain(`<p>${option.title.en}: ${option.images[0]!.description.en}</p>`)
  })
})

describe('the Bubble', () => {
  test('holds the title as the page heading, the description as rich text, and the Sources', async () => {
    const html = await view('/ai-act-example/start')
    const bubble = part(html, 'article', 'bubble')

    expect(bubble).toContain('<h1 id="node-title">Is your AI system within the reach of the AI Act?</h1>')
    expect(bubble).toContain('<p>The AI Act reaches AI systems')
    expect(bubble).toContain('<strong>placed on the market')
    expect(bubble).toContain('<li>Answer <strong>no</strong> only if none of these applies to your system.</li>')
    expect(bubble).toContain('<section class="sources"')
    expect(html.match(/<h1 /g)).toHaveLength(1)
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

  test('are labelled by their kind, and say that the link leaves the page', async () => {
    const html = await view('/ai-act-example/social-scoring')

    expect(html).toContain('>Legal</span>')
    expect(html).toContain('>Case law</span>')
    expect(html).toContain('>Literature</span>')
    expect(html).toContain('<span hidden="" id="sources-new-tab">opens in a new tab</span>')
  })

  test('are also in the Sheet they collapse to below the guarantee, as the same links (10.5, 14)', async () => {
    const html = await view('/ai-act-example/social-scoring')
    const sheet = part(html, 'div', 'sources-collapsed')

    expect(sheet).toContain('<summary class="sheet-open"><span>Sources (3)</span></summary>')
    expect(sheet.match(/target="_blank"/g)).toHaveLength(3)
    expect(sheet).toContain('href="https://arxiv.org/abs/2107.03721"')
  })

  test('a Node without Sources renders neither the list nor the Sheet', async () => {
    const html = await view('/ai-act-example/covered')

    expect(html).not.toContain('class="sources"')
    expect(html).not.toContain('class="sources-collapsed"')
  })
})

describe('a question Node with Options', () => {
  test('offers yes and no as two buttons below, each labelled with its chrome word, a colon and its target title in one run', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices')

    expect(branches(html, 'answer answer--yes')).toEqual([
      ['/ai-act-example/start/prohibited-practices/prohibited', 'This is a prohibited practice'],
    ])
    expect(branches(html, 'answer answer--no')).toEqual([
      ['/ai-act-example/start/prohibited-practices/covered', 'The AI Act applies to your system'],
    ])
    expect(part(html, 'div', 'answers')).toBe(
      '<div class="answers" role="group" aria-labelledby="node-title">' +
        '<a class="branch answer answer--yes" href="/ai-act-example/start/prohibited-practices/prohibited" data-slide="">' +
        '<span class="branch-label"><span class="branch-word">Yes</span>: <span class="branch-title">This is a prohibited practice</span></span></a>' +
        '<a class="branch answer answer--no" href="/ai-act-example/start/prohibited-practices/covered" data-slide="">' +
        '<span class="branch-label"><span class="branch-word">No</span>: <span class="branch-title">The AI Act applies to your system</span></span></a>' +
        '</div>',
    )
  })

  test('draws its Options beside the Bubble, one Branch per Option, each to its target with the current Node appended', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices')

    expect(branches(html, 'option')).toEqual([
      ['/ai-act-example/start/prohibited-practices/social-scoring', 'Social scoring'],
      ['/ai-act-example/start/prohibited-practices/emotion-recognition-at-work', 'Emotion recognition at work or in education'],
    ])
  })

  test('splits the Options over two columns, at most four a side, and says how many there are', async () => {
    const two = await view('/ai-act-example/prohibited-practices')
    expect(two).toContain('<div class="options-columns" data-count="2">')
    expect(part(two, 'ul', 'options options--left').match(/<li>/g)).toHaveLength(1)
    expect(part(two, 'ul', 'options options--right').match(/<li>/g)).toHaveLength(1)

    const eight = await view('/full-node/full')
    expect(eight).toContain('data-count="8"')
    expect(part(eight, 'ul', 'options options--left').match(/<li>/g)).toHaveLength(4)
    expect(part(eight, 'ul', 'options options--right').match(/<li>/g)).toHaveLength(4)
  })

  test('an Option with Images carries the first of them as a thumbnail, and only the first', async () => {
    const html = await view('/full-node/full')
    const first = part(html, 'ul', 'options options--left')

    expect(first).toContain('<img class="branch-image option-image" src="/images/one.png" alt="Option one, first picture" width="64" height="64" loading="lazy"/>')
    expect(first).not.toContain('/images/two.png')
  })

  test('the Options are named as a group, and are also in the Sheet they collapse to (10.5, 14)', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices')

    expect(html).toContain('<span hidden="" id="options-label">What this covers</span>')
    expect(html).toContain('<ul class="options options--left" aria-labelledby="options-label">')
    const sheet = part(html, 'div', 'options-collapsed')
    expect(sheet).toContain('<summary class="sheet-open"><span>What this covers (2)</span></summary>')
    expect(sheet).toContain('href="/ai-act-example/start/prohibited-practices/social-scoring"')
    expect(sheet).toContain('href="/ai-act-example/start/prohibited-practices/emotion-recognition-at-work"')
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

describe('an explanation Node', () => {
  test('says the answer is given on the step above, on the rim and outside the text area (10.1)', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices/social-scoring')
    const textArea = part(html, 'div', 'bubble-text')

    expect(part(html, 'article', 'bubble')).toContain('<p class="hint">This step only explains. Go back to answer the question.</p>')
    expect(textArea).not.toContain('class="hint"')
  })

  test('offers no yes or no, and one startAgain button below to the root with an empty Trail; the way back is the up arrow', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices/social-scoring')

    expect(html).not.toContain('answer--yes')
    expect(html).not.toContain('answer--no')
    expect(branches(html, 'answer')).toEqual([['/ai-act-example/start', 'Is your AI system within the reach of the AI Act?']])
    expect(html).toContain('<a class="branch answer answer--start-again" href="/ai-act-example/start">')
    expect(html).toContain('<a class="up-arrow" href="/ai-act-example/start/prohibited-practices" rel="prev"')
  })

  test('opened by its own URL it has no entry above, so no up arrow, and startAgain is its way in', async () => {
    const html = await view('/ai-act-example/social-scoring')

    expect(html).not.toContain('class="up-arrow"')
    expect(branches(html, 'answer')).toEqual([['/ai-act-example/start', 'Is your AI system within the reach of the AI Act?']])
  })

  test('draws its own Options beside it, when it has any', async () => {
    const html = await view('/full-node/full/opt-one')

    expect(branches(html, 'option')).toEqual([['/full-node/full/opt-one/opt-two', 'Option two: a title of sixty characters, the most it may be.']])
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
    expect(html).toContain('<span class="branch-word">Opnieuw beginnen</span>: ')
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
      '/ai-act-example/start/outside-scope',
      '/full-node/full/full/full/full/full/full/full',
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
