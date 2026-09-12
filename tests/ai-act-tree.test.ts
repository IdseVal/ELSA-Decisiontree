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
import type { Image, Node } from '../src/tree/types.ts'

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

/** The Option targets of a list that runs over several steps, in order (format 5.8). */
const listedBy = (ids: readonly string[]): string[] =>
  ids.flatMap((id) => nodes.get(id)!.options.map((option) => option.target))

/** Step 1 as #44 cut it: one Node per category of Article 2(1), in the Act's order. */
const JURISDICTION_STEPS = [
  'start',
  'jurisdiction-deployer',
  'jurisdiction-third-country-output',
  'jurisdiction-importer-distributor',
  'jurisdiction-product-manufacturer',
  'jurisdiction-authorised-representative',
  'jurisdiction-affected-person',
] as const

/** The steps a list too long for one Node is spread over (format 5.7: at most 8 Options). */
const PROHIBITED_STEPS = ['prohibited-practices', 'prohibited-practices-2'] as const
const ANNEX_I_STEPS = ['annex-i-legislation', 'annex-i-legislation-2', 'annex-i-legislation-3'] as const

/** The Node a reader meets each step at; step 4 has one per route (#45 puts a picture on each). */
const STEP_NODES = [
  'start',
  'ai-system-definition',
  'prohibited-practices',
  'annex-i-legislation',
  'annex-iii-areas',
  'general-purpose-ai',
  'transparency-obligations',
] as const

/** The licences issue #45 sourced under: public domain, CC0, CC BY and CC BY-SA. */
const OPEN_LICENCE = /CC0 1\.0|CC BY(-SA)? [0-9.]+|public domain/

/** Every Image in the Tree, on a Node or on an Option, each with where it hangs. */
function everyImage(): { where: string; image: Image }[] {
  return [...nodes.values()].flatMap((node) => [
    ...node.images.map((image) => ({ where: `${node.id}.images[${image.file}]`, image })),
    ...node.options.flatMap((option) =>
      option.images.map((image) => ({ where: `${node.id} -> ${option.target} [${image.file}]`, image })),
    ),
  ])
}

/** A Node's description in one language, unwrapped, so an assertion does not depend on where it wraps. */
const unwrapped = (id: string, lang: string): string => nodes.get(id)!.description[lang]!.replace(/\s+/g, ' ')

/** The same description as its Markdown blocks, blank-line separated, each one unwrapped. */
const paragraphs = (id: string, lang: string): string[] =>
  nodes
    .get(id)!
    .description[lang]!.split(/\n[ \t]*\n/)
    .map((block) => block.replace(/\s+/g, ' ').trim())
    .filter((block) => block.length > 0)

/** The Terminals a walk starting at `id` can end at, by Answers alone, sorted. */
const terminalsFrom = (id: string): string[] =>
  [...answerOnlyReach(nodes, id)].filter((reached) => nodes.get(reached)!.kind === 'terminal').sort()

/**
 * The content of the first Tree. Every test below walks the Tree from its root through
 * the loader, so all of them depend on the Tree loading -- which it does again since #44
 * cut its text to the length limits of `elsa-tree/2`.
 */
