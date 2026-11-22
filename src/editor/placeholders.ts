/**
 * **[#172]** What belongs in the field at a key path, its placeholder while it is empty
 * (docs/specs/application.md 28.2, amended), and **[#271]** the name a to-do line gives that
 * field (33.3): the same word, because an empty field shows it, so the author finds the field
 * the line names. Pure, so the server's slots and the editor's client components share it (34.4).
 */
import type { Chrome } from '../chrome.ts'

/** The chrome words a field's placeholder is one of. */
export type PlaceholderWords = Pick<
  Chrome,
  | 'placeholderTitle'
  | 'placeholderText'
  | 'placeholderSourceLabel'
  | 'placeholderUrl'
  | 'placeholderOptionTitle'
  | 'placeholderImageDescription'
  | 'placeholderCredit'
  | 'endingText'
  | 'nextStepWords'
  | 'placeholderTerm'
  | 'placeholderExplanation'
  | 'placeholderLogoAlt'
>

/** The chrome word for the field at `path` (no language segment), or '' for a select or a path that is no field. */
export function placeholderOf(path: string, words: PlaceholderWords): string {
  if (path === 'title') return words.placeholderTitle
  if (path === 'description') return words.placeholderText
  if (/^sources\[\d+\]\.label$/.test(path)) return words.placeholderSourceLabel
  if (/^sources\[\d+\]\.url$/.test(path)) return words.placeholderUrl
  if (/^options\[\d+\]\.title$/.test(path)) return words.placeholderOptionTitle
  if (/^images\[\d+\]\.description$/.test(path)) return words.placeholderImageDescription
  if (/^images\[\d+\]\.credit$/.test(path)) return words.placeholderCredit
  if (path === 'terminal.label') return words.endingText
  if (/^answers\[\d+\]\.label$/.test(path)) return words.nextStepWords
  if (/^explainers\[\d+\]\.term$/.test(path)) return words.placeholderTerm
  if (/^explainers\[\d+\]\.text$/.test(path)) return words.placeholderExplanation
  if (path === 'theme.logo.alt') return words.placeholderLogoAlt
  return ''
}

/**
 * **[#271]** The field a violation's key path names, for a to-do line (33.3): its placeholder,
 * the entry's place in its list counted from one, and the language, so two empty fields of one
 * Node never read as the same line -- `What it means 2 (nl)`. Null for a key path that names no
 * field (`answers`, `explainers[0]`, a JSON Pointer): the message names what it is about.
 */
export function fieldOf(keyPath: string, words: PlaceholderWords): string | null {
  // A localised text's key path ends in its language (tree-format.md 7); a credit's and a URL's do not.
  const cut = keyPath.lastIndexOf('.')
  const localised = placeholderOf(keyPath, words) === '' && cut >= 0
  const path = localised ? keyPath.slice(0, cut) : keyPath
  const word = placeholderOf(path, words)
  if (word === '') return null
  const index = /\[(\d+)\]/.exec(path)
  const name = index ? `${word} ${Number(index[1]) + 1}` : word
  return localised ? `${name} (${keyPath.slice(cut + 1)})` : name
}
