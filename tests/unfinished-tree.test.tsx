/**
 * **[#279]** The public page of a Tree with a to-do open (docs/specs/application.md 19.4;
 * ADR-279-to-do-is-support): for each advisory rule of tree-format.md 7, what a reader is shown.
 * Every Tree is a file in a folder, opened as the store opens the copy it serves
 * (`openTree(dir, { served: true })`), read through `parseUrl` and `loadPage`, and drawn by the
 * public components -- none is built by hand. Each case also holds that the file is still not a
 * valid `elsa-tree/9` file: `openTree(dir)`, the format's own reading, refuses it by that rule.
 */
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import { Logo } from '../src/components/Logo.tsx'
import { Tile } from '../src/components/Tile.tsx'
import { TreeView } from '../src/components/TreeView.tsx'
import { pageGraph } from '../src/findability/jsonld.ts'
import { llmsTxt } from '../src/findability/llms.ts'
import { sitemapXml } from '../src/findability/sitemap.ts'
import { loadPage } from '../src/neighbourhood.ts'
import { openTree, TreeInvalid, type Tree } from '../src/tree/loader.ts'
import { parseUrl } from '../src/url.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const invalid = path.join(here, 'fixtures', 'invalid')
const BASE = new URL('https://example.org')
let work: string

beforeAll(async () => {
  work = await mkdtemp(path.join(tmpdir(), 'elsa-unfinished-'))
})

afterAll(async () => {
  await rm(work, { recursive: true, force: true })
})

/** A localised text of the two languages. */
const both = (en: string, nl: string): Record<string, string> => ({ en, nl })

/** A Tree that is valid in full, in English and Dutch: what each case takes one text or Link from. */
function whole(): Record<string, any> {
  const metadata = { version: '1' }
  return {
    $schema: '/schemas/elsa-tree-9.json',
    format: 'elsa-tree/9',
    languages: ['en', 'nl'],
    root: 'start',
    title: both('A small Tree', 'Een kleine boom'),
    metadata,
    nodes: [
      {
        id: 'start',
        title: both('Does it apply?', 'Is het van toepassing?'),
        description: both('It asks about a [system](#system).', 'Het vraagt naar een [systeem](#system).'),
        metadata,
        sources: [{ kind: 'legal', label: both('Article 1', 'Artikel 1'), url: 'https://example.org/article-1' }],
        images: [{ file: 'pic.png', description: both('A picture', 'Een afbeelding'), credit: 'Picture: Example, CC0' }],
        answers: [
          { label: both('Yes', 'Ja'), target: 'yes-end' },
          { label: both('No', 'Nee'), target: 'no-end' },
        ],
        options: [{ title: both('What does it mean?', 'Wat betekent het?'), target: 'detail' }],
        explainers: [{ id: 'system', term: both('System', 'Systeem'), text: both('A machine.', 'Een machine.') }],
      },
      { id: 'detail', title: both('What it means', 'Wat het betekent'), description: both('An aside.', 'Een terzijde.'), metadata },
      { id: 'yes-end', title: both('It applies', 'Het is van toepassing'), description: both('The end.', 'Het einde.'), metadata, terminal: { label: both('Applies', 'Van toepassing') } },
      { id: 'no-end', title: both('It does not', 'Het is niet zo'), description: both('The other end.', 'Het andere einde.'), metadata, terminal: { label: both('Does not apply', 'Niet van toepassing') } },
    ],
  }
}

/** The folder of the Tree `whole()` after `change`, named `id`, with its one picture. */
async function folderOf(id: string, change: (tree: Record<string, any>) => void): Promise<string> {
  const dir = path.join(work, id)
  await mkdir(path.join(dir, 'images'), { recursive: true })
  await copyFile(path.join(invalid, 'v-answers', 'images', 'pic.png'), path.join(dir, 'images', 'pic.png'))
  const tree = whole()
  change(tree)
  await writeFile(path.join(dir, 'tree.json'), `${JSON.stringify(tree, null, 2)}\n`)
  return dir
}

/** The rule ids the format's own reading refuses `dir` for (tree-format.md 7): the file is not valid. */
async function refusedFor(dir: string): Promise<string[]> {
  try {
    await openTree(dir)
  } catch (error) {
    if (error instanceof TreeInvalid) return error.violations.map((violation) => `${violation.rule} ${violation.message}`)
    throw error
  }
  return []
}

/** The markup of the public page at `url` in `lang`, as the route draws it. */
async function page(tree: Tree, url: string, lang: string): Promise<string> {
  const address = parseUrl(url, lang, tree)!
  expect(address, url).not.toBeNull()
  const read = (await loadPage(tree, address))!
  return renderToStaticMarkup(<TreeView page={read} tree={tree} />)
}

