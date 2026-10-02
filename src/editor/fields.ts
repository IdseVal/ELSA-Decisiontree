/**
 * Reading a Node's fields by their key paths (docs/specs/application.md 22.2, 29.7): what
 * a `Field` shows from the Node the last write response carried, and how two Nodes are
 * compared field by field to tell a collaborator's write from one's own. **[#172]** And the
 * cap a field's typing stops at (28.4, amended). Pure; the client components import it.
 */
import { countedLength, estimatedLines } from '../tree/measure.ts'
import type { DraftNode, LocalisedText } from '../tree/types.ts'
import type { FieldLimit } from './mode.ts'

/** V-HTML, as the validator reads it: `<` followed by a letter, `/` or `!` (tree-format.md 3.4). */
export const RAW_HTML = /<[a-zA-Z/!]/

/** A plain field is one line: a pasted or typed line break becomes a space (28.1, V-PLAIN). */
export function plainLine(text: string): string {
  return text.replace(/\r\n?|\n/g, ' ')
}

/**
 * **[#172]** Whether `text` may stand in a field of `limit` that held `before`: within the
 * limit as the validator measures it (tree-format.md 3.8 -- code points of the counted text,
 * and the estimated lines where the limit has them), or no longer by either measure than
 * `before`, so that a text already over its limit can shrink and never grow (28.4).
 */
export function fitsLimit(text: string, limit: FieldLimit, before: string): boolean {
  if (countedLength(text) > Math.max(limit.characters, countedLength(before))) return false
  return limit.lines === undefined || estimatedLines(text) <= Math.max(limit.lines, estimatedLines(before))
}

/** Splits a text into what a reader sees as characters, so a cut never takes half of one (3.8). */
const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

/**
 * **[#172]** The text a field holds after an input event that turned `previous` into `next`
 * with the caret at `caret`: `next` where it fits `limit` (`fitsLimit`), else `previous` with
 * the inserted part -- the text before the caret that `previous` did not have -- cut after
 * the last whole character that fits. A key past the cap therefore does nothing and a paste
 * is cut at the cap (28.4, amended 2026-10-02). An input that does not fit and inserted
 * nothing (a deletion that lengthens the counted text, as taking the `]` out of a link
 * does) is refused whole. `caret` is where the text's caret goes.
 */
export function capped(previous: string, next: string, caret: number, limit: FieldLimit): { text: string; caret: number } {
  const fits = (text: string): boolean => fitsLimit(text, limit, previous)
  if (fits(next)) return { text: next, caret }
  // What follows the caret was in `previous` already; the inserted part runs from where the two first differ to the caret.
  const after = next.slice(caret)
  const bound = Math.min(caret, previous.length - after.length)
  let start = 0
  while (start < bound && previous[start] === next[start]) start += 1
  const before = next.slice(0, start)
  if (!previous.endsWith(after) || !fits(before + after)) return { text: previous, caret: previous.length - after.length }
  let kept = ''
  for (const { segment } of graphemes.segment(next.slice(start, caret))) {
    if (!fits(before + kept + segment + after)) break
    kept += segment
  }
  return { text: before + kept + after, caret: start + kept.length }
}

/** The queue's key of one field of one Node. */
export function keyOf(nodeId: string, keyPath: string): string {
  return `${nodeId} ${keyPath}`
}

/**
 * The value at `path` -- a key path of 22.2 without its language -- in the language `lang`,
 * or the string itself where the field is not localised (`lang` null). Undefined where the
 * Node has no such field or no text in that language.
 */
export function valueAt(node: DraftNode | undefined, path: string, lang: string | null): string | undefined {
  if (!node) return undefined
  // The draft's `terminal.outcome` is read as `outcome` (toDraftNode).
  const found = path === 'terminal.outcome' ? node.outcome : walk(node, path)
  if (lang === null) return typeof found === 'string' ? found : undefined
  const localised = found as LocalisedText | undefined
  const text = localised?.[lang]
  return typeof text === 'string' ? text : undefined
}

function walk(node: DraftNode, path: string): unknown {
  let current: unknown = node
  for (const segment of path.split('.')) {
    const match = /^([a-z]+)(?:\[(\d+)\])?$/.exec(segment)
    if (!match || current === null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[match[1]!]
    if (match[2] !== undefined) current = Array.isArray(current) ? current[Number(match[2])] : undefined
  }
  return current
}

/**
 * Every field of a Node as `key path -> value`, the localised ones once per language they
 * hold: the flat form two responses are compared in (29.7).
 */
export function fieldValues(node: DraftNode): Record<string, string> {
  const out: Record<string, string> = {}
  const localised = (at: string, text: LocalisedText | undefined): void => {
    for (const [lang, value] of Object.entries(text ?? {})) out[`${at}.${lang}`] = value
  }
  localised('title', node.title)
  localised('description', node.description)
  node.sources.forEach((source, i) => {
    localised(`sources[${i}].label`, source.label)
    out[`sources[${i}].kind`] = source.kind
    out[`sources[${i}].url`] = source.url
  })
  node.images.forEach((image, i) => {
    localised(`images[${i}].description`, image.description)
    out[`images[${i}].credit`] = image.credit
  })
  node.options.forEach((option, i) => localised(`options[${i}].title`, option.title))
  node.explainers.forEach((explainer, i) => {
    localised(`explainers[${i}].term`, explainer.term)
    localised(`explainers[${i}].text`, explainer.text)
  })
  if (node.outcome !== undefined) out['terminal.outcome'] = node.outcome
  return out
}
