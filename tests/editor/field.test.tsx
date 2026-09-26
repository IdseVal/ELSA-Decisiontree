// @vitest-environment jsdom
/**
 * **[#138]** The Field (docs/specs/application.md 28.1, 28.4, 28.5; ADR-133-bubble-edited-in-place),
 * mounted in a document with the Editor around it and a fake `fetch` behind the queue: the
 * counter pill counts as `countedLength` and `estimatedLines` count, on the strings
 * `markdown.test.ts` measures and the full Node's; a plain field turns a line break into a
 * space and blurs on Enter; the description shows the rendered text until it is focused and
 * the source while it is; `<` before a letter is refused at the field before anything is
 * sent; and a response's value repaints a field that is not being edited.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { Editor } from '../../src/editor/Editor.tsx'
import { Field } from '../../src/editor/Field.tsx'
import type { EditorWords } from '../../src/editor/mode.ts'
import { countedLength, estimatedLines } from '../../src/tree/measure.ts'
import type { DraftNode } from '../../src/tree/types.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const words = Object.fromEntries(
  [
    'missingText', 'characters', 'lines', 'addSource', 'editSource', 'removeSource', 'sourceKind', 'sourceUrl', 'sourceLegal', 'sourceCaseLaw',
    'sourceLiterature', 'outcome', 'outcomeNotApplicable', 'outcomeApplicable', 'outcomeProhibited', 'outcomeRefer', 'saving', 'saved', 'notSaved',
    'retrying', 'retry', 'notEditable', 'changedElsewhere', 'sessionExpired', 'publicBehind', 'toOverview',
  ].map((key) => [key, key]),
) as unknown as EditorWords
const loginWords = { login: 'login', password: 'password', signIn: 'signIn', loginFailed: '', loginLocked: '', requestFailed: '' }
const fieldWords = { missingText: 'Text missing in this language', characters: 'characters', lines: 'lines' }

/** The strings `markdown.test.ts` renders, and the full Node's two texts at the maximum. */
const TEXTS = [
  'Does your AI system use one of the [practices](#practice) Article 5 prohibits?',
  'The first paragraph.\n\nA blank line starts the second paragraph. A list:\n\n- one entry\n- another entry',
  '**Strong** and *emphasis*, a [link](https://example.org/) and the rest.',
  'Every field of this Node is at the maximum the format allows so that if this page fits inside the [Bubble](#bubble) every valid Tree fits which is the promise t.',
  'The full Node: a title of exactly eighty characters, the most it may be The ful.',
  'Een titel met een é en een ü, die per codepunt tellen.',
]

const node = (title: string, description: string): DraftNode => ({
  id: 'start',
  kind: 'explanation',
  title: { en: title, nl: '' },
  description: { en: description, nl: 'Nederlands' },
  metadata: { version: '1' },
  sources: [],
  images: [],
  options: [],
  explainers: [{ id: 'practice', term: { en: 'practice' }, text: { en: 'A practice.' } }, { id: 'bubble', term: { en: 'Bubble' }, text: { en: 'The round one.' } }],
})

let root: Root
let container: HTMLDivElement
let sent: Array<{ url: string; body: unknown }>
let answer: (body: unknown) => Response

beforeEach(() => {
  vi.useFakeTimers()
  sent = []
  answer = (body) => new Response(JSON.stringify(body), { status: 200 })
  vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body)) as unknown
    sent.push({ url, body })
    return Promise.resolve(answer(body))
  })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

/** A write response carrying `node`, as the store answers a field write (22.3). */
const responseWith = (stored: DraftNode, violations: unknown[] = []) => ({
  revision: 2,
  node: stored,
  violations,
  tree: { advisory: violations.length, published: false, publicCopyCurrent: true },
})

function mount(draft: DraftNode, field: Parameters<typeof Field>[0]): void {
  act(() => {
    root.render(
      <Editor treeId="t" lang="en" words={words} loginWords={loginWords} adminHref="/admin" nodes={{ start: draft }} violations={[]} published={false} publicCopyCurrent>
        <h1>
          <Field {...field} />
        </h1>
      </Editor>,
    )
  })
}

const textarea = (): HTMLTextAreaElement => container.querySelector('textarea')!

