/**
 * The JSON-LD `@graph` of docs/specs/application.md 16.4 (ADR-118-json-ld): the `Dataset`
 * on the root Node's page alone, a `WebPage` on every page, a `Question` where the Node
 * asks one, and nothing on a Terminal or an explanation Node but the `WebPage`.
 *
 * **And the escaping**, which is 13.3's rule at a second sink. A test that parsed the
 * script back and compared the object would pass whether or not a single character had
 * been escaped -- the tautology this freeze removed -- so the assertions below are made on
 * the emitted **text** as well: that it holds no `<` at all, that it parses, and that what
 * it parses to is the title the Tree wrote.
 *
 * That a browser's HTML parser closes the element where the server put it is
 * `tests/browser/findability.spec.ts`; this file cannot see that.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, test } from 'vitest'
import { CONTENT_LICENCE_URL } from '../../src/assets.ts'
import { chrome } from '../../src/chrome.ts'
import { CONTENT_HOLDER } from '../../src/findability/llms.ts'
import {
  closesTheElement,
  datasetId,
  graphScript,
  mostCitedLegalSource,
  pageGraph,
  type Dataset,
  type Graph,
  type WebPage,
} from '../../src/findability/jsonld.ts'
import { plainDescription } from '../../src/markdown.ts'
import { openTree, type Tree } from '../../src/tree/loader.ts'
import { absolute, addressSet, datasetHref } from '../../src/url.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.join(here, '..', '..')
const base = new URL('https://elsa.example.org')

/** The example Tree: two languages, every legal Source at one URL. */
let tree: Tree
/** The awkward one: no manifest `description`, `</script>` in a title, two legal URLs. */
let awkwardTree: Tree
/** One language, no Source at all: the Tree `isBasedOn` has nothing to say about. */
let sourcelessTree: Tree

beforeAll(async () => {
  tree = await openTree(path.join(repo, 'trees', 'ai-act-example'))
  awkwardTree = await openTree(path.join(here, '..', 'fixtures', 'findability'))
  sourcelessTree = await openTree(path.join(here, '..', 'fixtures', 'german-only'))
})

/** The graph of the page that shows `nodeId` in `lang`. */
async function graphOf(of: Tree, nodeId: string, lang: string): Promise<Graph> {
  const node = await of.getNode(nodeId)
  if (!node) throw new Error(`${nodeId} is not a Node of ${of.id}`)
  return pageGraph(of, node, lang, base)
}

/** The one `Dataset` of a graph, or null where the page carries none. */
function datasetOf(graph: Graph): Dataset | null {
  return (graph['@graph'].find((entry) => entry['@type'] === 'Dataset') as Dataset | undefined) ?? null
}

/** The one `WebPage` of a graph. Every page has exactly one. */
function webPageOf(graph: Graph): WebPage {
  const pages = graph['@graph'].filter((entry): entry is WebPage => entry['@type'] === 'WebPage')
  expect(pages).toHaveLength(1)
  return pages[0]!
}

/** The canonical URL of `nodeId` in `lang`: the string the page head and the sitemap carry. */
function canonical(of: Tree, nodeId: string, lang: string): string {
  return addressSet(of, nodeId, base).addresses.find((entry) => entry.lang === lang)!.url
}

