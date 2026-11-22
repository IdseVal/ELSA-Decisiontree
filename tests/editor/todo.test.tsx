// @vitest-environment jsdom
/**
 * **[#176]** The to-do bubble and the panel's refused publish (docs/specs/application.md 33.3,
 * amended 2026-10-02; ADR-176-floating-settings-and-to-do), mounted with the Editor around
 * them, each in its Sheet, against a fake `fetch`: the control says the count, in the words for
 * one thing and for more, and is a quiet tick at zero; opening the bubble re-reads the list and
 * the count; and a refused publish points at the bubble, which opens on the list the refusal
 * answered without re-reading it -- the refusal's own lines where the draft's list is empty.
 */
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Sheet } from '../../src/components/Sheet.tsx'
import { Editor } from '../../src/editor/Editor.tsx'
import type { EditorWords } from '../../src/editor/mode.ts'
import { Panel, type PanelWords } from '../../src/editor/Panel.tsx'
import { Todo, TodoButton, type TodoWords } from '../../src/editor/Todo.tsx'
import type { Violation } from '../../src/tree/types.ts'
import { validateTree, type Mapping } from '../../src/tree/validate.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

/** Each chrome string is its own key, so a test reads which one the screen says. */
function said<K extends string>(keys: K[]): Record<K, string> {
  return Object.fromEntries(keys.map((key) => [key, key as string])) as Record<K, string>
}

const editorWords = said(['missingText', 'saving', 'saved', 'notSaved', 'publicBehind', 'toOverview', 'close']) as unknown as EditorWords
const loginWords = { email: 'email', password: 'password', signIn: 'signIn', loginFailed: '', loginLocked: '', requestFailed: '', sessionNotKept: '' }
const sheetWords = said(['close', 'previous', 'next', 'opensInNewTab'])
const todoWords: TodoWords = said([
  'todoCount', 'todoCountOne', 'todoNone', 'todoBefore', 'publicBehindBecause', 'notServableBecause', 'thisTree', 'removeStep', 'requestFailed',
  'placeholderTitle', 'placeholderText', 'placeholderSourceLabel', 'placeholderUrl', 'placeholderOptionTitle', 'placeholderImageDescription',
  'placeholderCredit', 'endingText', 'nextStepWords', 'placeholderTerm', 'placeholderExplanation', 'placeholderLogoAlt',
])
const panelWords = said([
  'settings', 'publish', 'publishRefused', 'showTodo', 'publishedAt', 'publicLink', 'confirmUnpublish', 'confirm', 'cancel', 'collaborators', 'creator',
  'invite', 'cannotInvite', 'removeCollaborator', 'chooseAccount', 'thisTree', 'confirmRemoveLanguage', 'handOver', 'handOverTo', 'deleteTree',
  'unpublishFirst', 'confirmDeleteTree', 'published', 'hidden', 'notServable', 'publicBehind', 'languages', 'treeId', 'administrator', 'requestFailed',
  'addLanguage', 'makeDefault', 'default', 'removeLanguage', 'languageHint', 'languageTag',
]) as PanelWords

const missing = (file: string): Violation => ({ file, keyPath: 'title.nl', rule: 'V-L10N', message: `${file} has no Dutch title`, advisory: true })

/** What the fake server holds: the draft's to-do list, and what a publish answers. */
let advisory: Violation[]
let refusal: Violation[]
let sent: Array<{ method: string; url: string }>
/** **[#271]** The operations the fake server received, and whether it refuses them. */
let patched: unknown[]
let refuseRemoval: boolean
let root: Root
let container: HTMLDivElement

