/**
 * The chrome language rule of docs/specs/application.md section 3.1, including its table:
 * chrome follows the content language when it can, and falls back to English otherwise.
 */
import { describe, expect, test } from 'vitest'
import { chrome, chromeLanguage, CHROME_LANGUAGES, type Chrome } from '../src/chrome.ts'

/**
 * What a key says: its string, or, for a key that takes a value, what it says of one --
 * **[#197]** a list of names for `byAuthors`, numbers for the rest.
 */
function said(key: keyof Chrome, value: Chrome[keyof Chrome]): string {
  if (typeof value !== 'function') return value
  return key === 'byAuthors' ? (value as (names: string[]) => string)(['Anna de Vries']) : (value as (...n: number[]) => string)(2, 5)
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
    expect(chrome('nl').treeEndsHere).toBe('Boom eindigt hier')
    expect(chrome('nl-be').treeEndsHere).toBe('Boom eindigt hier')
    expect(chrome('de').treeEndsHere).toBe('Tree ends here')
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
        expect(said(key, chrome(language)[key]), `${language}.${key}`).toMatch(/\S/)
      }
    }
  })

  test('a key that takes a value is a function of it, in both languages (application.md 3.2)', () => {
    for (const language of CHROME_LANGUAGES) {
      const ui = chrome(language)
      expect(ui.up('Social scoring'), language).toContain('Social scoring')
      expect(ui.up('Social scoring'), language).not.toBe(ui.up('Prohibited practices'))
      expect(ui.imageCount(3, 7), language).toMatch(/\b3\b.*\b7\b/)
    }
  })

  // **[#179]** The badge's words are the Tree's now, held to 19 characters by V-LENGTH
  // (application.md 36.1), so the row that held the four chrome words to the rim is gone.
  test('the ending\'s placeholder fits the badge as its words do: at most 19 characters (36.3)', () => {
    for (const language of CHROME_LANGUAGES) expect([...chrome(language).endingText].length, language).toBeLessThanOrEqual(19)
  })

  // **[#233]** `yes` and `no` were read by `+ Yes` and `+ No` alone, which the one `+` replaced (42.7 item 5).
  test("the chrome has no yes or no: the words on a next step are its creator's (42.7 item 5)", () => {
    for (const language of CHROME_LANGUAGES) {
      expect(chrome(language), language).not.toHaveProperty('yes')
      expect(chrome(language), language).not.toHaveProperty('no')
    }
  })

  test('the two languages hold exactly the same keys', () => {
    expect(Object.keys(chrome('nl')).sort()).toEqual(Object.keys(chrome('en')).sort())
  })

  // **[#197]** The mention of a Tree's Authors (39.4): the names in their order, a comma between
  // all but the last two, which the language's own "and" joins.
  test('byAuthors names one, two, three and five Authors in their order, in both languages (39.4)', () => {
    const names = ['Anna de Vries', 'Bram Jansen', 'Cees Bakker', 'Dirk Visser', 'Erik de Boer']
    const by = (language: string, count: number): string => chrome(language).byAuthors(names.slice(0, count))
    expect(by('en', 1)).toBe('By Anna de Vries')
    expect(by('en', 2)).toBe('By Anna de Vries and Bram Jansen')
    expect(by('en', 3)).toBe('By Anna de Vries, Bram Jansen and Cees Bakker')
    expect(by('en', 5)).toBe('By Anna de Vries, Bram Jansen, Cees Bakker, Dirk Visser and Erik de Boer')
    expect(by('nl', 1)).toBe('Door Anna de Vries')
    expect(by('nl', 2)).toBe('Door Anna de Vries en Bram Jansen')
    expect(by('nl', 3)).toBe('Door Anna de Vries, Bram Jansen en Cees Bakker')
    expect(by('nl', 5)).toBe('Door Anna de Vries, Bram Jansen, Cees Bakker, Dirk Visser en Erik de Boer')
  })

  test("nameShownPublicly says the account page's notice in both languages (39.8)", () => {
    expect(chrome('en').nameShownPublicly).toBe('Shown on the public pages of the trees you create or collaborate on.')
    expect(chrome('nl').nameShownPublicly).toBe("Wordt getoond op de openbare pagina's van de bomen die u maakt of waaraan u meewerkt.")
  })

  // **[#206]** The preview of a hidden Tree's two buttons (40.5).
  test('preview and backToEditor say the two buttons of the preview in both languages (40.5)', () => {
    expect([chrome('en').preview, chrome('en').backToEditor]).toEqual(['Preview', 'Back to the editor'])
    expect([chrome('nl').preview, chrome('nl').backToEditor]).toEqual(['Voorbeeld', 'Terug naar de editor'])
  })
})
