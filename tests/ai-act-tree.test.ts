/**
 * The first Tree, `trees/ai-act-applicability-agrifood/` (issue #10): the content claims
 * that the loader's validity rules do not cover.
 *
 * The loader already enforces the format (docs/specs/tree-format.md section 7). What is
 * checked here is the *content*: that the six steps of the core document section 3.3 are
 * present and connected in that order, that each list holds as many entries as the research
 * of issue #3 counted in the Act, and that every Terminal can actually be reached by
 * answering questions.
 *
 * Every Node is discovered by walking the graph through the loader, never by reading the
 * folder, so this test also proves that the whole Tree is reachable from its root by
 * clicking (docs/specs/application.md section 7: fixtures are loaded through `openTree`).
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, test } from 'vitest'
import { openTree, type Tree } from '../src/tree/loader.ts'
import type { Node } from '../src/tree/types.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const treeDir = path.join(here, '..', 'trees', 'ai-act-applicability-agrifood')

/** Counts measured in the Act by issue #3, section 12 ("Counts, with their source"). */
const RESEARCH_COUNTS = {
  articleTwoExclusions: 6,
  prohibitedPractices: 10,
  annexIEntries: 20,
  annexIiiAreas: 8,
  articleFiftySituations: 5,
}

let tree: Tree
let nodes: Map<string, Node>

/** Every Node reachable from the root by following Answers and Options, breadth first. */
async function walkFromRoot(from: Tree): Promise<Map<string, Node>> {
  const found = new Map<string, Node>()
  const queue = [from.manifest.root]
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    if (found.has(id)) continue
    const node = await from.getNode(id)
    expect(node, `"${id}" is linked to but cannot be read`).not.toBeNull()
    found.set(id, node!)
    if (node!.kind === 'question') queue.push(node!.answers.yes, node!.answers.no)
    queue.push(...node!.options.map((option) => option.target))
  }
  return found
}

/** The ids reachable from the root by Answers alone: the walk a user makes by answering. */
function answerOnlyReach(from: Map<string, Node>, root: string): Set<string> {
  const seen = new Set<string>()
  const queue = [root]
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    if (seen.has(id)) continue
    seen.add(id)
    const node = from.get(id)
    if (node?.kind === 'question') queue.push(node.answers.yes, node.answers.no)
  }
  return seen
}

const optionCount = (id: string): number => nodes.get(id)!.options.length

beforeAll(async () => {
  tree = await openTree(treeDir)
  nodes = await walkFromRoot(tree)
})

describe('the Tree loads and is shaped like the six steps of the core document', () => {
  test('it declares English and Dutch, with English as the default', () => {
    expect(tree.id).toBe('ai-act-applicability-agrifood')
    expect(tree.manifest.languages).toEqual(['en', 'nl'])
    expect(tree.manifest.defaultLanguage).toBe('en')
    expect(tree.manifest.root).toBe('start')
  })

  test('the six steps are question Nodes chained in the order of core document 3.3', () => {
    const step = (id: string): Node & { kind: 'question' } => {
      const node = nodes.get(id)
      expect(node, `${id} is missing`).toBeDefined()
      expect(node!.kind, `${id} is not a question Node`).toBe('question')
      return node as Node & { kind: 'question' }
    }

    expect(step('start').answers).toEqual({ yes: 'ai-system-definition', no: 'ai-act-does-not-apply' })
    expect(step('ai-system-definition').answers).toEqual({ yes: 'prohibited-practices', no: 'not-an-ai-system' })
    expect(step('prohibited-practices').answers).toEqual({ yes: 'prohibited', no: 'annex-i-legislation' })
    expect(step('annex-i-legislation').answers).toEqual({ yes: 'high-risk', no: 'annex-iii-areas' })
    expect(step('annex-iii-areas').answers).toEqual({ yes: 'high-risk', no: 'general-purpose-ai' })
    // Steps 5 and 6 do not branch: general-purpose AI never ends the walk, and the Tree
    // goes no further than Article 50 (core document 3.3, item 7).
    expect(step('general-purpose-ai').answers).toEqual({ yes: 'transparency-obligations', no: 'transparency-obligations' })
    expect(step('transparency-obligations').answers).toEqual({ yes: 'end-of-walk', no: 'end-of-walk' })
  })

  test('it holds 7 question Nodes, 5 Terminals and 49 explanation Nodes', () => {
    const kinds = [...nodes.values()].map((node) => node.kind)
    expect(kinds.filter((kind) => kind === 'question')).toHaveLength(7)
    expect(kinds.filter((kind) => kind === 'terminal')).toHaveLength(5)
    expect(kinds.filter((kind) => kind === 'explanation')).toHaveLength(49)
    expect(nodes.size).toBe(61)
  })

  test('the general-purpose AI step is marked as a placeholder for the owner', () => {
    expect(nodes.get('general-purpose-ai')!.metadata.placeholder).toBe(true)
  })
})

