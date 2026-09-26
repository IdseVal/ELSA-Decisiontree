// @vitest-environment jsdom
/**
 * **[#138]** The Field (docs/specs/application.md 28.1, 28.4, 28.5; ADR-133-bubble-edited-in-place),
 * mounted in a document with the Editor around it and a fake `fetch` behind the queue: the
 * counter pill counts as `countedLength` and `estimatedLines` count, on the strings
 * `markdown.test.ts` measures and the full Node's; a plain field turns a line break into a
 * space and blurs on Enter; the description shows the rendered text until it is focused and
 * the source while it is; `<` before a letter is refused at the field before anything is
 * sent; a response's value repaints a field that is not being edited, and never one holding a
 * refused value, which stays with its `danger` state. The add-Source
 * form sends `add-source` only once a URL is typed, with no placeholder, and closes its Sheet.
 * **[#141]** The description's `mark` button sends `add-explainer` and then the marked
 * description, is refused where 32.1 says, and a click on a marked term opens the explainer
 * Sheet, whose `unmark` takes the mark out and removes the explainer.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { Editor } from '../../src/editor/Editor.tsx'
import { AddSourceForm, Field } from '../../src/editor/Field.tsx'
import type { EditorWords } from '../../src/editor/mode.ts'
import { countedLength, estimatedLines } from '../../src/tree/measure.ts'
import type { DraftNode } from '../../src/tree/types.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const words = Object.fromEntries(
  ['missingText', 'characters', 'lines', 'saving', 'saved', 'notSaved', 'retrying', 'retry', 'notEditable', 'changedElsewhere', 'sessionExpired', 'publicBehind', 'toOverview'].map((key) => [key, key]),
) as EditorWords
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

/** The Tree's state at load: a hidden draft (22.1). */
const HIDDEN = { advisory: 0, published: false, publicCopyCurrent: true, servable: false }

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
      <Editor treeId="t" lang="en" languages={["en"]} words={words} loginWords={loginWords} adminHref="/admin" nodes={{ start: draft }} violations={[]} tree={HIDDEN}>
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
        <Editor treeId="t" lang="en" languages={["en"]} words={words} loginWords={loginWords} adminHref="/admin" nodes={{ start: draft }} violations={[]} tree={HIDDEN}>
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

