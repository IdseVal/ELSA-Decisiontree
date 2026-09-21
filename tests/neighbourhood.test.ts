/**
 * The neighbourhood (docs/specs/application.md 10.9, 11.2): what a path names as its centre
 * and its aside chain; the placed set for each kind of Node, never more than seven, no id
 * twice, a Link to an unknown id dropped rather than thrown; the Option targets as asides,
 * at most eight; the Trail supplies `up`, the Answers `down`; an empty Trail has no `up`;
 * and a page reads at most seventeen Nodes in all.
 *
 * Every Tree comes through `openTree` and every address through `parseUrl` (section 7).
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, test } from 'vitest'
import { centreOf, loadPage, MAX_ASIDES, MAX_PLACED, neighbourhood, type Placed } from '../src/neighbourhood.ts'
import { openTree, type Tree } from '../src/tree/loader.ts'
import type { Node } from '../src/tree/types.ts'
import { followHref, nodeHref, parseUrl, trailHref, type PageAddress } from '../src/url.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
let example: Tree
let fullNode: Tree
let overlay: Tree

beforeAll(async () => {
  example = await openTree(path.join(here, '..', 'trees', 'ai-act-example'))
  fullNode = await openTree(path.join(here, 'fixtures', 'full-node'))
  overlay = await openTree(path.join(here, 'fixtures', 'overlay'))
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

/** A copy of `tree` that counts its `getNode` calls. */
function counting(tree: Tree): { tree: Tree; reads: () => number } {
  let reads = 0
  return { tree: { ...tree, getNode: (id) => ((reads += 1), tree.getNode(id)) }, reads: () => reads }
}

