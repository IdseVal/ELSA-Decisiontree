/**
 * The Theme as it reaches the page (docs/specs/application.md section 13,
 * ADR-38-theme-delivery): the one `<style>` string the root layout emits, the four
 * values that cannot be derived in CSS, and the escaping of the one place in this
 * application where third-party text becomes code.
 *
 * Most cases load a real Tree through the loader, as section 7 asks. The escaping cases
 * cannot: the loader rejects a Theme carrying a `;` in a family name, and the check this
 * file exercises is the second one, at the sink, which exists precisely for the day
 * something reaches `theme.ts` that the loader did not see. Those Themes are written here.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { DEFAULT_COLOURS, DEFAULT_FONT_STACK, themeStyle } from '../src/theme.ts'
import { openTree } from '../src/tree/loader.ts'
import type { Colours, Theme } from '../src/tree/types.ts'

const here = path.dirname(fileURLToPath(import.meta.url))

/**
 * The Tree with a Theme is the example Tree, not the first one: the first Tree is over the
 * format's length limits in 454 places until issue #44 cuts it, so `openTree` refuses it
 * (`tests/ai-act-tree.test.ts` asserts exactly that, and that none of the 454 is a V-THEME).
 * Its Theme block therefore reaches a browser here only through the copy
 * `tests/browser/theme.spec.ts` assembles.
 */
const themedTree = await openTree(path.join(here, '..', 'trees', 'ai-act-example'))
/** The interoperability fixture that carries no Theme at all (application.md 13.4). */
const plainTree = await openTree(path.join(here, 'fixtures', 'single-language'))

/** The value of one custom property in an emitted `:root` block. */
function property(css: string, name: string): string | undefined {
  return new RegExp(`--elsa-${name}:\\s*([^;\\n]+)`).exec(css)?.[1]?.trim()
}

