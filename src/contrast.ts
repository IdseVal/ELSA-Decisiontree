/**
 * WCAG 2 contrast between two `#rrggbb` colours, and the contrast rule a Theme's palette is
 * held to on the public page (issue #64; docs/specs/application.md 10.3, 13.1, 33.8).
 *
 * Pure and dependency-free, so the two places that need it read one definition: `theme.ts`,
 * which derives the readable-on colours of 13.1 from it, and the editor's Theme panel, which
 * warns a creator whose chosen colours fall short (34.4 lets the editor import this module).
 */
import type { Colours } from './tree/types.ts'

/** One pairing of the rule that a palette misses: what is drawn on what, the ratio, the minimum. */
export interface Shortfall {
  /** The role the text is drawn in, or the derived `on-accent-secondary`. */
  text: keyof Colours | 'on-accent-secondary'
  /** The role it is drawn on. */
  on: keyof Colours
  ratio: number
  minimum: number
}

/**
 * The pairings the public page measures (`tests/first-tree/contrast.spec.ts`): running and
 * secondary text on the page and on the Bubble at WCAG 2.2 SC 1.4.3's 4.5 : 1, and the
 * Answer label -- 19-pixel bold, large text -- on its `accent-secondary` fill at 3 : 1
 * (10.3, ADR-78-answer-buttons-and-up-arrow decision 3).
 */
const RULE: readonly { text: Shortfall['text']; on: keyof Colours; minimum: number }[] = [
  { text: 'text', on: 'background', minimum: 4.5 },
  { text: 'text', on: 'surface', minimum: 4.5 },
  { text: 'text-muted', on: 'background', minimum: 4.5 },
  { text: 'text-muted', on: 'surface', minimum: 4.5 },
  { text: 'on-accent-secondary', on: 'accent-secondary', minimum: 3 },
]

/** Every pairing of the rule that `colours` misses; empty when the palette meets it. */
export function shortfalls(colours: Colours): Shortfall[] {
  return RULE.flatMap(({ text, on, minimum }) => {
    const drawn = text === 'on-accent-secondary' ? readableOn(colours['accent-secondary'], colours) : colours[text]
    const ratio = contrast(drawn, colours[on])
    return ratio < minimum ? [{ text, on, ratio, minimum }] : []
  })
}

/** Whichever of `text` and `background` reads better on `colour` (13.1). */
export function readableOn(colour: string, colours: Colours): string {
  return contrast(colours.text, colour) >= contrast(colours.background, colour) ? colours.text : colours.background
}

/** The WCAG 2 relative luminance of `#rrggbb`. */
export function luminance(hex: string): number {
  const channel = (from: number): number => {
    const value = parseInt(hex.slice(from, from + 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

/** The WCAG 2 contrast ratio between two `#rrggbb` colours, 1 to 21. */
export function contrast(a: string, b: string): number {
  const first = luminance(a)
  const second = luminance(b)
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}
