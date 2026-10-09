/**
 * **[#206]** The preview of a hidden Tree's two pure pieces (docs/specs/application.md 40.1,
 * 40.2, 40.7): `previewLinks`, the public grammar behind `/admin/preview` with every picture on
 * the admin image route, and `previewDraft`, the draft as the preview reads it -- a placeholder
 * of 40.7 wherever it has no text yet in the language on screen, the other languages and the
 * texts it has untouched, and the draft itself not changed.
 *
 * Every draft is a copy of a fixture's folder with its file as `draft.json`, read by `openTree`
 * in draft mode, as the store reads one (19.2).
 */
import { cp, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, test } from 'vitest'
import { previewDraft, previewMode } from '../../src/admin/preview.ts'
import { previewLinks } from '../../src/editor/links.ts'
import { openTree, type Draft } from '../../src/tree/loader.ts'
import { MAX_PATH_IDS, type PageAddress } from '../../src/url.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const made: string[] = []

type Raw = { title: Record<string, string>; theme?: { logo: { alt: Record<string, string> } }; nodes: Record<string, unknown>[] }

/** A draft of the fixture folder `from`, its tree file edited by `change` first. */
async function draftOf(from: string, change: (raw: Raw, node: (id: string) => Record<string, any>) => void): Promise<Draft> {
  const parent = await mkdtemp(path.join(tmpdir(), 'elsa-preview-'))
  made.push(parent)
  const dir = path.join(parent, path.basename(from))
  await cp(from, dir, { recursive: true })
  const raw = JSON.parse(await readFile(path.join(dir, 'tree.json'), 'utf8')) as Raw
  change(raw, (id) => raw.nodes.find((node) => node.id === id) as Record<string, any>)
  await writeFile(path.join(dir, 'tree.json'), JSON.stringify(raw))
  await rename(path.join(dir, 'tree.json'), path.join(dir, 'draft.json'))
  return openTree(dir, { draft: true })
}

afterAll(async () => {
  for (const dir of made) await rm(dir, { recursive: true, force: true })
})

const address = (over: Partial<PageAddress> = {}): PageAddress => ({ treeId: 'a-tree', trail: ['start'], nodeId: 'step', lang: 'en', defaultLang: 'en', ...over })

describe('previewLinks (40.1)', () => {
  test('the four addresses are the public ones behind /admin/preview, ?lang kept where the language is not the default', () => {
    const links = previewLinks()
    expect(links.node(address())).toBe('/admin/preview/a-tree/start/step')
    expect(links.follow(address(), 'next')).toBe('/admin/preview/a-tree/start/step/next')
    expect(links.trail(address(), 0)).toBe('/admin/preview/a-tree/start')
    expect(links.withLang(address(), 'nl')).toBe('/admin/preview/a-tree/start/step?lang=nl')
    expect(links.node(address({ lang: 'nl' }))).toBe('/admin/preview/a-tree/start/step?lang=nl')
  })

  test('a Link followed from a path of fifty ids keeps fifty, dropping the oldest (4.3)', () => {
    const ids = Array.from({ length: MAX_PATH_IDS }, (_, index) => `n${index}`)
    const href = previewLinks().follow(address({ trail: ids.slice(0, -1), nodeId: ids.at(-1)! }), 'next')
    const kept = href.replace('/admin/preview/a-tree/', '').split('/')
    expect(kept).toHaveLength(MAX_PATH_IDS)
    expect(kept[0]).toBe('n1')
    expect(kept.at(-1)).toBe('next')
  })

  test('every picture is on the admin image route', () => {
    expect(previewLinks().image('a-tree', 'one picture.png')).toBe('/admin/api/trees/a-tree/images/one%20picture.png')
  })

  test("previewMode: the preview's links and no slot at all", () => {
    const edit = previewMode(address(), ['en', 'nl'])
    expect(edit.slots).toEqual({})
    expect(edit.links.node(address())).toBe('/admin/preview/a-tree/start/step')
    expect(edit.treeId).toBe('a-tree')
    expect(edit.languages).toEqual(['en', 'nl'])
  })
})