describe('a refused value stays on screen (29.4)', () => {
  test('a write the store refused is not repainted by another field\u2019s accepted write; the danger state stays', async () => {
    const draft = node('Mine', 'Mine too')
    act(() => {
      root.render(
        <Editor treeId="t" lang="en" languages={["en"]} words={words} loginWords={loginWords} adminHref="/admin" nodes={{ start: draft }} violations={[]} tree={HIDDEN}>
          <Field nodeId="start" path="title" lang="en" value="Mine" limit={{ characters: 80 }} words={fieldWords} />
          <Field nodeId="start" path="description" lang="en" value="Mine too" limit={{ characters: 150, lines: 2 }} rich words={fieldWords} />
        </Editor>,
      )
    })
    // The store refuses the title and accepts the description; the Node it answers with holds the old title.
    answer = (body) =>
      (body as { path: string }).path === 'title.en'
        ? new Response(JSON.stringify({ error: 'blocking', violations: [{ file: 'start', keyPath: 'title.en', rule: 'V-PLAIN', message: 'refused', advisory: false }] }), { status: 422 })
        : new Response(JSON.stringify(responseWith({ ...draft, description: { en: 'Mine too, edited', nl: 'x' } })), { status: 200 })

    const title = container.querySelectorAll('textarea')[0]!
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(title, 'Refused')
      title.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(() => vi.advanceTimersByTimeAsync(700))
    expect(sent.map((s) => s.body)).toEqual([{ path: 'title.en', value: 'Refused' }])
    expect(container.querySelector('.editor-field--refused')?.getAttribute('data-field')).toBe('start title.en')

    const description = container.querySelector<HTMLElement>('.editor-rendered')!
    act(() => description.focus())
    act(() => {
      description.dispatchEvent(new FocusEvent('focus'))
    })
    const area = container.querySelectorAll('textarea')[1]!
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(area, 'Mine too, edited')
      area.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(() => vi.advanceTimersByTimeAsync(700))
    await act(() => vi.advanceTimersByTimeAsync(0))

    expect(sent).toHaveLength(2)
    expect(container.querySelectorAll('textarea')[0]!.value).toBe('Refused')
    expect(container.querySelector('.editor-field--refused')?.getAttribute('data-field')).toBe('start title.en')
    expect(container.querySelectorAll('textarea')[1]!.value).toBe('Mine too, edited')
  })

  test('a value refused at the field drops the older one waiting; an older one in flight does not clear the refusal when accepted', async () => {
    // A fetch the test releases, so a write can be in flight while the next value is typed.
    let release: (() => void) | null = null
    vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as unknown
      sent.push({ url, body })
      return new Promise<Response>((resolve) => {
        release = () => resolve(answer(body))
      })
    })
    mount(node('T', 'Plain.'), { nodeId: 'start', path: 'description', lang: 'en', value: 'Plain.', limit: { characters: 150, lines: 2 }, rich: true, words: fieldWords })
    focus()

    // Waiting: `x<` is a legal value, `x<b` is refused 100 ms later; neither goes.
    type('Plain. x<')
    await act(() => vi.advanceTimersByTimeAsync(100))
    type('Plain. x<b')
    await act(() => vi.advanceTimersByTimeAsync(1000))
    expect(sent).toEqual([])
    expect(container.querySelector('.editor-field--refused')).not.toBeNull()

    // In flight: `a<` goes, `a<b` is refused while it is out, and its acceptance changes nothing on screen.
    answer = () => new Response(JSON.stringify(responseWith(node('T', 'Plain. a<'))), { status: 200 })
    type('Plain. a<')
    await act(() => vi.advanceTimersByTimeAsync(700))
    expect(sent.map((s) => s.body)).toEqual([{ path: 'description.en', value: 'Plain. a<' }])
    expect(container.querySelector('.editor-field--refused')).toBeNull()
    type('Plain. a<b')
    expect(container.querySelector('.editor-field--refused')).not.toBeNull()
    await act(async () => {
      release!()
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(container.querySelector('.editor-field--refused')).not.toBeNull()
    expect(textarea().value).toBe('Plain. a<b')

    // On blur nothing waits, so nothing goes, and the store's `a<` does not repaint the field.
    act(() => {
      const element = textarea()
      element.blur()
      element.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    })
    await act(() => vi.advanceTimersByTimeAsync(1000))
    expect(sent).toHaveLength(1)
    expect(container.querySelector('.editor-field--refused')).not.toBeNull()
    expect(container.querySelector('.editor-rendered')!.textContent).toContain('Plain. a<b')
  })
})