describe('the shape of the graph', () => {
  test('every page carries one @context and one @graph', async () => {
    for (const id of tree.nodeIds()) {
      const graph = await graphOf(tree, id, 'en')

      expect(graph['@context'], id).toBe('https://schema.org')
      expect(Array.isArray(graph['@graph']), id).toBe(true)
    }
  })

  test('the Dataset is on the root Node page only, and every other page refers to it by @id', async () => {
    for (const lang of tree.manifest.languages) {
      for (const id of tree.nodeIds()) {
        const graph = await graphOf(tree, id, lang)
        const page = webPageOf(graph)

        expect(datasetOf(graph) === null, `${id}.${lang}`).toBe(id !== tree.manifest.root)
        // The reference is there whether or not the record is: that is what makes the 14
        // pages of this Tree one dataset and not 14.
        expect(page.isPartOf, `${id}.${lang}`).toEqual({ '@id': datasetId(tree, base) })
      }
    }
  })

  test('the @id of the Dataset does not change with the language, and carries no ?lang', async () => {
    const english = datasetOf(await graphOf(tree, 'start', 'en'))!
    const dutch = datasetOf(await graphOf(tree, 'start', 'nl'))!

    expect(dutch['@id']).toBe(english['@id'])
    expect(english['@id']).toBe('https://elsa.example.org/ai-act-example#dataset')
    expect(english['@id']).not.toContain('lang=')
    // The pages themselves are one per language, which is why `url` differs where `@id` does not.
    expect(dutch.url).not.toBe(english.url)
  })

  test('nothing anywhere claims QAPage, FAQPage or an accepted answer', async () => {
    for (const of of [tree, awkwardTree, sourcelessTree]) {
      for (const lang of of.manifest.languages) {
        for (const id of of.nodeIds()) {
          const text = JSON.stringify(await graphOf(of, id, lang))

          expect(text, `${of.id}/${id}.${lang}`).not.toContain('QAPage')
          expect(text, `${of.id}/${id}.${lang}`).not.toContain('FAQPage')
          expect(text, `${of.id}/${id}.${lang}`).not.toContain('acceptedAnswer')
        }
      }
    }
  })
})

describe('the Dataset', () => {
  test('it carries every field of the 16.4 table, with the values that table gives', async () => {
    const dataset = datasetOf(await graphOf(tree, 'start', 'en'))!

    expect(dataset).toEqual({
      '@type': 'Dataset',
      '@id': 'https://elsa.example.org/ai-act-example#dataset',
      name: tree.manifest.title.en,
      description: plainDescription(tree.manifest.description!.en!).reduced,
      url: canonical(tree, 'start', 'en'),
      license: 'https://creativecommons.org/licenses/by/4.0/',
      creator: { '@type': 'Organization', name: 'Wageningen University & Research' },
      version: '2.0',
      inLanguage: ['en', 'nl'],
      isAccessibleForFree: true,
      distribution: [
        {
          '@type': 'DataDownload',
          contentUrl: 'https://elsa.example.org/ai-act-example/tree.json',
          encodingFormat: 'application/json',
        },
      ],
      isBasedOn: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj',
    })
  })

  test('name and description are present and non-empty: the two fields Google requires', async () => {
    // Named one by one rather than asserted as a shape, so that an edit which drops either
    // fails for the stated reason (issue #122, ADR-118-json-ld).
    for (const of of [tree, awkwardTree, sourcelessTree]) {
      for (const lang of of.manifest.languages) {
        const dataset = datasetOf(await graphOf(of, of.manifest.root, lang))!

        expect(typeof dataset.name, `${of.id}.${lang}`).toBe('string')
        expect(dataset.name.trim(), `${of.id}.${lang}`).not.toBe('')
        expect(typeof dataset.description, `${of.id}.${lang}`).toBe('string')
        expect(dataset.description.trim(), `${of.id}.${lang}`).not.toBe('')
      }
    }
  })

  test('the licence and the download stand beside them: Google\u2019s dataset requirements', async () => {
    for (const of of [tree, awkwardTree, sourcelessTree]) {
      const dataset = datasetOf(await graphOf(of, of.manifest.root, of.manifest.defaultLanguage))!

      expect(dataset.license, of.id).toBe(CONTENT_LICENCE_URL)
      expect(dataset.distribution, of.id).toHaveLength(1)
      expect(dataset.distribution[0]!.contentUrl, of.id).toBe(absolute(datasetHref(of.id), base))
      expect(dataset.distribution[0]!.encodingFormat, of.id).toBe('application/json')
    }
  })

  test('name and description are said in the page\u2019s language', async () => {
    const dutch = datasetOf(await graphOf(tree, 'start', 'nl'))!

    expect(dutch.name).toBe(tree.manifest.title.nl)
    expect(dutch.description).toBe(plainDescription(tree.manifest.description!.nl!).reduced)
    expect(dutch.name).not.toBe(tree.manifest.title.en)
  })

  test('the description is reduced to plain text and never cut', async () => {
    const dataset = datasetOf(await graphOf(tree, 'start', 'en'))!

    // The manifest's description is written over two lines; they are joined by one space.
    expect(tree.manifest.description!.en).toContain('\n')
    expect(dataset.description).not.toContain('\n')
    expect(dataset.description).not.toMatch(/[*]|\]\(/)
    // Never cut: a dataset record's abstract is read by an index, not shown in a listing.
    expect(dataset.description).not.toContain('\u2026')
  })

  test('with no description in the manifest it falls back to the root Node\u2019s', async () => {
    // A required field may not rest on an optional one, and the manifest's is optional.
    expect(awkwardTree.manifest.description).toBeUndefined()
    const root = (await awkwardTree.getNode('start'))!

    for (const lang of awkwardTree.manifest.languages) {
      const dataset = datasetOf(await graphOf(awkwardTree, 'start', lang))!

      expect(dataset.description, lang).toBe(plainDescription(root.description[lang]!).reduced)
      // The explainer mark of that description is gone: this is plain text.
      expect(dataset.description, lang).not.toContain('](#')
    }
  })

  test('the creator is the holder line of CONTENT-LICENSE', async () => {
    // The constant is a constant of the deployment, not a name parsed at run time: reading
    // a licence text at startup to find a name is brittle in a way that fails silently.
    // This is the grep that makes the day the line changes a loud failure.
    const licence = await readFile(path.join(repo, 'CONTENT-LICENSE'), 'utf8')
    const holder = /^Copyright \(c\) \d{4} (.+)$/m.exec(licence)

    expect(holder?.[1]).toBe(CONTENT_HOLDER)
    expect(datasetOf(await graphOf(tree, 'start', 'en'))!.creator).toEqual({
      '@type': 'Organization',
      name: holder![1],
    })
  })

  test('the url is the root Node\u2019s canonical address in the page\u2019s language', async () => {
    for (const lang of tree.manifest.languages) {
      const dataset = datasetOf(await graphOf(tree, 'start', lang))!

      expect(dataset.url, lang).toBe(canonical(tree, tree.manifest.root, lang))
    }
  })
})

