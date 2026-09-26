/**
 * The id proposed from a text (docs/specs/application.md 27.1, 32.1): a new Tree's from its
 * title, a new explainer's from the words it marks. One function for both, so the two can
 * never propose differently from the same words.
 */

/** The longest id the grammar allows (tree-format.md 3.1). */
const MAX_ID = 64

/**
 * The id proposed from `text` (27.1): lower-cased, every run of characters outside
 * `[a-z0-9]` one hyphen, no hyphen at either end, at most 64 characters. Empty when the text
 * has no letter or digit of that alphabet.
 */
export function proposedId(text: string): string {
  return cut(text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+/, ''), MAX_ID)
}

/**
 * The id of a new explainer marking `selection` (32.1): the proposed id, with `-2`, `-3`, ...
 * appended while the id is taken among `taken`, the ids of the Node's explainers. The stem is
 * cut shorter where the suffix would take the id past 64. Empty when nothing is proposed.
 */
export function explainerId(selection: string, taken: string[]): string {
  const stem = proposedId(selection)
  if (stem === '' || !taken.includes(stem)) return stem
  for (let n = 2; ; n += 1) {
    const suffix = `-${n}`
    const id = `${cut(stem, MAX_ID - suffix.length)}${suffix}`
    if (!taken.includes(id)) return id
  }
}

/** `id` at most `length` characters, with no hyphen left at the cut. */
function cut(id: string, length: number): string {
  return id.slice(0, length).replace(/-+$/, '')
}