/** Every page, record and list of `tree` in every language it declares: drawn without an error, with nothing logged. */
async function drawsWhole(tree: Tree): Promise<void> {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  for (const lang of tree.manifest.languages) {
    for (const id of tree.nodeIds()) {
      await page(tree, `/${tree.id}/${id}`, lang)
      const graph = await pageGraph(tree, (await tree.getNode(id))!, lang, BASE)
      expect(JSON.stringify(graph)).not.toContain('undefined')
    }
    renderToStaticMarkup(<Tile tree={tree} lang={lang} />)
    renderToStaticMarkup(<Logo treeId={tree.id} theme={tree.manifest.theme} title={tree.manifest.title} lang={lang} />)
  }
  sitemapXml([tree], BASE)
  llmsTxt([{ tree, rootDescription: '' }], BASE)
  expect(warn).not.toHaveBeenCalled()
  warn.mockRestore()
}

/** The Tree of `whole()` after `change`, served, whole-drawn, and refused by the format for `rule`. */
async function served(id: string, rule: string, change: (tree: Record<string, any>) => void): Promise<Tree> {
  const dir = await folderOf(id, change)
  expect((await refusedFor(dir)).join('\n'), `${id} is not a valid file`).toContain(rule)
  const tree = await openTree(dir, { served: true })
  await drawsWhole(tree)
  return tree
}

const start = (tree: Record<string, any>): Record<string, any> => tree.nodes[0]

describe('V-L10N: a text the Tree lacks in the language on screen is read in the first that has it, marked with it', () => {
  test('each text of a step, on the Dutch page, in English with lang="en"; the English page carries no mark', async () => {
    const tree = await served('one-language', 'must NOT have fewer than 1 characters', (raw) => {
      const node = start(raw)
      node.title.nl = ''
      node.description.nl = ''
      node.sources[0].label.nl = ''
      node.images[0].description.nl = ''
      node.answers[0].label.nl = ''
      node.options[0].title.nl = ''
      node.explainers[0].term.nl = ''
      node.explainers[0].text.nl = ''
      raw.nodes[2].terminal.label.nl = ''
    })
    const nl = await page(tree, '/one-language/start', 'nl')
    expect(nl).toContain('<h1 id="node-title" lang="en">Does it apply?</h1>')
    expect(nl).toMatch(/<div class="prose" lang="en"[^>]*>/)
    expect(nl).toContain('<b lang="en">System</b> <span lang="en">A machine.</span>')
    expect(nl).toMatch(/<a href="https:\/\/example\.org\/article-1"[^>]* lang="en">Article 1<\/a>/)
    expect(nl).toMatch(/<img id="main-image-picture"[^>]* alt="A picture" lang="en"/)
    expect(nl).toContain('<span class="option-title"><span lang="en">What does it mean?</span></span>')
    expect(nl).toMatch(/aria-label="Yes: Het is van toepassing"><span class="branch-label"><span class="branch-title"><span lang="en">Yes<\/span>/)
    // The second next step has its Dutch words: no mark.
    expect(nl).toContain('<span class="branch-title">Nee</span>')
    expect(await page(tree, '/one-language/start/yes-end', 'nl')).toContain('<p class="outcome" lang="en">Applies</p>')
    expect(nl).not.toContain('[Tekst ontbreekt in deze taal]')

    const en = await page(tree, '/one-language/start', 'en')
    expect(en).toContain('<h1 id="node-title">Does it apply?</h1>')
    expect(en).not.toContain('lang="nl"')
    // The record of the Dutch page says what the page shows.
    const record = JSON.stringify(await pageGraph(tree, (await tree.getNode('start'))!, 'nl', BASE))
    expect(record).toContain('"name":"Does it apply?"')
    expect(record).toContain('"text":"Yes: Het is van toepassing"')
  })

  test('a text no language has is not drawn: no heading, no box, no badge, no button without words; alt and credit empty, never invented', async () => {
    const empty = both('', '')
    const tree = await served('no-language', 'must NOT have fewer than 1 characters', (raw) => {
      const node = start(raw)
      node.title = { ...empty }
      node.description = { ...empty }
      node.sources[0].label = { ...empty }
      node.images[0].description = { ...empty }
      node.images[0].credit = ''
      node.answers[0].label = { ...empty }
      node.options[0].title = { ...empty }
      raw.nodes[2].terminal.label = { ...empty }
    })
    const html = await page(tree, '/no-language/start', 'en')
    expect(html).not.toContain('<h1')
    expect(html).not.toContain('node-title')
    expect(html).not.toContain('class="prose"')
    expect(html).not.toContain('class="sources"')
    expect(html).not.toContain('class="options"')
    expect(html).toMatch(/<img id="main-image-picture"[^>]* alt=""/)
    expect(html).not.toContain('class="credit"')
    // One next step left, of the two: the row counts what it draws.
    expect(html).toContain('class="answers answers--1"')
    expect(html.match(/class="branch answer answer--next"/g)).toHaveLength(1)
    expect(html).toContain('aria-label="No: It does not"')
    const end = await page(tree, '/no-language/start/yes-end', 'en')
    expect(end).not.toContain('class="outcome"')
    expect(end).toContain('<h1 id="node-title">It applies</h1>')
    // The record lists the next step the page draws, and no description.
    const record = JSON.stringify(await pageGraph(tree, (await tree.getNode('start'))!, 'en', BASE))
    expect(record).toContain('"text":"No: It does not"')
    expect(record).not.toContain('"text":": ')
  })

  test('a step none of whose next steps has words shows startAgain, as a step that has none', async () => {
    const tree = await served('no-words', 'must NOT have fewer than 1 characters', (raw) => {
      for (const answer of start(raw).answers) answer.label = both('', '')
    })
    const html = await page(tree, '/no-words/start', 'en')
    expect(html).not.toContain('answer--next')
    expect(html).toContain('answer--start-again')
    expect(JSON.stringify(await pageGraph(tree, (await tree.getNode('start'))!, 'en', BASE))).not.toContain('Question')
  })

  test('V-TITLE: a Tree no language titles yet is named by its id where a name must stand, and the bar invents none', async () => {
    const tree = await served('untitled', 'must NOT have fewer than 1 characters', (raw) => {
      raw.title = both('', '')
    })
    expect(renderToStaticMarkup(<Tile tree={tree} lang="en" />)).toContain('<span class="tile-title" data-clamp="">untitled</span>')
    expect(renderToStaticMarkup(<Logo treeId="untitled" theme={undefined} title={tree.manifest.title} lang="en" />)).toBe('<span class="tree-title" data-clamp="" title=""></span>')
    expect(JSON.stringify(await pageGraph(tree, (await tree.getNode('start'))!, 'en', BASE))).toContain('"@type":"Dataset","@id":"https://example.org/untitled#dataset","name":"untitled"')
    expect(llmsTxt([{ tree, rootDescription: '' }], BASE)).toContain('- [untitled](https://example.org/untitled/start)')
  })

  test('a title written in one language: the tile on the other language\'s overview shows it, marked', async () => {
    const tree = await served('half-titled', 'must NOT have fewer than 1 characters', (raw) => {
      raw.title.nl = ''
    })
    expect(renderToStaticMarkup(<Tile tree={tree} lang="nl" />)).toContain('<span class="tile-title" data-clamp="" lang="en">A small Tree</span>')
    expect(renderToStaticMarkup(<Tile tree={tree} lang="en" />)).toContain('<span class="tile-title" data-clamp="">A small Tree</span>')
  })
})

