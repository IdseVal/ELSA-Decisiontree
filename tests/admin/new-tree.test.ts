/**
 * The new-Tree form's rules that need no browser (docs/specs/application.md 27.1, 27.2): the
 * editor's address it lands on and which field a refusal of
 * `POST /admin/api/trees` is shown at. The form itself is `creators-overview.spec.ts`'s.
 */
import { describe, expect, it } from 'vitest'
import { editorHref, refusalOf, type NewTreeWords } from '../../src/editor/NewTreeForm.tsx'
import { isUrl } from '../../src/tree/grammar.ts'

const WORDS = {
  treeIdTaken: 'taken',
  treeIdReserved: 'reserved',
  languageHint: 'tag',
  requestFailed: 'failed',
} as NewTreeWords

describe('editorHref', () => {
  it('lands in the page language when the Tree declares it, the query left out for the default', () => {
    expect(editorHref('my-tree', ['en', 'nl'], 'en')).toBe('/admin/trees/my-tree/start')
    expect(editorHref('my-tree', ['en', 'nl'], 'nl')).toBe('/admin/trees/my-tree/start?lang=nl')
    expect(editorHref('my-tree', ['nl', 'en'], 'nl')).toBe('/admin/trees/my-tree/start')
  })

  it("lands in the Tree's default when it does not declare the page language", () => {
    expect(editorHref('my-tree', ['de', 'fr'], 'nl')).toBe('/admin/trees/my-tree/start')
  })
})

describe('refusalOf', () => {
  it('is null for the 201', () => {
    expect(refusalOf({ status: 201, body: null }, WORDS)).toBeNull()
  })

  it('shows a taken id and a reserved word at the id', () => {
    expect(refusalOf({ status: 409, body: { error: 'tree-id-taken' } }, WORDS)).toEqual({ field: 'id', text: 'taken' })
    expect(refusalOf({ status: 422, body: { error: 'malformed', violations: [{ keyPath: 'id' }] } }, WORDS)).toEqual({
      field: 'id',
      text: 'reserved',
    })
  })

  it('shows a refused tag at the languages, from the route and from the schema', () => {
    expect(refusalOf({ status: 422, body: { error: 'malformed', violations: [{ keyPath: 'languages' }] } }, WORDS)).toEqual({
      field: 'languages',
      text: 'tag',
    })
    expect(refusalOf({ status: 422, body: { error: 'blocking', violations: [{ keyPath: '/languages/1' }] } }, WORDS)).toEqual({
      field: 'languages',
      text: 'tag',
    })
  })

  it('says the request failed for a network failure, a 5xx and any other refusal', () => {
    expect(refusalOf(null, WORDS)).toEqual({ field: 'form', text: 'failed' })
    expect(refusalOf({ status: 500, body: null }, WORDS)).toEqual({ field: 'form', text: 'failed' })
    expect(refusalOf({ status: 401, body: { error: 'unauthenticated' } }, WORDS)).toEqual({ field: 'form', text: 'failed' })
  })
})

describe('the URL grammar the add-Source Sheet checks before it sends (28.1, the schema\u2019s url)', () => {
  it('an absolute http(s) URL with a host passes; a bare scheme, a space, another scheme or no scheme does not', () => {
    for (const url of ['https://example.org', 'http://a.b/c?d=e#f', 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj']) expect(isUrl(url), url).toBe(true)
    for (const url of ['https://', 'https://a b', 'ftp://example.org', 'example.org', '', 42, null]) expect(isUrl(url), String(url)).toBe(false)
  })
})
