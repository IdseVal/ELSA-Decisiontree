/**
 * The neighbourhood (docs/specs/application.md 11.2): the set for each kind of Node, never
 * more than fifteen, no id twice, a Link to an unknown id dropped rather than thrown; the
 * parent supplies `up`, the Answers `down`, the Options `side`; an empty Trail has no `up`.
 *
 * Every Tree comes through `openTree` and every address through `parseUrl` (section 7).
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, test } from 'vitest'
import { MAX_NEIGHBOURS, neighbourhood, type Placed } from '../src/neighbourhood.ts'
import { openTree, type Tree } from '../src/tree/loader.ts'
import type { Node } from '../src/tree/types.ts'
import { followHref, parseUrl, trailHref, type PageAddress } from '../src/url.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
let example: Tree
let fullNode: Tree

beforeAll(async () => {
  example = await openTree(path.join(here, '..', 'trees', 'ai-act-example'))
  fullNode = await openTree(path.join(here, 'fixtures', 'full-node'))
})

/** The address and Node a path names, the way the page reads them. */
async function at(tree: Tree, pathname: string, lang = 'en'): Promise<{ address: PageAddress; node: Node }> {
  const address = parseUrl(pathname, lang, tree)
  if (!address) throw new Error(`${pathname} is not a page of ${tree.id}`)
  return { address, node: (await tree.getNode(address.nodeId))! }
}

/** `direction slot id` for each placement, in the order returned. */
function summary(placed: Placed[]): string[] {
  return placed.map((p) => `${p.direction} ${p.slot} ${p.node.id}`)
}

describe('which Nodes surround the Node on screen', () => {
  test('the root with an empty Trail: no `up`, its Answers and theirs `down`', async () => {
    const { address, node } = await at(example, '/ai-act-example/start')
    const placed = await neighbourhood(example, address, node)

    // start -> yes prohibited-practices (a question: prohibited, covered), no outside-scope (a Terminal).
    expect(summary(placed)).toEqual([
      'down 0 prohibited-practices',
      'down 1 outside-scope',
      'down 2 prohibited',
      'down 3 covered',
    ])
    expect(placed[0]!.href).toBe(followHref(address, 'prohibited-practices'))
    expect(placed[2]!.href).toBe('/ai-act-example/start/prohibited-practices/prohibited')
  })

  test('a question Node with Options: the Trail `up`, Answers `down`, Options `side`', async () => {
    const { address, node } = await at(example, '/ai-act-example/start/prohibited-practices')
    const placed = await neighbourhood(example, address, node)

    expect(summary(placed)).toEqual([
      'up 0 start',
      'down 0 prohibited',
      'down 1 covered',
      'side 0 social-scoring',
      'side 1 emotion-recognition-at-work',
    ])
    expect(placed[0]!.href).toBe(trailHref(address, 0))
    expect(placed[3]!.href).toBe(followHref(address, 'social-scoring'))
  })

  test('an explanation Node: the parent alone `up`, the one Node the up arrow reaches; the grandparent is not placed', async () => {
    const { address, node } = await at(
      example,
      '/ai-act-example/start/prohibited-practices/emotion-recognition-at-work/social-scoring',
    )
    const placed = await neighbourhood(example, address, node)

    expect(summary(placed)).toEqual(['up 0 emotion-recognition-at-work'])
    expect(placed.map((p) => p.href)).toEqual([trailHref(address, 2)])
  })

  test('a Terminal: the Trail `up` only; `startAgain` has no placement', async () => {
    const { address, node } = await at(example, '/ai-act-example/start/prohibited-practices/prohibited')
    expect(summary(await neighbourhood(example, address, node))).toEqual(['up 0 prohibited-practices'])
  })

  test('the address of each placement is the one its href names, in the page language', async () => {
    const { address, node } = await at(example, '/ai-act-example/start/prohibited-practices', 'nl')
    for (const placed of await neighbourhood(example, address, node)) {
      const pathname = placed.href.split('?')[0]!
      expect(placed.address).toEqual(parseUrl(pathname, 'nl', example))
      expect(placed.href).toContain('lang=nl')
    }
  })

  test('the full Node: eight Options beside, its Answers below, and itself never its own neighbour', async () => {
    const { address, node } = await at(fullNode, `/full-node/${Array.from({ length: 50 }, () => 'full').join('/')}`)
    const placed = await neighbourhood(fullNode, address, node)

    // Its Trail is itself 49 times, so there is nothing `up` that is not the Node on screen.
    expect(placed.filter((p) => p.direction === 'up')).toEqual([])
    expect(placed.filter((p) => p.direction === 'side').map((p) => p.slot)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
    expect(placed.some((p) => p.node.id === 'full')).toBe(false)
  })
})

describe('the bound', () => {
  test('is fifteen: one parent, two Answers and their four, eight Options (11.2)', () => {
    expect(MAX_NEIGHBOURS).toBe(15)
  })

  test('every reachable Node of both Trees, reached by its path: at most 15, no id twice, one read each', async () => {
    for (const tree of [example, fullNode]) {
      // Walk the Tree by its Links from the root, each Node reached with the Trail that got there.
      const queue: string[] = [`/${tree.id}/${tree.manifest.root}`]
      const visited = new Set<string>()
      while (queue.length > 0) {
        const pathname = queue.shift()!
        const { address, node } = await at(tree, pathname)
        if (visited.has(node.id)) continue
        visited.add(node.id)

        let reads = 0
        const counted: Tree = { ...tree, getNode: (id) => ((reads += 1), tree.getNode(id)) }
        const placed = await neighbourhood(counted, address, node)

        expect(placed.length, pathname).toBeLessThanOrEqual(MAX_NEIGHBOURS)
        const ids = placed.map((p) => p.node.id)
        expect(new Set(ids).size, pathname).toBe(ids.length)
        expect(ids, pathname).not.toContain(node.id)
        // One `getNode` per neighbour at most, so the page's total stays at seventeen (11.2).
        expect(reads, pathname).toBeLessThanOrEqual(MAX_NEIGHBOURS)

        const links = [...(node.kind === 'question' ? [node.answers.yes, node.answers.no] : []), ...node.options.map((o) => o.target)]
        for (const id of links) queue.push(`${pathname}/${id}`)
      }
      expect(visited.size).toBeGreaterThan(1)
    }
  })

  test('a Link to an id the Tree does not hold is dropped, not thrown', async () => {
    const { address, node } = await at(example, '/ai-act-example/start/prohibited-practices')
    // The real Tree, except that it has lost one Node: the stale index a view must survive.
    const missing: Tree = { ...example, getNode: async (id) => (id === 'covered' ? null : example.getNode(id)) }

    const placed = await neighbourhood(missing, address, node)
    expect(summary(placed)).toEqual(['up 0 start', 'down 0 prohibited', 'side 0 social-scoring', 'side 1 emotion-recognition-at-work'])
  })
})