describe('every list holds as many entries as issue #3 counted in the Act', () => {
  test(`the root lists the ${RESEARCH_COUNTS.articleTwoExclusions} exclusions of Article 2`, () => {
    expect(optionCount('start')).toBe(RESEARCH_COUNTS.articleTwoExclusions)
  })

  test(`prohibited practices lists the ${RESEARCH_COUNTS.prohibitedPractices} practices of Article 5(1)`, () => {
    expect(optionCount('prohibited-practices')).toBe(RESEARCH_COUNTS.prohibitedPractices)
  })

  test(`the Annex I step lists all ${RESEARCH_COUNTS.annexIEntries} pieces of Union harmonisation legislation`, () => {
    expect(optionCount('annex-i-legislation')).toBe(RESEARCH_COUNTS.annexIEntries)
    const sections = nodes
      .get('annex-i-legislation')!
      .options.map((option) => nodes.get(option.target)!.metadata['annex-i-section'])
    expect(sections.filter((section) => section === 'A')).toHaveLength(11)
    expect(sections.filter((section) => section === 'B')).toHaveLength(9)
  })

  test(`the Annex III step lists all ${RESEARCH_COUNTS.annexIiiAreas} high-risk areas, covering 25 listed system types`, () => {
    expect(optionCount('annex-iii-areas')).toBe(RESEARCH_COUNTS.annexIiiAreas)
    const types = nodes
      .get('annex-iii-areas')!
      .options.map((option) => Number(nodes.get(option.target)!.metadata['listed-system-types']))
    expect(types).toEqual([3, 1, 4, 2, 4, 5, 4, 2])
    expect(types.reduce((sum, count) => sum + count, 0)).toBe(25)
  })

  test(`the transparency step lists the ${RESEARCH_COUNTS.articleFiftySituations} situations of Article 50`, () => {
    expect(optionCount('transparency-obligations')).toBe(RESEARCH_COUNTS.articleFiftySituations)
    const addressees = nodes
      .get('transparency-obligations')!
      .options.map((option) => nodes.get(option.target)!.metadata.addressee)
    expect(addressees).toEqual(['provider', 'provider', 'deployer', 'deployer', 'deployer'])
  })
})

describe('every Node carries both languages, a Source with a URL, and version 0.1', () => {
  test('every Node has a non-empty English and Dutch title and description', () => {
    for (const [id, node] of nodes) {
      for (const lang of ['en', 'nl']) {
        expect(node.title[lang]?.trim(), `${id}: ${lang} title`).toBeTruthy()
        expect(node.description[lang]?.trim(), `${id}: ${lang} description`).toBeTruthy()
      }
    }
  })

  test('the English and Dutch text of a Node are genuinely different strings', () => {
    for (const [id, node] of nodes) {
      expect(node.description.en, `${id}: the Dutch description repeats the English`).not.toBe(node.description.nl)
    }
  })

  test('every Node cites at least one Source, and every Source has an absolute http(s) URL', () => {
    for (const [id, node] of nodes) {
      expect(node.sources.length, `${id} cites no Source`).toBeGreaterThan(0)
      for (const source of node.sources) {
        expect(source.url, `${id}: ${source.label.en}`).toMatch(/^https?:\/\//)
        for (const lang of ['en', 'nl']) expect(source.label[lang]?.trim(), `${id}: ${lang} Source label`).toBeTruthy()
      }
    }
  })

  test('every Node cites a legal Source, and cites no case law or literature the research did not give', () => {
    for (const [id, node] of nodes) {
      expect(node.sources.some((source) => source.kind === 'legal'), `${id} cites no legal Source`).toBe(true)
      // Issue #10: case-law and literature Sources only where the research document
      // provides them, and it provides none.
      expect(node.sources.map((source) => source.kind), `${id}`).toEqual(node.sources.map(() => 'legal'))
    }
  })

  test('every Node is at metadata version 0.1', () => {
    for (const [id, node] of nodes) expect(node.metadata.version, id).toBe('0.1')
  })

  test('no Node carries an Image: the owner adds them (core document section 6)', () => {
    for (const [id, node] of nodes) {
      expect(node.images, id).toHaveLength(0)
      for (const option of node.options) expect(option.images, `${id} option ${option.title.en}`).toHaveLength(0)
    }
  })
})

describe('the walk', () => {
  test('every Terminal is reached from the root by answering questions alone', () => {
    const reached = answerOnlyReach(nodes, tree.manifest.root)
    const terminals = [...nodes.values()].filter((node) => node.kind === 'terminal').map((node) => node.id)
    expect(terminals.sort()).toEqual([
      'ai-act-does-not-apply',
      'end-of-walk',
      'high-risk',
      'not-an-ai-system',
      'prohibited',
    ])
    for (const id of terminals) expect(reached.has(id), `${id} cannot be reached by answering`).toBe(true)
  })

  test('the five Terminals carry the outcomes the walk earns', () => {
    const outcome = (id: string): string => {
      const node = nodes.get(id)!
      expect(node.kind, `${id} is not a Terminal`).toBe('terminal')
      return (node as Node & { kind: 'terminal' }).outcome
    }
    expect(outcome('ai-act-does-not-apply')).toBe('not-applicable')
    expect(outcome('not-an-ai-system')).toBe('refer')
    expect(outcome('prohibited')).toBe('prohibited')
    expect(outcome('high-risk')).toBe('applicable')
    expect(outcome('end-of-walk')).toBe('applicable')
  })

  test('every Option leads to an explanation Node, so no Option can end the walk', () => {
    for (const [id, node] of nodes) {
      for (const option of node.options) {
        expect(nodes.get(option.target)!.kind, `${id} -> ${option.target}`).toBe('explanation')
      }
    }
  })
})