function type(value: string): void {
  act(() => {
    const element = textarea()
    // React listens to the native setter's change; setting `.value` alone tells it nothing.
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(element, value)
    element.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function focus(): void {
  act(() => {
    const element = container.querySelector<HTMLElement>('textarea, .editor-rendered')!
    element.focus()
    element.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
  })
}

const pill = (): string | undefined => document.querySelector('.editor-pill')?.textContent ?? undefined

describe('the counter counts as the validator counts (28.4)', () => {
  test.for(TEXTS)('%s', (text) => {
    mount(node('T', text), { nodeId: 'start', path: 'description', lang: 'en', value: text, limit: { characters: 150, lines: 2 }, rich: true, words: fieldWords })
    focus()

    expect(pill()).toBe(`${countedLength(text)} / 150${estimatedLines(text)} / 2`)
  })

  test('a title past 80 is marked over, still holds its text, and its write goes with the whole text', async () => {
    const long = `${'x'.repeat(78)} and more`
    mount(node('Short', 'D'), { nodeId: 'start', path: 'title', lang: 'en', value: 'Short', limit: { characters: 80 }, words: fieldWords })
    focus()
    type(long)

    expect(pill()).toBe(`${countedLength(long)} / 80`)
    expect(document.querySelector('.editor-pill--over')).not.toBeNull()
    expect(container.querySelector('.editor-field--over')).not.toBeNull()
    expect(textarea().value).toBe(long)
    await act(() => vi.advanceTimersByTimeAsync(700))
    expect(sent.map((s) => s.body)).toEqual([{ path: 'title.en', value: long }])
  })
})

describe('a plain field is one line (28.1)', () => {
  test('a pasted line break becomes a space, and Enter blurs the field', () => {
    mount(node('One', 'D'), { nodeId: 'start', path: 'title', lang: 'en', value: 'One', limit: { characters: 80 }, words: fieldWords })
    focus()
    type('One\ntwo\r\nthree')
    expect(textarea().value).toBe('One two three')

    act(() => {
      textarea().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    })
    expect(document.activeElement).not.toBe(textarea())
  })

  test('a field with no text in the page language is an empty region with the placeholder, and nothing is written for it', async () => {
    mount(node('T', 'D'), { nodeId: 'start', path: 'title', lang: 'nl', value: '', limit: { characters: 80 }, words: fieldWords })

    expect(textarea().value).toBe('')
    expect(textarea().placeholder).toBe(fieldWords.missingText)
    await act(() => vi.advanceTimersByTimeAsync(1000))
    expect(sent).toEqual([])
  })
})

describe('the description: rendered and source (28.5)', () => {
  const text = 'Uses a [practice](#practice) of *note*.'

  test('shows the rendered text it was given until focused, the source while focused, and its own render after an edit', async () => {
    mount(node('T', text), {
      nodeId: 'start',
      path: 'description',
      lang: 'en',
      value: text,
      limit: { characters: 150, lines: 2 },
      rich: true,
      rendered: <div className="prose" data-public="">rendered by the page</div>,
      explainers: node('T', text).explainers,
      words: fieldWords,
    })
    expect(container.querySelector('[data-public]')).not.toBeNull()
    expect(container.querySelector('textarea')).toBeNull()

    focus()
    expect(textarea().value).toBe(text)
    expect(container.querySelector('[data-public]')).toBeNull()

    type(`${text} Edited.`)
    act(() => textarea().blur())
    await act(() => vi.advanceTimersByTimeAsync(0))
    const prose = container.querySelector('.editor-rendered .prose')!
    expect(prose.innerHTML).toContain('<span class="term" tabindex="0" aria-describedby="e-practice">practice</span>')
    expect(prose.innerHTML).toContain('<em>note</em>')
    expect(prose.textContent).toContain('Edited.')
    expect(container.querySelector('[data-public]')).toBeNull()
  })

  test('raw HTML is refused at the field before sending, with V-HTML, and the text stays', async () => {
    mount(node('T', 'Plain.'), { nodeId: 'start', path: 'description', lang: 'en', value: 'Plain.', limit: { characters: 150, lines: 2 }, rich: true, words: fieldWords })
    focus()
    type('Plain. <script>')
    await act(() => vi.advanceTimersByTimeAsync(1000))

    expect(sent).toEqual([])
    expect(textarea().value).toBe('Plain. <script>')
    expect(container.querySelector('.editor-field--refused')).not.toBeNull()

    type('Plain. Fixed.')
    await act(() => vi.advanceTimersByTimeAsync(700))
    expect(sent.map((s) => s.body)).toEqual([{ path: 'description.en', value: 'Plain. Fixed.' }])
    expect(container.querySelector('.editor-field--refused')).toBeNull()
  })
})

describe('the response repaints (29.7)', () => {
  test("a field not being edited takes the response's value; one being edited keeps the screen's", async () => {
    const draft = node('Mine', 'Mine too')
    act(() => {
      root.render(
        <Editor treeId="t" lang="en" words={words} loginWords={loginWords} adminHref="/admin" nodes={{ start: draft }} violations={[]} published={false} publicCopyCurrent>
          <Field nodeId="start" path="title" lang="en" value="Mine" limit={{ characters: 80 }} words={fieldWords} />
          <Field nodeId="start" path="description" lang="en" value="Mine too" limit={{ characters: 150, lines: 2 }} rich words={fieldWords} />
        </Editor>,
      )
    })
    // The store answers the description's write with a title a collaborator changed meanwhile.
    answer = () => new Response(JSON.stringify(responseWith({ ...draft, title: { en: 'Theirs', nl: '' }, description: { en: 'Mine too, edited', nl: 'x' } })), { status: 200 })
    const description = container.querySelectorAll<HTMLElement>('.editor-rendered')[0]!
    act(() => description.focus())
    act(() => {
      description.dispatchEvent(new FocusEvent('focus'))
    })
    const [title] = container.querySelectorAll('textarea')
    expect(title!.value).toBe('Mine')
    const area = container.querySelectorAll('textarea')[1]!
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(area, 'Mine too, edited')
      area.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(() => vi.advanceTimersByTimeAsync(700))
    await act(() => vi.advanceTimersByTimeAsync(0))

    expect(sent.map((s) => s.body)).toEqual([{ path: 'description.en', value: 'Mine too, edited' }])
    expect(container.querySelectorAll('textarea')[0]!.value).toBe('Theirs')
    expect(container.querySelector('.editor-field--changed')?.getAttribute('data-field')).toBe('start title.en')
    expect(container.querySelectorAll('textarea')[1]!.value).toBe('Mine too, edited')
  })
})
