/**
 * **[#136]** `npm run store -- import <folder>` (docs/specs/application.md 17.4), run as a
 * deployer runs it: plain Node, `ELSA_DATA_DIR` set. A valid Tree is imported published, with
 * the administrator as creator; one the store has and one that is not valid are refused with
 * exit code 1 and nothing written.
 */
import { spawnSync } from 'node:child_process'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { ADMIN_PASSWORD } from './admin.ts'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
let data: string
let seed: string

beforeAll(async () => {
  data = await mkdtemp(path.join(tmpdir(), 'elsa-import-'))
  seed = await mkdtemp(path.join(tmpdir(), 'elsa-import-seed-'))
})

afterAll(async () => {
  await rm(data, { recursive: true, force: true })
  await rm(seed, { recursive: true, force: true })
})

function run(folder: string): { status: number | null; output: string } {
  const result = spawnSync(process.execPath, ['scripts/store.ts', 'import', folder], {
    cwd: root,
    env: { ...process.env, ELSA_DATA_DIR: data, ELSA_ADMIN_PASSWORD: ADMIN_PASSWORD, ELSA_SEED_DIR: seed },
    encoding: 'utf8',
  })
  return { status: result.status, output: result.stdout + result.stderr }
}

test('a valid Tree is imported, published, the administrator its creator; twice is refused', async () => {
  const first = run('tests/fixtures/cycle')
  expect(first.output).toContain('Imported Tree "cycle"')
  expect(first.status).toBe(0)
  const folder = path.join(data, 'trees', 'cycle')
  expect((await readdir(folder)).sort()).toEqual(['draft.json', 'meta.json', 'tree.json'])
  expect(await readFile(path.join(folder, 'draft.json'), 'utf8')).toBe(await readFile(path.join(root, 'tests/fixtures/cycle/tree.json'), 'utf8'))
  const accounts = JSON.parse(await readFile(path.join(data, 'accounts.json'), 'utf8')) as Array<{ id: string; administrator: boolean }>
  expect(JSON.parse(await readFile(path.join(folder, 'meta.json'), 'utf8')).creator).toBe(accounts.find((account) => account.administrator)!.id)

  const again = run('tests/fixtures/cycle')
  expect(again.status).toBe(1)
  expect(again.output).toContain('the store already has a Tree with this id')
})

test('a Tree that fails validation is refused with its violations, and nothing is written', async () => {
  const refused = run('tests/fixtures/invalid/v-answers')
  expect(refused.status).toBe(1)
  expect(refused.output).toContain("v-answers  tree.json  /nodes/0/answers  schema  must have required property 'no'")
  expect(await readdir(path.join(data, 'trees'))).toEqual(['cycle'])
})
