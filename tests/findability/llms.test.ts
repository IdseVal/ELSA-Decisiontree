/**
 * `llms.txt` (docs/specs/application.md 16.5, 23.5, ADR-118-llms-txt): the sections it
 * carries, in the order the convention gives, and the two things it must never become -- a
 * second copy of a Tree's content, and a document of relative URLs read away from its
 * site. **[#134]** It is the deployment's: its H1 and blockquote are chrome, every served
 * Tree is one line where a section names a Tree, and a hidden Tree appears nowhere.
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
import { HIDDEN_ID, servedWithHiddenTree } from './hidden-tree.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(here, '..', '..')
const base = new URL('https://elsa.example.org')

let example: Tree
let dutch: Tree
let noManifestDescription: Tree

/** The document for `trees`, each root Node's description handed in as the route does. */
async function generate(trees: Tree[], at: URL = base): Promise<string> {
  const entries = await Promise.all(
    trees.map(async (tree) => {
      const lang = tree.manifest.defaultLanguage
      const node = (await tree.getNode(tree.manifest.root))!
      return { tree, rootDescription: text(node.description, lang, 'root.description') }
    }),
  )
  return llmsTxt(entries, at)
}

/** The lines of one `## ` section, the heading excluded. */
function section(file: string, heading: string): string[] {
  const start = file.indexOf(`## ${heading}\n`)
  const end = file.indexOf('\n## ', start + 1)
  return file
    .slice(start, end < 0 ? undefined : end)
    .split('\n')
    .slice(1)
    .filter((line) => line !== '')
}

beforeAll(async () => {
  example = await openTree(path.join(root, 'trees', 'ai-act-example'))
  dutch = await openTree(path.join(here, '..', 'fixtures', 'single-language'))
  noManifestDescription = await openTree(path.join(here, '..', 'fixtures', 'findability'))
})

