/**
 * The store's read side (docs/specs/application.md 17, 18.3, 23.7): the seed at first
 * start and never again, a hidden Tree out of the set, an invalid published Tree refused
 * and the rest served, the lock, whole files in order, and the three retired variables.
 * **[#179]** And the conversion of `elsa-tree/4` files, at the start and at an import (36.4).
 */
import { spawn } from 'node:child_process'
import { cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { openConfiguredStore } from '../../src/config.ts'
import { importTree, openStore, RESERVED_TREE_IDS } from '../../src/store/index.ts'
import { writeAtomic } from '../../src/store/write.ts'
import { TreeInvalid } from '../../src/tree/loader.ts'
import { ADMIN } from './admin.ts'

// **[#179]** One file the disk refuses while the store converts it: the real writer for every
// other file, and for every test that names none.
const refusedWrite = vi.hoisted(() => ({ file: null as string | null }))
vi.mock('../../src/store/write.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/store/write.ts')>()
  return {
    ...actual,
    writeAtomic: (file: string, data: string | Uint8Array): Promise<void> =>
      refusedWrite.file !== null && path.resolve(file) === refusedWrite.file
        ? Promise.reject(new Error(`EIO: i/o error, open '${file}.tmp'`))
        : actual.writeAtomic(file, data),
  }
})

const here = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.join(here, '..', 'fixtures')
const trees = path.join(here, '..', '..', 'trees')

const made: string[] = []

/** A fresh empty folder, removed after the test. */
async function folder(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'elsa-store-'))
  made.push(dir)
  return dir
}

/**
 * **[#179]** Writes the Tree file `file` back as the `elsa-tree/4` file it would have been before
 * #179: its two names of itself, and each Terminal's marker an `outcome`, from `outcomes` in order.
 */
async function writeAs4(file: string, outcomes: string[]): Promise<void> {
  const tree = JSON.parse(await readFile(file, 'utf8')) as { $schema: string; format: string; nodes: Array<{ terminal?: unknown }> }
  tree.$schema = '/schemas/elsa-tree-4.json'
  tree.format = 'elsa-tree/4'
  for (const node of tree.nodes) if (node.terminal) node.terminal = { outcome: outcomes.shift() }
  await writeFile(file, `${JSON.stringify(tree, null, 2)}\n`)
}

/** **[#179]** Writes the Tree file `file` back after `edit` has changed what it holds. */
async function rewrite(file: string, edit: (tree: { nodes: Array<Record<string, unknown>> }) => unknown): Promise<void> {
  const tree = JSON.parse(await readFile(file, 'utf8')) as { nodes: Array<Record<string, unknown>> }
  edit(tree)
  await writeFile(file, `${JSON.stringify(tree, null, 2)}\n`)
}

/** The lines `log` was called with that say a file was converted (36.4). */
function conversions(log: { mock: { calls: unknown[][] } }): string[] {
  return log.mock.calls.map((call) => String(call[0])).filter((line) => line.startsWith('Converted'))
}

/** A seed folder holding a copy of each named fixture, under its own id. */
async function seedOf(...entries: Array<[from: string, id: string]>): Promise<string> {
  const seed = await folder()
  for (const [from, id] of entries) await cp(from, path.join(seed, id), { recursive: true })
  return seed
}

afterEach(async () => {
  refusedWrite.file = null
  vi.restoreAllMocks()
  for (const dir of made.splice(0)) await rm(dir, { recursive: true, force: true })
})

