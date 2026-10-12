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
  return stem === '' ? stem : unused(stem, taken)
}

/**
 * **[#168]** The address of a new Tree titled `title` (27.1): the proposed id of the title
 * with its accents folded to their letters -- `Één wet` is `een-wet`, not `n-wet` -- or
 * `tree` when no letter or digit is left, with `-2`, `-3`, ... appended past `taken`, the
 * addresses the route has refused. The creator is never asked for it.
 */
export function treeIdOf(title: string, taken: string[]): string {
  return unused(proposedId(title.normalize('NFKD').replace(/\p{M}/gu, '')) || 'tree', taken)
}

/** `stem`, or the first of `stem-2`, `stem-3`, ... not in `taken`, cut so it stays within 64. */
function unused(stem: string, taken: string[]): string {
  if (!taken.includes(stem)) return stem
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
