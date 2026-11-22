/**
 * **[#271]** The field a to-do line names (docs/specs/application.md 33.3): the placeholder an
 * empty field shows (28.2), the entry's place in its list and the language, and nothing for a
 * key path that names no field.
 */
import { expect, test } from 'vitest'
import { chrome } from '../../src/chrome.ts'
import { fieldOf, type PlaceholderWords } from '../../src/editor/placeholders.ts'

const words: PlaceholderWords = chrome('en')

test.each([
  ['title.nl', 'Title (nl)'],
  ['description.en', 'Text (en)'],
  ['answers[1].label.nl', 'Words on the button 2 (nl)'],
  ['options[0].title.pt-br', 'Side bubble title 1 (pt-br)'],
  ['sources[2].label.en', 'Name of the source 3 (en)'],
  ['images[0].description.nl', 'What the picture shows 1 (nl)'],
  ['images[0].credit', 'Maker and licence 1'],
  ['terminal.label.nl', 'Text of the ending (nl)'],
  ['explainers[0].term.nl', 'Word or phrase 1 (nl)'],
  ['explainers[1].text.nl', 'What it means 2 (nl)'],
  ['theme.logo.alt.en', 'What the logo says (en)'],
])('%s names %s', (keyPath, name) => {
  expect(fieldOf(keyPath, words)).toBe(name)
})

test.each(['answers', 'explainers[0]', 'explainers[0].id', '/nodes/3/title', '', 'images', 'root'])('%s names no field', (keyPath) => {
  expect(fieldOf(keyPath, words)).toBeNull()
})

test('the Dutch chrome names the fields in Dutch', () => {
  expect(fieldOf('explainers[0].text.nl', chrome('nl'))).toBe(`${chrome('nl').placeholderExplanation} 1 (nl)`)
  expect(chrome('nl').placeholderExplanation).not.toBe(chrome('en').placeholderExplanation)
})
