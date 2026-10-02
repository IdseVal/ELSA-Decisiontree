/**
 * The new-Tree form's rules that need no browser (docs/specs/application.md 27.1, 27.2): the
 * editor's address it lands on, **[#168]** the address it creates the Tree at without asking,
 * and where a refusal of `POST /admin/api/trees` is shown. The form itself is
 * `creators-overview.spec.ts`'s.
 */
import { describe, expect, it } from 'vitest'
import { createTree, editorHref, refusalOf, type NewTreeWords } from '../../src/editor/NewTreeForm.tsx'
import type { Answer } from '../../src/editor/request.ts'
import { isUrl } from '../../src/tree/grammar.ts'

const WORDS = {
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

describe('createTree (#168)', () => {
  /** A route that answers each posted id from `answers`, 201 for any other, and records what it was sent. */
  function route(answers: Record<string, Answer | null>) {
    const sent: { id: string; languages: string[]; title: Record<string, string> }[] = []
    const post = async (creation: (typeof sent)[number]): Promise<Answer | null> => {
      sent.push(creation)
      return creation.id in answers ? answers[creation.id]! : { status: 201, body: null }
    }
    return { sent, post }
  }
  const TAKEN: Answer = { status: 409, body: { error: 'tree-id-taken' } }
  const RESERVED: Answer = { status: 422, body: { error: 'malformed', violations: [{ keyPath: 'id' }] } }

  it("creates the Tree at its default language's title's address, a language without a title empty", async () => {
    const { sent, post } = route({})
    const titles = { en: 'Data Act: does it apply?', nl: 'Is de Dataverordening van toepassing?', de: 'Gilt der Data Act?' }
    expect(await createTree(titles, ['nl', 'en', 'fr'], post)).toEqual({ id: 'is-de-dataverordening-van-toepassing', answer: { status: 201, body: null } })
    expect(sent).toEqual([
      {
        id: 'is-de-dataverordening-van-toepassing',
        languages: ['nl', 'en', 'fr'],
        title: { nl: 'Is de Dataverordening van toepassing?', en: 'Data Act: does it apply?', fr: '' },
      },
    ])
  })

  it('follows a taken address and a reserved word with the next, without asking', async () => {
    const taken = route({ 'ai-act-example': TAKEN, 'ai-act-example-2': TAKEN })
    expect((await createTree({ en: 'AI Act example' }, ['en'], taken.post)).id).toBe('ai-act-example-3')
    expect(taken.sent.map((creation) => creation.id)).toEqual(['ai-act-example', 'ai-act-example-2', 'ai-act-example-3'])

    const reserved = route({ admin: RESERVED })
    expect((await createTree({ en: 'Admin' }, ['en'], reserved.post)).id).toBe('admin-2')
  })

  it('stops at any other refusal, and after twenty refused addresses, with the last answer', async () => {
    const languages: Answer = { status: 422, body: { error: 'blocking', violations: [{ keyPath: '/languages/1' }] } }
    const refused = route({ tree: languages })
    expect(await createTree({ en: '?!' }, ['en', 'x'], refused.post)).toEqual({ id: 'tree', answer: languages })
    expect(refused.sent).toHaveLength(1)

    const failed = route({ tree: null })
    expect((await createTree({}, ['en'], failed.post)).answer).toBeNull()

    const sent: string[] = []
    const always = await createTree({ en: 'Busy' }, ['en'], async (creation) => (sent.push(creation.id), TAKEN))
    expect(sent).toHaveLength(20)
    expect(always).toEqual({ id: 'busy-20', answer: TAKEN })
    expect(refusalOf(always.answer, WORDS)).toEqual({ field: 'form', text: 'failed' })
  })
})

describe('the URL grammar the add-Source Sheet checks before it sends (28.1, the schema\u2019s url)', () => {
  it('an absolute http(s) URL with a host passes; a bare scheme, a space, another scheme or no scheme does not', () => {
    for (const url of ['https://example.org', 'http://a.b/c?d=e#f', 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj']) expect(isUrl(url), url).toBe(true)
    for (const url of ['https://', 'https://a b', 'ftp://example.org', 'example.org', '', 42, null]) expect(isUrl(url), String(url)).toBe(false)
  })
})