describe('isBasedOn: what the Tree is based on, derived from the Tree', () => {
  test('a Tree whose legal Sources are all one instrument names it', async () => {
    expect(await mostCitedLegalSource(tree)).toBe('https://eur-lex.europa.eu/eli/reg/2024/1689/oj')
  })

  test('the most frequent wins, and the comparison drops the fragment and the query', async () => {
    // The fixture cites 2024/1689 twice and 2016/679 once, both as bare ELI addresses;
    // the first Tree cites one instrument at twenty different fragments, which is the case
    // the stripping exists for and which `trees/ai-act-applicability-agrifood` carries.
    expect(await mostCitedLegalSource(awkwardTree)).toBe('https://eur-lex.europa.eu/eli/reg/2024/1689/oj')

    const agrifood = await openTree(path.join(repo, 'trees', 'ai-act-applicability-agrifood'))
    const cited = await mostCitedLegalSource(agrifood)
    expect(cited).toContain('CELEX:02024R1689-20260727')
    // The value emitted is a Source's URL as the Tree wrote it, never the stripped key:
    // `https://eur-lex.europa.eu/legal-content/EN/TXT/` identifies no instrument at all.
    expect(cited).not.toBe('https://eur-lex.europa.eu/legal-content/EN/TXT/')
  })

  test('a tie is broken by the first occurrence in Node order', async () => {
    // Two instruments cited once each; the one the earlier Node cites is the answer.
    const tied = await openTree(path.join(here, '..', 'fixtures', 'tied-sources'))

    expect(await mostCitedLegalSource(tied)).toBe('https://eur-lex.europa.eu/eli/reg/2024/1689/oj')
  })

  test('a Tree with no legal Source omits the field rather than guessing', async () => {
    expect(await mostCitedLegalSource(sourcelessTree)).toBeNull()

    const dataset = datasetOf(await graphOf(sourcelessTree, sourcelessTree.manifest.root, 'de'))!
    expect('isBasedOn' in dataset).toBe(false)
  })
})

