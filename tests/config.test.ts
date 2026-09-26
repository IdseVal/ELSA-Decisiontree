/**
 * What a deployment configures (docs/specs/application.md 17.1, docs/deployment.md): the
 * data directory its one store lives in -- whose refusals are tests/store/store.test.ts's
 * -- and the public base URL its readers reach it at.
 */
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, test, vi } from 'vitest'
import { baseUrl, publicBaseUrl, store, type Environment } from '../src/config.ts'

describe('the configured store', () => {
  let dataDir: string

  afterAll(async () => {
    await rm(dataDir, { recursive: true, force: true })
  })

  test('the process opens its store once, however many bundles ask for it', async () => {
    // store() reads the real environment, the way the server does.
    dataDir = await mkdtemp(path.join(tmpdir(), 'elsa-config-'))
    process.env.ELSA_DATA_DIR = dataDir
    vi.spyOn(console, 'log').mockImplementation(() => {})

    // Every route asks for the store on every request; it must not re-open the directory,
    // and a second copy of this module -- Next.js bundles instrumentation apart -- must get
    // the same store, which is why it is held on globalThis.
    const first = await store()
    vi.resetModules()
    const again = await (await import('../src/config.ts')).store()
    expect(again).toBe(first)
    expect(first.publishedIds()).toEqual(['ai-act-applicability-agrifood', 'ai-act-example'])
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

/**
 * The base every absolute URL of section 16 is built against. A deployment that names one
 * is answered it; one that names none is answered the origin the request arrived on --
 * `ELSA_BASE_URL`'s fallback since #118, because a sitemap read away from the page it came
 * from cannot resolve a path.
 */
describe('the base a findability document is built against (16)', () => {
  const origin = (headers: Record<string, string>, env: Environment = {}): string =>
    baseUrl(new Headers(headers), env).origin

  test('ELSA_BASE_URL wins, and then no header is read at all', () => {
    const env = { ELSA_BASE_URL: 'https://elsa.example.org' }

    expect(origin({ host: 'attacker.example' }, env)).toBe('https://elsa.example.org')
    expect(origin({ 'x-forwarded-host': 'attacker.example', 'x-forwarded-proto': 'https' }, env)).toBe(
      'https://elsa.example.org',
    )
  })

  test('without it, the origin the request arrived on', () => {
    expect(origin({ host: '127.0.0.1:3117' })).toBe('http://127.0.0.1:3117')
    expect(origin({ 'x-forwarded-host': 'elsa.example.org', 'x-forwarded-proto': 'https' })).toBe(
      'https://elsa.example.org',
    )
  })

  test('a proxy list gives its first value', () => {
    expect(origin({ 'x-forwarded-host': 'elsa.example.org, inner.example', 'x-forwarded-proto': 'https, http' })).toBe(
      'https://elsa.example.org',
    )
  })

  test('a host that is not a host is dropped rather than parsed', () => {
    // The header is whatever the caller sent. It is only ever used to build these URLs --
    // never fetched, never redirected to -- and a value that could carry a path, a scheme
    // or markup into one does not become part of a URL at all.
    for (const host of ['elsa.example.org/tool', 'https://elsa.example.org', 'a<script>b', 'a b', '']) {
      expect(origin({ host }), host).toBe('http://localhost')
    }
    expect(origin({})).toBe('http://localhost')
  })

  test('only `https` makes an https origin', () => {
    expect(origin({ host: 'elsa.example.org', 'x-forwarded-proto': 'HTTPS' })).toBe('http://elsa.example.org')
    expect(origin({ host: 'elsa.example.org', 'x-forwarded-proto': 'javascript' })).toBe('http://elsa.example.org')
  })
})
