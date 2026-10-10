/**
 * The neighbourhood (docs/specs/application.md 10.9, 11.2): what a path names as its centre
 * and its aside chain; the placed set for each kind of Node, never more than seven, no id
 * twice, a Link to an unknown id dropped rather than thrown; the Option targets as asides,
 * at most eight; the Trail supplies `up`, the Answers `down`; an empty Trail has no `up`;
 * and a page reads at most seventeen Nodes in all.
 *
 * Every Tree comes through `openTree` and every address through `parseUrl` (section 7).
 */
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { centreOf, draftCentre, loadPage, MAX_ASIDES, MAX_PLACED, neighbourhood, type Placed } from '../src/neighbourhood.ts'
import { openTree, type Draft, type Tree } from '../src/tree/loader.ts'
import type { DraftNode, Node } from '../src/tree/types.ts'
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

/** **[#221]** `direction x,y id` for each placement, in the order returned (41.5). */
function summary(placed: Placed<Node | DraftNode>[]): string[] {
  return placed.map((p) => `${p.direction} ${p.x},${p.y} ${p.node.id}`)
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
    // **[#221]** The second level is every next step of the first, K of them: here two, which
    // stand where two stand under one step (41.5), not where #102's slots kept them.
    expect(summary(placed)).toEqual([
      'down -0.5,1 prohibited-practices',
      'down 0.5,1 outside-scope',
      'down -0.5,2 prohibited',
      'down 0.5,2 covered',
    ])
    expect(placed[0]!.href).toBe(followHref(address, 'prohibited-practices'))
    expect(placed[2]!.href).toBe('/ai-act-example/start/prohibited-practices/prohibited')
    expect(asides).toEqual([])
  })

  test('a question Node with Options: the parent `up`, Answers `down`, the Option targets as asides in Option order', async () => {
    const { address, node } = await at(example, '/ai-act-example/start/prohibited-practices')
    const { placed, asides } = await neighbourhood(example, address, node)

    expect(summary(placed)).toEqual(['up 0.5,-1 start', 'down -0.5,1 prohibited', 'down 0.5,1 covered'])
    expect(placed[0]!.href).toBe(trailHref(address, 0))
    expect(asides.map((aside) => aside.node.id)).toEqual(['social-scoring', 'emotion-recognition-at-work'])
    // An aside's address is the explanation Node's own, under this centre (10.9).
    expect(asides[0]!.href).toBe(followHref(address, 'social-scoring'))
    expect(asides[0]!.address).toEqual(parseUrl(asides[0]!.href, 'en', example))
  })

  test('only the parent is `up`: the grandparent is no longer one click away (11.2)', async () => {
    const { address, node } = await at(example, '/ai-act-example/start/prohibited-practices/prohibited')
    expect(summary((await neighbourhood(example, address, node)).placed)).toEqual(['up 0.5,-1 prohibited-practices'])
  })

  test("`up` knows the step it undoes: above and right of the first of two, above and left of the second, straight above any other step (11.3, 41.5)", async () => {
    const up = async (pathname: string) => {
      const { address, node } = await at(example, pathname)
      return summary((await neighbourhood(example, address, node)).placed).filter((s) => s.startsWith('up'))
    }
    // start -> yes prohibited-practices -> no covered.
    expect(await up('/ai-act-example/start/prohibited-practices')).toEqual(['up 0.5,-1 start'])
    expect(await up('/ai-act-example/start/prohibited-practices/covered')).toEqual(['up -0.5,-1 prohibited-practices'])
    expect(await up('/ai-act-example/start/outside-scope')).toEqual(['up -0.5,-1 start'])
    // Adjacency is not checked (4.3): `covered` is neither Answer of `start`, so the step was straight down.
    expect(await up('/ai-act-example/start/covered')).toEqual(['up 0,-1 start'])
  })

  test('nothing is placed `side`: an Option target is an aside, and an aside that is also placed stays an aside', async () => {
    // `third`'s `yes` is `second`, its parent: placed `up` once, and never `side`. That
    // cycle among question Nodes is not an error (tree-format.md section 7), and it is what
    // the `cycle` fixture is for: deduplication leaves a Branch without a slide, and no
    // Trail repeats a Node (application.md 11.3). The fixture said so in a comment until
    // #119; the JSON of elsa-tree/4 and /5 has none, so it is said here, where a reader of the test meets it.
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
  test('every reachable Node of both Trees, reached by its path: at most 21 placed, 8 asides, no id placed twice, one read each', async () => {
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
        // One `getNode` per neighbour at most, so the page's total stays at thirty-one (41.5).
        expect(counted.reads(), pathname).toBeLessThanOrEqual(MAX_PLACED + MAX_ASIDES)

        const links = [...(node.kind === 'question' ? node.answers.map((answer) => answer.target) : []), ...node.options.map((o) => o.target)]
        for (const id of links) queue.push(`${pathname}/${id}`)
      }
      expect(visited.size).toBeGreaterThan(1)
    }
  })

  test('a whole page -- centre, chain and neighbourhood -- reads at most 31 Nodes, and an aside the chain named is read once', async () => {
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
      expect(counted.reads(), pathname).toBeLessThanOrEqual(31)
    }
  })

  test('a Link to an id the Tree does not hold is dropped, not thrown', async () => {
    const { address, node } = await at(example, '/ai-act-example/start/prohibited-practices')
    // The real Tree, except that it has lost one Node: the stale index a view must survive.
    const missing: Tree = { ...example, getNode: async (id) => (id === 'covered' ? null : example.getNode(id)) }

    const { placed, asides } = await neighbourhood(missing, address, node)
    expect(summary(placed)).toEqual(['up 0.5,-1 start', 'down -0.5,1 prohibited'])
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

/**
 * **[#206]** A draft of the full Node's Tree (application.md 19.2), as the store keeps one: its
 * `draft.json` in a folder of its own, read by `openTree` in draft mode. `change` edits the
 * Nodes by id first, a new one added by its id; the pictures are left out, so the folder needs no files.
 */
const drafts: string[] = []
async function fullNodeDraft(change: (nodes: Record<string, Record<string, unknown>>) => void): Promise<Draft> {
  const raw = JSON.parse(await readFile(path.join(here, 'fixtures', 'full-node', 'tree.json'), 'utf8')) as { nodes: Record<string, unknown>[] }
  for (const node of raw.nodes) delete node.images
  const nodes = Object.fromEntries(raw.nodes.map((node) => [node.id as string, node]))
  change(nodes)
  raw.nodes = Object.values(nodes)
  const dir = path.join(await mkdtemp(path.join(tmpdir(), 'elsa-neighbourhood-')), 'full-node')
  drafts.push(path.dirname(dir))
  await mkdir(dir)
  await writeFile(path.join(dir, 'draft.json'), JSON.stringify(raw))
  return openTree(dir, { draft: true })
}

afterAll(async () => {
  for (const dir of drafts) await rm(dir, { recursive: true, force: true })
})

describe('**[#206]** over a draft, for the preview of a hidden Tree (40.2)', () => {
  test('a question step with one Answer places that one, **[#221]** straight below it (41.5)', async () => {
    for (const [answers, expected] of [
      [[{ label: { en: 'No', nl: 'Nee' }, target: 'does-not-apply' }], ['down 0,1 does-not-apply']],
      [[{ label: { en: 'Yes', nl: 'Ja' }, target: 'applies' }], ['down 0,1 applies']],
    ] as const) {
      const draft = await fullNodeDraft((nodes) => {
        nodes.full!.answers = answers
      })
      const address = parseUrl('/full-node/full', 'en', draft)!
      const node = (await draft.getNode('full'))!

      const { placed, asides } = await neighbourhood(draft, address, node)
      expect(summary(placed), JSON.stringify(answers)).toEqual(expected)
      expect(asides).toHaveLength(8)
    }
  })

  test("a lone Answer's target is placed **[#221]** straight above, when the reader goes up from it", async () => {
    const draft = await fullNodeDraft((nodes) => {
      nodes.full!.answers = [{ label: { en: 'No', nl: 'Nee' }, target: 'does-not-apply' }]
    })
    const address = parseUrl('/full-node/full/does-not-apply', 'en', draft)!
    const { placed } = await neighbourhood(draft, address, (await draft.getNode('does-not-apply'))!)
    expect(summary(placed)).toEqual(['up 0,-1 full'])
  })

  test('draftCentre: a fresh step a yes made is the centre, under its Trail; an Option target stays the open aside', async () => {
    const draft = await fullNodeDraft((nodes) => {
      nodes.fresh = { id: 'fresh', metadata: { version: '1' }, title: { en: 'Fresh' } }
      nodes.full!.answers = [
        { label: { en: 'Yes', nl: 'Ja' }, target: 'fresh' },
        { label: { en: 'No', nl: 'Nee' }, target: 'does-not-apply' },
      ]
    })
    const fresh = draftCentre((await centreOf(draft, parseUrl('/full-node/full/fresh', 'en', draft)!))!)
    expect(fresh.node.id).toBe('fresh')
    expect(fresh.address.trail).toEqual(['full'])
    expect(fresh.chain).toEqual([])

    // What the editor's page applied it to before #205 moved it: an Overlay its parent names stays one.
    const aside = draftCentre((await centreOf(draft, parseUrl('/full-node/full/opt-one', 'en', draft)!))!)
    expect(aside.node.id).toBe('full')
    expect(aside.chain.map((entry) => entry.node.id)).toEqual(['opt-one'])
  })
})

/**
 * **[#221]** A step of two to four next steps (application.md 41.5): a frame a layer width
 * apart, centred under the step, a second level counted before deduplication, the parent over
 * the step it came down from, mirrored, and a page of at most 31 Nodes.
 */
describe('**[#221]** the places of two to four next steps, and the bound of 31 (41.5)', () => {
  const label = { en: 'A step', nl: 'Een stap' }
  /** `count` Terminals `<prefix>-<i>`, with the full Node's titles and words, for a step to lead to. */
  const ends = (nodes: Record<string, Record<string, unknown>>, prefix: string, count: number): string[] =>
    Array.from({ length: count }, (_, i) => {
      const id = `${prefix}-${i}`
      nodes[id] = { ...structuredClone(nodes.applies!), id }
      return id
    })

  test('one level down, the n next steps stand at x = i - (n - 1) / 2: three at -1, 0, 1 and four at -1.5 to 1.5', async () => {
    const three = await openTree(path.join(here, 'fixtures', 'three-next-steps'))
    const centre = await at(three, '/three-next-steps/full')
    expect(summary((await neighbourhood(three, centre.address, centre.node)).placed)).toEqual([
      'down -1,1 applies',
      'down 0,1 does-not-apply',
      'down 1,1 deployer-only',
    ])
    const four = await at(fullNode, '/full-node/full')
    expect(summary((await neighbourhood(fullNode, four.address, four.node)).placed)).toEqual([
      'down -1.5,1 applies',
      'down -0.5,1 does-not-apply',
      'down 0.5,1 deployer-only',
      'down 1.5,1 not-applicable',
    ])
  })

  test('the parent stands over the first of its next steps that names the centre, mirrored: up and left from the fourth of four', async () => {
    for (const [target, x] of [['applies', 1.5], ['does-not-apply', 0.5], ['deployer-only', -0.5], ['not-applicable', -1.5]] as const) {
      const { address, node } = await at(fullNode, `/full-node/full/${target}`)
      expect(summary((await neighbourhood(fullNode, address, node)).placed), target).toEqual([`up ${x},-1 full`])
    }
  })

  test('two levels down, every next step of every first-level target in order, K of them counted before deduplication', async () => {
    const draft = await fullNodeDraft((nodes) => {
      // full -> a (three next steps), b (a Terminal), c (two, one of them a's): K = 5.
      const [a, b, c] = ends(nodes, 'level', 3) as [string, string, string]
      const below = ends(nodes, 'below', 4)
      nodes[a] = { ...nodes[a]!, terminal: undefined, answers: below.slice(0, 3).map((target) => ({ label, target })) }
      delete nodes[a]!.terminal
      nodes[c] = { ...nodes[c]!, answers: [below[0], below[3]].map((target) => ({ label, target })) }
      delete nodes[c]!.terminal
      nodes.full!.answers = [a, b, c].map((target) => ({ label, target }))
    })
    const node = (await draft.getNode('full'))!
    const { placed } = await neighbourhood(draft, parseUrl('/full-node/full', 'en', draft)!, node)
    // below-0 is K's first and its fourth: placed once, at the first; below-3 keeps the fifth place.
    expect(summary(placed)).toEqual([
      'down -1,1 level-0',
      'down 0,1 level-1',
      'down 1,1 level-2',
      'down -2,2 below-0',
      'down -1,2 below-1',
      'down 0,2 below-2',
      'down 2,2 below-3',
    ])
  })

  test('a step of four whose next steps have four each, under a parent, with eight asides and an Overlay the URL names: 29 neighbours and a page of 31 Nodes', async () => {
    const draft = await fullNodeDraft((nodes) => {
      const first = ends(nodes, 'one', 4)
      for (const [index, id] of first.entries()) {
        const second = ends(nodes, `two-${index}`, 4)
        nodes[id] = { ...nodes[id]!, answers: second.map((target) => ({ label, target })) }
        delete nodes[id]!.terminal
      }
      nodes.full!.answers = first.map((target) => ({ label, target }))
      // A parent above `full`, and an explanation Node no Option of `full` names, for the URL's Overlay.
      nodes.top = { ...structuredClone(nodes['opt-one']!), id: 'top', options: undefined, answers: [{ label, target: 'full' }, { label, target: 'applies' }] }
      delete nodes.top!.options
      nodes.lone = { ...structuredClone(nodes['opt-two']!), id: 'lone' }
      nodes['opt-one']!.options = [{ title: label, target: 'lone' }]
    })
    const counted = counting(draft as unknown as Tree)
    const address = parseUrl('/full-node/top/full/opt-one/lone', 'en', draft)!
    const page = (await loadPage(counted.tree, address))!

    expect(page.centre.node.id).toBe('full')
    expect(page.neighbours.placed).toHaveLength(MAX_PLACED)
    expect(page.neighbours.asides).toHaveLength(MAX_ASIDES)
    expect(MAX_PLACED + MAX_ASIDES).toBe(29)
    expect(page.centre.chain.map((aside) => aside.node.id)).toEqual(['opt-one', 'lone'])
    expect(counted.reads()).toBe(31)
    expect(summary(page.neighbours.placed).slice(0, 2)).toEqual(['up 0.5,-1 top', 'down -1.5,1 one-0'])
    expect(summary(page.neighbours.placed).slice(-1)).toEqual(['down 7.5,2 two-3-3'])
  })
})
