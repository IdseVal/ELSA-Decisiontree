/**
 * The language switch (docs/CORE_DOCUMENT.md 3.2, issue #9): what it offers, where each
 * entry leads, and what changes on the page when the reader picks another language.
 *
 * Every fixture is loaded through `openTree` and every address through `parseUrl`, as
 * docs/specs/application.md section 7 requires; nothing here builds a Node by hand -- not
 * even the damaged one at the end, which is a fixture the loader read after its file
 * changed.
 */
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import { parse, stringify } from 'yaml'
import { endonym, LanguageSwitch } from '../src/components/LanguageSwitch.tsx'
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

/** The address of a URL, read the way the route reads it. */
function addressOf(url: string): { tree: Tree; address: ReturnType<typeof parseUrl> } {
  const { pathname, searchParams } = new URL(url, 'https://example.org')
  const tree = trees.get(pathname.split('/')[1]!)!
  return { tree, address: parseUrl(pathname, searchParams, tree) }
}

/** The switch as the page renders it, for the page `url` names. */
function switchOn(url: string): string {
  const { tree, address } = addressOf(url)
  if (!address) throw new Error(`${url} is not a page of ${tree.id}`)
  return renderToStaticMarkup(<LanguageSwitch address={address} languages={tree.manifest.languages} />)
}

