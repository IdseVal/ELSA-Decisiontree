/**
 * The rich-text subset of docs/specs/tree-format.md 3.4: what it renders, and -- since its
 * output is written into the page as HTML -- what it refuses to let through.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { explainerMarks, plainDescription, richTextToHtml } from '../src/markdown.ts'
import { openTree } from '../src/tree/loader.ts'
import type { Explainer } from '../src/tree/types.ts'

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

describe('explainer marks (tree-format.md 3.4, 5.9; application.md 10.8)', () => {
  const provider: Explainer = {
    id: 'provider',
    term: { en: 'provider', nl: 'aanbieder' },
    text: { en: 'Someone who places an AI system on the market.', nl: 'Wie een AI-systeem in de handel brengt.' },
  }
  const context = { explainers: [provider], lang: 'en', idPrefix: '' }

  test('a mark becomes a focusable term described by its panel, the next sibling', () => {
    expect(richTextToHtml('Are you a [providers](#provider)?', context)).toBe(
      '<p>Are you a <span class="term" tabindex="0" aria-describedby="e-provider">providers</span>' +
        '<span class="explainer" role="tooltip" id="e-provider"><b>provider</b> Someone who places an AI system on the market.</span>?</p>',
    )
  })

  test('the panel is written in the language asked for, and its id carries the prefix', () => {
    const html = richTextToHtml('De [aanbieders](#provider).', { ...context, lang: 'nl', idPrefix: 'n1-' })

    expect(html).toContain('aria-describedby="n1-e-provider">aanbieders</span>')
    expect(html).toContain('id="n1-e-provider"><b>aanbieder</b> Wie een AI-systeem in de handel brengt.</span>')
  })

  test('a term marked twice has two panels with distinct ids', () => {
    const html = richTextToHtml('A [provider](#provider).\n\n- another [provider](#provider)', context)
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((match) => match[1])

    expect(ids).toEqual(['e-provider', 'e-provider--2'])
    expect(html).toContain('aria-describedby="e-provider--2"')
  })

  test('without the Node explainers, or naming none of them, a mark is shown as written', () => {
    expect(richTextToHtml('A [provider](#provider).')).toBe('<p>A [provider](#provider).</p>')
    expect(richTextToHtml('A [deployer](#deployer).', context)).toBe('<p>A [deployer](#deployer).</p>')
  })

  test('the explainer text is escaped like every other text', () => {
    const hostile = { ...provider, text: { en: '<img src=x onerror=alert(1)>' } }

    expect(richTextToHtml('[p](#provider)', { ...context, explainers: [hostile] })).not.toContain('<img')
  })

  test('the marks are found where the renderer finds them, emphasis included', () => {
    expect(explainerMarks('A [providers](#provider) and\n\n- a [deployer](#deployer)')).toEqual([
      { text: 'providers', id: 'provider', emphasised: false },
      { text: 'deployer', id: 'deployer', emphasised: false },
    ])
    expect(explainerMarks('**the [provider](#provider)** and *a [x](#y)*')).toEqual([
      { text: 'provider', id: 'provider', emphasised: true },
      { text: 'x', id: 'y', emphasised: true },
    ])
    expect(explainerMarks('[**provider**](#provider) and [](#empty) and [a link](https://a.example/)')).toEqual([
      { text: '**provider**', id: 'provider', emphasised: true },
      { text: '', id: 'empty', emphasised: false },
    ])
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

/**
 * The plain-text reduction of docs/specs/application.md 16.3, the one function four
 * documents read: the meta description and a `WebPage`'s description take its cut string,
 * a `Question`'s text and `llms.txt`'s blockquote take its reduced one.
 */
