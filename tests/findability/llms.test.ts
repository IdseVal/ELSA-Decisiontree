/**
 * `llms.txt` (docs/specs/application.md 16.5, ADR-118-llms-txt): the sections it carries,
 * in the order the convention gives, and the two things it must never become -- a second
 * copy of the Tree's content, and a document of relative URLs read away from its site.
 *
 * The Trees come from the loader, as section 7 requires; nothing here parses a Tree file.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, test } from 'vitest'
import { text } from '../../src/chrome.ts'
import { CONTENT_HOLDER, llmsTxt } from '../../src/findability/llms.ts'
import { openTree, type Tree } from '../../src/tree/loader.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(here, '..', '..')
const base = new URL('https://elsa.example.org')

let example: Tree
let dutch: Tree
let noManifestDescription: Tree

/** The document for `tree`, with the root Node's description handed in as the route does. */
async function generate(tree: Tree, at: URL = base): Promise<string> {
  const lang = tree.manifest.defaultLanguage
  const node = (await tree.getNode(tree.manifest.root))!
  return llmsTxt(tree, at, text(node.description, lang, 'root.description'))
}

beforeAll(async () => {
  example = await openTree(path.join(root, 'trees', 'ai-act-example'))
  dutch = await openTree(path.join(here, '..', 'fixtures', 'single-language'))
  noManifestDescription = await openTree(path.join(here, '..', 'fixtures', 'findability'))
})