describe('the first start seeds the store, and no later start does', () => {
  test('every valid seed Tree is imported, published, with its draft and its metadata', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const seed = await seedOf([path.join(trees, 'ai-act-example'), 'ai-act-example'], [path.join(fixtures, 'cycle'), 'cycle'])
    const data = await folder()

    const store = await openStore(data, { ...ADMIN, ELSA_SEED_DIR: seed })

    expect(store.publishedIds()).toEqual(['ai-act-example', 'cycle'])
    const folderOf = path.join(data, 'trees', 'ai-act-example')
    expect((await readdir(folderOf)).sort()).toEqual(['draft.json', 'images', 'meta.json', 'theme', 'tree.json'])
    const original = await readFile(path.join(trees, 'ai-act-example', 'tree.json'))
    expect(await readFile(path.join(folderOf, 'tree.json'))).toEqual(original)
    expect(await readFile(path.join(folderOf, 'draft.json'))).toEqual(original)
    const meta = JSON.parse(await readFile(path.join(folderOf, 'meta.json'), 'utf8'))
    // **[#135]** The seed's Trees are the administrator's (17.4, 20.3).
    const admin = store.accounts.all().find((account) => account.administrator)!
    expect(meta).toMatchObject({ creator: admin.id, updatedBy: admin.id, collaborators: [], publishCount: 1, revision: 0 })
    expect(Number.isNaN(Date.parse(meta.publishedAt))).toBe(false)
    // The dataset endpoint streams the store's copy now (23.6).
    expect(store.published('ai-act-example')!.filePath).toBe(path.join(folderOf, 'tree.json'))
  })

  test('a second start reads no seed: a Tree deleted from the store does not come back', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const seed = await seedOf([path.join(fixtures, 'cycle'), 'cycle'])
    const data = await folder()
    await openStore(data, { ...ADMIN, ELSA_SEED_DIR: seed })
    await rm(path.join(data, 'trees', 'cycle'), { recursive: true })
    await cp(path.join(fixtures, 'carousel'), path.join(seed, 'carousel'), { recursive: true })

    const store = await openStore(data, { ...ADMIN, ELSA_SEED_DIR: seed })

    expect(store.publishedIds()).toEqual([])
  })

  test('a seed folder that is reserved or invalid is skipped, with the reason printed', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const seed = await seedOf(
      [path.join(fixtures, 'cycle'), 'admin'],
      [path.join(fixtures, 'invalid', 'v-image'), 'v-image'],
      [path.join(fixtures, 'carousel'), 'carousel'],
    )

    const store = await openStore(await folder(), { ...ADMIN, ELSA_SEED_DIR: seed })

    expect(store.publishedIds()).toEqual(['carousel'])
    const printed = errors.mock.calls.map((call) => String(call[0])).join('\n')
    expect(printed).toContain('"admin" is a reserved word')
    expect(printed).toContain('Tree "v-image" is invalid')
  })

  test('ELSA_SEED_DIR defaults to trees/ under the working directory', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})

    const store = await openStore(await folder(), ADMIN)

    expect(store.publishedIds()).toEqual(['ai-act-applicability-agrifood', 'ai-act-example'])
  })
})

