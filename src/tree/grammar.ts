/**
 * The grammars of tree-format.md a form checks before it sends (docs/specs/application.md
 * 27.1, 28.4): the id, the language tag and the counted length. A module of its own, with
 * no import, because the editor's client components need them and `validate.ts` brings the
 * JSON Schema and its validator with it. **[#138]** And the URL grammar of the schema's `url`,
 * which the add-Source Sheet checks before it sends (28.1).
 */

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/
const LANGUAGE_TAG = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/
const MARKDOWN_LINK = /\[([^\]]*)\]\([^)]*\)/g
/** The schema's `url` pattern (schemas/elsa-tree-5.json): a scheme, a non-empty host, no whitespace. */
const URL_PATTERN = /^https?:\/\/[^\s/?#]+(?:[/?#][^\s]*)?$/

/** Tree-format.md 3.1: lowercase letters, digits, single hyphens, at most 64 characters. */
export function isId(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 64 && ID.test(value)
}

/** An absolute http(s) URL as the schema's `url` reads it (V-SOURCE, blocking): what a Source needs before it exists. */
export function isUrl(value: unknown): value is string {
  return typeof value === 'string' && URL_PATTERN.test(value)
}

/** Tree-format.md 3.3: a lowercase BCP 47 tag such as `en`, `nl` or `pt-br`; the schema's pattern. */
export function isLanguageTag(value: unknown): value is string {
  return typeof value === 'string' && LANGUAGE_TAG.test(value)
}

/**
 * Tree-format.md 3.8 steps 1 and 2: what a length rule is measured on -- the text
 * trimmed, with every Markdown link replaced by the words the reader sees.
 */
export function countedText(text: string): string {
  return text.trim().replace(MARKDOWN_LINK, '$1')
}

/** Tree-format.md 3.8 step 3: the length in Unicode code points, not bytes. */
export function countedLength(text: string): number {
  return [...countedText(text)].length
}
