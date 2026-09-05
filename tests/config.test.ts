/**
 * Tree selection (docs/specs/application.md section 2): one deployment serves exactly one
 * Tree, there is no default, and a deployment that names no usable Tree refuses to start
 * with a message that says what it did find.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { openConfiguredTree, servedTree, type Environment } from '../src/config.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const treesDir = path.join(here, '..', 'trees')
const fixturesDir = path.join(here, 'fixtures')

/** The error message, or '' when the Tree opened. */
async function refusal(env: Environment): Promise<string> {
  return openConfiguredTree(env).then(
    () => '',
    (error: Error) => error.message,
  )
}

describe('the configured Tree', () => {
  test('ELSA_TREE names the folder under ELSA_TREES_DIR that is served', async () => {
    const tree = await openConfiguredTree({ ELSA_TREE: 'ai-act-example', ELSA_TREES_DIR: treesDir })

    expect(tree.id).toBe('ai-act-example')
    expect(tree.manifest.languages).toEqual(['en', 'nl'])
  })

  test('ELSA_TREES_DIR defaults to trees/ under the working directory', async () => {
    const tree = await openConfiguredTree({ ELSA_TREE: 'ai-act-example' })

    expect(tree.id).toBe('ai-act-example')
  })

  test('the process opens and validates its Tree once', async () => {
    // servedTree reads the real environment, the way the server does.
    process.env.ELSA_TREE = 'ai-act-example'

    // The Node page asks for the served Tree on every request; it must not re-read the folder.
    expect(await servedTree()).toBe(await servedTree())
  })
})

describe('a deployment that names no usable Tree refuses to start', () => {
  test('there is no default Tree', async () => {
    const message = await refusal({ ELSA_TREES_DIR: treesDir })

    expect(message).toContain('ELSA_TREE is not set')
    expect(message).toContain('ai-act-example')
  })

  test('a reserved word is refused before anything is read', async () => {
    // `images` is the image route's path segment (application.md 4.3).
    const message = await refusal({ ELSA_TREE: 'images', ELSA_TREES_DIR: treesDir })

    expect(message).toContain('reserved')
    expect(message).toContain('ai-act-example')
  })

  test('a missing folder is refused, and the message lists the Tree ids found', async () => {
    const message = await refusal({ ELSA_TREE: 'no-such-tree', ELSA_TREES_DIR: treesDir })

    expect(message).toContain('no-such-tree')
    expect(message).toContain('is not a folder')
    expect(message).toContain('Tree ids found')
    expect(message).toContain('ai-act-example')
  })

  test('an invalid Tree is refused, with every violation in the message', async () => {
    const message = await refusal({ ELSA_TREE: 'v-terminal', ELSA_TREES_DIR: path.join(fixturesDir, 'invalid') })

    expect(message).toContain('V-TERMINAL')
    expect(message).toContain('nodes/yes-end.yaml')
  })
})
