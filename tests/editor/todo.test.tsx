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

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

/** Each chrome string is its own key, so a test reads which one the screen says. */
function said<K extends string>(keys: K[]): Record<K, string> {
  return Object.fromEntries(keys.map((key) => [key, key as string])) as Record<K, string>
}

const editorWords = said(['missingText', 'saving', 'saved', 'notSaved', 'publicBehind', 'toOverview', 'close']) as unknown as EditorWords
const loginWords = { email: 'email', password: 'password', signIn: 'signIn', loginFailed: '', loginLocked: '', requestFailed: '', sessionNotKept: '' }
const sheetWords = said(['close', 'previous', 'next', 'opensInNewTab'])
const todoWords: TodoWords = said(['todoCount', 'todoCountOne', 'todoNone', 'todoBefore', 'publicBehindBecause', 'notServableBecause', 'thisTree', 'removeStep', 'requestFailed'])
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
let root: Root
let container: HTMLDivElement

beforeEach(() => {
  advisory = []
  refusal = []
  sent = []
  vi.stubGlobal('fetch', (url: string, init: RequestInit = {}) => {
    const method = init.method ?? 'GET'
    sent.push({ method, url })
    const json = (status: number, body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))
    if (url === '/admin/api/trees/t' && method === 'GET') {
      return json(200, { meta: { creator: 'anna', collaborators: [] }, published: false, servable: false, publicCopyCurrent: true, advisory, written: { en: 3 } })
    }
    if (url === '/admin/api/accounts') return json(200, [])
    if (url === '/admin/api/trees/t/published') return json(409, { error: 'invalid', violations: refusal })
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
function todoSheet(list: Violation[]): ReactNode {
  return (
    <Sheet
      className="todo-sheet"
      summary={<TodoButton words={todoWords} />}
      pages={[<Todo key="todo" treeId="t" words={todoWords} advisory={list} titles={{}} nodeHref={{ before: '/admin/trees/t/', after: '' }} manages />]}
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
