'use client'

/**
 * Marking a term (docs/specs/application.md 32.1, 32.4; ADR-133-explainers-in-the-editor
 * decisions 1 and 4): the `mark` button the description's rim shows under the counter pill
 * while a selection lies in its source, and the rules that say where a mark may go and what
 * marking and unmarking do to the source text. Pure but for the button, so
 * `tests/editor/marker.test.ts` asserts the rules without a browser.
 *
 * Imports of `src/`: `markdown.ts`, and types (34.4).
 */
import { explainerMarks, syntaxSpans } from '../markdown.ts'

/** At most eight explainers on a Node (tree-format.md 5.7, 5.9). */
export const MAX_EXPLAINERS = 8

/** The chrome words the button says; strings, because a client component takes no module. */
export interface MarkerWords {
  mark: string
  cannotMarkHere: string
  explainerLimit: string
}

/** Why the button is disabled, by the name of the chrome word that says it. */
export type MarkRefusal = 'cannotMarkHere' | 'explainerLimit'

/** The selection `[start, end)` of `text` without the white space at its two ends: a double click takes the space after a word. */
export function trimmedSelection(text: string, start: number, end: number): [number, number] {
  let from = Math.min(start, end)
  let to = Math.max(start, end)
  while (from < to && /\s/.test(text[from]!)) from += 1
  while (to > from && /\s/.test(text[to - 1]!)) to -= 1
  return [from, to]
}

/**
 * Why the words `[start, end)` of `text` cannot be marked on a Node that has `count`
 * explainers, or null when they can (32.1): the Node is full; or the selection spans a line
 * break, holds a character of the subset's syntax, cuts into a link, a mark, emphasis, strong
 * text or a list marker (V-MARK: a mark is not written inside them), or has no letter or digit
 * an id could be made of.
 */
export function markRefusal(text: string, start: number, end: number, count: number, id: string): MarkRefusal | null {
  if (count >= MAX_EXPLAINERS) return 'explainerLimit'
  const words = text.slice(start, end)
  if (id === '' || /[\n[\]*]/.test(words)) return 'cannotMarkHere'
  if (syntaxSpans(text).some((span) => start < span.end && end > span.start)) return 'cannotMarkHere'
  return null
}

/** `text` with the words `[start, end)` marked for the explainer `id`: `[words](#id)` (5.9). */
export function marked(text: string, start: number, end: number, id: string): string {
  return `${text.slice(0, start)}[${text.slice(start, end)}](#${id})${text.slice(end)}`
}

/** `text` with every mark of the explainer `id` replaced by its words (32.4). */
export function unmarked(text: string, id: string): string {
  // An id is `[a-z0-9-]` (3.1): nothing in it is special in a pattern.
  return text.replace(new RegExp(`\\[([^\\]\\n]*)\\]\\(#${id}\\)`, 'g'), '$1')
}

/** Whether `text` marks the explainer `id` at least once, read as the validator reads it (V-EXPLAINER). */
export function marks(text: string | undefined, id: string): boolean {
  return explainerMarks(text ?? '').some((mark) => mark.id === id)
}

/**
 * The `mark` button. Disabled buttons show no title in every browser, so a refused mark is
 * `aria-disabled` and says why in its title, and a press does nothing.
 */
export function Marker({ refusal, onMark, words }: { refusal: MarkRefusal | null; onMark: () => void; words: MarkerWords }) {
  return (
    <button
      type="button"
      className="editor-mark"
      aria-disabled={refusal !== null || undefined}
      title={refusal === null ? undefined : words[refusal]}
      onClick={() => {
        if (refusal === null) onMark()
      }}
    >
      {words.mark}
    </button>
  )
}