describe('the content of the first Tree', () => {

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

      // Issue #44 cut three of the six steps into several Nodes, because their Options or
      // their text did not fit the limits of elsa-tree/2. The six steps and their order are
      // unchanged; what changed is how many Nodes a step spans. Step 1 is seven sub-steps
      // and an exclusions Node (the test below), step 3 is two Nodes and step 4a is three,
      // and the last Node of each reaches what the single Node it replaced reached. Since PR
      // #53 a yes on step 1 passes the exclusions Node on its way to step 2.
      expect(step('start').answers).toEqual({ yes: 'article-2-exclusions', no: 'jurisdiction-deployer' })
      expect(step('article-2-exclusions').answers).toEqual({ yes: 'ai-act-does-not-apply', no: 'ai-system-definition' })
      expect(step('ai-system-definition').answers).toEqual({ yes: 'prohibited-practices', no: 'not-an-ai-system' })
      expect(step('prohibited-practices').answers).toEqual({ yes: 'prohibited', no: 'prohibited-practices-2' })
      expect(step('prohibited-practices-2').answers).toEqual({ yes: 'prohibited', no: 'annex-i-legislation' })
      expect(step('annex-i-legislation').answers).toEqual({ yes: 'high-risk', no: 'annex-i-legislation-2' })
      expect(step('annex-i-legislation-2').answers).toEqual({ yes: 'high-risk', no: 'annex-i-legislation-3' })
      expect(step('annex-i-legislation-3').answers).toEqual({ yes: 'high-risk', no: 'annex-iii-areas' })
      expect(step('annex-iii-areas').answers).toEqual({ yes: 'high-risk', no: 'general-purpose-ai' })
      // Issue #24: the high-risk finding does not end the walk. A high-risk system can carry
      // Article 50 obligations at the same time (Article 50(6)), and the core document's
      // OPEN 10.7 answers that the general-purpose AI and transparency steps come after the
      // high-risk step -- so both Answers carry the finding on into step 5.
      expect(step('high-risk').answers).toEqual({ yes: 'general-purpose-ai', no: 'general-purpose-ai' })
      // Steps 5 and 6 do not branch either: general-purpose AI never ends the walk, and the
      // Tree goes no further than Article 50 (core document 3.3, item 7).
      expect(step('general-purpose-ai').answers).toEqual({ yes: 'transparency-obligations', no: 'transparency-obligations' })
      expect(step('transparency-obligations').answers).toEqual({ yes: 'end-of-walk', no: 'end-of-walk' })
    })

    test('the jurisdiction step spans seven question Nodes, each numbered in its title', () => {
      // The owner's cut (#35, #44): "the seven potential options for what is currently the
      // first node in the tree can each be their own step that receives a yes and a no".
      JURISDICTION_STEPS.forEach((id, index) => {
        const node = nodes.get(id)
        expect(node, `${id} is missing`).toBeDefined()
        expect(node!.kind, `${id} is not a question Node`).toBe('question')
        for (const lang of ['en', 'nl']) {
          expect(node!.title[lang], `${id}: ${lang} title`).toContain(`(${index + 1}/7)`)
        }
        // A yes on any one of the seven means the Act reaches the reader, so it goes to the
        // exclusions; a no goes on to the next category, and a no on the seventh ends the walk.
        expect((node as Node & { kind: 'question' }).answers).toEqual({
          yes: 'article-2-exclusions',
          no: JURISDICTION_STEPS[index + 1] ?? 'ai-act-does-not-apply',
        })
      })
      // The owner's answer on PR #53: the exclusions are asked of every reader the Act reaches,
      // because a defence or sole-research provider must not be walked on to a high-risk or
      // Article 50 finding. A full exclusion ends the walk; otherwise step 2 follows. A reader
      // with no jurisdictional link never meets them: for that reader they are moot.
      expect(nodes.get('article-2-exclusions')).toMatchObject({
        kind: 'question',
        answers: { yes: 'ai-act-does-not-apply', no: 'ai-system-definition' },
      })
    })

    test('the prohibited-practices and Annex I steps are numbered in their titles too', () => {
      // Format 5.8: a step cut into several Nodes says so at the end of its title, in every
      // language. The jurisdiction counters are pinned above; these are the other two steps.
      for (const steps of [PROHIBITED_STEPS, ANNEX_I_STEPS]) {
        steps.forEach((id, index) => {
          const counter = `(${index + 1}/${steps.length})`
          for (const lang of ['en', 'nl']) {
            expect(nodes.get(id)!.title[lang]!.endsWith(counter), `${id}: ${lang} title ends with ${counter}`).toBe(true)
          }
        })
      }
    })

    test('it holds 18 question Nodes, 4 Terminals and 49 explanation Nodes', () => {
      // 8 question Nodes before #44: the seven jurisdiction sub-steps and the exclusions Node
      // after them, one more prohibited-practices step and two more Annex I steps make 18. The
      // explanation Nodes are the same 49 entries, spread differently over their steps.
      const kinds = [...nodes.values()].map((node) => node.kind)
      expect(kinds.filter((kind) => kind === 'question')).toHaveLength(18)
      expect(kinds.filter((kind) => kind === 'terminal')).toHaveLength(4)
      expect(kinds.filter((kind) => kind === 'explanation')).toHaveLength(49)
      expect(nodes.size).toBe(71)
    })

    test('the general-purpose AI step is marked as a placeholder for the owner', () => {
      expect(nodes.get('general-purpose-ai')!.metadata.placeholder).toBe(true)
    })
  })

  describe('every list holds as many entries as issue #3 counted in the Act', () => {
    test(`the exclusions Node lists the ${RESEARCH_COUNTS.articleTwoExclusions} exclusions of Article 2`, () => {
      expect(optionCount('article-2-exclusions')).toBe(RESEARCH_COUNTS.articleTwoExclusions)
    })

    test(`prohibited practices lists the ${RESEARCH_COUNTS.prohibitedPractices} practices of Article 5(1)`, () => {
      // Since #44 a list longer than 8 Options runs over several steps (format 5.7), so the
      // count issue #3 measured in the Act is the sum across the steps of that list.
      expect(PROHIBITED_STEPS.map(optionCount)).toEqual([5, 5])
      expect(listedBy(PROHIBITED_STEPS)).toHaveLength(RESEARCH_COUNTS.prohibitedPractices)
    })

    test(`the Annex I steps list all ${RESEARCH_COUNTS.annexIEntries} pieces of Union harmonisation legislation`, () => {
      expect(ANNEX_I_STEPS.map(optionCount)).toEqual([8, 7, 5])
      const entries = listedBy(ANNEX_I_STEPS)
      expect(entries).toHaveLength(RESEARCH_COUNTS.annexIEntries)
      const sections = entries.map((target) => nodes.get(target)!.metadata['annex-i-section'])
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

  describe('what #44 cut as repetition is still said once, where the question is asked', () => {
    test('no explanation Node repeats the hint the frontend shows under it', () => {
      // #44 took this closing line out of all 49 explanation Nodes, because `src/chrome.ts`
      // already shows the same hint under every Node without Answers. Putting it back on a
      // short Node still validates, so only this catches it.
      const explanations = [...nodes.values()].filter((node) => node.kind === 'explanation')
      expect(explanations).toHaveLength(49)
      for (const { id } of explanations) {
        expect(unwrapped(id, 'en'), id).not.toMatch(/This is an explanation only|Go back to the previous step/i)
        expect(unwrapped(id, 'nl'), id).not.toMatch(/Dit is alleen uitleg|Ga terug naar de vorige stap/i)
      }
    })

    test('the first Annex I step states the two conditions of Article 6(1) and Article 2(13)', () => {
      // #44 cut both from the Annex I entries on the grounds that every entry repeated them.
      // That holds only while the step says them instead: if these sentences go, no Node
      // states the Article 6(1) test at all. Article 2(13) came back here on PR #53, with its
      // own Source.
      expect(unwrapped('annex-i-legislation', 'en')).toContain(
        'Article 6(1) applies when **both** are met: **(a)** the system is intended as a **safety component of a product**',
      )
      expect(unwrapped('annex-i-legislation', 'en')).toContain(
        '**and (b)** that product must undergo a **third-party conformity assessment**',
      )
      expect(unwrapped('annex-i-legislation', 'nl')).toContain(
        'Artikel 6, lid 1, vereist **beide**: **a)** het systeem is bedoeld als **veiligheidscomponent van een product**',
      )
      expect(unwrapped('annex-i-legislation', 'nl')).toContain(
        '**en b)** dat product vereist een **conformiteitsbeoordeling door een derde partij**',
      )

      expect(unwrapped('annex-i-legislation', 'en')).toContain(
        'Article 2(13) lets the Commission limit Articles 9 to 15 and 17 to 25 by delegated act',
      )
      expect(unwrapped('annex-i-legislation', 'nl')).toContain(
        'artikel 2, lid 13, laat de Commissie daarvoor de artikelen 9 tot en met 15 en 17 tot en met 25 bij gedelegeerde handeling beperken',
      )
      expect(nodes.get('annex-i-legislation')!.sources.map((source) => source.label.en)).toContain(
        'Article 2(13) AI Act (limitation for Section A)',
      )
    })
  })

  describe('every Node carries both languages, a Source with a URL, and version 0.2', () => {
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

    test('every Node is at metadata version 0.2', () => {
      // #44 re-cut every Node's text and bumped the Tree to 0.2; the Nodes follow the Tree.
      expect(tree.manifest.metadata.version).toBe('0.2')
      for (const [id, node] of nodes) expect(node.metadata.version, id).toBe('0.2')
    })

  })

  describe('the pictures: every list entry shows what it covers, every credit names a licence', () => {
    // Issue #45 replaces the assertion that this Tree carries no Image at all. That was true
    // of the Tree issue #10 authored and was written when the core document still had the
    // owner placing every picture by hand (section 6); the owner asked in #35 where the
    // images were, and open item 10.24 answers that the agents source them and the owner
    // replaces any of them at will. The three tests below are what the old one becomes.

    test('every Annex I and Annex III Option carries at least one Image', () => {
      // Core document 3.3, items 4a and 4b: each piece of Annex I legislation is an Option
      // "with an image showing what kind of product it covers", and each Annex III area is
      // "an Option with an image". The Annex I list spans three Nodes since #44.
      for (const id of [...ANNEX_I_STEPS, 'annex-iii-areas']) {
        for (const option of nodes.get(id)!.options) {
          expect(option.images.length, `${id} -> ${option.target} carries no Image`).toBeGreaterThan(0)
        }
      }
    })

    test('every step Node carries an Image of what the step asks about', () => {
      // Seven Nodes for six steps: step 4 asks its question twice, once down the Annex I
      // route and once down the Annex III route, and each entry Node carries its own picture.
      for (const id of STEP_NODES) {
        expect(nodes.get(id)!.images.length, `${id} carries no Image`).toBeGreaterThan(0)
      }
    })

    test("every Image's credit names an open licence, and an attribution besides it", () => {
      // The rule the sourcing of #45 worked under: openly licensed only, and the credit says
      // which licence, next to the author and where the picture came from. `credit` is
      // required by the format (tree-format.md 5.2); what it must SAY is this issue's rule,
      // so it is checked here and not in the loader, which serves every Tree.
      for (const { where, image } of everyImage()) {
        expect(image.credit, `${where}: credit names no licence`).toMatch(OPEN_LICENCE)
        const attribution = image.credit.replace(OPEN_LICENCE, '').replace(/[,\s]+/g, ' ').trim()
        expect(attribution, `${where}: credit is a licence and nothing else`).not.toBe('')
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
        'not-an-ai-system',
        'prohibited',
      ])
      for (const id of terminals) expect(reached.has(id), `${id} cannot be reached by answering`).toBe(true)
    })

    test('the four Terminals carry the outcomes the walk earns', () => {
      const outcome = (id: string): string => {
        const node = nodes.get(id)!
        expect(node.kind, `${id} is not a Terminal`).toBe('terminal')
        return (node as Node & { kind: 'terminal' }).outcome
      }
      expect(outcome('ai-act-does-not-apply')).toBe('not-applicable')
      expect(outcome('not-an-ai-system')).toBe('refer')
      expect(outcome('prohibited')).toBe('prohibited')
      expect(outcome('end-of-walk')).toBe('applicable')
    })

    test('a high-risk finding carries on into the general-purpose AI and transparency steps', () => {
      // Issue #24: the high-risk Node used to be a Terminal while its own text told the reader
      // to continue with steps 5 and 6, which the Tree could not do. It is now a question Node
      // that leads on whichever way it is answered, so a high-risk system reaches Article 50 --
      // the two regimes bite at once (Article 50(6)).
      expect(nodes.get('high-risk')!.kind).toBe('question')
      expect([...answerOnlyReach(nodes, 'high-risk')].sort()).toEqual([
        'end-of-walk',
        'general-purpose-ai',
        'high-risk',
        'transparency-obligations',
      ])
      // Both high-risk routes therefore end at `end-of-walk`, and nowhere else.
      expect(terminalsFrom('annex-i-legislation')).toEqual(['end-of-walk'])
      expect(terminalsFrom('annex-iii-areas')).toEqual(['end-of-walk'])
    })

    test('the Annex I Section B tension is left standing, and nothing on the route reconciles it', () => {
      // Issue #26. Since #24 every high-risk reader walks on into step 6, and step 6 says
      // Article 50 attaches whatever the risk classification -- which is not what Article 2(2)
      // provides for a system that is high-risk through Annex I, Section B. Resolving that is
      // legal authoring either way, and the owner's answer on the issue was to leave the
      // Tree's content to a later iteration and insert the wording by hand. So what ships is
      // pinned here rather than fixed, and the pin has to survive that insert: an *added*
      // caveat is the likeliest way this gets resolved, and no `toContain` ever sees an
      // addition. Hence the two halves below. The other way out - splitting step 4c by Annex
      // I Section - is deliberately not re-asserted here, because it cannot be done without a
      // new question Node and a new Terminal, and five tests earlier in this file already fail
      // on that: "the six steps are question Nodes chained in the order of core document 3.3",
      // "it holds 18 question Nodes, 4 Terminals and 49 explanation Nodes", "every Terminal is
      // reached from the root by answering questions alone", "a high-risk finding carries on
      // into the general-purpose AI and transparency steps" and "the walk stops early only
      // where the Act itself stops". Repeating them here would pin nothing new. NOTES.md
      // section 8 records the decision and points at both sets.

      // `high-risk` carries the caveat the Act gives, and is the only place the reader meets it.
      expect(unwrapped('high-risk', 'en')).toContain(
        '**Annex I, Section B**, Article 2(2) provides that only Article 6(1), Article 60a and Articles 102 to 112 apply',
      )
      expect(unwrapped('high-risk', 'nl')).toContain(
        '**bijlage I, afdeling B**, valt, bepaalt artikel 2, lid 2, dat uitsluitend artikel 6, lid 1, artikel 60 bis, en de artikelen 102 tot en met 112 van toepassing zijn',
      )
      // Step 6 states the general rule, unqualified, to that same reader.
      expect(unwrapped('transparency-obligations', 'en')).toContain(
        'Article 50 attaches **transparency obligations** to certain AI systems, whatever their risk classification.',
      )
      expect(unwrapped('transparency-obligations', 'nl')).toContain(
        'Artikel 50 verbindt **transparantieverplichtingen** aan bepaalde AI-systemen, ongeacht hun risicoclassificatie.',
      )

      // The other half, and the one that bites on an addition: the reconciliation is absent.
      // Telling this reader that Article 50 may not attach on a Section B route means naming
      // the carve-out and Article 50 in one breath, and no single block of the three Nodes
      // past step 4a does that today - step 4c keeps them in separate paragraphs, steps 5 and
      // 6 never mention Annex I at all. A caveat added anywhere on the route, in either
      // language and however worded, has to, so it fails here instead of shipping green.
      for (const id of ['high-risk', 'general-purpose-ai', 'transparency-obligations']) {
        for (const lang of ['en', 'nl']) {
          for (const block of paragraphs(id, lang)) {
            const reconciles = /Section B|afdeling B/i.test(block) && /Article 50|artikel 50/i.test(block)
            expect(
              reconciles,
              `${id} (${lang}) now answers Article 50 for the Annex I Section B route: "${block.slice(0, 160)}...". ` +
                'That resolves the tension issue #26 decided to leave standing - read section 8 of ' +
                "the Tree's NOTES.md and rewrite this test to pin what the Tree says instead.",
            ).toBe(false)
          }
        }
      }
    })

    test('the walk stops early only where the Act itself stops', () => {
      // The counterpart decision of issue #24: three Terminals do end the walk before step 6,
      // deliberately. `ai-act-does-not-apply` and `not-an-ai-system` stop because the Act does
      // not reach the system; `prohibited` stops because Article 5 leaves no route to
      // compliance, so the questions "which obligations attach?" have nothing to add.
      expect(terminalsFrom('start')).toEqual([
        'ai-act-does-not-apply',
        'end-of-walk',
        'not-an-ai-system',
        'prohibited',
      ])
      // Past step 3 the prohibition is the only early stop left, and past step 4 there is none.
      expect(terminalsFrom('prohibited-practices')).toEqual(['end-of-walk', 'prohibited'])
      expect(terminalsFrom('annex-i-legislation')).toEqual(['end-of-walk'])
    })

    test('the three Nodes whose text issue #24 changed say what the traversal now does', () => {
      // The traversal is pinned above, but the wording issue #24 asked for is not, and prose
      // is what a reader of this Tree actually gets. One assertion per changed Node, in both
      // languages, so reverting any of these sentences fails here and not only in review.

      // `high-risk` no longer sends the reader on by hand: the sentence #24 quotes is gone.
      expect(unwrapped('high-risk', 'en')).not.toContain('Continue with the general-purpose AI and transparency steps as well')
      expect(unwrapped('high-risk', 'nl')).not.toContain('Loop ook de stappen over AI voor algemene doeleinden en transparantie door')
      expect(unwrapped('high-risk', 'en')).toContain('**This step does not end the walk.**')
      expect(unwrapped('high-risk', 'nl')).toContain('**Deze stap beëindigt de doorloop niet.**')

      // Issue #24 task item 2: `prohibited` says its stop is deliberate instead of leaving it
      // to be inferred from the absence of an Answer.
      expect(unwrapped('prohibited', 'en')).toContain('**This walk ends here, and that is deliberate.**')
      expect(unwrapped('prohibited', 'nl')).toContain('**Deze doorloop eindigt hier, en dat is een bewuste keuze.**')

      // The high-risk finding is no longer an outcome of its own, so `end-of-walk` carries it.
      expect(unwrapped('end-of-walk', 'en')).toContain('**If step 4 found your system to be high-risk, that finding stands.**')
      expect(unwrapped('end-of-walk', 'nl')).toContain('hoog risico heeft, blijft die bevinding staan.**')
    })

    test('every Option leads to an explanation Node, so no Option can end the walk', () => {
      for (const [id, node] of nodes) {
        for (const option of node.options) {
          expect(nodes.get(option.target)!.kind, `${id} -> ${option.target}`).toBe('explanation')
        }
      }
    })
  })
})
