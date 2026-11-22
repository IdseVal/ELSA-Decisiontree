/**
 * **[#272]** What the overview's search bar matches (docs/specs/application.md 26.5): a Tree's
 * title and description in every language it declares, case- and accent-insensitive, every
 * word of the query somewhere in that text.
 */
import { describe, expect, test } from 'vitest'
import { foldForSearch, matchesSearch, searchText } from '../src/search.ts'
import type { Manifest } from '../src/tree/types.ts'

/** A manifest with the two fields the search reads; the rest is never looked at. */
function manifest(title: Manifest['title'], description?: Manifest['description']): Manifest {
  return { title, description } as Manifest
}

describe('folding', () => {
  test('lower-cases, drops accents and collapses spaces', () => {
    expect(foldForSearch('  Le RÈGLEMENT\n IA  ')).toBe('le reglement ia')
    expect(foldForSearch('Één café, naïef')).toBe('een cafe, naief')
  })
})

describe('the text a Tree is found by', () => {
  test('holds the title and the description in every declared language', () => {
    const text = searchText(manifest({ en: 'The fixture', nl: 'De carrousel' }, { fr: 'Un petit arbre' }))

    for (const word of ['fixture', 'carrousel', 'petit']) expect(text).toContain(word)
  })

  test("holds the description's words, not its marks", () => {
    const text = searchText(manifest({ en: 'T' }, { en: 'An **important** and [linked](https://example.org) text' }))

    expect(text).toContain('important and linked text')
    expect(text).not.toContain('**')
    expect(text).not.toContain('example.org')
  })

  test('without a description, is the titles alone', () => {
    expect(searchText(manifest({ de: 'Gilt die KI-Verordnung?' }))).toBe('gilt die ki-verordnung?')
  })
})

describe('matching', () => {
  const text = searchText(manifest({ fr: "Le règlement IA s'applique-t-il ?" }, { fr: 'Un petit arbre pour les tests.' }))

  test.for([
    ['regle', true],
    ['RÈGLEMENT', true],
    ['petit arbre', true],
    ['arbre petit', true],
    ['  arbre   ', true],
    ['arbre chat', false],
    ['tree', false],
  ] as const)('%j matches: %s', ([query, expected]) => {
    expect(matchesSearch(text, query)).toBe(expected)
  })

  test('an empty or blank query matches every Tree', () => {
    expect(matchesSearch(text, '')).toBe(true)
    expect(matchesSearch(text, '   ')).toBe(true)
  })
})
