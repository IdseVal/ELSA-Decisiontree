/**
 * The rich-text subset of docs/specs/tree-format.md 3.4 to HTML: paragraphs, `*emphasis*`,
 * `**strong**`, bulleted and numbered lists, `[text](https://...)` links that open in a new
 * tab, and `[text](#id)` explainer marks (5.9). Nothing else is part of the contract.
 *
 * The converter never passes a character of the Tree through unescaped: it escapes every
 * run of text and then emits only the tags of the subset, so raw HTML in a Tree file --
 * which rule V-HTML already rejects at load -- cannot reach the page even if a Tree were
 * loaded some other way. Only `http:` and `https:` links with text become links, and only a
 * mark naming an explainer it was given becomes a term.
 */
import type { Explainer } from './tree/types.ts'

/**
 * A link target, its text, or a run of plain text; `**strong**` before `*emphasis*`.
 *
 * An emphasis mark next to another `*` opens nothing, so nesting the format does not
 * promise (`**a *b* c**`) keeps its outer marks on screen as the author wrote them
 * instead of being torn apart mid-word.
 */
const INLINE = /\[([^\]\n]*)\]\(([^\s)]+)\)|\*\*([^*\n]+)\*\*|(?<!\*)\*([^*\n]+)\*(?!\*)/g

/** An explainer mark inside a run of strong or emphasised text, which INLINE does not reach. */
const NESTED_MARK = /\[([^\]\n]*)\]\(#([^\s)]*)\)/g
/** Strong or emphasised text inside a mark's own text. */
const EMPHASIS = /\*\*[^*\n]+\*\*|(?<!\*)\*[^*\n]+\*(?!\*)/

const BULLET = /^\s{0,3}[-*]\s+(.*)$/
const NUMBER = /^\s{0,3}\d{1,9}[.)]\s+(.*)$/

/** One `[text](#id)` of a description, read the way the renderer reads it. */
export interface ExplainerMark {
  /** What the reader sees. */
  text: string
  /** The explainer it names. */
  id: string
  /** Inside `*emphasis*` or `**strong**`, or holding one, which the subset forbids (V-MARK). */
  emphasised: boolean
}

/** What a description's marks are rendered with (application.md 10.8). */
export interface ExplainerContext {
  /** The explainers of the Node the description belongs to. */
  explainers: Explainer[]
  /** The language the panels are written in. */
  lang: string
  /** Prepended to every panel id, for a copy of the text in a neighbour frame or an Overlay. */
  idPrefix: string
}

/** Escapes text for use in element content and in an attribute value alike. */
function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * A marked term and its panel as the next sibling (application.md 10.8). A term marked
 * twice gets two panels, so the second id carries its count after `--`, which no explainer
 * id can contain (tree-format.md 3.1).
 */
function term(words: string, explainer: Explainer, context: ExplainerContext, seen: Map<string, number>): string {
  const count = (seen.get(explainer.id) ?? 0) + 1
  seen.set(explainer.id, count)
  const panel = escape(`${context.idPrefix}e-${explainer.id}${count > 1 ? `--${count}` : ''}`)
  return (
    `<span class="term" tabindex="0" aria-describedby="${panel}">${escape(words)}</span>` +
    `<span class="explainer" role="tooltip" id="${panel}">` +
    `<b>${escape(explainer.term[context.lang] ?? '')}</b> ${escape(explainer.text[context.lang] ?? '')}</span>`
  )
}

/** The subset's inline marks. Text outside a mark is escaped and emitted as it stands. */
function inline(text: string, context: ExplainerContext | undefined, seen: Map<string, number>): string {
  let html = ''
  let last = 0
  for (const match of text.matchAll(INLINE)) {
    const [whole, linkText = '', url, strong, emphasis] = match
    html += escape(text.slice(last, match.index))
    last = match.index + whole.length
    if (url?.startsWith('#')) {
      const explainer = context?.explainers.find((candidate) => candidate.id === url.slice(1))
      // A mark naming no explainer it was given fails V-MARK at load; shown as written.
      html += explainer && context && linkText.trim() !== '' ? term(linkText, explainer, context, seen) : escape(whole)
    } else if (url !== undefined) {
      // A link with no text would be a link with no accessible name, so it stays text.
      html += /^https?:\/\//i.test(url) && linkText.trim() !== ''
        ? `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${inline(linkText, undefined, seen)}</a>`
        : escape(whole) // Any other scheme is not a link of this format; show it as written.
    } else if (strong !== undefined) {
      html += `<strong>${escape(strong)}</strong>`
    } else {
      html += `<em>${escape(emphasis ?? '')}</em>`
    }
  }
  return html + escape(text.slice(last))
}

/** One block of the text: a paragraph, or a list and its items, markers already stripped. */
interface Block {
  tag: 'p' | 'ul' | 'ol'
  /** One entry for a paragraph, one per item for a list. */
  items: string[]
}

/**
 * Groups lines into blocks. A blank line ends a block; a list marker starts an item; any
 * other line continues what it follows, which is how a paragraph written over several
 * lines of the file becomes one paragraph and a wrapped list item stays one item.
 */
function blocks(text: string): Block[] {
  const found: Block[] = []
  let open: Block | null = null
  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    if (line.trim() === '') {
      open = null
      continue
    }
    const bullet = BULLET.exec(line)
    const numbered = bullet ? null : NUMBER.exec(line)
    if (bullet ?? numbered) {
      const tag: Block['tag'] = bullet ? 'ul' : 'ol'
      if (open === null || open.tag !== tag) {
        open = { tag, items: [] }
        found.push(open)
      }
      open.items.push((bullet ?? numbered)?.[1] ?? '')
    } else if (open === null) {
      open = { tag: 'p', items: [line.trim()] }
      found.push(open)
    } else {
      open.items.push(`${open.items.pop() ?? ''} ${line.trim()}`)
    }
  }
  return found
}

/**
 * The rich-text `text` as safe HTML. Empty text gives an empty string. Given the Node's
 * explainers, each mark naming one becomes a term with its panel; without them, as in the
 * manifest's description, a mark is shown as written.
 */
export function richTextToHtml(text: string, explainers?: ExplainerContext): string {
  const seen = new Map<string, number>()
  return blocks(text)
    .map((block) =>
      block.tag === 'p'
        ? `<p>${inline(block.items[0] ?? '', explainers, seen)}</p>`
        : `<${block.tag}>${block.items.map((item) => `<li>${inline(item, explainers, seen)}</li>`).join('')}</${block.tag}>`,
    )
    .join('')
}

/**
 * Every explainer mark of a rich text, in order, found exactly where the renderer finds
 * them, so that what the validator checks (V-EXPLAINER, V-MARK) is what the page shows.
 */
export function explainerMarks(text: string): ExplainerMark[] {
  const marks: ExplainerMark[] = []
  for (const item of blocks(text).flatMap((block) => block.items)) {
    for (const [, linkText = '', url, strong, emphasis] of item.matchAll(INLINE)) {
      if (url?.startsWith('#')) {
        marks.push({ text: linkText, id: url.slice(1), emphasised: EMPHASIS.test(linkText) })
      } else if (url === undefined) {
        for (const [, words = '', id = ''] of (strong ?? emphasis ?? '').matchAll(NESTED_MARK)) {
          marks.push({ text: words, id, emphasised: true })
        }
      }
    }
  }
  return marks
}
