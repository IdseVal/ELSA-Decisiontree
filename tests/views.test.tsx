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
  return renderToStaticMarkup(<TreeView node={node} address={address} tree={tree} />)
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
          <TreeView node={node} address={address} tree={tree} />
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
        `<a class="branch ${className}[^"]*" href="([^"]*)"[^>]*>(?:<img [^>]*>)?<span class="branch-label">(?:<span class="branch-word"[^>]*>[^<]*</span>)?<span class="branch-title">(?:<span[^>]*>)?([^<]*)`,
        'g',
      ),
    ),
  ].map((match) => [match[1]!, match[2]!])
}

describe('the tree layer', () => {
  test('is one element holding the Trail, the Bubble, the Branches and the Carousel row, in that order (11.1)', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices')
    const layer = part(html, 'div', 'tree-layer')

    const order = ['class="trail', 'class="bubble', 'class="options', 'class="answers"', 'class="carousel"'].map((marker) =>
      layer.indexOf(marker),
    )
    expect(order.every((at) => at >= 0), layer.slice(0, 200)).toBe(true)
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  test('the Carousel row is present on every Node, empty where the Node has no Images, so the Bubble never moves (12.1)', async () => {
    for (const url of ['/ai-act-example/covered', '/ai-act-example/social-scoring']) {
      expect(await view(url), url).toContain('<div class="carousel"></div>')
    }
    expect(await view('/ai-act-example/start')).toContain('<div class="carousel"><section class="images"')
  })

  test("the Node's own Images are thumbnails in the Carousel row until #43 draws the Carousel, each a link to its file with the enlarged view behind it", async () => {
    // `start` carries eu-map.png as its Image. The owner (PR #56): what 0.1 showed stays
    // reachable, picture and credit, until the Carousel lands.
    const html = await view('/ai-act-example/start')
    const row = part(html, 'div', 'carousel')

    expect(row).toContain('<span hidden="" id="images-label">Images</span>')
    expect(row).toContain(
      '<a class="thumbnail" href="/images/eu-map.png" aria-label="Enlarge: Map of the European Union member states">' +
        '<img src="/images/eu-map.png" alt="Map of the European Union member states" width="60" height="60" loading="lazy"/></a>',
    )
    // The enlarged view is on the page, closed and empty: the credit is drawn when it opens.
    expect(row).toContain('<dialog class="enlarged" aria-labelledby="enlarged-description">')
    expect(row).toContain('<button class="close">Close</button>')
    expect(row).not.toContain('Example Cartography')
  })

  test("an Option's thumbnail is on its Branch, not in the Carousel row (10.3, 12.1)", async () => {
    // `prohibited-practices` carries scoreboard.png on an Option and no Image of its own.
    const html = await view('/ai-act-example/prohibited-practices')
    expect(html).toContain(
      '<img class="branch-image option-image" src="/images/scoreboard.png" alt="A scoreboard ranking people"',
    )
    expect(html).toContain('<div class="carousel"></div>')
  })

  test('carries the notice for a window below the floor, for the stylesheet to show (10.4)', async () => {
    expect(await view('/ai-act-example/start')).toContain(
      '<p class="minimum-size">This tool needs a window of at least 320 by 480 pixels.</p>',
    )
    expect(await view('/ai-act-example/start?lang=nl')).toContain('minimaal 320 bij 480 pixels')
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
    expect(await view('/ai-act-example/start?lang=nl')).toContain('<article class="bubble bubble--question" lang="nl">')
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
  test('offers yes and no as two Branches below, each showing its chrome word and its target title', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices')

    expect(branches(html, 'answer answer--yes')).toEqual([
      ['/ai-act-example/start/prohibited-practices/prohibited', 'This is a prohibited practice'],
    ])
    expect(branches(html, 'answer answer--no')).toEqual([
      ['/ai-act-example/start/prohibited-practices/covered', 'The AI Act applies to your system'],
    ])
    expect(html).toContain('<span class="branch-word">Yes</span>')
    expect(html).toContain('<span class="branch-word">No</span>')
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

  test('offers no yes or no, and one back Branch below to the Trail entry directly above, with its title', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices/social-scoring')

    expect(html).not.toContain('answer--yes')
    expect(html).not.toContain('answer--no')
    expect(branches(html, 'answer answer--back')).toEqual([
      ['/ai-act-example/start/prohibited-practices', 'Does your system do any of the prohibited practices?'],
    ])
    expect(html).toContain('<span class="branch-word">Back</span>')
  })

  test('opened by its own URL it has no entry above, so no back Branch: the Trail row offers the start', async () => {
    const html = await view('/ai-act-example/social-scoring')

    expect(branches(html, 'answer')).toEqual([])
    expect(branches(html, 'trail-entry')).toEqual([['/ai-act-example/start', 'Start']])
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

  test('offers back to the Trail entry above and startAgain to the root with an empty Trail', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices/prohibited?lang=nl')

    expect(branches(html, 'answer answer--back')).toEqual([
      ['/ai-act-example/start/prohibited-practices?lang=nl', 'Verricht uw systeem een van de verboden praktijken?'],
    ])
    expect(branches(html, 'answer answer--start-again')).toEqual([
      ['/ai-act-example/start?lang=nl', 'Valt uw AI-systeem binnen het bereik van de AI-verordening?'],
    ])
    expect(html).toContain('<span class="branch-word">Terug</span>')
    expect(html).toContain('<span class="branch-word">Opnieuw beginnen</span>')
  })

  test('with no Trail entry above it shows startAgain alone', async () => {
    const html = await view('/ai-act-example/covered')

    expect(branches(html, 'answer answer--back')).toEqual([])
    expect(branches(html, 'answer answer--start-again')).toHaveLength(1)
  })

  test('never draws Options', async () => {
    expect(await view('/ai-act-example/start/outside-scope')).not.toContain('class="options')
  })
})

describe('the chrome speaks its own language beside content it does not speak', () => {
  test('the Branch words, the group names and the badge carry lang="en" on a German page', async () => {
    const html = await view('/other-languages/inverkehrbringen/start?lang=de')

    expect(html).toContain('<span class="branch-word" lang="en">Yes</span>')
    expect(html).toContain('<span hidden="" id="trail-label" lang="en">Your path</span>')
    expect(html).toContain('id="options-label" lang="en">')
    expect(html).toContain('<p class="minimum-size" lang="en">')
  })

  test('and stays silent about it where the chrome and the content agree', async () => {
    const html = await view('/ai-act-example/start/outside-scope?lang=nl')

    expect(html).toContain('<p class="outcome outcome--not-applicable">Niet van toepassing</p>')
    expect(html).toContain('<span class="branch-word">Terug</span>')
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
