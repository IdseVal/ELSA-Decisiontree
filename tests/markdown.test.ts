/**
 * The rich-text subset of docs/specs/tree-format.md 3.4: what it renders, and -- since its
 * output is written into the page as HTML -- what it refuses to let through.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { richTextToHtml } from '../src/markdown.ts'
import { openTree } from '../src/tree/loader.ts'

const here = path.dirname(fileURLToPath(import.meta.url))

describe('the subset the format promises', () => {
  test('a blank line starts a paragraph; line breaks inside one become spaces', () => {
    const html = richTextToHtml('The first paragraph. It runs\nover two lines.\n\nThe second.\n')

    expect(html).toBe('<p>The first paragraph. It runs over two lines.</p><p>The second.</p>')
  })

  test('emphasis and strong', () => {
    expect(richTextToHtml('A *soft* and a **hard** word.')).toBe(
      '<p>A <em>soft</em> and a <strong>hard</strong> word.</p>',
    )
  })

  test('a bulleted list and a numbered list', () => {
    expect(richTextToHtml('- one\n- two')).toBe('<ul><li>one</li><li>two</li></ul>')
    expect(richTextToHtml('1. one\n2. two')).toBe('<ol><li>one</li><li>two</li></ol>')
  })

  test('a list item written over two lines stays one item', () => {
    expect(richTextToHtml('- one that runs\n  over two lines\n- two')).toBe(
      '<ul><li>one that runs over two lines</li><li>two</li></ul>',
    )
  })

  test('a link opens in a new tab and cannot reach back at the page that opened it', () => {
    expect(richTextToHtml('See [Article 5](https://eur-lex.europa.eu/eli/reg/2024/1689/oj).')).toBe(
      '<p>See <a href="https://eur-lex.europa.eu/eli/reg/2024/1689/oj" target="_blank"' +
        ' rel="noopener noreferrer">Article 5</a>.</p>',
    )
  })

  test('a mark the subset does not nest is left on screen, not torn apart mid-word', () => {
    // tree-format.md 3.4 promises no nesting. Showing the author their own marks back is
    // kinder than emitting them as stray asterisks around fragments of the word.
    expect(richTextToHtml('**a *b* c**')).toBe('<p>**a <em>b</em> c**</p>')
    expect(richTextToHtml('A *soft* and a **hard** word.')).toContain('<em>soft</em>')
  })

  test('a link with no text is not a link, because it would have no accessible name', () => {
    expect(richTextToHtml('[](https://example.org/)')).toBe(
      '<p>[](https://example.org/)</p>',
    )
    expect(richTextToHtml('[ ](https://example.org/)')).not.toContain('<a')
  })

  test('text with no blocks gives no markup', () => {
    expect(richTextToHtml('')).toBe('')
    expect(richTextToHtml('\n  \n')).toBe('')
  })
})

describe('what the converter refuses to emit', () => {
  // The output is written into the page as HTML, so every one of these is a security test.
  const attacks: Array<{ what: string; text: string; absent: string }> = [
    { what: 'a script tag', text: 'before <script>alert(1)</script> after', absent: '<script' },
    { what: 'an image with an error handler', text: '<img src=x onerror=alert(1)>', absent: '<img' },
    { what: 'a javascript: link', text: '[click](javascript:alert(1))', absent: '<a' },
    { what: 'a data: link', text: '[click](data:text/html,<script>alert(1)</script>)', absent: '<a' },
    { what: 'an attribute break-out in a link', text: '[x](https://a.example/" onmouseover="alert(1))', absent: 'onmouseover="' },
    { what: 'an attribute break-out in link text', text: '[<b>x</b>](https://a.example/)', absent: '<b>' },
    { what: 'a raw anchor', text: '<a href="https://evil.example">x</a>', absent: 'href="https://evil.example"' },
  ]

  test.for(attacks)('$what is escaped, not emitted', ({ text, absent }) => {
    expect(richTextToHtml(text)).not.toContain(absent)
  })

  test('an ampersand and angle brackets survive as text', () => {
    expect(richTextToHtml('a < b && c > d')).toBe('<p>a &lt; b &amp;&amp; c &gt; d</p>')
  })

  test('every tag in the output is one of the subset', () => {
    const html = richTextToHtml(
      '**A** *b* [c](https://a.example/)\n\n- d\n\n1. e\n\n<script>f</script>',
    )
    const tags = [...html.matchAll(/<\/?([a-z0-9]+)/g)].map((match) => match[1])

    expect(new Set(tags)).toEqual(new Set(['p', 'strong', 'em', 'a', 'ul', 'li', 'ol']))
  })
})

describe('the descriptions of a real Tree', () => {
  test('every Node of the example Tree renders as paragraphs in both languages', async () => {
    const tree = await openTree(path.join(here, '..', 'trees', 'ai-act-example'))
    const ids = ['start', 'prohibited-practices', 'social-scoring', 'covered']

    for (const id of ids) {
      const node = (await tree.getNode(id))!
      for (const language of tree.manifest.languages) {
        const html = richTextToHtml(node.description[language]!)

        expect(html, `${id}.${language}`).toMatch(/^<p>/)
        expect(html, `${id}.${language}`).not.toContain('undefined')
      }
    }
  })
})
