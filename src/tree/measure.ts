/**
 * How text is measured (docs/specs/tree-format.md 3.8): the counted text of a field, its
 * length in code points and the estimated line count of rich text. **[#138]** Moved here
 * from `validate.ts` (ADR-133-bubble-edited-in-place decision 4) so that the editor's
 * counter in the browser and the validator on the server run the same twenty lines: this
 * module is pure -- no `node:` module, no `ajv`, no schema -- and `validate.ts` re-exports
 * the three names, so nothing that imported them changes.
 */

const MARKDOWN_LINK = /\[([^\]]*)\]\([^)]*\)/g
const LIST_ITEM = /^(-\s|\d+\.\s)/

/** The width the estimated line count of rich text assumes (tree-format.md 3.8, 5.7). */
const CHARS_PER_LINE = 75

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

/**
 * Tree-format.md 3.8: how many lines this rich text takes when a renderer lays it out at
 * `CHARS_PER_LINE`. Blocks are paragraphs and list items; a run of blank lines between
 * two blocks costs one line of paragraph spacing.
 */
export function estimatedLines(text: string): number {
  const blocks: string[] = []
  let breaks = 0
  let afterBlank = false
  for (const raw of countedText(text).split('\n')) {
    const line = raw.trim()
    if (line === '') {
      if (blocks.length > 0 && !afterBlank) breaks += 1
      afterBlank = true
      continue
    }
    if (afterBlank || blocks.length === 0 || LIST_ITEM.test(line)) blocks.push(line)
    else blocks[blocks.length - 1] += ` ${line}`
    afterBlank = false
  }
  const lines = blocks.reduce((sum, block) => sum + Math.max(1, Math.ceil([...block].length / CHARS_PER_LINE)), 0)
  return lines + breaks
}