describe('the plain-text reduction (16.3)', () => {
  test('a link becomes its text and an explainer mark its term', () => {
    const { reduced } = plainDescription(
      'See [Article 5](https://eur-lex.europa.eu/eli/reg/2024/1689/oj) on [providers](#provider).',
    )

    expect(reduced).toBe('See Article 5 on providers.')
  })

  test('emphasis markers go, and the words they marked stay', () => {
    expect(plainDescription('A *soft* and a **hard** word.').reduced).toBe('A soft and a hard word.')
  })

  test('list markers go and the blocks are joined by one space', () => {
    expect(plainDescription('The question:\n\n- one entry\n- another entry\n\n1. and a numbered one').reduced).toBe(
      'The question: one entry another entry and a numbered one',
    )
  })

  test('a line break becomes one space and runs of whitespace collapse', () => {
    expect(plainDescription('  The first line\n   and its   second.\t\n').reduced).toBe('The first line and its second.')
  })

  test('nothing of the subset is left in the result', () => {
    const { reduced } = plainDescription('**Strong**, *soft*, a [link](https://a.example/), a [mark](#m).\n\n- item')

    expect(reduced).not.toMatch(/[*]|\]\(/)
  })

  test('a description under the limit is returned whole and uncut', () => {
    const short = 'A question about the scope of the Act. Answer yes or no.'
    const { reduced, cut } = plainDescription(short)

    expect(reduced).toBe(short)
    expect(cut).toBe(short)
    expect(cut).not.toContain('\u2026')
  })

  test('over the limit, the cut falls at the last sentence end that fits', () => {
    const first = 'The Act applies to providers and deployers of AI systems in the Union.'
    const second = 'It applies to importers and distributors as well, wherever they are established.'
    const third = 'The rest follows from Article 2.'
    const { cut } = plainDescription(`${first} ${second} ${third}`)

    expect(cut).toBe(`${first} ${second}`)
    expect([...cut].length).toBeLessThanOrEqual(155)
    expect(cut).not.toContain('\u2026')
  })

  test('with no sentence end in reach the cut falls on a word boundary and ends in an ellipsis', () => {
    // One sentence of 180 characters: no `.`, `!` or `?` below 155, so step 4's second half
    // runs. The 155th character falls inside "considerations", which must stay whole.
    const long =
      'The scope of the Act reaches providers, deployers, importers and distributors of systems placed on the market of the Union, and the rest of this sentence considerations aside'
    const { cut } = plainDescription(long)

    expect([...cut].length).toBeLessThanOrEqual(155)
    expect(cut.endsWith('\u2026')).toBe(true)
    expect(cut).not.toContain('considerations')
    expect(long.startsWith(cut.slice(0, -1))).toBe(true)
  })

  test('the cut counts code points, so a surrogate pair is never split', () => {
    // 160 astral characters: cutting on UTF-16 units would leave half a pair at the end.
    const emoji = '\u{1F331} '.repeat(80).trim()
    const { cut } = plainDescription(emoji)

    expect([...cut].length).toBeLessThanOrEqual(155)
    // Every code point of the result is a whole one: a split pair would show as two halves
    // neither of which is the character.
    expect([...cut].every((point) => point === '\u{1F331}' || point === ' ' || point === '\u2026')).toBe(true)
  })

  test('the same input gives the same output every time', () => {
    const text = 'A *description* with [a link](https://a.example/) and two paragraphs.\n\nThe second one.'

    expect(plainDescription(text)).toEqual(plainDescription(text))
  })

  test('the cut string, ellipsis removed, is a prefix of the reduced one', () => {
    // The assertion that keeps a `Question`'s text and a meta description one reduction.
    const texts = [
      'Short enough to be returned whole.',
      'A *marked up* one with [a link](https://a.example/) in it.',
      'x '.repeat(120),
      'No sentence end anywhere in this one so the ellipsis branch runs ' + 'y '.repeat(60),
    ]

    for (const text of texts) {
      const { reduced, cut } = plainDescription(text)
      const withoutEllipsis = cut.endsWith('\u2026') ? cut.slice(0, -1) : cut

      expect(reduced.startsWith(withoutEllipsis), text.slice(0, 30)).toBe(true)
    }
  })

  test('every Node of the example Tree reduces to plain text that fits a listing', async () => {
    const tree = await openTree(path.join(here, '..', 'trees', 'ai-act-example'))

    for (const id of tree.nodeIds()) {
      const node = (await tree.getNode(id))!
      for (const language of tree.manifest.languages) {
        const { reduced, cut } = plainDescription(node.description[language]!)

        expect(reduced, `${id}.${language}`).not.toMatch(/[*]|\]\(/)
        expect([...cut].length, `${id}.${language}`).toBeLessThanOrEqual(155)
        // A conforming Tree's Node description is at most 150 counted characters, so the
        // two outputs are the same string and the distinction of 16.3 never shows.
        expect(cut, `${id}.${language}`).toBe(reduced)
      }
    }
  })
})
