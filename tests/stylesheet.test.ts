/**
 * Core document section 9 -- "the frontend must never carry a lab's branding in its code"
 * -- as a test that cannot be argued with (docs/specs/application.md 13.5, section 7).
 *
 * The stylesheet may hold no colour literal and no font family of its own: every colour on
 * the page comes from the Tree's Theme through the seven `--elsa-*` roles, and every shade
 * beyond them is mixed from those roles in CSS. A rule that names `#33553e` or `system-ui`
 * would be a look this frontend imposes on every Tree that loads it, which is the failure
 * the whole theme mechanism exists to prevent -- and it would be invisible in review,
 * because one hex value in six hundred lines looks like every other declaration.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const here = path.dirname(fileURLToPath(import.meta.url))
const stylesheet = await readFile(path.join(here, '..', 'src', 'app', '[lang]', 'globals.css'), 'utf8')

/** The stylesheet with its comments removed: prose about a colour is not a colour. */
const rules = stylesheet.replace(/\/\*[\s\S]*?\*\//g, '')

/**
 * The CSS named colours. `transparent` and `currentcolor` are deliberately not here: one
 * is the absence of a colour and the other is whatever the Theme has already set, so
 * neither can carry a lab's identity into the page.
 */
const NAMED_COLOURS = [
  'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black',
  'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse',
  'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue',
  'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki',
  'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon',
  'darkseagreen', 'darkslateblue', 'darkslategray', 'darkslategrey', 'darkturquoise',
  'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue',
  'firebrick', 'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite', 'gold',
  'goldenrod', 'gray', 'green', 'greenyellow', 'grey', 'honeydew', 'hotpink', 'indianred',
  'indigo', 'ivory', 'khaki', 'lavender', 'lavenderblush', 'lawngreen', 'lemonchiffon',
  'lightblue', 'lightcoral', 'lightcyan', 'lightgoldenrodyellow', 'lightgray',
  'lightgreen', 'lightgrey', 'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue',
  'lightslategray', 'lightslategrey', 'lightsteelblue', 'lightyellow', 'lime', 'limegreen',
  'linen', 'magenta', 'maroon', 'mediumaquamarine', 'mediumblue', 'mediumorchid',
  'mediumpurple', 'mediumseagreen', 'mediumslateblue', 'mediumspringgreen',
  'mediumturquoise', 'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose',
  'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab', 'orange',
  'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise', 'palevioletred',
  'papayawhip', 'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple',
  'rebeccapurple', 'red', 'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown',
  'seagreen', 'seashell', 'sienna', 'silver', 'skyblue', 'slateblue', 'slategray',
  'slategrey', 'snow', 'springgreen', 'steelblue', 'tan', 'teal', 'thistle', 'tomato',
  'turquoise', 'violet', 'wheat', 'white', 'whitesmoke', 'yellow', 'yellowgreen',
]

describe('the stylesheet names no colour', () => {
  test('no hex literal', () => {
    expect(rules.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([])
  })

  test('no colour function that takes channels', () => {
    // `color-mix()` is the exception and the point: it takes `--elsa-*` roles, not values.
    expect(rules.match(/\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/g) ?? []).toEqual([])
  })

  test('no named colour', () => {
    const found = NAMED_COLOURS.filter((colour) => new RegExp(`(?<![\\w-])${colour}(?![\\w-])`, 'i').test(rules))

    expect(found).toEqual([])
  })
})

describe('the stylesheet names no font', () => {
  test('every font-family is a var(--elsa-font-*)', () => {
    const values = [...rules.matchAll(/font-family:\s*([^;}]+)/g)].map((match) => match[1]!.trim())

    expect(values.length).toBeGreaterThan(0)
    for (const value of values) {
      expect(value).toMatch(/^var\(--elsa-font-(?:body|heading)\)$/)
    }
  })

  test('no family name reaches the page another way', () => {
    // The `font` shorthand carries a family too, and a bare stack in a custom property
    // would be the same mistake spelled differently.
    for (const value of [...rules.matchAll(/(?<![-\w])font:\s*([^;}]+)/g)].map((match) => match[1]!.trim())) {
      expect(value).toBe('inherit')
    }
    expect(rules).not.toMatch(/\b(?:system-ui|ui-sans-serif|ui-serif|-apple-system|Segoe UI|Helvetica|Arial|Georgia)\b/)
    expect(rules).not.toMatch(/(?<![-\w])(?:sans-serif|serif|monospace|cursive|fantasy)(?![-\w])/)
  })
})

describe('the roles the stylesheet reads are the ones the Theme emits', () => {
  test('every --elsa-* it reads is one src/theme.ts writes', async () => {
    const { DEFAULT_COLOURS } = await import('../src/theme.ts')
    const emitted = new Set([
      ...Object.keys(DEFAULT_COLOURS).map((role) => `--elsa-${role}`),
      '--elsa-on-accent',
      '--elsa-on-accent-secondary',
      '--elsa-on-danger',
      '--elsa-font-body',
      '--elsa-font-heading',
    ])
    const read = new Set([...rules.matchAll(/var\((--elsa-[a-z-]+)/g)].map((match) => match[1]!))

    // A property the stylesheet reads and nobody emits is a rule that silently does
    // nothing -- the one way this design can break without any test noticing.
    expect([...read].filter((name) => !emitted.has(name))).toEqual([])
  })
})