describe('which Trees are served (18.3, 23.1)', () => {
  test('a hidden Tree -- a folder without tree.json -- is not in the set', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const seed = await seedOf([path.join(fixtures, 'cycle'), 'cycle'], [path.join(fixtures, 'carousel'), 'carousel'])
    const data = await folder()
    await openStore(data, { ...ADMIN, ELSA_SEED_DIR: seed })
    await rm(path.join(data, 'trees', 'cycle', 'tree.json'))

    const store = await openStore(data, ADMIN)

    expect(store.publishedIds()).toEqual(['carousel'])
    expect(store.published('cycle')).toBeNull()
  })

  test('a published Tree that fails validation is refused, not thrown, and the rest are served', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const seed = await seedOf([path.join(fixtures, 'cycle'), 'cycle'], [path.join(fixtures, 'carousel'), 'carousel'])
    const data = await folder()
    await openStore(data, { ...ADMIN, ELSA_SEED_DIR: seed })
    await writeFile(path.join(data, 'trees', 'cycle', 'tree.json'), '{ "format": "elsa-tree/5" ')

    const store = await openStore(data, ADMIN)

    expect(store.publishedIds()).toEqual(['carousel'])
    expect(store.published('cycle')).toBeNull()
    expect(store.refused().map(({ id }) => id)).toEqual(['cycle'])
    expect(store.refused()[0]!.reason).toContain('V-JSON')
    // The published state is the creator's, and is not touched (18.3).
    expect(await readdir(path.join(data, 'trees', 'cycle'))).toContain('tree.json')
  })

  test('**[#135]** a Tree whose meta.json is broken is refused, not thrown, and the rest are served', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const seed = await seedOf([path.join(fixtures, 'cycle'), 'cycle'], [path.join(fixtures, 'carousel'), 'carousel'])
    const data = await folder()
    await openStore(data, { ...ADMIN, ELSA_SEED_DIR: seed })
    await writeFile(path.join(data, 'trees', 'cycle', 'meta.json'), '{ "creator": ')
    await writeFile(path.join(data, 'trees', 'carousel', 'meta.json'), 'null')

    const store = await openStore(data, ADMIN)

    expect(store.publishedIds()).toEqual([])
    expect(store.refused().map(({ id }) => id).sort()).toEqual(['carousel', 'cycle'])
    for (const { reason } of store.refused()) expect(reason).toContain('meta.json')
    // Reported, not repaired: the file is the creator's to look at.
    expect(await readFile(path.join(data, 'trees', 'cycle', 'meta.json'), 'utf8')).toBe('{ "creator": ')
  })

  test("**[#135]** ELSA_ADMIN_PASSWORD set to another password ends the administrator's sessions; the same one does not", async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const data = await folder()
    const first = await openStore(data, { ...ADMIN, ELSA_SEED_DIR: await folder() })
    const admin = first.accounts.all().find((account) => account.administrator)!
    const anna = await first.accounts.create(admin, 'Anna', 'anna@example.org', 'annas first password')
    const cookieOf = async (account: typeof admin): Promise<string> => (await first.sessions.start(account, true)).cookie.split(';')[0]!
    const adminCookie = await cookieOf(admin)
    const annaCookie = await cookieOf(anna)

    // A restart with the variable still set to the same password is no reset (20.3).
    const again = await openStore(data, ADMIN)
    expect(again.accounts.adminPasswordReplaced).toBe(false)
    expect(await again.sessions.resolve(adminCookie)).not.toBeNull()

    // **[#196]** Nor is a new address from ELSA_ADMIN_EMAIL: a change of address ends no session (38.3, 38.5).
    const readdressed = await openStore(data, { ELSA_ADMIN_EMAIL: 'root@example.org' })
    expect(readdressed.accounts.adminPasswordReplaced).toBe(false)
    expect(await readdressed.sessions.resolve(adminCookie)).toMatchObject({ account: { id: admin.id, email: 'root@example.org' } })

    // The recovery of a leaked password: the old sessions end with it (20.4).
    const reset = await openStore(data, { ELSA_ADMIN_PASSWORD: 'a brand new password' })
    expect(reset.accounts.adminPasswordReplaced).toBe(true)
    expect(await reset.sessions.resolve(adminCookie)).toBeNull()
    expect(await reset.sessions.resolve(annaCookie)).toMatchObject({ account: { id: anna.id } })
  })

  test('an unknown or reserved id is null, like a hidden one', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const store = await openStore(await folder(), { ...ADMIN, ELSA_SEED_DIR: await seedOf([path.join(fixtures, 'cycle'), 'cycle']) })

    for (const id of ['no-such-tree', ...RESERVED_TREE_IDS, '..', '']) expect(store.published(id)).toBeNull()
  })

  test('a published folder placed by hand under a reserved id is refused, not served', async () => {
    // Served, it would boot and be unreachable: /admin, /schemas and the two retired file
    // addresses are routes of their own (4.3).
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const data = await folder()
    await openStore(data, { ...ADMIN, ELSA_SEED_DIR: await seedOf([path.join(fixtures, 'cycle'), 'cycle']) })
    await cp(path.join(data, 'trees', 'cycle'), path.join(data, 'trees', 'theme'), { recursive: true })

    const store = await openStore(data, ADMIN)

    expect(store.publishedIds()).toEqual(['cycle'])
    expect(store.refused()).toEqual([{ id: 'theme', reason: 'Tree "theme": "theme" is a reserved word (application.md 4.3)' }])
  })

  test('zero Trees is a valid store', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    const store = await openStore(await folder(), { ...ADMIN, ELSA_SEED_DIR: await folder() })

    expect(store.publishedIds()).toEqual([])
  })

  test('swap puts a Tree in the set and takes it out, without a restart (18.2)', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const data = await folder()
    const store = await openStore(data, { ...ADMIN, ELSA_SEED_DIR: await seedOf([path.join(fixtures, 'cycle'), 'cycle']) })
    const cycle = store.published('cycle')!

    store.swap('cycle', null)
    expect(store.publishedIds()).toEqual([])
    store.swap('cycle', cycle)
    expect(store.published('cycle')).toBe(cycle)
  })
})

