/**
 * The rules of the `mark` control (docs/specs/application.md 32.1, 32.4; ADR-133-explainers-
 * in-the-editor decisions 1 and 4): where a mark may go, and what marking and unmarking do to
 * the description's source. The button and the Sheet are `tests/browser/marking.spec.ts`'s.
 */
import { describe, expect, it } from 'vitest'
import { marked, markRefusal, marks, trimmedSelection, unmarked } from '../../src/editor/Marker.tsx'

/** The refusal for the first occurrence of `words` in `text`, on a Node with `count` explainers. */
function refusalOf(text: string, words: string, count = 0): ReturnType<typeof markRefusal> {
  const start = text.indexOf(words)
  return markRefusal(text, start, start + words.length, count, 'some-id')
}

describe('trimmedSelection', () => {
  it('leaves out the white space a double click takes with a word', () => {
    expect(trimmedSelection('a provider here', 2, 11)).toEqual([2, 10])
    expect(trimmedSelection('a provider here', 11, 1)).toEqual([2, 10])
    expect(trimmedSelection('a   b', 1, 4)).toEqual([4, 4])
  })
})

describe('markRefusal', () => {
  const text = 'Are you a provider? See *emphasis here* and **strong words**, [a law](https://example.org) and [users](#user).\n- first item\n1. second item'

  it('accepts words in plain running text and in a list item', () => {
    expect(refusalOf(text, 'provider')).toBeNull()
    expect(refusalOf(text, 'first item')).toBeNull()
    expect(refusalOf(text, 'second')).toBeNull()
  })

  it('refuses a selection over a line break', () => {
    expect(refusalOf(text, 'users](#user).\n- first')).toBe('cannotMarkHere')
    expect(refusalOf('one\ntwo', 'one\ntwo')).toBe('cannotMarkHere')
  })

  it('refuses a selection inside or across emphasis, strong text, a link or a mark (V-MARK)', () => {
    expect(refusalOf(text, 'emphasis')).toBe('cannotMarkHere')
    expect(refusalOf(text, 'strong')).toBe('cannotMarkHere')
    expect(refusalOf(text, 'a law')).toBe('cannotMarkHere')
    expect(refusalOf(text, 'users')).toBe('cannotMarkHere')
    expect(refusalOf(text, 'See *emphasis')).toBe('cannotMarkHere')
  })

  it('refuses a selection over a list marker or holding the syntax characters', () => {
    expect(refusalOf(text, '- first')).toBe('cannotMarkHere')
    expect(refusalOf(text, '1. second')).toBe('cannotMarkHere')
    expect(refusalOf('a [b c', '[b')).toBe('cannotMarkHere')
    expect(refusalOf('a * b', 'a * b')).toBe('cannotMarkHere')
  })

  it('refuses a selection no id can be made of', () => {
    expect(markRefusal('a -- b', 2, 4, 0, '')).toBe('cannotMarkHere')
  })

  it('refuses a ninth explainer and says so before anything else', () => {
    expect(refusalOf(text, 'provider', 7)).toBeNull()
    expect(refusalOf(text, 'provider', 8)).toBe('explainerLimit')
    expect(refusalOf(text, 'emphasis', 8)).toBe('explainerLimit')
  })
})

describe('marked and unmarked', () => {
  it('writes the selection as a mark for the id', () => {
    expect(marked('Are you a provider?', 10, 18, 'provider')).toBe('Are you a [provider](#provider)?')
  })

  it('replaces every mark of the id by its words, and no other mark', () => {
    const text = '[Providers](#provider) and a [provider](#provider), not [users](#user) nor [x](#provider-2).'
    expect(unmarked(text, 'provider')).toBe('Providers and a provider, not [users](#user) nor [x](#provider-2).')
  })

  it('reads whether a text marks an id as the validator does', () => {
    expect(marks('a [provider](#provider)', 'provider')).toBe(true)
    expect(marks('a provider', 'provider')).toBe(false)
    expect(marks(undefined, 'provider')).toBe(false)
  })
})
