/**
 * The rich-text subset of docs/specs/tree-format.md 3.4 to HTML: paragraphs, `*emphasis*`,
 * `**strong**`, bulleted and numbered lists, and `[text](https://...)` links that open in
 * a new tab. Nothing else is part of the contract.
 *
 * The converter never passes a character of the Tree through unescaped: it escapes every
 * run of text and then emits only the tags of the subset, so raw HTML in a Tree file --
 * which rule V-HTML already rejects at load -- cannot reach the page even if a Tree were
 * loaded some other way. Only `http:` and `https:` links become links.
 */

/** A link target, its text, or a run of plain text; `**strong**` before `*emphasis*`. */
const INLINE = /\[([^\]\n]*)\]\(([^\s)]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g

const BULLET = /^\s{0,3}[-*]\s+(.*)$/
const NUMBER = /^\s{0,3}\d{1,9}[.)]\s+(.*)$/

/** Escapes text for use in element content and in an attribute value alike. */
function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** The subset's inline marks. Text outside a mark is escaped and emitted as it stands. */
function inline(text: string): string {
  let html = ''
  let last = 0
  for (const match of text.matchAll(INLINE)) {
    const [whole, linkText, url, strong, emphasis] = match
    html += escape(text.slice(last, match.index))
    last = match.index + whole.length
    if (url !== undefined) {
      html += /^https?:\/\//i.test(url)
        ? `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${inline(linkText ?? '')}</a>`
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

/** The rich-text `text` as safe HTML. Empty text gives an empty string. */
export function richTextToHtml(text: string): string {
  return blocks(text)
    .map((block) =>
      block.tag === 'p'
        ? `<p>${inline(block.items[0] ?? '')}</p>`
        : `<${block.tag}>${block.items.map((item) => `<li>${inline(item)}</li>`).join('')}</${block.tag}>`,
    )
    .join('')
}