describe('the centre a path names, and its aside chain (10.9)', () => {
  test('a path ending at a question Node: that Node is the centre and the chain is empty', async () => {
    const address = parseUrl('/ai-act-example/start/prohibited-practices', 'en', example)!
    const centre = (await centreOf(example, address))!

    expect(centre.node.id).toBe('prohibited-practices')
    expect(centre.address).toEqual(address)
    expect(centre.chain).toEqual([])
  })

  test("an explanation Node's URL: the centre is the question Node before it, the explanation Node its open aside", async () => {
    const address = parseUrl('/ai-act-example/start/prohibited-practices/social-scoring', 'en', example)!
    const centre = (await centreOf(example, address))!

    expect(centre.node.id).toBe('prohibited-practices')
    expect(centre.address).toEqual(parseUrl('/ai-act-example/start/prohibited-practices', 'en', example))
    expect(centre.chain.map((aside) => aside.node.id)).toEqual(['social-scoring'])
    // The aside's own address is the URL itself: the Overlay's heading links there.
    expect(centre.chain[0]!.href).toBe('/ai-act-example/start/prohibited-practices/social-scoring')
    expect(centre.chain[0]!.address).toEqual(address)
  })

  test('two explanation Nodes after the centre: both are the chain, in path order, the last the one open', async () => {
    // Adjacency is not checked (4.3): `social-scoring` is not an Option of `emotion-recognition-at-work`.
    const address = parseUrl(
      '/ai-act-example/start/prohibited-practices/emotion-recognition-at-work/social-scoring',
      'en',
      example,
    )!
    const centre = (await centreOf(example, address))!

    expect(centre.node.id).toBe('prohibited-practices')
    expect(centre.chain.map((aside) => aside.node.id)).toEqual(['emotion-recognition-at-work', 'social-scoring'])
    expect(centre.chain.map((aside) => aside.href)).toEqual([
      '/ai-act-example/start/prohibited-practices/emotion-recognition-at-work',
      '/ai-act-example/start/prohibited-practices/emotion-recognition-at-work/social-scoring',
    ])
  })

  test('a Terminal is a centre too: the entries after it are its chain', async () => {
    const address = parseUrl('/ai-act-example/start/prohibited-practices/prohibited/social-scoring', 'en', example)!
    const centre = (await centreOf(example, address))!
    expect(centre.node.id).toBe('prohibited')
    expect(centre.chain.map((aside) => aside.node.id)).toEqual(['social-scoring'])
  })

  test('a path of explanation Nodes alone has no parent to show: its first entry is the centre', async () => {
    const alone = (await centreOf(example, parseUrl('/ai-act-example/social-scoring', 'en', example)!))!
    expect(alone.node.id).toBe('social-scoring')
    expect(alone.address.trail).toEqual([])
    expect(alone.chain).toEqual([])

    const two = (await centreOf(fullNode, parseUrl('/full-node/opt-one/opt-two', 'en', fullNode)!))!
    expect(two.node.id).toBe('opt-one')
    expect(two.chain.map((aside) => aside.node.id)).toEqual(['opt-two'])
  })

  test('a run of explanation Nodes at the end of a path: at most two are the chain, and the entry before them is the centre whatever its kind', async () => {
    // `opt-two` is an Option of `opt-one`, so `opt-one` is the parent the path shows.
    const centre = (await centreOf(fullNode, parseUrl('/full-node/full/opt-three/opt-one/opt-two/opt-four', 'en', fullNode)!))!
    expect(centre.node.id).toBe('opt-one')
    expect(centre.address).toEqual(parseUrl('/full-node/full/opt-three/opt-one', 'en', fullNode))
    expect(centre.chain.map((aside) => aside.node.id)).toEqual(['opt-two', 'opt-four'])
  })

  test('the first of a chain of two is an aside of the centre, or it is the centre itself: a page has one Overlay that is not', async () => {
    // `opt-three` is not an Option of `opt-one`, so it is no aside of it: it is the centre, under `opt-one`.
    const centre = (await centreOf(fullNode, parseUrl('/full-node/full/opt-one/opt-three/opt-four', 'en', fullNode)!))!
    expect(centre.node.id).toBe('opt-three')
    expect(centre.address).toEqual(parseUrl('/full-node/full/opt-one/opt-three', 'en', fullNode))
    expect(centre.chain.map((aside) => aside.node.id)).toEqual(['opt-four'])
  })

  test('reads at most three Nodes however long the path and whatever it repeats, each id once', async () => {
    for (const [pathname, most] of [
      [`/ai-act-example/start/prohibited-practices/${Array.from({ length: 47 }, () => 'social-scoring').join('/')}`, 1],
      [`/full-node/full/${Array.from({ length: 12 }, () => 'opt-one/opt-two/opt-three/opt-four').join('/')}`, 3],
    ] as const) {
      const base = pathname.startsWith('/full-node') ? fullNode : example
      const { tree, reads } = counting(base)
      expect(await centreOf(tree, parseUrl(pathname, 'en', base)!), pathname).not.toBeNull()
      expect(reads(), pathname).toBe(most)
    }
  })

  test('reads one Node per entry walked back over, and the language travels with every address', async () => {
    const { tree, reads } = counting(example)
    const address = parseUrl('/ai-act-example/start/prohibited-practices/social-scoring', 'nl', tree)!
    const centre = (await centreOf(tree, address))!

    expect(reads()).toBe(2)
    expect(centre.address.lang).toBe('nl')
    expect(centre.chain[0]!.href).toBe('/ai-act-example/start/prohibited-practices/social-scoring?lang=nl')
  })
})