describe('the structure rules: the page draws what is there', () => {
  test('V-ANSWERS: one next step is one button, and a next step not yet finished is the centre of its own page with the way back and startAgain', async () => {
    const tree = await served('one-step', 'must NOT have fewer than 2 items', (raw) => {
      start(raw).answers = [{ label: both('Go on', 'Verder'), target: 'fresh' }]
      raw.nodes.push({ id: 'fresh', title: both('A fresh step', 'Een nieuwe stap'), description: both('Not finished.', 'Niet af.'), metadata: { version: '1' } })
    })
    const html = await page(tree, '/one-step/start', 'en')
    expect(html).toContain('class="answers answers--1"')
    expect(html).toContain('aria-label="Go on: A fresh step"')
    const fresh = await page(tree, '/one-step/start/fresh', 'en')
    // The centre, not an Overlay over the step before: its own Bubble, the up arrow, startAgain.
    expect(fresh).toMatch(/^.*<article class="bubble bubble--explanation" lang="en" data-node="fresh">/s)
    expect(fresh.indexOf('data-node="fresh"')).toBeLessThan(fresh.indexOf('data-node="start"') === -1 ? Infinity : fresh.indexOf('data-node="start"'))
    expect(fresh).toContain('class="up-arrow"')
    expect(fresh).toContain('answer--start-again')
    expect(fresh).not.toContain('overlay--unbuttoned')
  })

  test('V-OPTIONS: an Option to a step that is not an explanation Node opens that step\'s text, and its heading leads to the step', async () => {
    const tree = await served('option-to-end', 'V-OPTIONS', (raw) => {
      start(raw).options = [{ title: both('See the end', 'Zie het einde'), target: 'no-end' }]
      start(raw).answers = [{ label: both('Yes', 'Ja'), target: 'yes-end' }, { label: both('Maybe', 'Misschien'), target: 'detail' }]
    })
    const html = await page(tree, '/option-to-end/start', 'en')
    expect(html).toContain('<div class="overlay-interior" lang="en" data-node="no-end">')
    expect(html).toContain('<a href="/option-to-end/start/no-end">It does not</a>')
    expect(await page(tree, '/option-to-end/start/no-end', 'en')).toContain('<article class="bubble bubble--terminal" lang="en" data-node="no-end">')
  })

  test('V-ROOT: a first step with no next step and no end is drawn with startAgain', async () => {
    const tree = await served('bare-root', 'V-ROOT', (raw) => {
      delete start(raw).answers
      raw.nodes = [start(raw), raw.nodes[1]]
    })
    const html = await page(tree, '/bare-root/start', 'en')
    expect(html).toContain('<article class="bubble bubble--explanation" lang="en" data-node="start">')
    expect(html).toContain('answer--start-again')
  })
})

