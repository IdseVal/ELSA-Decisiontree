/**
 * What a deployment configures (docs/specs/application.md section 2, docs/deployment.md):
 * the Tree it serves -- exactly one, no default, and a deployment that names no usable Tree
 * refuses to start with a message that says what it did find -- and the public base URL its
 * readers reach it at.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { openConfiguredTree, publicBaseUrl, servedTree, type Environment } from '../src/config.ts'

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

describe('the public base URL', () => {
  /** The error message, or '' when the value was accepted. */
  function refusedBaseUrl(value: string): string {
    try {
      publicBaseUrl({ ELSA_BASE_URL: value })
      return ''
    } catch (error) {
      return (error as Error).message
    }
  }

  test('a deployment that names none is a valid deployment', () => {
    // Then the canonical link stays a path, which is right for every reader and short of
    // one address only for a crawler (docs/deployment.md).
    expect(publicBaseUrl({})).toBeUndefined()
    expect(publicBaseUrl({ ELSA_BASE_URL: '' })).toBeUndefined()
    expect(publicBaseUrl({ ELSA_BASE_URL: '   ' })).toBeUndefined()
  })

  test('an origin is read, with or without a trailing slash', () => {
    expect(publicBaseUrl({ ELSA_BASE_URL: 'https://elsa.example.org' })?.href).toBe('https://elsa.example.org/')
    expect(publicBaseUrl({ ELSA_BASE_URL: ' https://elsa.example.org/ ' })?.href).toBe('https://elsa.example.org/')
    expect(publicBaseUrl({ ELSA_BASE_URL: 'http://127.0.0.1:3000' })?.href).toBe('http://127.0.0.1:3000/')
  })

  // Three distinct refusals, pinned by the words that tell them apart, because
  // docs/deployment.md gives each one its own row for an operator to grep the journal
  // against: a table that promised one message for three failures would match one case in
  // three.
  test('a value that is not an http(s) origin is refused', () => {
    expect(refusedBaseUrl('elsa.example.org')).toContain('is not an absolute URL')
    expect(refusedBaseUrl('file:///opt/elsa')).toContain('only http and https are served')
    // The application has no basePath, so it cannot be served under a path. A base URL
    // that carries one would put an address in the canonical link that answers 404.
    expect(refusedBaseUrl('https://elsa.example.org/tool')).toContain('must be a bare origin')
    expect(refusedBaseUrl('https://elsa.example.org/?a=1')).toContain('must be a bare origin')
  })
})