describe('which Nodes surround the centre', () => {
  test('the root with an empty Trail: no `up`, its Answers and theirs `down`, and no asides', async () => {
    const { address, node } = await at(example, '/ai-act-example/start')
    const { placed, asides } = await neighbourhood(example, address, node)

    // start -> yes prohibited-practices (a question: prohibited, covered), no outside-scope (a Terminal).
    expect(summary(placed)).toEqual([
      'down 0 prohibited-practices',
      'down 1 outside-scope',
      'down 2 prohibited',
      'down 3 covered',
    ])
    expect(placed[0]!.href).toBe(followHref(address, 'prohibited-practices'))
    expect(placed[2]!.href).toBe('/ai-act-example/start/prohibited-practices/prohibited')
    expect(asides).toEqual([])
  })

  test('a question Node with Options: the parent `up`, Answers `down`, the Option targets as asides in Option order', async () => {
    const { address, node } = await at(example, '/ai-act-example/start/prohibited-practices')
    const { placed, asides } = await neighbourhood(example, address, node)

    expect(summary(placed)).toEqual(['up 0 start', 'down 0 prohibited', 'down 1 covered'])
    expect(placed[0]!.href).toBe(trailHref(address, 0))
    expect(asides.map((aside) => aside.node.id)).toEqual(['social-scoring', 'emotion-recognition-at-work'])
    // An aside's address is the explanation Node's own, under this centre (10.9).
    expect(asides[0]!.href).toBe(followHref(address, 'social-scoring'))
    expect(asides[0]!.address).toEqual(parseUrl(asides[0]!.href, 'en', example))
  })

  test('only the parent is `up`: the grandparent is no longer one click away (11.2)', async () => {
    const { address, node } = await at(example, '/ai-act-example/start/prohibited-practices/prohibited')
    expect(summary((await neighbourhood(example, address, node)).placed)).toEqual(['up 0 prohibited-practices'])
  })

  test("`up` knows the step it undoes: slot 0 under the parent's `yes`, 1 under its `no`, 2 for any other step (11.3)", async () => {
    const up = async (pathname: string) => {
      const { address, node } = await at(example, pathname)
      return summary((await neighbourhood(example, address, node)).placed).filter((s) => s.startsWith('up'))
    }
    // start -> yes prohibited-practices -> no covered.
    expect(await up('/ai-act-example/start/prohibited-practices')).toEqual(['up 0 start'])
    expect(await up('/ai-act-example/start/prohibited-practices/covered')).toEqual(['up 1 prohibited-practices'])
    expect(await up('/ai-act-example/start/outside-scope')).toEqual(['up 1 start'])
    // Adjacency is not checked (4.3): `covered` is neither Answer of `start`, so the step was straight down.
    expect(await up('/ai-act-example/start/covered')).toEqual(['up 2 start'])
  })

  test('nothing is placed `side`: an Option target is an aside, and an aside that is also placed stays an aside', async () => {
    // `third`'s `yes` is `second`, its parent: placed `up` once, and never `side`. That
    // cycle among question Nodes is not an error (tree-format.md section 7), and it is what
    // the `cycle` fixture is for: deduplication leaves a Branch without a slide, and no
    // Trail repeats a Node (application.md 11.3). The fixture said so in a comment until
    // #119; elsa-tree/4 has none, so it is said here, where a reader of the test meets it.
    const cycle = await openTree(path.join(here, 'fixtures', 'cycle'))
    const { address, node } = await at(cycle, '/cycle/first/second/third')
    const { placed } = await neighbourhood(cycle, address, node)
    expect(placed.map((p) => p.direction)).not.toContain('side')
    expect(new Set(placed.map((p) => p.node.id)).size).toBe(placed.length)
  })

  test('the address of each placement and aside is the one its href names, in the page language', async () => {
    const { address, node } = await at(example, '/ai-act-example/start/prohibited-practices', 'nl')
    const { placed, asides } = await neighbourhood(example, address, node)
    for (const each of [...placed, ...asides]) {
      const pathname = each.href.split('?')[0]!
      expect(each.address).toEqual(parseUrl(pathname, 'nl', example))
      expect(each.href).toContain('lang=nl')
    }
  })

  test('the full Node: eight asides, its Answers below, and itself never its own neighbour', async () => {
    const { address, node } = await at(fullNode, `/full-node/${Array.from({ length: 50 }, () => 'full').join('/')}`)
    const { placed, asides } = await neighbourhood(fullNode, address, node)

    // Its Trail is itself 49 times, so there is nothing `up` that is not the Node on screen.
    expect(placed.filter((p) => p.direction === 'up')).toEqual([])
    expect(asides.map((aside) => aside.node.id)).toEqual([
      'opt-one',
      'opt-two',
      'opt-three',
      'opt-four',
      'opt-five',
      'opt-six',
      'opt-seven',
      'opt-eight',
    ])
    expect(placed.some((p) => p.node.id === 'full')).toBe(false)
  })
})