/** The relative luminance of `#rrggbb`, WCAG 2 -- written out so the test computes it too. */
function luminance(hex: string): number {
  const channel = (from: number): number => {
    const value = parseInt(hex.slice(from, from + 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

function contrast(a: string, b: string): number {
  const first = luminance(a)
  const second = luminance(b)
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

describe('the seven roles become the seven properties', () => {
  test('a themed Tree emits exactly the manifest values', () => {
    const colours = themedTree.manifest.theme!.colours!
    const { css } = themeStyle(themedTree.manifest.theme)

    for (const [role, value] of Object.entries(colours)) {
      expect(property(css, role), role).toBe(value)
    }
  })

  test('a Tree with no Theme emits the default palette, not an empty block', () => {
    const { css } = themeStyle(plainTree.manifest.theme)

    expect(plainTree.manifest.theme).toBeUndefined()
    for (const [role, value] of Object.entries(DEFAULT_COLOURS)) {
      expect(property(css, role), role).toBe(value)
    }
  })

  test('there is no eighth role', () => {
    const { css } = themeStyle(themedTree.manifest.theme)
    const emitted = [...css.matchAll(/--elsa-([a-z-]+):/g)].map((match) => match[1]!)

    // The seven of tree-format.md 4.3.3, the four derived of 13.1, and the two font roles.
    expect(new Set(emitted)).toEqual(
      new Set([
        ...Object.keys(DEFAULT_COLOURS),
        'on-accent',
        'on-accent-secondary',
        'on-danger',
        'scrim',
        'font-body',
        'font-heading',
      ]),
    )
  })

  test('the default palette is readable, so a Tree without a Theme is not a broken page', () => {
    // The one thing a default must be. A Theme's own palette is its author's
    // responsibility (tree-format.md 4.3.3); this one is ours.
    expect(contrast(DEFAULT_COLOURS.text, DEFAULT_COLOURS.background)).toBeGreaterThan(7)
    expect(contrast(DEFAULT_COLOURS.text, DEFAULT_COLOURS.surface)).toBeGreaterThan(7)
  })
})

describe('the four values CSS cannot compute', () => {
  test.for([
    ['accent', 'on-accent'],
    ['accent-secondary', 'on-accent-secondary'],
    ['danger', 'on-danger'],
  ] as const)('%s: the better-contrasting of text and background', ([role, derived]) => {
    const colours = themedTree.manifest.theme!.colours!
    const { css } = themeStyle(themedTree.manifest.theme)
    const on = colours[role]

    const better = contrast(colours.text, on) >= contrast(colours.background, on) ? colours.text : colours.background
    expect(property(css, derived)).toBe(better)
  })

  test('the derived colour is the readable one, whichever way the palette runs', () => {
    // Issue #36 measured that the first Tree's own site paints white on its yellow accent
    // (1.58:1) where near-black reads at 8.60:1. The rule picks the readable one, and it
    // does so for a light accent on a light page and a light accent on a dark page alike.
    const light = { ...DEFAULT_COLOURS, background: '#ffffff', text: '#2d2e33', accent: '#ffc600' }
    const dark = { ...DEFAULT_COLOURS, background: '#161a1d', text: '#eef1f2', accent: '#ffc600' }

    expect(property(themeStyle({ colours: light }).css, 'on-accent')).toBe('#2d2e33')
    expect(property(themeStyle({ colours: dark }).css, 'on-accent')).toBe('#161a1d')
  })

  test.for([
    ['a light palette', { ...DEFAULT_COLOURS, background: '#ffffff', text: '#2d2e33' }, '#2d2e33'],
    ['a dark palette', { ...DEFAULT_COLOURS, background: '#161a1d', text: '#eef1f2' }, '#161a1d'],
  ] as const)('the scrim is the dark end of %s', ([, colours, expected]) => {
    expect(property(themeStyle({ colours }).css, 'scrim')).toBe(expected)
  })

  test('the scrim is never lighter than the page it lies over, whichever Theme is served', () => {
    // The invariant the backdrop of `.enlarged` rests on (globals.css `--veil`): a scrim
    // keyed to `text` is a near-white sheet on a dark Theme, which is the opposite of what
    // a backdrop is for. Measured on both Themes this repository ships, and on the default.
    const first = themedTree.manifest.theme!.colours!
    const palettes: Colours[] = [
      DEFAULT_COLOURS,
      first,
      { ...DEFAULT_COLOURS, background: '#ffffff', text: '#2d2e33' },
    ]

    for (const colours of palettes) {
      const scrim = property(themeStyle({ colours }).css, 'scrim')!

      expect(luminance(scrim)).toBeLessThanOrEqual(luminance(colours.background))
      expect(luminance(scrim)).toBeLessThanOrEqual(luminance(colours.text))
    }
  })
})

describe('the fonts', () => {
  test('one @font-face per file, weight and style verbatim, served from the Tree', () => {
    const families = themedTree.manifest.theme!.fonts!
    const { css } = themeStyle(themedTree.manifest.theme)

    for (const family of families) {
      for (const face of family.files) {
        const rule = [...css.matchAll(/@font-face\{([^}]*)\}/g)]
          .map((match) => match[1]!)
          .find((body) => body.includes(`url('/theme/${face.file}')`))

        expect(rule, face.file).toBeDefined()
        expect(rule).toContain(`font-family:'${family.family}'`)
        expect(rule).toContain(`font-weight:${face.weight}`)
        expect(rule).toContain(`font-style:${face.style}`)
        expect(rule).toContain("format('woff2')")
        // A slow font must never blank the text (13.1).
        expect(rule).toContain('font-display:swap')
      }
    }
  })

  test('each role becomes its property, and a role the Tree omits gets its documented fallback', () => {
    const families = themedTree.manifest.theme!.fonts!
    const { css } = themeStyle(themedTree.manifest.theme)
    const body = families.find((family) => family.role === 'body')
    const heading = families.find((family) => family.role === 'heading')

    // The example Tree gives `heading` only, so its running text is the default stack --
    // the fallback tree-format.md 4.3.2 states, checked against a Tree that relies on it.
    expect(property(css, 'font-body')).toBe(body ? `'${body.family}', ${DEFAULT_FONT_STACK}` : DEFAULT_FONT_STACK)
    expect(property(css, 'font-heading')).toBe(
      heading ? `'${heading.family}', var(--elsa-font-body)` : 'var(--elsa-font-body)',
    )
  })

  test('a Tree that gives only a body family has its headings in that family', () => {
    const { css } = themeStyle({
      fonts: [
        {
          family: 'Open Sans',
          role: 'body',
          licence: 'SIL Open Font License 1.1',
          files: [{ file: 'open-sans-400.woff2', weight: '400', style: 'normal' }],
        },
      ],
    })

    expect(property(css, 'font-body')).toBe(`'Open Sans', ${DEFAULT_FONT_STACK}`)
    expect(property(css, 'font-heading')).toBe('var(--elsa-font-body)')
  })

  test('a Tree with no fonts gets the default stack for both roles', () => {
    const { css } = themeStyle(plainTree.manifest.theme)

    expect(property(css, 'font-body')).toBe(DEFAULT_FONT_STACK)
    expect(property(css, 'font-heading')).toBe('var(--elsa-font-body)')
    expect(css).not.toContain('@font-face')
  })
})

describe('the parts are independent (13.4)', () => {
  const theme = (): Theme => structuredClone(themedTree.manifest.theme!)

  test('colours only: those colours, the default stack, no logo', () => {
    const { css, logo } = themeStyle({ colours: theme().colours })

    expect(property(css, 'accent')).toBe(themedTree.manifest.theme!.colours!.accent)
    expect(property(css, 'font-body')).toBe(DEFAULT_FONT_STACK)
    expect(logo).toBeUndefined()
  })

  test('fonts only: the default palette, those families', () => {
    const { css } = themeStyle({ fonts: theme().fonts })

    expect(property(css, 'background')).toBe(DEFAULT_COLOURS.background)
    expect(css).toContain('@font-face')
  })

  test('logo only: the default palette and stack, that logo', () => {
    const { css, logo } = themeStyle({ logo: theme().logo })

    expect(property(css, 'background')).toBe(DEFAULT_COLOURS.background)
    expect(property(css, 'font-body')).toBe(DEFAULT_FONT_STACK)
    expect(logo?.file).toBe(themedTree.manifest.theme!.logo!.light)
  })
})

describe('the logo variant is derived from the palette, never declared (13.1)', () => {
  const logo = {
    light: 'light.svg',
    dark: 'dark.svg',
    icon: 'icon.png',
    alt: { en: 'A lab' },
    url: 'https://example.org',
  }
  const dark: Colours = { ...DEFAULT_COLOURS, background: '#101418', surface: '#1b2026', text: '#f2f4f6' }

  test('a light palette shows the light variant', () => {
    expect(themeStyle({ logo, colours: { ...DEFAULT_COLOURS } }).logo?.file).toBe('light.svg')
  })

  test('a dark palette shows the dark variant, and says so to the browser', () => {
    const { css, logo: shown } = themeStyle({ logo, colours: dark })

    expect(shown?.file).toBe('dark.svg')
    expect(css).toContain('color-scheme:dark')
  })

  test('a dark palette with no dark variant still shows the light one', () => {
    const { light, alt } = logo
    expect(themeStyle({ logo: { light, alt }, colours: dark }).logo?.file).toBe('light.svg')
  })

  test('the alt text, the link and the tab icon travel with it', () => {
    const style = themeStyle({ logo })

    expect(style.logo?.alt).toEqual(logo.alt)
    expect(style.logo?.url).toBe(logo.url)
    expect(style.icon).toBe('icon.png')
  })
})

describe('escaping: the one place author text becomes code (13.3)', () => {
  const family = (name: string): Theme => ({
    fonts: [{ family: name, role: 'body', licence: 'x', files: [{ file: 'f.woff2', weight: '400', style: 'normal' }] }],
  })

  test("a family name is quoted, with ' and \\ escaped", () => {
    const { css } = themeStyle(family("O'Neill\\Sans"))

    expect(property(css, 'font-body')).toBe(`'O\\'Neill\\\\Sans', ${DEFAULT_FONT_STACK}`)
  })

  test('a family name with a space in it is ordinary and is emitted', () => {
    // The first Tree's own families are "Open Sans" and "Nova Square": refusing a space
    // would refuse every real font name.
    expect(property(themeStyle(family('Open Sans')).css, 'font-body')).toBe(`'Open Sans', ${DEFAULT_FONT_STACK}`)
  })

  test.for([';', '{', '}', '<', '\n', String.fromCharCode(1)])(
    'a family name holding %j is refused, and its faces with it',
    (character) => {
      const { css } = themeStyle(family(`Bad${character}Sans`))

      expect(property(css, 'font-body')).toBe(DEFAULT_FONT_STACK)
      expect(css).not.toContain('@font-face')
      expect(css).not.toContain('Bad')
    },
  )

  test.for(['red', '#FFF', '#ffc60', 'var(--x)', '#ffc600;}', 'rgb(1,2,3)'])(
    'a colour that is not #rrggbb is refused, and the default for that role used: %j',
    (value) => {
      const colours = { ...DEFAULT_COLOURS, accent: value } as Colours
      const { css } = themeStyle({ colours })

      expect(property(css, 'accent')).toBe(DEFAULT_COLOURS.accent)
      // The other six of the block are untouched: only the role that failed falls back.
      expect(property(css, 'background')).toBe(DEFAULT_COLOURS.background)
    },
  )

  test('nothing that could close the element is ever emitted', () => {
    // Belt and braces: every part above is escaped, so this can only fire if one is not.
    for (const style of [themeStyle(themedTree.manifest.theme), themeStyle(family('</style><script>'))]) {
      expect(style.css.toLowerCase()).not.toContain('</style')
    }
  })
})