/** The Node view of the page `url` names, rendered the way the page renders it. */
async function view(url: string): Promise<string> {
  const { tree, address } = addressOf(url)
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

describe('what the switch offers', () => {
  // One row per fixture: the languages the manifest declares, as the reader sees them.
  const fixtures = [
    { url: '/ai-act-example/start', labels: ['English', 'Nederlands'] },
    { url: '/single-language/start', labels: ['Nederlands'] },
    { url: '/german-only/start', labels: ['Deutsch'] },
    { url: '/other-languages/start', labels: ['Deutsch', 'français'] },
  ]

  test.for(fixtures)('$url offers exactly its own languages, each in its own', ({ url, labels }) => {
    const html = switchOn(url)

    expect([...html.matchAll(/class="language(?: [^"]*)?"[^>]*>([^<]*)</g)].map((m) => m[1])).toEqual(labels)
  })

  test('a language is named in itself, not in the language on screen', () => {
    // The point of the endonym: a Dutch reader looking at an English page recognises "Nederlands".
    expect(switchOn('/ai-act-example/start')).toContain('>Nederlands</a>')
    expect(switchOn('/ai-act-example/start?lang=nl')).toContain('>English</a>')
  })

  test('every entry carries the language it names, so it is pronounced in it', () => {
    expect(switchOn('/ai-act-example/start')).toContain('lang="nl">Nederlands</a>')
    expect(switchOn('/other-languages/start')).toContain('lang="fr">français</a>')
  })

  test('the language on screen is marked as current and is not a link', () => {
    const html = switchOn('/ai-act-example/start?lang=nl')

    expect(html).toContain('class="language language--current" lang="nl" aria-current="true">Nederlands<')
    expect(html).not.toContain('>Nederlands</a>')
  })

  test('the switch is named by chrome, which follows the content language', () => {
    expect(switchOn('/ai-act-example/start')).toContain('>Language</span>')
    expect(switchOn('/ai-act-example/start?lang=nl')).toContain('>Taal</span>')
    // A Tree in a language the chrome does not speak keeps its content and takes English chrome.
    expect(switchOn('/german-only/start')).toContain('lang="en">Language</span>')
  })

  test('a tag the platform has no name for still labels its entry, and never throws', () => {
    // Core document section 9: a third-party Tree must never break the frontend. A tag with
    // no CLDR name keeps the tag; one the platform refuses outright falls back to the same.
    expect(endonym('nl')).toBe('Nederlands')
    expect(endonym('zz')).toBe('zz')
    expect(endonym('not a language')).toBe('not a language')
  })
})

describe('where an entry leads', () => {
  test('to the same Node with the same Trail, in the other language', () => {
    expect(switchOn('/ai-act-example/start/prohibited-practices/social-scoring')).toContain(
      'href="/ai-act-example/start/prohibited-practices/social-scoring?lang=nl"',
    )
  })

  test('back to the default language carries no lang at all', () => {
    expect(switchOn('/ai-act-example/start/prohibited-practices?lang=nl')).toContain(
      'href="/ai-act-example/start/prohibited-practices"',
    )
  })

  test('the language is in the link, so nothing has to be stored to keep it', () => {
    // Every link of the page carries it too: that is what makes it survive a walk (4.1).
    const nl = switchOn('/ai-act-example/start')
    expect(nl).toMatch(/href="[^"]*\?lang=nl"/)
  })
})

describe('choosing a language', () => {
  test('changes every text of the Node, its Options, Sources, Images and Trail', async () => {
    const url = '/ai-act-example/start/prohibited-practices'
    const en = await view(url)
    const nl = await view(`${url}?lang=nl`)

    // One row per kind of text the issue names, English on this page and Dutch on that one.
    const rows: Array<[what: string, english: string, dutch: string]> = [
      ['title', 'Does your system do any of the prohibited practices?', 'Verricht uw systeem een van de verboden praktijken?'],
      ['description', 'lists practices that are', 'noemt praktijken die zonder meer'],
      ['Option', 'Emotion recognition at work', 'Emotieherkenning op het werk'],
      ['Image description', 'A scoreboard ranking people', 'Een scorebord dat mensen rangschikt'],
      ['Source label', 'Article 5 AI Act', 'Artikel 5 AI-verordening'],
      ['Trail entry', 'Is your AI system within the reach', 'Valt uw AI-systeem binnen het bereik'],
      ['chrome', '>Yes<', '>Ja<'],
      ['chrome heading', 'Sources', 'Bronnen'],
    ]

    for (const [what, english, dutch] of rows) {
      expect(en, what).toContain(english)
      expect(en, what).not.toContain(dutch)
      expect(nl, what).toContain(dutch)
      expect(nl, what).not.toContain(english)
    }
  })

  test('the first visit is the first language the Tree declares', async () => {
    // No cookie, no header, no guess: application.md 4.1, "absent means the Tree's default".
    expect(addressOf('/ai-act-example/start').address?.lang).toBe('en')
    expect(addressOf('/german-only/start').address?.lang).toBe('de')
    expect(addressOf('/other-languages/start').address?.lang).toBe('de')
  })
})

describe('a Node that lacks a text in a language the Tree declares', () => {
  let dir: string
  let tree: Tree

  beforeAll(async () => {
    // The one way this can happen at run time: `openTree` validated the folder (V-L10N), and
    // then the file changed under the running server -- `getNode` re-reads it and does not
    // re-validate. Anything else would need a hand-built Node, which section 7 forbids.
    dir = await mkdtemp(path.join(tmpdir(), 'elsa-language-'))
    await cp(path.join(here, '..', 'trees', 'ai-act-example'), path.join(dir, 'damaged'), { recursive: true })
    tree = await openTree(path.join(dir, 'damaged'))

    const file = path.join(dir, 'damaged', 'nodes', 'start.yaml')
    const raw = parse(await readFile(file, 'utf8')) as { title: Record<string, string> }
    delete raw.title.nl
    await writeFile(file, stringify(raw), 'utf8')
  })

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  test('shows a placeholder the reader can see, and warns on the server', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const node = (await tree.getNode('start'))!
    const address = parseUrl('/damaged/start', new URLSearchParams('lang=nl'), tree)!

    const html = renderToStaticMarkup(
      <NodeView node={node} address={address} rootId={tree.manifest.root} trailTitles={[]} />,
    )

    expect(html).toContain('[Tekst ontbreekt in deze taal]')
    expect(warn).toHaveBeenCalledWith('Tree text missing: start.title has no text for the language "nl"')
    // The rest of the Node is unharmed: only the field that is gone is stood in for.
    expect(html).toContain('De AI-verordening bestrijkt AI-systemen')
    warn.mockRestore()
  })

  test('the language it does have is untouched', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const node = (await tree.getNode('start'))!
    const address = parseUrl('/damaged/start', new URLSearchParams(), tree)!

    const html = renderToStaticMarkup(
      <NodeView node={node} address={address} rootId={tree.manifest.root} trailTitles={[]} />,
    )

    expect(html).toContain('Is your AI system within the reach of the AI Act?')
    expect(html).not.toContain('Text missing in this language')
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})
