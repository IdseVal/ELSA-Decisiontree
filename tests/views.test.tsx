/**
 * The Node view (docs/CORE_DOCUMENT.md 3.2): what each kind of Node puts on the page.
 *
 * Every fixture is loaded through `openTree` and every address through `parseUrl`, as
 * docs/specs/application.md section 7 requires; nothing here builds a Node by hand.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, test } from 'vitest'
import { Disclaimer } from '../src/components/Disclaimer.tsx'
import { NodeView } from '../src/components/NodeView.tsx'
import { openTree, type Tree } from '../src/tree/loader.ts'
import { parseUrl } from '../src/url.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const trees = new Map<string, Tree>()

beforeAll(async () => {
  for (const [id, dir] of [
    ['ai-act-example', path.join(here, '..', 'trees', 'ai-act-example')],
    ['single-language', path.join(here, 'fixtures', 'single-language')],
    ['german-only', path.join(here, 'fixtures', 'german-only')],
    ['other-languages', path.join(here, 'fixtures', 'other-languages')],
  ] as const) {
    trees.set(id, await openTree(dir))
  }
})

/** The markup of the Node the URL names, rendered the way the page renders it. */
async function view(url: string): Promise<string> {
  const { pathname, searchParams } = new URL(url, 'https://example.org')
  const tree = trees.get(pathname.split('/')[1]!)!
  const address = parseUrl(pathname, searchParams, tree)
  if (!address) throw new Error(`${url} is not a page of ${tree.id}`)
  const node = await tree.getNode(address.nodeId)
  if (!node) throw new Error(`${url} names no Node`)
  return renderToStaticMarkup(
    <NodeView node={node} address={address} rootId={tree.manifest.root} />,
  )
}

/**
 * A whole page: the shell `src/app/layout.tsx` renders around the Node view and the footer.
 * `<html lang>` is the Tree's default language there, which is why what the footer inherits
 * is not the language of the page (issue #19).
 */
async function shell(url: string): Promise<string> {
  const { pathname, searchParams } = new URL(url, 'https://example.org')
  const tree = trees.get(pathname.split('/')[1]!)!
  const address = parseUrl(pathname, searchParams, tree)!
  const node = (await tree.getNode(address.nodeId))!
  return renderToStaticMarkup(
    <html lang={tree.manifest.defaultLanguage}>
      <body>
        <main>
          <NodeView node={node} address={address} rootId={tree.manifest.root} />
        </main>
        <Disclaimer lang={address.lang} />
      </body>
    </html>,
  )
}

/** Elements that close themselves, so they never become an ancestor. */
const VOID_ELEMENTS = new Set(['br', 'hr', 'img', 'input', 'link', 'meta', 'source'])

/**
 * The language a screen reader announces the element whose start tag contains `marker` in:
 * its own `lang`, or the nearest ancestor's. The suite has no DOM, and the markup here is
 * React's own output, so scanning the start tags is enough.
 */
function effectiveLang(html: string, marker: string): string | undefined {
  const ancestors: Array<string | undefined> = []
  for (const [, closing, name, attributes = ''] of html.matchAll(/<(\/?)([a-z0-9]+)([^>]*)>/g)) {
    if (closing) {
      ancestors.pop()
      continue
    }
    const own = /\slang="([^"]*)"/.exec(attributes)?.[1]
    if (attributes.includes(marker)) return own ?? ancestors.findLast((lang) => lang !== undefined)
    if (!VOID_ELEMENTS.has(name!) && !attributes.endsWith('/')) ancestors.push(own)
  }
  throw new Error(`no element matching ${marker}`)
}

describe('a question Node', () => {
  test('shows its title and its description as paragraphs', async () => {
    const html = await view('/ai-act-example/start')

    expect(html).toContain('<h1 id="node-title">Is your AI system within the reach of the AI Act?</h1>')
    expect(html).toContain('<p>The AI Act reaches AI systems')
    expect(html).toContain('<strong>placed on the market')
    expect(html).toContain('<li>you use it in the EU;</li>')
  })

  test('offers yes and no as two controls that lead to the two Answer targets', async () => {
    const html = await view('/ai-act-example/start')

    expect(html).toContain('href="/ai-act-example/start/prohibited-practices"')
    expect(html).toContain('href="/ai-act-example/start/outside-scope"')
    expect(html).toMatch(/class="answer answer--yes"[^>]*>Yes</)
    expect(html).toMatch(/class="answer answer--no"[^>]*>No</)
  })

  test('an Answer keeps the Trail taken so far and adds the Node just left', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices')

    expect(html).toContain('href="/ai-act-example/start/prohibited-practices/prohibited"')
    expect(html).toContain('href="/ai-act-example/start/prohibited-practices/covered"')
  })

  test('shows the metadata version unobtrusively', async () => {
    expect(await view('/ai-act-example/start')).toContain('<p class="version">Version 1.0</p>')
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
      expect(html).toContain(`<a href="${url}" target="_blank" rel="noopener noreferrer">`)
    }
  })

  test('are labelled by their kind', async () => {
    const html = await view('/ai-act-example/social-scoring')

    expect(html).toContain('>Legal</span>')
    expect(html).toContain('>Case law</span>')
    expect(html).toContain('>Literature</span>')
  })

  test('say that the link leaves the page, for a reader who cannot see it happen', async () => {
    expect(await view('/ai-act-example/social-scoring')).toContain('opens in a new tab')
  })

  test('a Node without Sources renders no Sources section', async () => {
    expect(await view('/ai-act-example/covered')).not.toContain('class="sources"')
  })
})