describe('importTree (17.4)', () => {
  test('refuses an id the store already has, and a reserved one', async () => {
    const treesDir = await folder()
    await importTree(path.join(fixtures, 'cycle'), treesDir, null)

    await expect(importTree(path.join(fixtures, 'cycle'), treesDir, null)).rejects.toThrow('already has a Tree')
    const reserved = await seedOf([path.join(fixtures, 'cycle'), 'schemas'])
    await expect(importTree(path.join(reserved, 'schemas'), treesDir, null)).rejects.toThrow('reserved word')
    expect(await readdir(treesDir)).toEqual(['cycle'])
  })

  test('**[#179]** an elsa-tree/4 folder is converted in its staging copy, and the source is not written (36.4)', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const source = path.join(await seedOf([path.join(fixtures, 'carousel'), 'carousel']), 'carousel')
    await writeAs4(path.join(source, 'tree.json'), ['refer'])
    const before = await readFile(path.join(source, 'tree.json'))
    const treesDir = await folder()

    const tree = await importTree(source, treesDir, null)

    expect(await tree.getNode('done')).toMatchObject({ kind: 'terminal', label: { en: 'Look elsewhere', nl: 'Elders geregeld' } })
    expect(conversions(log)).toEqual(['Converted Tree "carousel" tree.json from elsa-tree/4 to elsa-tree/5: 1 endings'])
    expect(await readFile(path.join(source, 'tree.json'))).toEqual(before)
    const stored = await readFile(path.join(treesDir, 'carousel', 'tree.json'), 'utf8')
    expect(JSON.parse(stored)).toMatchObject({ $schema: '/schemas/elsa-tree-5.json', format: 'elsa-tree/5' })
    expect(await readFile(path.join(treesDir, 'carousel', 'draft.json'), 'utf8')).toBe(stored)
    expect(await readdir(treesDir)).toEqual(['carousel'])
  })

  test('**[#179]** a folder refused is refused as before, from its copy, and nothing is left behind', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const treesDir = await folder()
    const source = path.join(await seedOf([path.join(fixtures, 'carousel'), 'carousel']), 'carousel')
    await writeAs4(path.join(source, 'tree.json'), ['maybe'])
    const before = await readFile(path.join(source, 'tree.json'))

    // An outcome the conversion cannot carry: the converted copy keeps it, and fails.
    await expect(importTree(source, treesDir, null)).rejects.toThrow('Tree "carousel" is invalid')
    expect(await readFile(path.join(source, 'tree.json'))).toEqual(before)
    // What the loader reads beside the file is copied as it stands, so a file named images is refused too.
    await expect(importTree(path.join(fixtures, 'invalid', 'v-dir'), treesDir, null)).rejects.toThrow('images must be a folder')
    await expect(importTree(path.join(fixtures, 'invalid', 'v-json'), treesDir, null)).rejects.toThrow('V-JSON')
    // A folder named tree.json is no file to copy: the copy lacks it, as the loader finds the source.
    const hollow = path.join(await seedOf([path.join(fixtures, 'carousel'), 'carousel']), 'carousel')
    await rm(path.join(hollow, 'tree.json'))
    await mkdir(path.join(hollow, 'tree.json'))
    await expect(importTree(hollow, treesDir, null)).rejects.toThrow('carousel  tree.json  -  V-DIR  tree.json is missing')
    expect(await readdir(treesDir)).toEqual([])
  })

  test("**[#179]** an elsa-tree/4 folder whose converted copy fails is refused with that copy's violations, and nothing is left behind (12.7.1 step 8)", async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const treesDir = await folder()
    const source = path.join(await seedOf([path.join(fixtures, 'carousel'), 'carousel']), 'carousel')
    const file = path.join(source, 'tree.json')
    await writeAs4(file, ['refer'])
    // A title one character over 5.7's limit: a content rule, which the /4 file's own schema errors would hide.
    const tree = JSON.parse(await readFile(file, 'utf8')) as { title: { en: string } }
    tree.title.en = 'T'.repeat(81)
    await writeFile(file, `${JSON.stringify(tree, null, 2)}\n`)
    const before = await readFile(file)

    await expect(importTree(source, treesDir, null)).rejects.toThrow(TreeInvalid)
    await expect(importTree(source, treesDir, null)).rejects.toMatchObject({
      violations: [{ file: 'manifest', keyPath: 'title.en', rule: 'V-LENGTH', message: '81 characters; at most 80' }],
    })
    expect(await readFile(file)).toEqual(before)
    expect(await readdir(treesDir)).toEqual([])
  })

  test('**[#179]** an elsa-tree/4 folder whose shape the byte form cannot carry is refused with the schema\'s violation, not a TypeError (12.7.1 step 8)', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const treesDir = await folder()
    const source = path.join(await seedOf([path.join(fixtures, 'carousel'), 'carousel']), 'carousel')
    const file = path.join(source, 'tree.json')
    await writeAs4(file, ['refer'])
    const four = await readFile(file, 'utf8')
    // The writer of 3.7 walks every list key's value as a list of objects: an object where a
    // list is, at a Node or at the top, and a list holding null each make it throw.
    const shapes: Array<[edit: (tree: { nodes: Array<Record<string, unknown>> }) => unknown, keyPath: string, message: string]> = [
      [(tree) => (tree.nodes[0]!.sources = {}), '/nodes/0/sources', 'must be array'],
      [(tree) => (tree.nodes[0]!.images = [null]), '/nodes/0/images/0', 'must be object'],
      [(tree) => Object.assign(tree, { nodes: {} }), '/nodes', 'must be array'],
    ]
    for (const [edit, keyPath, message] of shapes) {
      await writeFile(file, four)
      await rewrite(file, edit)
      const before = await readFile(file)

      await expect(importTree(source, treesDir, null)).rejects.toMatchObject({
        name: 'TreeInvalid',
        violations: [{ file: 'tree.json', keyPath, rule: 'schema', message }],
      })
      expect(await readFile(file)).toEqual(before)
      expect(await readdir(treesDir)).toEqual([])
    }
  })
})