describe('the shape the convention gives', () => {
  test('the H1 is the manifest title in the default language, and is the first line', async () => {
    const file = await generate(example)

    expect(file.split('\n')[0]).toBe(`# ${example.manifest.title.en}`)
    // The one element the convention requires, and exactly one of it.
    expect(file.match(/^# /gm)).toHaveLength(1)
  })

  test('the blockquote is the manifest description, reduced to plain text', async () => {
    const file = await generate(example)
    const quotes = file.match(/^> .*$/gm)!

    expect(quotes).toHaveLength(1)
    // The description holds a line break and a `code` span; neither survives into a line
    // that has to be one line (16.3 steps 1 and 2, no cut).
    expect(quotes[0]).toBe(
      '> A small example Tree that exercises every element of the `elsa-tree/4` format. Its legal content is simplified and not to be relied on.',
    )
    expect(quotes[0]).not.toContain('\n')
  })

  test('the blockquote falls back to the root Node when the manifest carries no description', async () => {
    // The manifest's `description` is optional in the format; a headless llms.txt would
    // say nothing at all, so the root Node's -- which is required -- answers (16.5).
    expect(noManifestDescription.manifest.description).toBeUndefined()
    const rootNode = (await noManifestDescription.getNode(noManifestDescription.manifest.root))!
    const file = await generate(noManifestDescription)

    expect(file).toContain('> The first question, and the one the Dataset record describes')
    // Reduced, not raw: the explainer mark in that description is gone.
    expect(file).not.toContain('(#dataset)')
    expect(rootNode.description.en).toContain('(#dataset)')
  })

  test('the four sections appear once each, in the order 16.5 gives', async () => {
    const file = await generate(example)

    expect(file.match(/^## .*$/gm)).toEqual([
      '## The dataset',
      '## Walking the Tree',
      '## Languages',
      '## Licence',
    ])
  })

  test('the free-form paragraph stands between the blockquote and the first heading', async () => {
    const file = await generate(example)
    const between = file.slice(file.indexOf('\n>'), file.indexOf('## The dataset'))

    expect(between).toContain('interactive legal decision tree')
    expect(between).toContain('Every step is a page of its own with a real URL')
    expect(between).toContain('one JSON file')
    // The same disclaimer every page carries permanently (core document 8), not a second
    // wording of it: a file that softened it would be the copy a reader trusted.
    expect(between).toContain('This is not legal advice.')
  })

  test('a Dutch-default Tree gets its H1, its blockquote and its disclaimer in Dutch', async () => {
    const file = await generate(dutch)

    expect(file.split('\n')[0]).toBe(`# ${dutch.manifest.title.nl}`)
    expect(file).toContain('Dit is geen juridisch advies.')
  })
})

describe('what the file points at', () => {
  test('the dataset section names the Tree file and the schema, absolutely', async () => {
    const file = await generate(example)

    expect(file).toContain('- [The Tree file](https://elsa.example.org/ai-act-example/tree.json):')
    expect(file).toContain('- [The JSON Schema](https://elsa.example.org/schemas/elsa-tree-4.json):')
  })

  test('walking the Tree gives the root URL, the sitemap and the URL grammar', async () => {
    const file = await generate(example)

    expect(file).toContain('- [The first step](https://elsa.example.org/ai-act-example/start):')
    expect(file).toContain('- [Sitemap](https://elsa.example.org/sitemap.xml):')
    // The grammar, not a list of addresses: an agent reaches any step without guessing and
    // the file does not grow with the Tree (16.5).
    expect(file).toContain('The address of one step is `/ai-act-example/<step-id>`')
    expect(file).toContain('`?lang=<tag>` chooses the')
  })

  test('every URL in the document is absolute, at the base the route was given', async () => {
    const file = await generate(example)
    const targets = [...file.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]!)

    expect(targets.length).toBeGreaterThanOrEqual(4)
    for (const target of targets) expect(() => new URL(target), target).not.toThrow()
    for (const target of targets) expect(target, target).not.toMatch(/^\//)
  })

  test("a deployment that names no base URL advertises the request's own origin", async () => {
    // What `baseUrl()` hands in when ELSA_BASE_URL is unset (16).
    const file = await generate(example, new URL('http://127.0.0.1:3117'))

    expect(file).toContain('- [The Tree file](http://127.0.0.1:3117/ai-act-example/tree.json):')
    expect(file).not.toContain('elsa.example.org')
  })

  test('there is no llms-full.txt, and the file names none', async () => {
    // The complete content of this site in one document already exists and is named in the
    // first section; a second rendering would be the copy that drifts (16.5).
    const file = await generate(example)

    expect(file).not.toContain('llms-full')
    const routes = path.join(root, 'src', 'app', '[lang]')
    await expect(readFile(path.join(routes, 'llms-full.txt', 'route.ts'))).rejects.toThrow()
  })
})

describe('the languages and the licences', () => {
  test('every declared language is listed, and the default is marked', async () => {
    const file = await generate(example)
    const section = file.slice(file.indexOf('## Languages'), file.indexOf('## Licence'))

    expect(section).toContain('- `en` (default)')
    expect(section).toContain('- `nl`')
    expect(section).not.toContain('- `nl` (default)')
  })

  test('a single-language Tree lists its one language as the default', async () => {
    const file = await generate(dutch)
    const section = file.slice(file.indexOf('## Languages'), file.indexOf('## Licence'))

    expect(section.match(/^- /gm)).toEqual(['- '])
    expect(section).toContain('- `nl` (default)')
  })

  test('both licences are named, with their URLs, and stated to differ', async () => {
    const file = await generate(example)
    const section = file.slice(file.indexOf('## Licence'))

    expect(section).toContain('[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)')
    expect(section).toContain('[MIT](https://opensource.org/license/mit)')
    expect(section).toMatch(/Tree content and code are licensed separately/)
  })

  test('the holder line is the one CONTENT-LICENSE carries', async () => {
    // Not parsed at run time -- reading a licence text at startup to find a name fails
    // silently on the one day it matters -- but a constant this test compares, so the day
    // the line changes fails loudly (ADR-118-json-ld decision 3).
    const licence = await readFile(path.join(root, 'CONTENT-LICENSE'), 'utf8')
    const holder = licence.match(/^Copyright \(c\) \d{4} (.+)$/m)

    expect(holder?.[1]).toBe(CONTENT_HOLDER)
    expect(await generate(example)).toContain(`(c) ${CONTENT_HOLDER}`)
  })
})

/**
 * The rule that keeps this file a signpost. `llms.txt` carries the manifest's title and
 * description and nothing else of the Tree: Node titles, descriptions and Sources are in
 * the pages, in the sitemap and in the dataset, and a fourth copy is the one that goes
 * stale (16.5, ADR-118-llms-txt decision 5).
 */
describe('no Tree content beyond the manifest leaks in', () => {
  test('no Node title, description or Source appears anywhere in it', async () => {
    const file = await generate(example)

    for (const id of example.nodeIds()) {
      const node = (await example.getNode(id))!
      for (const lang of example.manifest.languages) {
        expect(file, `${id}.title.${lang}`).not.toContain(node.title[lang])
        expect(file, `${id}.description.${lang}`).not.toContain(node.description[lang])
        for (const source of node.sources) {
          expect(file, `${id}.sources.${lang}`).not.toContain(source.label[lang])
          expect(file, `${id}.sources.url`).not.toContain(source.url)
        }
      }
    }
  })

  test('no Node id but the root appears, and the root only inside its URL', async () => {
    // The root's id is in the address of the first step, which is the point of the entry;
    // every other id would be a list of addresses, which 16.5 refuses.
    const file = await generate(example)
    const withoutRootUrl = file.replaceAll(`/ai-act-example/${example.manifest.root}`, '')

    for (const id of example.nodeIds()) {
      expect(withoutRootUrl, id).not.toContain(`/${id}`)
    }
  })

  test('the file does not grow with the Tree', async () => {
    // Two Trees of very different sizes; the difference is the manifest's own text and the
    // language list, never a line per Node.
    const small = await generate(dutch)
    const large = await generate(example)

    expect(example.nodeIds().length).toBeGreaterThan(dutch.nodeIds().length)
    expect(Math.abs(large.split('\n').length - small.split('\n').length)).toBeLessThanOrEqual(2)
  })
})
