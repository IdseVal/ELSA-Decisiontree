/**
 * The new-Tree form's rules that need no browser (docs/specs/application.md 27.1, 27.2): the
 * id proposed from a title, the editor's address it lands on, and which field a refusal of
 * `POST /admin/api/trees` is shown at. The form itself is `creators-overview.spec.ts`'s.
 */
import { describe, expect, it } from 'vitest'
import { editorHref, proposedId, refusalOf, type NewTreeWords } from '../../src/editor/NewTreeForm.tsx'
import { isId } from '../../src/tree/grammar.ts'

const WORDS = {
  treeIdTaken: 'taken',
  treeIdReserved: 'reserved',
  languageHint: 'tag',
  requestFailed: 'failed',
} as NewTreeWords

describe('proposedId', () => {
  it('lower-cases a title and makes every run outside [a-z0-9] one hyphen, none at either end', () => {
    expect(proposedId('Does the AI Act apply?')).toBe('does-the-ai-act-apply')
    expect(proposedId('  --AI   Act -- 2024!! ')).toBe('ai-act-2024')
    expect(proposedId('Één wet')).toBe('n-wet')
  })

  it('cuts at 64 and leaves no hyphen at the cut', () => {
    const cut = proposedId(`${'a'.repeat(63)} b`)
    expect(cut).toBe('a'.repeat(63))
    expect(proposedId('word '.repeat(30)).length).toBeLessThanOrEqual(64)
    expect(isId(proposedId('word '.repeat(30)))).toBe(true)
  })

  it('proposes nothing from a title without a letter or digit', () => {
    expect(proposedId('?!')).toBe('')
  })
})

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