describe('**[#179]** a data directory written by a release before elsa-tree/5 (36.4)', () => {
  test('its elsa-tree/4 files are converted before any Tree is opened, one line each, and the Trees are served and editable', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const data = await folder()
    await openStore(data, { ...ADMIN, ELSA_SEED_DIR: await seedOf([path.join(fixtures, 'carousel'), 'carousel'], [path.join(fixtures, 'cycle'), 'cycle']) })
    for (const id of ['carousel', 'cycle']) {
      await writeAs4(path.join(data, 'trees', id, 'tree.json'), ['prohibited'])
      await writeAs4(path.join(data, 'trees', id, 'draft.json'), ['prohibited'])
    }
    const meta = await readFile(path.join(data, 'trees', 'cycle', 'meta.json'), 'utf8')
    log.mockClear()

    const store = await openStore(data, ADMIN)

    expect(conversions(log)).toEqual([
      'Converted Tree "carousel" tree.json from elsa-tree/4 to elsa-tree/5: 1 endings',
      'Converted Tree "carousel" draft.json from elsa-tree/4 to elsa-tree/5: 1 endings',
      'Converted Tree "cycle" tree.json from elsa-tree/4 to elsa-tree/5: 1 endings',
      'Converted Tree "cycle" draft.json from elsa-tree/4 to elsa-tree/5: 1 endings',
    ])
    expect(store.publishedIds()).toEqual(['carousel', 'cycle'])
    expect(await store.published('carousel')!.getNode('done')).toMatchObject({ kind: 'terminal', label: { en: 'Prohibited', nl: 'Verboden' } })
    const converted = await readFile(path.join(data, 'trees', 'carousel', 'tree.json'), 'utf8')
    expect(JSON.parse(converted)).toMatchObject({ $schema: '/schemas/elsa-tree-5.json', format: 'elsa-tree/5' })
    // The two copies converted alike, so the public copy is still the draft's (19.4).
    expect(await readFile(path.join(data, 'trees', 'carousel', 'draft.json'), 'utf8')).toBe(converted)
    // No creator wrote.
    expect(await readFile(path.join(data, 'trees', 'cycle', 'meta.json'), 'utf8')).toBe(meta)
    const admin = store.accounts.all().find((account) => account.administrator)!
    expect(store.drafts.entry(admin, 'carousel')).toMatchObject({ publicCopyCurrent: true, blocking: [] })
    const written = await store.drafts.write(admin, 'carousel', 'done', { path: 'terminal.label.en', value: 'Not allowed' })
    expect(written.node!.label).toEqual({ en: 'Not allowed', nl: 'Verboden' })

    // Converted once: the next start finds nothing to do.
    log.mockClear()
    await openStore(data, ADMIN)
    expect(conversions(log)).toEqual([])
  })

  test('a file the disk will not take is left as it was, its Tree refused, and the start goes on (18.3)', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const data = await folder()
    await openStore(data, { ...ADMIN, ELSA_SEED_DIR: await seedOf([path.join(fixtures, 'carousel'), 'carousel'], [path.join(fixtures, 'cycle'), 'cycle']) })
    const published = path.join(data, 'trees', 'cycle', 'tree.json')
    await writeAs4(published, ['refer'])
    const before = await readFile(published, 'utf8')
    refusedWrite.file = published

    const store = await openStore(data, ADMIN)

    expect(errors.mock.calls.map((call) => String(call[0]))).toContain(`Not converted: Tree "cycle" tree.json: EIO: i/o error, open '${published}.tmp'`)
    expect(await readFile(published, 'utf8')).toBe(before)
    expect(store.publishedIds()).toEqual(['carousel'])
    expect(store.refused().map(({ id }) => id)).toEqual(['cycle'])
  })

  test('a file the conversion cannot carry is left as it was: its Tree refused, or held uneditable (18.3, 19.5)', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const data = await folder()
    await openStore(data, { ...ADMIN, ELSA_SEED_DIR: await seedOf([path.join(fixtures, 'carousel'), 'carousel'], [path.join(fixtures, 'cycle'), 'cycle']) })
    const published = path.join(data, 'trees', 'cycle', 'tree.json')
    const draft = path.join(data, 'trees', 'carousel', 'draft.json')
    await writeAs4(published, ['maybe'])
    await writeAs4(draft, ['maybe'])
    const before = [await readFile(published, 'utf8'), await readFile(draft, 'utf8')]
    log.mockClear()

    const store = await openStore(data, ADMIN)

    expect(conversions(log)).toEqual([])
    expect(errors.mock.calls.map((call) => String(call[0]).split('\n')[0])).toEqual([
      'Not converted: Tree "carousel" draft.json: the converted file would be invalid:',
      'Not converted: Tree "cycle" tree.json: the converted file would be invalid:',
    ])
    expect([await readFile(published, 'utf8'), await readFile(draft, 'utf8')]).toEqual(before)
    expect(store.publishedIds()).toEqual(['carousel'])
    expect(store.refused().map(({ id }) => id)).toEqual(['cycle'])
    const admin = store.accounts.all().find((account) => account.administrator)!
    expect(store.drafts.entry(admin, 'carousel').manifest).toBeNull()
  })

  test('a file whose converted result breaks a rule is left as it was, and the start prints the violations that stopped it (12.7.1 step 8)', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const data = await folder()
    await openStore(data, { ...ADMIN, ELSA_SEED_DIR: await seedOf([path.join(fixtures, 'carousel'), 'carousel'], [path.join(fixtures, 'cycle'), 'cycle']) })
    const dir = path.join(data, 'trees', 'carousel')
    const files = [path.join(dir, 'tree.json'), path.join(dir, 'draft.json')]
    for (const file of files) await writeAs4(file, ['refer'])
    // A picture missing from images/: a content rule, which the /4 file's own schema errors would
    // hide, and one a draft is held to as well (19.2).
    await rm(path.join(dir, 'images', 'barn.svg'))
    const before = await Promise.all(files.map((file) => readFile(file, 'utf8')))
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})

    const store = await openStore(data, ADMIN)

    const missing = `carousel  two  images[0].file  V-IMAGE  "barn.svg" is not in the Tree's images/ folder`
    expect(errors.mock.calls.map((call) => String(call[0]))).toEqual([
      `Not converted: Tree "carousel" tree.json: the converted file would be invalid:\n${missing}`,
      `Not converted: Tree "carousel" draft.json: the converted file would be invalid:\n${missing}`,
    ])
    expect(await Promise.all(files.map((file) => readFile(file, 'utf8')))).toEqual(before)
    expect(store.publishedIds()).toEqual(['cycle'])
    expect(store.refused().map(({ id }) => id)).toEqual(['carousel'])
  })

  test('a file whose shape the byte form cannot carry is left as it was, and the start prints the schema\'s violation, not a TypeError (12.7.1 step 8)', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const data = await folder()
    await openStore(data, { ...ADMIN, ELSA_SEED_DIR: await seedOf([path.join(fixtures, 'carousel'), 'carousel'], [path.join(fixtures, 'cycle'), 'cycle']) })
    const dir = path.join(data, 'trees', 'carousel')
    const files = [path.join(dir, 'tree.json'), path.join(dir, 'draft.json')]
    for (const file of files) {
      await writeAs4(file, ['refer'])
      await rewrite(file, (tree) => (tree.nodes[0]!.sources = {}))
    }
    const before = await Promise.all(files.map((file) => readFile(file, 'utf8')))
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})

    const store = await openStore(data, ADMIN)

    // The draft schema drops no `type` (19.2), so the draft is stopped by the same violation.
    const shape = 'carousel  tree.json  /nodes/0/sources  schema  must be array'
    expect(errors.mock.calls.map((call) => String(call[0]))).toEqual([
      `Not converted: Tree "carousel" tree.json: the converted file would be invalid:\n${shape}`,
      `Not converted: Tree "carousel" draft.json: the converted file would be invalid:\n${shape}`,
    ])
    expect(await Promise.all(files.map((file) => readFile(file, 'utf8')))).toEqual(before)
    expect(store.publishedIds()).toEqual(['cycle'])
    expect(store.refused().map(({ id }) => id)).toEqual(['carousel'])
    const admin = store.accounts.all().find((account) => account.administrator)!
    expect(store.drafts.entry(admin, 'carousel').manifest).toBeNull()
  })
})

