/**
 * **[#144]** The contrast rule of the public page (issue #64; docs/specs/application.md 33.8)
 * as `src/contrast.ts` states it for the editor's Theme panel: the pairings
 * `tests/first-tree/contrast.spec.ts` measures in a browser, computed from the palette alone.
 */
import { describe, expect, test } from 'vitest'
import { contrast, shortfalls } from '../src/contrast.ts'
import { DEFAULT_COLOURS } from '../src/theme.ts'
import type { Colours } from '../src/tree/types.ts'

/** The first Tree's palette after #64 and #82: what the browser suite passes. */
const FIRST_TREE: Colours = {
  background: '#ffffff',
  surface: '#f0f3f7',
  text: '#2d2e33',
  'text-muted': '#696a6e',
  accent: '#ffc600',
  'accent-secondary': '#159a2f',
  danger: '#e44e56',
}

describe('contrast', () => {
  test('is the WCAG 2 ratio: black on white is 21, a colour on itself 1', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrast('#ffffff', '#000000')).toBeCloseTo(21, 5)
    expect(contrast('#159a2f', '#159a2f')).toBe(1)
  })
})

describe('shortfalls', () => {
  test('the default palette and the first Tree’s meet the rule', () => {
    expect(shortfalls(DEFAULT_COLOURS)).toEqual([])
    expect(shortfalls(FIRST_TREE)).toEqual([])
  })

  test('the ai4sfs.org site’s own muted grey, 2.49 : 1 on white, falls short on the page and on the Bubble (#64)', () => {
    const found = shortfalls({ ...FIRST_TREE, 'text-muted': '#a3a4a8' })
    expect(found.map(({ text, on }) => `${text} on ${on}`)).toEqual(['text-muted on background', 'text-muted on surface'])
    expect(found[0]!.ratio).toBeCloseTo(2.49, 2)
    expect(found[0]!.minimum).toBe(4.5)
  })

  test('the Answer label is held to large text’s 3 : 1 against its fill, in whichever of text and background reads better', () => {
    // A pale yellow fill: dark text reads on it, so it passes although white would not.
    expect(shortfalls({ ...FIRST_TREE, 'accent-secondary': '#ffe680' })).toEqual([])
    // A mid-grey fill between a grey text and a grey page: neither reads on it at 3 : 1.
    const both = { ...FIRST_TREE, text: '#555555', background: '#aaaaaa', surface: '#aaaaaa', 'text-muted': '#555555', 'accent-secondary': '#808080' }
    expect(shortfalls(both).map(({ text }) => text)).toContain('on-accent-secondary')
  })
})
