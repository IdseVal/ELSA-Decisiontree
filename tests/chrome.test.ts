/**
 * The chrome language rule of docs/specs/application.md section 3.1, including its table:
 * chrome follows the content language when it can, and falls back to English otherwise.
 */
import { describe, expect, test } from 'vitest'
import { chrome, chromeLanguage, CHROME_LANGUAGES, type Chrome } from '../src/chrome.ts'

/** What a key says: its string, or, for a key that takes numbers, what it says of some. */
function said(value: Chrome[keyof Chrome]): string {
  return typeof value === 'function' ? (value as (...n: number[]) => string)(2, 5) : value
}

describe('the chrome language follows the content language', () => {
  // The table of docs/specs/application.md section 3.1, one row per entry.
  const rows: Array<{ content: string; expected: string }> = [
    { content: 'en', expected: 'en' },
    { content: 'nl', expected: 'nl' },
    { content: 'de', expected: 'en' },
    { content: 'fr', expected: 'en' },
    { content: 'pt-br', expected: 'en' },
    { content: 'nl-be', expected: 'nl' },
  ]

  test.for(rows)('content in $content gets chrome in $expected', ({ content, expected }) => {
    expect(chromeLanguage(content)).toBe(expected)
  })

  test('the strings come from the language the rule picked', () => {
    expect(chrome('nl').yes).toBe('Ja')
    expect(chrome('nl-be').yes).toBe('Ja')
    expect(chrome('de').yes).toBe('Yes')
  })
})

describe('the chrome strings', () => {
  test('every key is present and non-empty in every chrome language', () => {
    // The key list comes from the English record; the type makes a missing Dutch key a
    // compile error, and this catches an empty one.
    const keys = Object.keys(chrome('en')) as Array<keyof Chrome>

    expect(keys.length).toBeGreaterThan(0)
    for (const language of CHROME_LANGUAGES) {
      for (const key of keys) {
        expect(said(chrome(language)[key]), `${language}.${key}`).toMatch(/\S/)
      }
    }
  })

  test('a key that takes a number is a function of it, in both languages (application.md 3.2)', () => {
    for (const language of CHROME_LANGUAGES) {
      const ui = chrome(language)
      expect(ui.trailMore(1), language).toMatch(/1/)
      expect(ui.trailMore(7), language).toMatch(/7/)
      expect(ui.trailMore(7), language).not.toBe(ui.trailMore(1))
      expect(ui.imageCount(3, 7), language).toMatch(/3.*7/)
    }
  })

  test("the two rim texts fit the Bubble's rim: at most 80 characters (application.md 10.1)", () => {
    // The badge and the hint sit in the band between the text area and the Bubble's curve,
    // which holds about 80 characters of 13-pixel text; they are chrome, so their length is
    // this file's to keep and not an author's.
    for (const language of CHROME_LANGUAGES) {
      const ui = chrome(language)
      for (const key of [
        'explanationOnly',
        'outcomeNotApplicable',
        'outcomeApplicable',
        'outcomeProhibited',
        'outcomeRefer',
      ] as const) {
        expect([...ui[key]].length, `${language}.${key}`).toBeLessThanOrEqual(80)
      }
    }
  })

  test('the two languages hold exactly the same keys', () => {
    expect(Object.keys(chrome('nl')).sort()).toEqual(Object.keys(chrome('en')).sort())
  })
})
