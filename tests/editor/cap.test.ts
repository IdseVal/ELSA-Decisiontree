/**
 * **[#172]** Typing stops at the cap (docs/specs/application.md 28.4, amended 2026-10-02):
 * `capped` keeps an input whose text fits its limit and cuts the inserted part of one that
 * does not -- a key, a paste -- at the last whole character that fits, measured as the
 * validator measures (tree-format.md 3.8): code points of the counted text, and for the
 * description its estimated lines. A text already over its limit may shrink and never grow.
 */
import { describe, expect, test } from 'vitest'
import { capped, cutTo, fitsLimit } from '../../src/editor/fields.ts'
import { countedLength, estimatedLines } from '../../src/tree/measure.ts'

const TITLE = { characters: 80 }
const DESCRIPTION = { characters: 150, lines: 2 }

/** The input event's result: `previous` with `inserted` put at `at` (replacing `replaced` characters), the caret after it. */
function input(previous: string, at: number, inserted: string, replaced = 0): [string, number] {
  return [previous.slice(0, at) + inserted + previous.slice(at + replaced), at + inserted.length]
}

describe('a text that fits is kept as typed', () => {
  test('a key and a paste within the limit', () => {
    expect(capped('Title', ...input('Title', 5, 's'), TITLE)).toEqual({ text: 'Titles', caret: 6 })
    expect(capped('', ...input('', 0, 'x'.repeat(80)), TITLE)).toEqual({ text: 'x'.repeat(80), caret: 80 })
  })

  test('a link counts its text and not its address (3.8), so a pasted link fits by its words', () => {
    const before = 'x'.repeat(140)
    const link = ' [term](https://example.org/a/very/long/address/indeed)'
    const { text } = capped(before, ...input(before, 140, link), DESCRIPTION)
    expect(text).toBe(before + link)
    expect(countedLength(text)).toBe(145)
  })
})

describe('a text past the limit is cut at the limit', () => {
  test('a key at the limit does nothing, wherever the caret is', () => {
    const full = 'a'.repeat(40) + 'b'.repeat(40)
    expect(capped(full, ...input(full, 80, 'c'), TITLE)).toEqual({ text: full, caret: 80 })
    expect(capped(full, ...input(full, 40, 'c'), TITLE)).toEqual({ text: full, caret: 40 })
  })

  test('a space at the limit does nothing either, though 3.8 trims it from the count', () => {
    const full = 'a'.repeat(80)
    expect(capped(full, ...input(full, 80, ' '), TITLE).text).toBe(full)
    expect(capped(full, ...input(full, 0, ' '), TITLE).text).toBe(full)
    expect(capped('a'.repeat(79), ...input('a'.repeat(79), 79, '  b'), TITLE).text).toBe(`${'a'.repeat(79)} `)
  })

  test('a paste is cut to what fits, at the caret, and what followed the caret stays', () => {
    const before = `${'a'.repeat(30)}${'z'.repeat(40)}`
    const { text, caret } = capped(before, ...input(before, 30, '0123456789ABCDEF'), TITLE)
    expect(text).toBe(`${'a'.repeat(30)}0123456789${'z'.repeat(40)}`)
    expect(countedLength(text)).toBe(80)
    expect(caret).toBe(40)
  })

  test('a paste over a selection replaces it and is cut to what fits', () => {
    const before = 'x'.repeat(80)
    const { text } = capped(before, ...input(before, 10, 'y'.repeat(30), 5), TITLE)
    expect(text).toBe('x'.repeat(10) + 'y'.repeat(5) + 'x'.repeat(65))
    expect(countedLength(text)).toBe(80)
  })

  test('the description stops at its two estimated lines as at its 150 characters', () => {
    const two = `${'x'.repeat(70)}\n- one`
    expect(estimatedLines(two)).toBe(2)
    // The item's first letter is where a third line would begin: the paste stops before it.
    expect(capped(two, ...input(two, two.length, '\n- two'), DESCRIPTION).text).toBe(`${two}\n- `)
    expect(estimatedLines(capped(two, ...input(two, two.length, '\n\nA new paragraph.'), DESCRIPTION).text)).toBe(2)
  })

  test('a multi-code-point character at the boundary is kept whole or not at all (3.8)', () => {
    const before = 'x'.repeat(79)
    // `e` and a combining acute: one character on screen, two code points by 3.8.
    const decomposed = 'e\u0301'
    expect(countedLength(decomposed)).toBe(2)
    expect(capped(before, ...input(before, 79, `${decomposed}tail`), TITLE)).toEqual({ text: before, caret: 79 })
    // A flag is two regional indicators: never one of them alone.
    expect(capped(before, ...input(before, 79, '\u{1F1F3}\u{1F1F1}'), TITLE).text).toBe(before)
    // A character outside the Basic Multilingual Plane is one code point in two UTF-16 units: it fits whole.
    const { text } = capped(before, ...input(before, 79, '\u{1F600}\u{1F600}'), TITLE)
    expect(text).toBe(`${before}\u{1F600}`)
    expect(countedLength(text)).toBe(80)
  })

  test('a precomposed character is one code point and takes the last place', () => {
    const before = 'x'.repeat(78)
    const { text } = capped(before, ...input(before, 78, 'éüö'), TITLE)
    expect(text).toBe(`${before}éü`)
    expect(countedLength(text)).toBe(80)
  })
})

