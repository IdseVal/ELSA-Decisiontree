/**
 * The store's read side (docs/specs/application.md 17, 18.3, 23.7): the seed at first
 * start and never again, a hidden Tree out of the set, an invalid published Tree refused
 * and the rest served, the lock, whole files in order, and the three retired variables.
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
import { ADMIN } from './admin.ts'

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

/** A seed folder holding a copy of each named fixture, under its own id. */
async function seedOf(...entries: Array<[from: string, id: string]>): Promise<string> {
  const seed = await folder()
  for (const [from, id] of entries) await cp(from, path.join(seed, id), { recursive: true })
  return seed
}

afterEach(async () => {
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
    await writeFile(path.join(data, 'trees', 'cycle', 'tree.json'), '{ "format": "elsa-tree/4" ')

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
    const anna = await first.accounts.create(admin, 'Anna', 'anna', 'annas first password')
    const cookieOf = async (account: typeof admin): Promise<string> => (await first.sessions.start(account)).cookie.split(';')[0]!
    const adminCookie = await cookieOf(admin)
    const annaCookie = await cookieOf(anna)

    // A restart with the variable still set to the same password is no reset (20.3).
    const again = await openStore(data, ADMIN)
    expect(again.accounts.adminPasswordReplaced).toBe(false)
    expect(await again.sessions.resolve(adminCookie)).not.toBeNull()

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