describe('the WebPage on every page', () => {
  test('its @id and url are the page\u2019s canonical address, and its name the Node\u2019s title', async () => {
    for (const lang of tree.manifest.languages) {
      for (const id of tree.nodeIds()) {
        const page = webPageOf(await graphOf(tree, id, lang))
        const node = (await tree.getNode(id))!

        expect(page['@id'], `${id}.${lang}`).toBe(canonical(tree, id, lang))
        expect(page.url, `${id}.${lang}`).toBe(page['@id'])
        expect(page.name, `${id}.${lang}`).toBe(node.title[lang])
        expect(page.inLanguage, `${id}.${lang}`).toBe(lang)
      }
    }
  })

  test('its description is the cut string, the bytes the meta description carries', async () => {
    for (const id of tree.nodeIds()) {
      for (const lang of tree.manifest.languages) {
        const node = (await tree.getNode(id))!
        const page = webPageOf(await graphOf(tree, id, lang))

        expect(page.description, `${id}.${lang}`).toBe(plainDescription(node.description[lang]!).cut)
        expect([...page.description!].length, `${id}.${lang}`).toBeLessThanOrEqual(155)
      }
    }
  })

  test('the Dutch page and the English page are two WebPages of one Dataset', async () => {
    const english = webPageOf(await graphOf(tree, 'prohibited-practices', 'en'))
    const dutch = webPageOf(await graphOf(tree, 'prohibited-practices', 'nl'))

    expect(dutch['@id']).not.toBe(english['@id'])
    expect(dutch['@id']).toContain('lang=nl')
    expect(dutch.isPartOf).toEqual(english.isPartOf)
  })
})

describe('the Question, on a question Node and nowhere else', () => {
  test('a question Node carries one, as mainEntity, with its two Answers in button order', async () => {
    const node = (await tree.getNode('start'))!
    if (node.kind !== 'question') throw new Error('start is the question Node this test needs')
    const page = webPageOf(await graphOf(tree, 'start', 'en'))
    const words = chrome('en')

    expect(page.mainEntity).toEqual({
      '@type': 'Question',
      '@id': `${canonical(tree, 'start', 'en')}#question`,
      name: node.title.en,
      text: plainDescription(node.description.en!).reduced,
      inLanguage: 'en',
      suggestedAnswer: [
        {
          '@type': 'Answer',
          text: `${words.yes}: ${tree.getTitle(node.answers.yes)!.en}`,
          url: canonical(tree, node.answers.yes, 'en'),
        },
        {
          '@type': 'Answer',
          text: `${words.no}: ${tree.getTitle(node.answers.no)!.en}`,
          url: canonical(tree, node.answers.no, 'en'),
        },
      ],
    })
  })

  test('each Answer is the exact label its button carries, in the page\u2019s language', async () => {
    const node = (await tree.getNode('start'))!
    if (node.kind !== 'question') throw new Error('start is the question Node this test needs')
    const answers = webPageOf(await graphOf(tree, 'start', 'nl')).mainEntity!.suggestedAnswer

    expect(answers.map((answer) => answer.text)).toEqual([
      `${chrome('nl').yes}: ${tree.getTitle(node.answers.yes)!.nl}`,
      `${chrome('nl').no}: ${tree.getTitle(node.answers.no)!.nl}`,
    ])
    expect(answers.map((answer) => answer.url)).toEqual([
      canonical(tree, node.answers.yes, 'nl'),
      canonical(tree, node.answers.no, 'nl'),
    ])
  })

  test('the Question\u2019s text is the reduced string and never the cut one', async () => {
    // A description is at most 150 counted characters, so the two are the same string for
    // a conforming Tree. What is asserted here is which function the field reads, because
    // that decides which consumer takes the loss the day that limit moves (16.3).
    for (const id of ['start', 'prohibited-practices']) {
      const node = (await tree.getNode(id))!
      const question = webPageOf(await graphOf(tree, id, 'en')).mainEntity!

      expect(question.text, id).toBe(plainDescription(node.description.en!).reduced)
      expect(question.text, id).not.toContain('\u2026')
    }
  })

  test('a Terminal and an explanation Node carry the WebPage and nothing more', async () => {
    for (const [id, kind] of [
      ['outside-scope', 'terminal'],
      ['prohibited', 'terminal'],
      ['social-scoring', 'explanation'],
      ['emotion-recognition-at-work', 'explanation'],
    ] as const) {
      expect((await tree.getNode(id))!.kind, id).toBe(kind)
      const graph = await graphOf(tree, id, 'en')

      expect(webPageOf(graph).mainEntity, id).toBeUndefined()
      expect(JSON.stringify(graph), id).not.toContain('Question')
    }
  })

  test('the Options are not mapped: an aside is not an answer to the question', async () => {
    const node = (await tree.getNode('prohibited-practices'))!
    const question = webPageOf(await graphOf(tree, 'prohibited-practices', 'en')).mainEntity!

    expect(node.options.length).toBeGreaterThan(0)
    expect(question.suggestedAnswer).toHaveLength(2)
    for (const option of node.options) {
      expect(question.suggestedAnswer.map((answer) => answer.url)).not.toContain(
        canonical(tree, option.target, 'en'),
      )
    }
  })
})

