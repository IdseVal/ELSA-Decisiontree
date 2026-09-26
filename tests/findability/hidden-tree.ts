/**
 * A data directory of two Trees, one hidden (docs/specs/application.md 23.7): the example
 * Tree published and the `findability` fixture seeded and then unpublished -- its
 * `tree.json` removed, which is what unpublishing is (17.2). The findability documents are
 * built from what the store then serves, as the routes build them.
 *
 * Not a test file: `sitemap.test.ts` and `llms.test.ts` import it.
 */
import { cp, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { openStore } from '../../src/store/index.ts'
import { ADMIN } from '../store/admin.ts'
import type { Tree } from '../../src/tree/loader.ts'

const here = path.dirname(fileURLToPath(import.meta.url))

/** The id of the hidden Tree: the one that must appear nowhere. */
export const HIDDEN_ID = 'findability'

/** The served Trees of that store, in its id order, and a function that removes its folders. */
export async function servedWithHiddenTree(): Promise<{ trees: Tree[]; remove: () => Promise<void> }> {
  const seed = await mkdtemp(path.join(tmpdir(), 'elsa-seed-'))
  const data = await mkdtemp(path.join(tmpdir(), 'elsa-data-'))
  await cp(path.join(here, '..', '..', 'trees', 'ai-act-example'), path.join(seed, 'ai-act-example'), { recursive: true })
  await cp(path.join(here, '..', 'fixtures', HIDDEN_ID), path.join(seed, HIDDEN_ID), { recursive: true })
  const log = console.log
  console.log = () => {}
  try {
    await openStore(data, { ...ADMIN, ELSA_SEED_DIR: seed })
    await rm(path.join(data, 'trees', HIDDEN_ID, 'tree.json'))
    const store = await openStore(data, {})
    return {
      trees: store.publishedIds().map((id) => store.published(id)!),
      remove: async () => {
        await rm(seed, { recursive: true, force: true })
        await rm(data, { recursive: true, force: true })
      },
    }
  } finally {
    console.log = log
  }
}