describe('the fixtures of tree-format.md 7, one advisory rule each, served as they are', () => {
  /** The fixture `name` of tests/fixtures/invalid, served: refused by the format for `rule`, drawn whole. */
  async function fixture(name: string, rule: string): Promise<Tree> {
    const dir = path.join(invalid, name)
    expect((await refusedFor(dir)).join('\n')).toContain(rule)
    const tree = await openTree(dir, { served: true })
    await drawsWhole(tree)
    return tree
  }

  test('V-ANSWERS with one entry: its one button', async () => {
    const tree = await fixture('v-answers', 'must NOT have fewer than 2 items')
    expect(await page(tree, '/v-answers/start', 'en')).toContain('class="answers answers--1"')
  })

  test('V-NODE: a step without a title or a description yet draws neither', async () => {
    const tree = await fixture('v-node', "must have required property")
    const raw = JSON.parse(await readFile(path.join(invalid, 'v-node', 'tree.json'), 'utf8')) as { nodes: Array<Record<string, unknown>> }
    const bare = raw.nodes.find((node) => !('title' in node) || !('description' in node))!
    const html = await page(tree, `/v-node/${String(bare.id)}`, 'en')
    expect(html.includes('<h1')).toBe('title' in bare)
    expect(html.includes('class="prose"')).toBe('description' in bare)
  })

  test('V-ORPHAN and V-REACH: an unreachable step is at its own address and in the sitemap, as every step the dataset holds', async () => {
    for (const [name, rule, id] of [['v-orphan', 'V-ORPHAN', 'lonely'], ['v-reach', 'V-REACH', 'stray']] as const) {
      const tree = await fixture(name, rule)
      expect(await page(tree, `/${name}/${id}`, 'en')).toContain(`data-node="${id}"`)
      expect(sitemapXml([tree], BASE)).toContain(`<loc>https://example.org/${name}/${id}</loc>`)
    }
  })

  test('V-LENGTH, V-LINES and V-COUNT: the text and the list are drawn whole, nothing cut', async () => {
    for (const [name, rule] of [['v-length', 'V-LENGTH'], ['v-lines', 'V-LINES'], ['v-count', 'V-COUNT']] as const) {
      const tree = await fixture(name, rule)
      const raw = JSON.parse(await readFile(path.join(invalid, name, 'tree.json'), 'utf8')) as { nodes: Array<{ id: string; title: { en: string }; sources?: unknown[]; options?: unknown[] }> }
      for (const node of raw.nodes) {
        const html = await page(tree, `/${name}/${node.id}`, 'en')
        expect(html, `${name} ${node.id}`).toContain(`>${node.title.en.replace(/&/g, '&amp;').replace(/'/g, '&#x27;')}</h1>`)
        expect((html.match(/<section class="sources"[\s\S]*?<\/section>/)?.[0].match(/<li>/g) ?? []).length).toBe(node.sources?.length ?? 0)
      }
    }
  })

  test('V-EXPLAINER: an explainer no description marks shows nothing; V-MARK: a mark to a removed explainer is its words alone', async () => {
    const unmarked = await fixture('v-explainer', 'V-EXPLAINER')
    // The fixture marks its term in English and not in Dutch: the Dutch page has no term and no panel.
    expect(await page(unmarked, '/v-explainer/start', 'en')).toContain('class="term"')
    const dutch = await page(unmarked, '/v-explainer/start', 'nl')
    expect(dutch).toContain('Bent u een aanbieder?')
    expect(dutch).not.toContain('class="term"')
    expect(dutch).not.toContain('Wie een AI-systeem onder eigen naam in de handel brengt.')
    const marked = await fixture('v-mark', 'V-MARK')
    const html = await page(marked, '/v-mark/start', 'en')
    expect(html).not.toContain('](#')
  })
})
