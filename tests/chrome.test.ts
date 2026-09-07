/**
 * The chrome language rule of docs/specs/application.md section 3.1, including its table:
 * chrome follows the content language when it can, and falls back to English otherwise.
 */
import { describe, expect, test } from 'vitest'
import { chrome, chromeLanguage, CHROME_LANGUAGES, type Chrome } from '../src/chrome.ts'

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
        expect(chrome(language)[key], `${language}.${key}`).toMatch(/\S/)
      }
    }
  })

  test('the two languages hold exactly the same keys', () => {
    expect(Object.keys(chrome('nl')).sort()).toEqual(Object.keys(chrome('en')).sort())
  })
})