describe('a text already over its limit (stored before #172, or by another route)', () => {
  const over = 'x'.repeat(93)

  test('is not over the limit by its own measure alone: it fits as long as it does not grow', () => {
    expect(fitsLimit(over, TITLE, over)).toBe(true)
    expect(fitsLimit(`${over}y`, TITLE, over)).toBe(false)
  })

  test('can be shortened', () => {
    expect(capped(over, ...input(over, 90, '', 3), TITLE)).toEqual({ text: 'x'.repeat(90), caret: 90 })
  })

  test('cannot be lengthened: a key does nothing and a paste over a selection is cut to the length it replaces', () => {
    expect(capped(over, ...input(over, 93, 'y'), TITLE).text).toBe(over)
    const { text } = capped(over, ...input(over, 0, 'yyyyy', 2), TITLE)
    expect(text).toBe(`yy${'x'.repeat(91)}`)
  })

  test('over by its lines, it cannot be lengthened by its characters either (the Reviewer of #184 typed 27 keys into it)', () => {
    // The description `editor.spec.ts` stores: well within 150 characters, over its 2 lines.
    const three = 'One paragraph.\n\n- and a list item under it'
    expect(countedLength(three)).toBe(42)
    expect(estimatedLines(three)).toBe(3)
    expect(fitsLimit(`${three}x`, DESCRIPTION, three)).toBe(false)
    expect(capped(three, ...input(three, three.length, 'x'), DESCRIPTION)).toEqual({ text: three, caret: three.length })
    expect(capped(three, ...input(three, 0, 'A longer opening. '), DESCRIPTION).text).toBe(three)
    // It can be shortened, and an edit that brings it within both measures is taken, as is a key after that.
    expect(capped(three, ...input(three, 39, '', 3), DESCRIPTION).text).toBe(three.slice(0, 39))
    const two = capped(three, ...input(three, 14, '', 1), DESCRIPTION).text
    expect(two).toBe('One paragraph.\n- and a list item under it')
    expect(estimatedLines(two)).toBe(2)
    expect(capped(two, ...input(two, two.length, 's'), DESCRIPTION).text).toBe(`${two}s`)
  })

  test('over by both, an edit is taken only if it is no longer by either', () => {
    const long = 'x'.repeat(160)
    expect(estimatedLines(long)).toBe(3)
    // Fewer characters on as many lines: taken. Fewer characters on more lines: refused.
    const shorter = `${'x'.repeat(70)}\n\n${'x'.repeat(70)}`
    expect(estimatedLines(shorter)).toBe(3)
    expect(fitsLimit(shorter, DESCRIPTION, long)).toBe(true)
    const more = `${'x'.repeat(50)}\n\n${'x'.repeat(50)}\n\n${'x'.repeat(50)}`
    expect(estimatedLines(more)).toBe(5)
    expect(fitsLimit(more, DESCRIPTION, long)).toBe(false)
  })
})

describe('a deletion that would lengthen the counted text', () => {
  test('is refused: taking the `]` out of a link would count its address (3.8)', () => {
    const before = `${'x'.repeat(140)} [term](https://example.org/)`
    const at = before.indexOf(']')
    expect(capped(before, ...input(before, at, '', 1), DESCRIPTION).text).toBe(before)
  })
})

describe('**[#177]** cutTo: an aside title as its Option button takes it (30.5, amended)', () => {
  const OPTION = { characters: 60 }

  test('a title within the button limit is taken whole; an empty one stays empty', () => {
    expect(cutTo('An aside', OPTION)).toBe('An aside')
    expect(cutTo('', OPTION)).toBe('')
  })

  test('a longer title is cut after the last whole character that fits the 60', () => {
    const title = `${'w'.repeat(59)}\u{1F44D}\u{1F3FD} and more words to reach eighty characters`
    expect(cutTo(title, OPTION)).toBe('w'.repeat(59))
    expect(cutTo('x'.repeat(80), OPTION)).toBe('x'.repeat(60))
  })
})
