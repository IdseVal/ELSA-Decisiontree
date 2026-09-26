/**
 * Reading a Node's fields by their key paths (docs/specs/application.md 22.2, 29.7): what
 * a `Field` shows from the Node the last write response carried, and how two Nodes are
 * compared field by field to tell a collaborator's write from one's own. Pure; the
 * client components import it.
 */
import type { DraftNode, LocalisedText } from '../tree/types.ts'

/** V-HTML, as the validator reads it: `<` followed by a letter, `/` or `!` (tree-format.md 3.4). */
export const RAW_HTML = /<[a-zA-Z/!]/

/** A plain field is one line: a pasted or typed line break becomes a space (28.1, V-PLAIN). */
export function plainLine(text: string): string {
  return text.replace(/\r\n?|\n/g, ' ')
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