describe('the add-Source form (28.1)', () => {
  const kinds = [
    { value: 'legal' as const, label: 'Legal' },
    { value: 'case-law' as const, label: 'Case law' },
  ]

  function mountForm(): void {
    act(() => {
      root.render(
        <Editor treeId="t" lang="en" languages={["en"]} words={words} loginWords={loginWords} adminHref="/admin" nodes={{ start: node('T', 'D') }} violations={[]} tree={HIDDEN}>
          <details className="sheet" open>
            <summary>+ addSource</summary>
            <AddSourceForm nodeId="start" focusPath="sources[0].label.en" kinds={kinds} words={{ addSource: 'addSource', sourceKind: 'sourceKind', sourceUrl: 'sourceUrl' }} />
          </details>
        </Editor>,
      )
    })
  }

  const input = (): HTMLInputElement => container.querySelector('input.editor-url')!
  const button = (): HTMLButtonElement => container.querySelector('button[type="submit"]')!

  function typeUrl(value: string): void {
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input(), value)
      input().dispatchEvent(new Event('input', { bubbles: true }))
    })
  }

  test('nothing is sent and the button stays disabled until a URL of the schema\u2019s grammar is typed; no placeholder', () => {
    mountForm()
    expect(button().disabled).toBe(true)
    expect(input().getAttribute('aria-invalid')).toBeNull()

    typeUrl('not a url')
    expect(input().getAttribute('aria-invalid')).toBe('true')
    expect(button().disabled).toBe(true)
    act(() => {
      container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
    expect(sent).toEqual([])

    typeUrl('https://eur-lex.europa.eu/eli/reg/2024/1689/oj')
    expect(input().getAttribute('aria-invalid')).toBeNull()
    expect(button().disabled).toBe(false)
  })

  test('the submit sends add-source at once with the kind chosen, an empty label and the URL, and closes the Sheet', async () => {
    mountForm()
    act(() => {
      const select = container.querySelector('select')!
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!.call(select, 'case-law')
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
    typeUrl(' https://example.com/ruling ')
    act(() => {
      container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
    await act(() => vi.advanceTimersByTimeAsync(0))

    expect(sent.map((s) => s.body)).toEqual([{ op: 'add-source', kind: 'case-law', label: {}, url: 'https://example.com/ruling' }])
    expect(container.querySelector('details')!.open).toBe(false)
    expect(input().value).toBe('')
  })
})

describe('[#141] marking a term (32.1, 32.2, 32.4)', () => {
  const markerWords = { mark: 'mark', cannotMarkHere: 'cannotMarkHere', explainerLimit: 'explainerLimit' }
  const sheetWords = { ...words, close: 'close', unmark: 'unmark', term: 'term', explanation: 'explanation', markedIn: 'markedIn', notMarkedIn: 'notMarkedIn' }
  const plainNode = (description: string, explainers: DraftNode['explainers'] = []): DraftNode => ({ ...node('T', description), description: { en: description }, explainers })

  function mountDescription(draft: DraftNode): void {
    act(() => {
      root.render(
        <Editor treeId="t" lang="en" languages={['en']} words={sheetWords as EditorWords} loginWords={loginWords} adminHref="/admin" nodes={{ start: draft }} violations={[]} tree={HIDDEN}>
          <Field nodeId="start" path="description" lang="en" value={draft.description.en!} limit={{ characters: 150, lines: 2 }} rich explainers={draft.explainers} termEvent="elsa-term" markerWords={markerWords} words={fieldWords} />
        </Editor>,
      )
    })
  }

  function select(start: number, end: number): void {
    act(() => {
      textarea().setSelectionRange(start, end)
      document.dispatchEvent(new Event('selectionchange'))
      textarea().dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }))
    })
  }

  const markButton = (): HTMLButtonElement | null => document.querySelector('.editor-mark')

  test('no button without a selection; the selection marked writes the explainer, then the description with its mark, and opens the Sheet', async () => {
    mountDescription(plainNode('Are you a provider here?'))
    focus()
    expect(markButton()).toBeNull()

    // A double click takes the space after the word; the mark does not.
    select(10, 19)
    expect(markButton()?.getAttribute('aria-disabled')).toBeNull()
    act(() => markButton()!.click())
    await act(() => vi.advanceTimersByTimeAsync(100))

    expect(sent.map((s) => s.body)).toEqual([
      { op: 'add-explainer', id: 'provider', term: { en: 'provider' }, text: { en: '' } },
      { path: 'description.en', value: 'Are you a [provider](#provider) here?' },
    ])
    expect(document.querySelector('[role="dialog"] h2')?.textContent).toBe('provider')
  })

  test('a selection inside strong text is refused with cannotMarkHere, and a ninth explainer with explainerLimit', () => {
    mountDescription(plainNode('A **strong** word and a plain one.'))
    focus()
    select(4, 10)
    expect(markButton()?.getAttribute('aria-disabled')).toBe('true')
    expect(markButton()?.title).toBe('cannotMarkHere')
    act(() => markButton()!.click())
    expect(sent).toEqual([])

    act(() => root.unmount())
    root = createRoot(container)
    const eight = Array.from({ length: 8 }, (_, i) => ({ id: `e${i}`, term: { en: `e${i}` }, text: { en: 'x' } }))
    mountDescription(plainNode('A plain word.', eight))
    focus()
    select(2, 7)
    expect(markButton()?.title).toBe('explainerLimit')
  })

  test('a click on a marked term opens its Sheet, and unmark in the last marking language removes the explainer', async () => {
    const provider = { id: 'provider', term: { en: 'provider' }, text: { en: 'Someone.' } }
    mountDescription(plainNode('A [provider](#provider) here.', [provider]))
    // The rendered state: a click on the term does not open the source.
    act(() => (container.querySelector('.term') as HTMLElement).click())
    expect(container.querySelector('.editor-field--rich textarea')).toBeNull()
    expect(document.querySelector('[role="dialog"] h2')?.textContent).toBe('provider')
    expect(document.querySelector('.explainer-marked')?.textContent).toBe('markedIn')

    act(() => (Array.from(document.querySelectorAll('[role="dialog"] button')).find((b) => b.textContent === 'unmark') as HTMLButtonElement).click())
    await act(() => vi.advanceTimersByTimeAsync(100))
    expect(sent.map((s) => s.body)).toEqual([{ path: 'description.en', value: 'A provider here.' }, { op: 'remove-explainer', id: 'provider' }])
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })
})