describe('Images', () => {
  test('are plain thumbnails: an image per file, no carousel chrome around them', async () => {
    const html = await view('/ai-act-example/start')

    expect(html).toContain('<img src="/images/eu-map.png"')
    expect(html).toContain('alt="Map of the European Union member states"')
    expect(html).toContain('loading="lazy"')
    // No frame, arrows or dots (core document 10.6).
    expect(html).not.toMatch(/prev|next|carousel|slide|dots/i)
  })

  test('a thumbnail is a link to the file, so it works without JavaScript', async () => {
    expect(await view('/ai-act-example/start')).toContain('href="/images/eu-map.png"')
  })

  test('only the Images of this Node are named in its markup', async () => {
    const files = [...(await view('/ai-act-example/start')).matchAll(/\/images\/([\w.-]+)/g)].map(
      (match) => match[1],
    )

    expect(new Set(files)).toEqual(new Set(['eu-map.png']))
  })

  test('a Node without Images renders no Images section', async () => {
    expect(await view('/ai-act-example/social-scoring')).not.toContain('class="images"')
  })
})

describe('Options', () => {
  test('are a clickable list, each entry leading to its child Node', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices')

    expect(html).toContain('href="/ai-act-example/start/prohibited-practices/social-scoring"')
    expect(html).toContain('>Social scoring</span>')
    expect(html).toContain(
      'href="/ai-act-example/start/prohibited-practices/emotion-recognition-at-work"',
    )
  })

  test('carry the thumbnail of the entry when it has one', async () => {
    const html = await view('/ai-act-example/prohibited-practices')

    expect(html).toContain('<img class="option-image" src="/images/scoreboard.png"')
    expect(html).toContain('alt="A scoreboard ranking people"')
  })
})

describe('a Terminal Node', () => {
  test('shows its outcome and offers no yes or no', async () => {
    const html = await view('/ai-act-example/start/outside-scope')

    expect(html).toContain('class="outcome outcome--not-applicable"')
    expect(html).toContain('>Does not apply</p>')
    expect(html).not.toContain('class="answers"')
    expect(html).not.toContain('answer--yes')
  })

  test('each outcome gets its own name and style', async () => {
    expect(await view('/ai-act-example/prohibited')).toContain('outcome--prohibited')
    expect(await view('/ai-act-example/prohibited')).toContain('>Prohibited</p>')
    expect(await view('/ai-act-example/covered')).toContain('>Applies</p>')
  })
})

describe('an explanation-only Node', () => {
  test('says the answer is given on the previous step and offers no yes or no', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices/social-scoring')

    expect(html).toContain('This step only explains.')
    expect(html).not.toContain('class="answers"')
  })

  test('offers a way back to the Node it was opened from', async () => {
    const html = await view('/ai-act-example/start/prohibited-practices/social-scoring')

    expect(html).toContain('<a class="back" href="/ai-act-example/start/prohibited-practices"')
    expect(html).toContain('>Back</a>')
  })

  test('opened by its own URL, the way back is the start of the walk', async () => {
    const html = await view('/ai-act-example/social-scoring')

    expect(html).toContain('<a class="back" href="/ai-act-example/start"')
    expect(html).toContain('>Start</a>')
  })

  test('the root Node has nothing to go back to', async () => {
    expect(await view('/ai-act-example/start')).not.toContain('class="back"')
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
    expect(html).toContain('lang="de"'.replace('de', 'en'))
  })

  test('names its own language every time, including when it equals the content language', () => {
    // The footer is a sibling of <main>: the only language it can inherit is <html>'s, which
    // is the Tree's default and says nothing about this page (application.md 3.1, issue #19).
    expect(renderToStaticMarkup(<Disclaimer lang="nl" />)).toContain('lang="nl"')
    expect(renderToStaticMarkup(<Disclaimer lang="en" />)).toContain('lang="en"')
  })

  test('is announced in Dutch on a Dutch page of a Tree whose default is English', async () => {
    const html = await shell('/ai-act-example/start?lang=nl')

    expect(html).toContain('Dit is geen juridisch advies.')
    expect(effectiveLang(html, 'class="node"')).toBe('nl')
    expect(effectiveLang(html, 'class="disclaimer"')).toBe('nl')
  })

  test('is announced in English beside German content, which stays German', async () => {
    const html = await shell('/other-languages/start?lang=de')

    expect(effectiveLang(html, 'class="node"')).toBe('de')
    expect(effectiveLang(html, 'class="disclaimer"')).toBe('en')
  })
})

describe('everything on the page is reachable by keyboard', () => {
  test('every control is a link with a target or a button, and none is taken out of the tab order', async () => {
    for (const url of [
      '/ai-act-example/start',
      '/ai-act-example/start/prohibited-practices',
      '/ai-act-example/start/prohibited-practices/social-scoring',
      '/ai-act-example/start/outside-scope',
    ]) {
      const html = await view(url)

      expect(html, url).not.toMatch(/<a(?=[\s>])(?![^>]*\shref=)/)
      expect(html, url).not.toContain('tabindex="-1"')
      expect(html, url).not.toMatch(/<(div|span)[^>]*role="button"/)
    }
  })
})