describe('the data directory itself (17.1, 17.3)', () => {
  test('the lock refuses a second process while the first lives, and is taken over after it', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const data = await folder()
    const other = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 60000)'], { stdio: 'ignore' })
    try {
      await writeFile(path.join(data, 'lock'), `${other.pid}\n`)
      await expect(openStore(data, { ...ADMIN, ELSA_SEED_DIR: await folder() })).rejects.toThrow(`in use by process ${other.pid}`)
    } finally {
      other.kill()
      await new Promise((done) => other.once('exit', done))
    }

    await openStore(data, { ...ADMIN, ELSA_SEED_DIR: await folder() })
    expect((await readFile(path.join(data, 'lock'), 'utf8')).trim()).toBe(String(process.pid))
  })

  test('a start deletes what an interrupted write left, and a half-done seed is done again', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const data = await folder()
    await mkdir(path.join(data, 'trees.tmp', 'half'), { recursive: true })
    await writeFile(path.join(data, 'accounts.json.tmp'), '{')

    const store = await openStore(data, { ...ADMIN, ELSA_SEED_DIR: await seedOf([path.join(fixtures, 'cycle'), 'cycle']) })

    expect(store.publishedIds()).toEqual(['cycle'])
    expect((await readdir(data)).sort()).toEqual(['accounts.json', 'lock', 'trees'])
  })

  test('a missing or unset data directory refuses to start; next dev creates it', async () => {
    const missing = path.join(await folder(), 'not-here')

    await expect(openConfiguredStore({})).rejects.toThrow('ELSA_DATA_DIR is not set')
    await expect(openConfiguredStore({ ELSA_DATA_DIR: missing })).rejects.toThrow('is not a folder')
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const developed = await openConfiguredStore({ ...ADMIN, ELSA_DATA_DIR: missing, NODE_ENV: 'development', ELSA_SEED_DIR: await folder() })
    expect(developed.publishedIds()).toEqual([])
  })

  test.for(['ELSA_TREE', 'ELSA_TREES_DIR', 'ELSA_TREE_LASTMOD'])('the retired %s refuses to start and names its replacement', async (name) => {
    const data = await folder()

    const refusal = openStore(data, { [name]: 'ai-act-example' })

    await expect(refusal).rejects.toThrow(`${name} is set, and is retired`)
    await expect(refusal).rejects.toThrow(name === 'ELSA_TREES_DIR' ? 'ELSA_SEED_DIR' : 'docs/deployment.md')
    // Refused before anything is touched: not even the lock is taken.
    expect(await readdir(data)).toEqual([])
  })
})