describe('the shape the convention gives', () => {
  test("the H1 is the deployment's name, a chrome string, and is the first line", async () => {
    const file = await generate([example, dutch])

    expect(file.split('\n')[0]).toBe('# ELSA decision trees')
    // The one element the convention requires, and exactly one of it.
    expect(file.match(/^# /gm)).toHaveLength(1)
  })

  test('the blockquote is one chrome sentence saying what this site is', async () => {
    const quotes = (await generate([example])).match(/^> .*$/gm)!

    expect(quotes).toEqual([
      '> Interactive legal decision trees: answer one question at a time and arrive at an outcome, with the legal sources of every step.',
    ])
  })

  test('the five sections appear once each, in the order 23.5 gives', async () => {
    const file = await generate([example, dutch])

    expect(file.match(/^## .*$/gm)).toEqual([
      '## The Trees',
      '## The datasets',
      '## Walking a Tree',
      '## Languages',
      '## Licence',
    ])
  })

  test('the free-form paragraph stands between the blockquote and the first heading', async () => {
    const file = await generate([example])
    const between = file.slice(file.indexOf('\n>'), file.indexOf('## The Trees'))

    expect(between).toContain('interactive legal decision trees')
    expect(between).toContain('Every step is a page of its own with a real URL')
    expect(between).toContain('each tree is one JSON file')
    // The same disclaimer every page carries permanently (core document 8), not a second
    // wording of it: a file that softened it would be the copy a reader trusted.
    expect(between).toContain('This is not legal advice.')
  })
})

describe('the Trees', () => {
  test('one entry per served Tree, in the order given: its title and description in its default language', async () => {
    const lines = section(await generate([example, dutch]), 'The Trees')

    expect(lines).toEqual([
      `- [${example.manifest.title.en}](https://elsa.example.org/ai-act-example/start): A small example Tree that exercises every element of the \`elsa-tree/4\` format. Its legal content is simplified and not to be relied on.`,
      `- [${dutch.manifest.title.nl}](https://elsa.example.org/single-language/${dutch.manifest.root}): ${lines[1]!.split('): ')[1]}`,
    ])
    // A Dutch-default Tree is listed in Dutch: its own language, not the chrome's.
    expect(lines[1]).toContain(dutch.manifest.title.nl)
  })

  test("a Tree's entry falls back to the root Node when the manifest carries no description", async () => {
    // The manifest's `description` is optional in the format; the root Node's is required.
    expect(noManifestDescription.manifest.description).toBeUndefined()
    const rootNode = (await noManifestDescription.getNode(noManifestDescription.manifest.root))!
    const file = await generate([noManifestDescription])

    expect(section(file, 'The Trees')[0]).toContain('The first question, and the one the Dataset record describes')
    // Reduced, not raw: the explainer mark in that description is gone.
    expect(file).not.toContain('(#dataset)')
    expect(rootNode.description.en).toContain('(#dataset)')
  })

  test('a hidden Tree of the store appears nowhere in it', async () => {
    const { trees, remove } = await servedWithHiddenTree()
    try {
      const file = await generate(trees)

      expect(section(file, 'The Trees')).toHaveLength(1)
      expect(file).not.toContain(HIDDEN_ID)
    } finally {
      await remove()
    }
  })

  test('no Tree at all is still a document: the chrome, with empty lists', async () => {
    const file = await generate([])

    expect(file.split('\n')[0]).toBe('# ELSA decision trees')
    expect(section(file, 'The Trees')).toEqual([])
  })
})

describe('what the file points at', () => {
  test('the datasets section names every Tree file and the one schema, absolutely', async () => {
    const lines = section(await generate([example, dutch]), 'The datasets')

    expect(lines).toHaveLength(3)
    expect(lines[0]).toContain(`- [${example.manifest.title.en}: the Tree file](https://elsa.example.org/ai-act-example/tree.json):`)
    expect(lines[1]).toContain('(https://elsa.example.org/single-language/tree.json):')
    expect(lines[2]).toContain('- [The JSON Schema](https://elsa.example.org/schemas/elsa-tree-4.json):')
  })

  test('walking a Tree gives the overview, the sitemap and the URL grammar', async () => {
    const file = await generate([example])

    expect(file).toContain('- [The overview](https://elsa.example.org/):')
    expect(file).toContain('- [Sitemap](https://elsa.example.org/sitemap.xml):')
    // The grammar, not a list of addresses: an agent reaches any step without guessing and
    // the file does not grow with the Trees (16.5).
    expect(file).toContain('The address of one step is `/<tree-id>/<step-id>`')
    expect(file).toContain('`?lang=<tag>` chooses the')
  })

  test('every URL in the document is absolute, at the base the route was given', async () => {
    const file = await generate([example, dutch])
    const targets = [...file.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]!)

    expect(targets.length).toBeGreaterThanOrEqual(7)
    for (const target of targets) expect(() => new URL(target), target).not.toThrow()
    for (const target of targets) expect(target, target).not.toMatch(/^\//)
  })

  test("a deployment that names no base URL advertises the request's own origin", async () => {
    // What `baseUrl()` hands in when ELSA_BASE_URL is unset (16).
    const file = await generate([example], new URL('http://127.0.0.1:3117'))

    expect(file).toContain('(http://127.0.0.1:3117/ai-act-example/tree.json):')
    expect(file).not.toContain('elsa.example.org')
  })

  test('there is no llms-full.txt, and the file names none', async () => {
    // The complete content of each Tree in one document already exists and is named in
    // the datasets section; a second rendering would be the copy that drifts (16.5).
    const file = await generate([example])

    expect(file).not.toContain('llms-full')
    const routes = path.join(root, 'src', 'app', '[lang]')
    await expect(readFile(path.join(routes, 'llms-full.txt', 'route.ts'))).rejects.toThrow()
  })
})

describe('the languages and the licences', () => {
  test("every Tree's declared languages are listed on its line, the default marked", async () => {
    const lines = section(await generate([example, dutch]), 'Languages')

    expect(lines).toEqual(['- `ai-act-example`: `en` (default), `nl`', '- `single-language`: `nl` (default)'])
  })

  test('both licences are named, with their URLs, and stated to differ', async () => {
    const file = await generate([example])
    const licence = file.slice(file.indexOf('## Licence'))

    expect(licence).toContain('[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)')
    expect(licence).toContain('[MIT](https://opensource.org/license/mit)')
    expect(licence).toMatch(/Tree content and code are licensed separately/)
  })

  test('the holder line is the one CONTENT-LICENSE carries', async () => {
    // Not parsed at run time -- reading a licence text at startup to find a name fails
    // silently on the one day it matters -- but a constant this test compares, so the day
    // the line changes fails loudly (ADR-118-json-ld decision 3).
    const licence = await readFile(path.join(root, 'CONTENT-LICENSE'), 'utf8')
    const holder = licence.match(/^Copyright \(c\) \d{4} (.+)$/m)

    expect(holder?.[1]).toBe(CONTENT_HOLDER)
    expect(await generate([example])).toContain(`(c) ${CONTENT_HOLDER}`)
  })
})

/**
 * The rule that keeps this file a signpost. `llms.txt` carries each manifest's title and
 * description and nothing else of a Tree: Node titles, descriptions and Sources are in the
 * pages, in the sitemap and in the dataset, and a fourth copy is the one that goes stale
 * (16.5, ADR-118-llms-txt decision 5).
 */
describe('no Tree content beyond the manifest leaks in', () => {
  test('no Node title, description or Source appears anywhere in it', async () => {
    const file = await generate([example])

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
    // The root's id is in the address where the walk begins, which is the point of the
    // entry; every other id would be a list of addresses, which 16.5 refuses.
    const file = await generate([example])
    const withoutRootUrl = file.replaceAll(`/ai-act-example/${example.manifest.root}`, '')

    for (const id of example.nodeIds()) {
      expect(withoutRootUrl, id).not.toContain(`/${id}`)
    }
  })

  test('the file grows by a line per Tree per section, never by a line per Node', async () => {
    const small = await generate([dutch])
    const large = await generate([example])

    expect(example.nodeIds().length).toBeGreaterThan(dutch.nodeIds().length)
    expect(large.split('\n').length).toBe(small.split('\n').length)
  })
})