describe('the bound', () => {
  test('every reachable Node of both Trees, reached by its path: at most 7 placed, 8 asides, no id placed twice, one read each', async () => {
    for (const tree of [example, fullNode]) {
      // Walk the Tree by its Links from the root, each Node reached with the Trail that got there.
      const queue: string[] = [`/${tree.id}/${tree.manifest.root}`]
      const visited = new Set<string>()
      while (queue.length > 0) {
        const pathname = queue.shift()!
        const { address, node } = await at(tree, pathname)
        if (visited.has(node.id)) continue
        visited.add(node.id)

        const counted = counting(tree)
        const { placed, asides } = await neighbourhood(counted.tree, address, node)

        expect(placed.length, pathname).toBeLessThanOrEqual(MAX_PLACED)
        expect(asides.length, pathname).toBeLessThanOrEqual(MAX_ASIDES)
        const ids = placed.map((p) => p.node.id)
        expect(new Set(ids).size, pathname).toBe(ids.length)
        expect(ids, pathname).not.toContain(node.id)
        // One `getNode` per neighbour at most, so the page's total stays at seventeen (11.2).
        expect(counted.reads(), pathname).toBeLessThanOrEqual(MAX_PLACED + MAX_ASIDES)

        const links = [...(node.kind === 'question' ? [node.answers.yes, node.answers.no] : []), ...node.options.map((o) => o.target)]
        for (const id of links) queue.push(`${pathname}/${id}`)
      }
      expect(visited.size).toBeGreaterThan(1)
    }
  })

  test('a whole page -- centre, chain and neighbourhood -- reads at most 17 Nodes, and an aside the chain named is read once', async () => {
    for (const pathname of [
      '/ai-act-example/start/prohibited-practices/social-scoring',
      '/ai-act-example/start/prohibited-practices/emotion-recognition-at-work/social-scoring',
      `/full-node/${Array.from({ length: 49 }, () => 'full').join('/')}/opt-one`,
      `/full-node/${Array.from({ length: 48 }, () => 'full').join('/')}/opt-one/opt-two`,
      // Long in the chain, not in the Trail: what a reader clicking through nested asides, or typing, arrives at.
      `/ai-act-example/start/prohibited-practices/${Array.from({ length: 47 }, () => 'social-scoring').join('/')}`,
      `/full-node/full/${Array.from({ length: 12 }, () => 'opt-one/opt-two/opt-three/opt-four').join('/')}`,
      // Two explanation Nodes after a full question Node, neither of them its aside.
      '/overlay/five/o1/o2',
      '/full-node/full/opt-one/opt-three/opt-four',
    ]) {
      const tree = { 'full-node': fullNode, overlay }[pathname.split('/')[1]!] ?? example
      const counted = counting(tree)
      const page = (await loadPage(counted.tree, parseUrl(pathname, 'en', tree)!))!

      const carried = new Set([
        page.centre.node.id,
        ...page.centre.chain.map((a) => a.node.id),
        ...page.neighbours.placed.map((p) => p.node.id),
        ...page.neighbours.asides.map((a) => a.node.id),
      ])
      expect(counted.reads(), pathname).toBe(carried.size)
      expect(counted.reads(), pathname).toBeLessThanOrEqual(17)
    }
  })

  test('a Link to an id the Tree does not hold is dropped, not thrown', async () => {
    const { address, node } = await at(example, '/ai-act-example/start/prohibited-practices')
    // The real Tree, except that it has lost one Node: the stale index a view must survive.
    const missing: Tree = { ...example, getNode: async (id) => (id === 'covered' ? null : example.getNode(id)) }

    const { placed, asides } = await neighbourhood(missing, address, node)
    expect(summary(placed)).toEqual(['up 0 start', 'down 0 prohibited'])
    expect(asides.map((aside) => aside.node.id)).toEqual(['social-scoring', 'emotion-recognition-at-work'])

    const gone: Tree = { ...example, getNode: async (id) => (id === 'social-scoring' ? null : example.getNode(id)) }
    expect((await neighbourhood(gone, address, node)).asides.map((aside) => aside.node.id)).toEqual(['emotion-recognition-at-work'])
    expect(await centreOf(gone, parseUrl('/ai-act-example/start/prohibited-practices/social-scoring', 'en', gone)!)).toBeNull()
  })

  test('the page carries the address it was asked for, whole, beside the centre it shows', async () => {
    const address = parseUrl('/ai-act-example/start/prohibited-practices/social-scoring', 'nl', example)!
    const page = (await loadPage(example, address))!
    expect(nodeHref(page.address)).toBe('/ai-act-example/start/prohibited-practices/social-scoring?lang=nl')
    expect(nodeHref(page.centre.address)).toBe('/ai-act-example/start/prohibited-practices?lang=nl')
  })
})
