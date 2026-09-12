/**
 * A Tree's Theme turned into the one `<style>` element the root layout emits, and into
 * the logo that layout shows (docs/specs/application.md section 13,
 * docs/adrs/ADR-38-theme-delivery.md).
 *
 * This is the only module in the application that writes a colour or a font name, and the
 * only place where text from a Tree -- third-party data -- becomes code. Every escape of
 * 13.3 is therefore here and nowhere else, and `tests/stylesheet.test.ts` holds the other
 * half of that bargain: `globals.css` names no colour and no font family of its own.
 *
 * It computes four values and nothing more, and each is one CSS cannot: three readable-on
 * colours, because CSS cannot compare contrast, and the dark end of the palette, because
 * it cannot compare luminance either. Hover shades, borders, washes and the backdrop's
 * opacity are derived in CSS with `color-mix()` from those; this is not a colour system.
 */
import { themeHref } from './url.ts'
import type { Colours, LocalisedText, Theme } from './tree/types.ts'

/**
 * The frontend's plain default look: what a Tree without a Theme is shown in, and what a
 * Tree that gives one part of a Theme gets for the parts it does not give (13.4). It is a
 * quiet neutral palette rather than a lab's, because the frontend carries no lab's
 * branding (core document section 9).
 */
export const DEFAULT_COLOURS: Colours = {
  background: '#fbfaf6',
  surface: '#ffffff',
  text: '#14181c',
  'text-muted': '#5a6470',
  accent: '#33553e',
  'accent-secondary': '#3c5a86',
  danger: '#8a2f26',
}

/**
 * The default type stack: the reader's own system face, so a plain Tree fetches no font.
 *
 * Named face by face rather than as `system-ui`, because on a Linux machine with no desktop
 * -- a server, a CI runner -- `system-ui` resolves through fontconfig to DejaVu Sans, which
 * is wider than the humanist faces tree-format.md 5.7 measured the length limits with, and a
 * Node at those limits then takes one line more than the Bubble has. Arial, or Liberation
 * Sans that fontconfig substitutes for it, has the metrics the limits assume and is on
 * every platform. Windows, macOS and Android still get their own face, named first.
 */
export const DEFAULT_FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Liberation Sans", sans-serif'

/** A colour as the format writes it, re-checked here because this is the sink (13.3). */
const COLOUR = /^#[0-9a-f]{6}$/

/**
 * A family name this module refuses to quote: a control character (`Cc`, which includes a
 * newline), or one of the four characters that could end the declaration, the block or the
 * element the name is written into (13.3).
 */
const UNQUOTABLE_FAMILY = /[;{}<\p{Cc}]/u

/** The logo the page shows, already resolved to the variant this palette calls for. */
export interface ResolvedLogo {
  /** The theme file name; the layout asks `themeHref` for its URL. */
  file: string
  alt: LocalisedText
  /** Where clicking it leads, opened in a new tab and never fetched (13.2). */
  url?: string
}

/** What the root layout puts in `<head>`. The logo is `themeLogo`'s, for the chrome bar. */
export interface ThemeStyle {
  /** The CSS of the one `<style>` element: `@font-face` rules and the `:root` block. */
  css: string
  /** The tab icon's theme file name, when the Theme names one. */
  icon?: string
}

/**
 * The Theme of the served Tree, or its absence, as the page's style. Each of the three
 * parts is taken whole or not at all: a palette is designed as a set, so half a Theme is
 * never merged with half a default (13.4).
 */
export function themeStyle(theme: Theme | undefined): ThemeStyle {
  const css = build(theme, paletteOf(theme?.colours))

  return {
    // Every part above is escaped, so this can only fire if one of them stops escaping.
    // The default look is then emitted whole rather than nothing: a page with no custom
    // properties at all would have no colour left to fall back on.
    css: css.toLowerCase().includes('</style') ? build(undefined, DEFAULT_COLOURS) : css,
    icon: theme?.logo?.icon,
  }
}

/**
 * The logo the page shows, or undefined when the Theme names none. Which variant is
 * derived, never declared: `dark` is used when the palette's `background` is dark, so the
 * format needs no key for it and an author cannot get it wrong (13.1).
 *
 * Separate from `themeStyle` because the chrome bar asks only for this, and building the
 * stylesheet again to get it would be work the page throws away.
 */
export function themeLogo(theme: Theme | undefined): ResolvedLogo | undefined {
  const logo = theme?.logo
  if (!logo) return undefined
  const dark = isDark(paletteOf(theme?.colours))
  return { file: (dark && logo.dark) || logo.light, alt: logo.alt, url: logo.url }
}

