/**
 * **[#273]** The public overview's tag filter (docs/specs/application.md 26.6, `src/tags.ts`):
 * which tags it lists and in what words, which a query chose, and which tiles they leave.
 */
import { describe, expect, test } from 'vitest'
import { chosenTags, shows, tagOptions, treeTagKeys, withTags } from '../src/tags.ts'

const food = { en: 'Food', nl: 'Voedsel' }
const law = { en: 'AI Act', nl: 'AI-verordening' }

describe('the list (26.6)', () => {
  test('every tag once, in the language each tile speaks, in the page language\'s alphabet, letter case aside', () => {
    const options = tagOptions(
      [
        { tags: [food, law], shown: 'nl' },
        // A Tree without Dutch speaks its default on the Dutch page, as its title does (23.2).
        { tags: [{ de: 'zoll' }, { de: 'voedsel ' }], shown: 'de' },
        { tags: undefined, shown: 'nl' },
      ],
      'nl',
    )

    expect(options).toEqual([
      { key: 'ai-verordening', label: 'AI-verordening' },
      { key: 'voedsel', label: 'Voedsel' },
      { key: 'zoll', label: 'zoll' },
    ])
  })

  test('a tag with no text in the tile\'s language is left out', () => {
    expect(tagOptions([{ tags: [{ en: 'Food', nl: '' }], shown: 'nl' }], 'nl')).toEqual([])
    expect(treeTagKeys([{ en: 'Food', nl: '  ' }, law], 'nl')).toEqual(['ai-verordening'])
  })
})

describe('the choice and the tiles (26.6)', () => {
  const options = tagOptions([{ tags: [food, law], shown: 'en' }, { tags: [{ en: 'Safety' }], shown: 'en' }], 'en')

  test('the query\'s words are matched by their key; a tag no served Tree carries is no choice', () => {
    expect(chosenTags(['safety', ' FOOD', 'Privacy'], options)).toEqual(['food', 'safety'])
    expect(chosenTags([], options)).toEqual([])
  })

  test('a tile stands while nothing is chosen, or while it carries any chosen tag', () => {
    expect(shows(['food'], [])).toBe(true)
    expect(shows([], [])).toBe(true)
    expect(shows(['food', 'ai act'], ['safety', 'ai act'])).toBe(true)
    expect(shows(['food'], ['safety'])).toBe(false)
    expect(shows([], ['safety'])).toBe(false)
  })

  test('the address carries the choice in the list\'s words after the page\'s other parameters, and none for no choice', () => {
    expect(withTags('https://elsa.example.org/?lang=nl', ['safety', 'food'], options)).toBe('https://elsa.example.org/?lang=nl&tag=Food&tag=Safety')
    expect(withTags('https://elsa.example.org/?tag=Food&lang=nl', [], options)).toBe('https://elsa.example.org/?lang=nl')
    expect(withTags('https://elsa.example.org/', ['ai act'], options)).toBe('https://elsa.example.org/?tag=AI+Act')
  })
})
