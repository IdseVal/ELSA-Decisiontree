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
 *
 * [#118] The same subset also reduces to **plain text** (`plainDescription`, application.md
 * 16.3): what a `<meta name="description">`, a JSON-LD record and `llms.txt` say a page is
 * about. One reduction with two outputs, so those four consumers cannot drift apart.
 */
import type { Explainer } from './tree/types.ts'
import { countedText } from './tree/measure.ts'

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

/**
 * The two strings application.md 16.3 hands out, from one reduction of one description.
 *
 * `reduced` is steps 1 and 2 -- what the text says with no Markdown left in it. `cut` is
 * steps 3 and 4 on top of it: the same string when it fits a result listing, and a
 * sentence or a word shorter when it does not. The meta description and a `WebPage`'s
 * description take `cut`; a `Question`'s text and `llms.txt`'s blockquote take `reduced`.
 */
export interface PlainDescription {
  /** The description as plain text, markers gone and blocks joined by one space. */
  reduced: string
  /** `reduced` at most 155 characters, cut at a sentence or a word, ending in an ellipsis. */
  cut: string
}

/** What a `<meta name="description">` shows before a result listing truncates it (16.3). */
const DESCRIPTION_LIMIT = 155

/** The emphasis markers of 3.4, read exactly as `INLINE` reads them, so both agree. */
const EMPHASIS_MARKS = /\*\*([^*\n]+)\*\*|(?<!\*)\*([^*\n]+)\*(?!\*)/g

/** A sentence's last character, when a space follows it (16.3 step 4). */
const SENTENCE_END = new Set(['.', '!', '?'])

/**
 * A Node's or a Tree's rich-text description as the plain text 16.3 describes, in four
 * deterministic steps: the counted text of tree-format.md 3.8 (links and explainer marks
 * become their words), the subset's remaining markers dropped and the blocks joined, the
 * 155-character test, and the cut.
 *
 * Step 2 is where this and 3.8 differ on purpose: 3.8 counts an asterisk because it takes
 * a reader's space on screen, and a meta description shows nobody an asterisk.
 */
export function plainDescription(text: string): PlainDescription {
  const joined = blocks(countedText(text))
    .flatMap((block) => block.items)
    .join(' ')
  const reduced = joined
    .replace(EMPHASIS_MARKS, (_whole, strong: string | undefined, emphasis: string | undefined) => strong ?? emphasis ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  return { reduced, cut: cutToLimit(reduced) }
}

/**
 * Steps 3 and 4 of 16.3. Characters are Unicode code points, so a cut never splits a
 * surrogate pair; and because every cut falls where a sentence or a word ends, it never
 * splits a combining sequence either -- a mark that follows a space belongs to the word
 * after it.
 *
 * They do not fire for a conforming Tree, whose Node description is at most 150 counted
 * characters (tree-format.md 5.7). They are here because a reduction that is not total is
 * a reduction with a crash in it, and because that limit has already moved twice.
 */
function cutToLimit(reduced: string): string {
  const points = [...reduced]
  if (points.length <= DESCRIPTION_LIMIT) return reduced

  for (let end = DESCRIPTION_LIMIT - 1; end >= 0; end -= 1) {
    if (SENTENCE_END.has(points[end]!) && points[end + 1] === ' ') return points.slice(0, end + 1).join('')
  }
  // No sentence ends in the window: one character of the limit goes to the ellipsis.
  const space = points.slice(0, DESCRIPTION_LIMIT - 1).lastIndexOf(' ')
  const words = space > 0 ? space : DESCRIPTION_LIMIT - 1
  return `${points.slice(0, words).join('').trimEnd()}\u2026`
}