beforeEach(() => {
  advisory = []
  refusal = []
  sent = []
  patched = []
  refuseRemoval = false
  vi.stubGlobal('fetch', (url: string, init: RequestInit = {}) => {
    const method = init.method ?? 'GET'
    sent.push({ method, url })
    const json = (status: number, body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))
    if (url === '/admin/api/trees/t' && method === 'GET') {
      return json(200, { meta: { creator: 'anna', collaborators: [] }, published: false, servable: false, publicCopyCurrent: true, advisory, written: { en: 3 } })
    }
    if (url === '/admin/api/accounts') return json(200, [])
    if (url === '/admin/api/trees/t/published') return json(409, { error: 'invalid', violations: refusal })
    if (url.startsWith('/admin/api/trees/t/nodes/') && method === 'PATCH') {
      patched.push(JSON.parse(String(init.body)))
      if (refuseRemoval) return json(422, { error: 'invalid', violations: [] })
      return json(200, { revision: 2, node: null, violations: [], tree: { advisory: advisory.length, published: false, publicCopyCurrent: true } })
    }
    return json(404, { error: 'not-found' })
  })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

function mount(count: number, children: ReactNode): void {
  act(() => {
    root.render(
      <Editor key={count} treeId="t" lang="en" languages={['en']} words={editorWords} loginWords={loginWords} adminHref="/admin" nodes={{}} violations={[]} tree={{ advisory: count, published: false, publicCopyCurrent: true, servable: false }}>
        {children}
      </Editor>,
    )
  })
}

/** The to-do bubble in its Sheet, as the editor page draws it. */
function todoSheet(list: Violation[], manages = true): ReactNode {
  return (
    <Sheet
      className="todo-sheet"
      summary={<TodoButton words={todoWords} />}
      pages={[<Todo key="todo" treeId="t" words={todoWords} advisory={list} titles={{}} nodeHref={{ before: '/admin/trees/t/', after: '' }} manages={manages} />]}
      words={sheetWords}
      uiLang={undefined}
      cross
    />
  )
}

/** The settings panel in its Sheet, as the editor page draws it. */
function panelSheet(): ReactNode {
  return (
    <Sheet
      className="panel-sheet"
      summary="settings"
      pages={[
        <Panel
          key="panel"
          treeId="t"
          words={panelWords}
          role="creator"
          administratorId="admin"
          meta={{ creator: 'anna', collaborators: [] }}
          publishedAt={null}
          accounts={[]}
          names={{ anna: 'Anna' }}
          publicHref="/t"
          languages={['en']}
          lang="en"
          written={{ en: 3 }}
          overviewHref="/admin"
        />,
      ]}
      words={sheetWords}
      uiLang={undefined}
      cross
    />
  )
}

/** Lets the fake `fetch` answer, a details element fire its toggle, and React render the outcome. */
async function settle(): Promise<void> {
  for (let i = 0; i < 6; i += 1) await act(() => new Promise((wake) => setTimeout(wake, 0)))
}

const todoName = (): string | null => container.querySelector('.todo-sheet > summary [role="img"]')!.getAttribute('aria-label')
const todoDetails = (): HTMLDetailsElement => container.querySelector<HTMLDetailsElement>('details.todo-sheet')!
const lines = (): string[] => [...container.querySelectorAll('.todo-sheet .todo-list li')].map((line) => line.textContent ?? '')
const rereads = (): number => sent.filter((request) => request.method === 'GET' && request.url === '/admin/api/trees/t').length

test('the control says the count in the words for one and for more, and is a quiet tick named todoNone at zero', () => {
  mount(3, todoSheet([]))
  expect(todoName()).toBe('3 todoCount')
  expect(container.querySelector('.todo-count')!.textContent).toBe('3')
  expect(container.querySelector('.todo-sheet .float-words')!.textContent).toBe('todoCount')

  mount(1, todoSheet([]))
  expect(todoName()).toBe('1 todoCountOne')

  mount(0, todoSheet([]))
  expect(todoName()).toBe('todoNone')
  expect(container.querySelector('.todo-count svg')).not.toBeNull()
  expect(container.querySelector('.todo-sheet .float-words')).toBeNull()
})

test('opening the bubble re-reads the list and the count', async () => {
  mount(1, todoSheet([missing('a')]))
  expect(lines()).toEqual(['a: a has no Dutch title'])
  advisory = [missing('a'), missing('b')]

  act(() => {
    todoDetails().open = true
  })
  await settle()

  expect(rereads()).toBe(1)
  expect(lines()).toEqual(['a: a has no Dutch title', 'b: b has no Dutch title'])
  expect(todoName()).toBe('2 todoCount')
})

test('a refused publish points at the bubble, which opens on the refusal’s list without re-reading it', async () => {
  // The draft's own list is empty, so the refusal's lines are the to-do list (33.3); a re-read would lose them.
  refusal = [missing('tree.json')]
  mount(0, [todoSheet([]), panelSheet()])
  act(() => container.querySelector<HTMLButtonElement>('[role="switch"]')!.click())
  await settle()

  const pointer = container.querySelector('.panel-sheet [role="alert"]')!
  expect(pointer.textContent).toBe('publishRefused showTodo')
  expect(todoName()).toBe('1 todoCountOne')
  const before = rereads()

  act(() => pointer.querySelector('button')!.click())
  await settle()

  expect(todoDetails().open).toBe(true)
  expect(lines()).toEqual(['thisTree: tree.json has no Dutch title'])
  expect(rereads()).toBe(before)

  // Closed and opened again by its own control, it re-reads: the refusal is not the draft's list.
  act(() => {
    todoDetails().open = false
  })
  await settle()
  act(() => {
    todoDetails().open = true
  })
  await settle()
  expect(rereads()).toBe(before + 1)
  expect(lines()).toEqual([])
  expect(container.querySelector('.todo-sheet .panel-body')!.textContent).toContain('todoNone')
})

/**
 * **[#271]** The owner's Node on the live Tree, as the validator reads it in a draft: the marks
 * of an explainer deleted by hand in both languages, the Dutch description and the explainer's
 * Dutch texts not written yet. The lines are the validator's own, not written for the test.
 */
function ownersLines(): Violation[] {
  const text = (en: string, nl: string): Record<string, string> => ({ en, nl })
  const tree: Mapping = {
    $schema: '/schemas/elsa-tree-8.json',
    format: 'elsa-tree/8',
    languages: ['en', 'nl'],
    root: 'start',
    title: text('A Tree', 'Een boom'),
    metadata: { version: '1' },
    nodes: [
      {
        id: 'start',
        title: text('Is your system an AI system?', 'Is uw systeem een AI-systeem?'),
        description: text('Are you a provider?', ''),
        metadata: { version: '1' },
        explainers: [{ id: 'provider-2', term: text('provider', ''), text: text('Someone who develops it.', '') }],
        terminal: { label: text('Ends', 'Einde') },
      },
    ],
  }
  return validateTree({ id: 't', tree, images: new Set(), themeFiles: new Set() }, 'draft').filter((violation) => violation.advisory)
}

/** The write the fake server received for `remove-explainer`, if any. */
const removals = (): Array<{ method: string; url: string }> => sent.filter((request) => request.method === 'PATCH')

test('**[#271]** an explainer marked nowhere offers `remove` on its lines; it sends remove-explainer and re-reads the list', async () => {
  const before = ownersLines()
  advisory = before
  mount(before.length, todoSheet(before))
  const unmarked = [...container.querySelectorAll('.todo-sheet .todo-list li[data-rule="V-EXPLAINER"]')]
  expect(unmarked).toHaveLength(2)
  for (const line of unmarked) expect(line.querySelector('button')?.textContent).toBe('removeStep')
  // A line of another rule has no `remove`: the field is written, not removed.
  expect(container.querySelector('.todo-sheet .todo-list li[data-rule="V-L10N"] button')).toBeNull()

  // The store removes it: what is left is the description's Dutch.
  advisory = before.filter((violation) => !violation.keyPath.startsWith('explainers'))
  act(() => unmarked[0]!.querySelector('button')!.click())
  await settle()

  expect(removals()).toEqual([{ method: 'PATCH', url: '/admin/api/trees/t/nodes/start' }])
  expect(patched).toEqual([{ op: 'remove-explainer', id: 'provider-2' }])
  expect(rereads()).toBe(1)
  expect(lines()).toEqual(['start: placeholderText (nl): missing or empty text for the declared language "nl"'])
  expect(todoName()).toBe('1 todoCountOne')
})

test('**[#271]** a collaborator may remove it too; a refused removal says requestFailed and keeps the list', async () => {
  const before = ownersLines()
  advisory = before
  refuseRemoval = true
  mount(before.length, todoSheet(before, false))
  const button = container.querySelector<HTMLButtonElement>('.todo-sheet .todo-list li[data-rule="V-EXPLAINER"] button')!
  act(() => button.click())
  await settle()

  expect(patched).toEqual([{ op: 'remove-explainer', id: 'provider-2' }])
  expect(container.querySelector('.todo-sheet [role="alert"]')?.textContent).toBe('requestFailed')
  expect(lines()).toHaveLength(before.length)
})

test('**[#271]** two empty fields of one Node read as two different lines: each names its field and language', () => {
  const list = ownersLines()
  mount(list.length, todoSheet(list))
  const said = lines()
  expect(said).toEqual([
    'start: placeholderText (nl): missing or empty text for the declared language "nl"',
    'start: placeholderTerm 1 (nl): missing or empty text for the declared language "nl"',
    'start: placeholderExplanation 1 (nl): missing or empty text for the declared language "nl"',
    'start: "provider-2" is not marked in description.en; write [words](#provider-2) where the term occurs',
    'start: "provider-2" is not marked in description.nl; write [words](#provider-2) where the term occurs',
  ].map((line) => (line.includes('is not marked') ? `${line}removeStep` : line)))
  expect(new Set(said).size).toBe(said.length)
})