describe('writeAtomic (17.3)', () => {
  test('two writes to one file land in the order accepted', async () => {
    const file = path.join(await folder(), 'meta.json')

    await Promise.all([writeAtomic(file, 'first'), writeAtomic(file, 'second')])

    expect(await readFile(file, 'utf8')).toBe('second')
  })

  test('a reader mid-write sees the old bytes or the new, never a mix', async () => {
    const file = path.join(await folder(), 'draft.json')
    const old = 'a'.repeat(4_000_000)
    const next = 'b'.repeat(4_000_000)
    await writeAtomic(file, old)

    const seen = new Set<string>()
    const writing = writeAtomic(file, next)
    let done = false
    const settle = (): void => {
      done = true
    }
    writing.then(settle, settle)
    while (!done) {
      const bytes = await readFile(file, 'utf8').catch(() => null)
      if (bytes !== null) seen.add(bytes === old ? 'old' : bytes === next ? 'new' : 'torn')
      // Let the writer's rename in between reads: Windows refuses it while a read is open.
      await new Promise((wake) => setTimeout(wake, 5))
    }
    await writing
    seen.add((await readFile(file, 'utf8')) === next ? 'new' : 'torn')

    expect(seen.has('torn')).toBe(false)
    expect(seen.has('new')).toBe(true)
  })
})