describe('escaping: what reaches the bytes of the element', () => {
  test('a title holding </script>, <!-- and a lone < leaves no < in the emitted text', async () => {
    const title = (await awkwardTree.getNode('placing-on-the-market'))!.title.en!
    expect(title).toContain('</script>')
    expect(title).toContain('<!--')
    expect(title).toContain('<what it means>')

    const script = graphScript(await graphOf(awkwardTree, 'placing-on-the-market', 'en'))!

    // Not "no `</script>`": no `<` at all. The escape is applied to the whole serialised
    // string, because any value in it may have come from the Tree.
    expect(script).not.toContain('<')
    expect(script).toContain('\\u003c/script>')
  })

  test('the escaped text still parses, and parses back to the title the Tree wrote', async () => {
    for (const of of [awkwardTree, tree]) {
      for (const lang of of.manifest.languages) {
        for (const id of of.nodeIds()) {
          const script = graphScript(await graphOf(of, id, lang))!
          const parsed = JSON.parse(script) as Graph

          expect(script, `${of.id}/${id}.${lang}`).not.toContain('<')
          expect(webPageOf(parsed).name, `${of.id}/${id}.${lang}`).toBe((await of.getNode(id))!.title[lang])
        }
      }
    }
  })

  test('the manifest title reaches the Dataset\u2019s name escaped and reads back whole', async () => {
    const script = graphScript(await graphOf(awkwardTree, 'start', 'en'))!

    expect(awkwardTree.manifest.title.en).toContain('</script>')
    expect(script).not.toContain('<')
    expect(datasetOf(JSON.parse(script) as Graph)!.name).toBe(awkwardTree.manifest.title.en)
  })

  test('the check at the sink knows what closes a script element', async () => {
    // The escape makes this check unreachable through `graphScript`, which is why it is
    // exported and asserted here: it is what turns a broken escape into a page without its
    // JSON-LD, instead of a page whose script element was closed by a Tree's own text.
    for (const closing of ['</script>', '</SCRIPT>', '</script ', '\u003c!-- a comment', 'x</ScRiPt>y']) {
      expect(closesTheElement(closing), closing).toBe(true)
    }
    for (const safe of ['{"name":"\\u003c/script>"}', 'script', '<!-', '</scrip']) {
      expect(closesTheElement(safe), safe).toBe(false)
    }

    // And what the sink is actually handed, on the Tree written to break it, passes.
    for (const lang of awkwardTree.manifest.languages) {
      for (const id of awkwardTree.nodeIds()) {
        const script = graphScript(await graphOf(awkwardTree, id, lang))

        expect(script, `${id}.${lang}`).not.toBeNull()
        expect(closesTheElement(script!), `${id}.${lang}`).toBe(false)
      }
    }
  })
})