/** The `@font-face` rules and the `:root` block, in that order. */
function build(theme: Theme | undefined, colours: Colours): string {
  return [...fontFaces(theme), rootBlock(colours, theme)].join('\n')
}

/**
 * The seven roles, each the Theme's value when it is a colour and the default for that
 * role when it is not. The loader has already validated these (tree-format.md 4.3.3); the
 * check here is the second one, at the sink, and the two answer different questions.
 */
function paletteOf(colours: Colours | undefined): Colours {
  const palette = { ...DEFAULT_COLOURS }
  for (const role of Object.keys(DEFAULT_COLOURS) as (keyof Colours)[]) {
    const value = colours?.[role]
    if (typeof value === 'string' && COLOUR.test(value)) palette[role] = value
  }
  return palette
}

/**
 * The `:root` block: the seven roles, the four derived values, the two font stacks and
 * `color-scheme`.
 */
function rootBlock(colours: Colours, theme: Theme | undefined): string {
  const families = new Map((theme?.fonts ?? []).map((family) => [family.role, quoteFamily(family.family)]))
  const body = families.get('body')
  const heading = families.get('heading')
  const declarations = [
    ...Object.entries(colours).map(([role, value]) => `--elsa-${role}:${value}`),
    // CSS cannot compute contrast, so these three are computed here and only these three.
    `--elsa-on-accent:${readableOn(colours.accent, colours)}`,
    `--elsa-on-accent-secondary:${readableOn(colours['accent-secondary'], colours)}`,
    `--elsa-on-danger:${readableOn(colours.danger, colours)}`,
    // Nor can CSS ask which end of the palette is the dark one, and a backdrop that is not
    // told brightens the page it is meant to push back: keyed to `text` it is a near-white
    // sheet on a dark Theme. This invents no colour -- it is `text` or `background`, picked
    // -- and it is what makes `--veil` recede whichever way the palette runs (13.1).
    `--elsa-scrim:${darkerOf(colours.text, colours.background)}`,
    `--elsa-font-body:${body ? `${body}, ${DEFAULT_FONT_STACK}` : DEFAULT_FONT_STACK}`,
    // A Tree that gives only `body` has its headings in the body family (4.3.2).
    `--elsa-font-heading:${heading ? `${heading}, var(--elsa-font-body)` : 'var(--elsa-font-body)'}`,
    // The same test that picks the logo variant, so a dark Theme gets dark form controls
    // and scrollbars.
    `color-scheme:${isDark(colours) ? 'dark' : 'light'}`,
  ]
  return `:root{\n  ${declarations.join(';\n  ')}\n}`
}

/**
 * One `@font-face` per file of every family whose name can be quoted safely. A refused
 * family takes its faces with it: serving a font under a name the page cannot use would
 * only cost the reader the download.
 */
function fontFaces(theme: Theme | undefined): string[] {
  return (theme?.fonts ?? []).flatMap((family) => {
    const name = quoteFamily(family.family)
    if (!name) return []
    return family.files.map(
      (face) =>
        `@font-face{font-family:${name};font-weight:${face.weight};font-style:${face.style};` +
        `src:url('${themeHref(face.file)}') format('woff2');font-display:swap}`,
    )
  })
}

/**
 * A family name as a single-quoted CSS string, or null when it must not be emitted at all.
 * A name holding a control character, `;`, `{`, `}` or `<` is refused rather than
 * sanitised: an author who wrote one meant something this format does not offer.
 */
function quoteFamily(family: string): string | null {
  if (UNQUOTABLE_FAMILY.test(family)) return null
  return `'${family.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

/**
 * Whether the palette runs dark. One test, asked in two places -- the logo variant and
 * `color-scheme` -- because 13.1 says it is one rule and the threshold should not be able
 * to drift between them.
 */
function isDark(colours: Colours): boolean {
  return luminance(colours.background) < 0.5
}

/** Whichever of `text` and `background` reads better on `colour` (13.1). */
function readableOn(colour: string, colours: Colours): string {
  return contrast(colours.text, colour) >= contrast(colours.background, colour) ? colours.text : colours.background
}

/** Whichever of two `#rrggbb` colours is the darker; `a` when they are equally light. */
function darkerOf(a: string, b: string): string {
  return luminance(a) <= luminance(b) ? a : b
}

/** The WCAG 2 relative luminance of `#rrggbb`. */
function luminance(hex: string): number {
  const channel = (from: number): number => {
    const value = parseInt(hex.slice(from, from + 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

/** The WCAG 2 contrast ratio between two `#rrggbb` colours, 1 to 21. */
function contrast(a: string, b: string): number {
  const first = luminance(a)
  const second = luminance(b)
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}
