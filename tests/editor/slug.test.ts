/**
 * The id proposed from a text (docs/specs/application.md 27.1, 32.1; ADR-133-explainers-in-
 * the-editor decision 1): a new Tree's from its title, a new explainer's from the words it
 * marks, with `-2`, `-3` while the id is taken on the Node.
 */
import { describe, expect, it } from 'vitest'
import { explainerId, proposedId, treeIdOf } from '../../src/editor/slug.ts'
import { isId } from '../../src/tree/grammar.ts'

describe('proposedId', () => {
  it('lower-cases a title and makes every run outside [a-z0-9] one hyphen, none at either end', () => {
    expect(proposedId('Does the AI Act apply?')).toBe('does-the-ai-act-apply')
    expect(proposedId('  --AI   Act -- 2024!! ')).toBe('ai-act-2024')
    expect(proposedId('Één wet')).toBe('n-wet')
  })

  it('gives back the examples of tree-format.md 3.1 unchanged, and derives them from their words', () => {
    for (const id of ['start', 'prohibited-practices', 'jurisdiction-1', 'annex-iii-area-5']) expect(proposedId(id)).toBe(id)
    expect(proposedId('Prohibited practices')).toBe('prohibited-practices')
    expect(proposedId('Annex III, area 5')).toBe('annex-iii-area-5')
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

describe('explainerId', () => {
  it('derives the id from a selection', () => {
    expect(explainerId('provider', [])).toBe('provider')
    expect(explainerId('Provider (EU)', [])).toBe('provider-eu')
    expect(explainerId('aanbieder', [])).toBe('aanbieder')
  })

  it('refuses an all-punctuation selection: nothing is proposed', () => {
    expect(explainerId('(!) -- ?', [])).toBe('')
  })

  it('cuts a 70-character selection to an id of at most 64', () => {
    const selection = 'the provider of a general-purpose AI model with systemic risk in the EU'
    expect(selection).toHaveLength(71)
    const id = explainerId(selection, [])
    expect(id).toBe('the-provider-of-a-general-purpose-ai-model-with-systemic-risk-in')
    expect(isId(id)).toBe(true)
    expect(explainerId('x'.repeat(70), [])).toBe('x'.repeat(64))
  })

  it('appends -2, -3 while the id is taken on this Node', () => {
    expect(explainerId('Provider', ['provider'])).toBe('provider-2')
    expect(explainerId('providers', ['provider'])).toBe('providers')
    expect(explainerId('provider', ['provider', 'provider-2'])).toBe('provider-3')
  })

  it('keeps a suffixed id within 64 characters', () => {
    const long = 'x'.repeat(64)
    expect(explainerId(long, [long])).toBe(`${'x'.repeat(62)}-2`)
    expect(isId(explainerId(long, [long]))).toBe(true)
  })
})

describe('treeIdOf (#168)', () => {
  it('derives a new Tree address from its title, accents folded to their letters', () => {
    expect(treeIdOf('Does the AI Act apply?', [])).toBe('does-the-ai-act-apply')
    expect(treeIdOf('Één wet, één café', [])).toBe('een-wet-een-cafe')
  })

  it('falls back to tree for a title without a letter or digit of the id alphabet', () => {
    expect(treeIdOf('?!', [])).toBe('tree')
    expect(treeIdOf('Закон', [])).toBe('tree')
    expect(treeIdOf('?!', ['tree'])).toBe('tree-2')
  })

  it('appends -2, -3 past the addresses the route refused, within 64 characters', () => {
    expect(treeIdOf('AI Act', ['ai-act'])).toBe('ai-act-2')
    expect(treeIdOf('AI Act', ['ai-act', 'ai-act-2'])).toBe('ai-act-3')
    expect(treeIdOf('Admin', ['admin'])).toBe('admin-2')
    const long = 'x'.repeat(70)
    expect(treeIdOf(long, ['x'.repeat(64)])).toBe(`${'x'.repeat(62)}-2`)
  })
})
