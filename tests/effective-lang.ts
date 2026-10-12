/**
 * What language a piece of rendered markup is announced in. Shared by the suites that
 * assert docs/specs/application.md 3.1: `<html lang>` is the content language, and chrome
 * in another language carries its own `lang`.
 */

/** Elements that close themselves, so they never become an ancestor. */
const VOID_ELEMENTS = new Set(['br', 'hr', 'img', 'input', 'link', 'meta', 'source'])

/**
 * The language a screen reader announces the element whose start tag contains `marker` in:
 * its own `lang`, or the nearest ancestor's. The suite has no DOM, and the markup here is
 * React's own output, so scanning the start tags is enough.
 */
export function effectiveLang(html: string, marker: string): string | undefined {
  const ancestors: Array<string | undefined> = []
  for (const [, closing, name, attributes = ''] of html.matchAll(/<(\/?)([a-z0-9]+)([^>]*)>/g)) {
    if (closing) {
      ancestors.pop()
      continue
    }
    const own = /\slang="([^"]*)"/.exec(attributes)?.[1]
    if (attributes.includes(marker)) return own ?? ancestors.findLast((lang) => lang !== undefined)
    if (!VOID_ELEMENTS.has(name!) && !attributes.endsWith('/')) ancestors.push(own)
  }
  throw new Error(`no element matching ${marker}`)
}