describe('previewDraft (40.7)', () => {
  /** The full Node's draft with every text 40.7 lists left out in Dutch, one way or another. */
  const unfinished = () =>
    draftOf(path.join(here, '..', 'fixtures', 'full-node'), (raw, node) => {
      raw.title.nl = ''
      delete node('full').title.nl
      node('full').description.nl = ''
      delete node('full').sources[0].label.nl
      node('full').options[0].title.nl = ''
      delete node('full').explainers[0].term.nl
      node('full').explainers[0].text.nl = ''
      delete node('full').images[0].description.nl
      node('full').images[0].credit = ''
      delete node('does-not-apply').terminal.label.nl
    })

  test('in Dutch every missing text reads its placeholder in its own place, and the texts the draft has stand', async () => {
    const draft = await unfinished()
    const shown = previewDraft(draft, 'nl')
    const full = (await shown.getNode('full'))!
    const missing = '[Tekst ontbreekt in deze taal]'

    expect(full.title.nl).toBe(missing)
    expect(full.description.nl).toBe(missing)
    expect(full.sources[0]!.label.nl).toBe(missing)
    expect(full.options[0]!.title.nl).toBe(missing)
    expect(full.explainers[0]!.term.nl).toBe(missing)
    expect(full.explainers[0]!.text.nl).toBe(missing)
    expect(full.images[0]!.description.nl).toBe(missing)
    expect(full.images[0]!.credit).toBe('[Maker en licentie]')
    expect((await shown.getNode('does-not-apply'))!.label!.nl).toBe('Tekst van het einde')
    expect(shown.getTitle('full')!.nl).toBe(missing)
    expect(shown.manifest.title.nl).toBe(missing)

    // The texts it has, and the other language, untouched.
    const original = (await draft.getNode('full'))!
    expect(full.sources[1]!.label).toEqual(original.sources[1]!.label)
    expect(full.images[1]).toEqual(original.images[1])
    expect(full.title.en).toBe(original.title.en)
    expect(shown.getTitle('opt-one')).toEqual(draft.getTitle('opt-one'))
    expect(shown.getTitle('no-such-node')).toBeNull()
    expect(await shown.getNode('no-such-node')).toBeNull()
  })

  test('in English, where the draft has every text, the Nodes read as the draft holds them; the credit placeholder is in English', async () => {
    const draft = await unfinished()
    const shown = previewDraft(draft, 'en')
    for (const id of ['full', 'opt-one', 'applies']) {
      const node = (await shown.getNode(id))!
      const original = (await draft.getNode(id))!
      expect({ ...node, images: [] }, id).toEqual({ ...original, images: [] })
    }
    expect((await shown.getNode('full'))!.images[0]!.credit).toBe('[Maker and licence]')
    expect(shown.manifest).toEqual(draft.manifest)
  })

  test("every placeholder is within its text's limit (tree-format.md 5.7): the badge's 19, a credit's 120, a title's 80", async () => {
    const shown = previewDraft(await unfinished(), 'nl')
    expect([...(await shown.getNode('does-not-apply'))!.label!.nl!].length).toBeLessThanOrEqual(19)
    expect([...(await shown.getNode('full'))!.images[0]!.credit].length).toBeLessThanOrEqual(120)
    expect([...shown.getTitle('full')!.nl!].length).toBeLessThanOrEqual(80)
  })

  test('the draft itself is not changed', async () => {
    const draft = await unfinished()
    const before = JSON.stringify([await draft.getNode('full'), await draft.getNode('does-not-apply'), draft.getTitle('full'), draft.manifest])
    const shown = previewDraft(draft, 'nl')
    await shown.getNode('full')
    await shown.getNode('does-not-apply')
    shown.getTitle('full')
    expect(JSON.stringify([await draft.getNode('full'), await draft.getNode('does-not-apply'), draft.getTitle('full'), draft.manifest])).toBe(before)
  })

  test("the logo's alternative text reads its placeholder where the draft has none in the language", async () => {
    const draft = await draftOf(path.join(here, '..', '..', 'trees', 'ai-act-example'), (raw) => {
      delete raw.theme!.logo.alt.nl
    })
    expect(previewDraft(draft, 'nl').manifest.theme!.logo!.alt.nl).toBe('[Tekst ontbreekt in deze taal]')
    expect(previewDraft(draft, 'en').manifest.theme!.logo!.alt.en).toBe('Example Lab')
  })
})
