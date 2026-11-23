// @vitest-environment jsdom
/**
 * **[#273]** The tags field of "This Tree" (docs/specs/application.md 33.5; ADR-273-tags),
 * mounted with the Editor around it and a fake `fetch`: a chip keeps the text of the tag it
 * stands for when the list around it changes, so a removed tag's text never lands on the chip
 * that takes its place, nor is written over the tag that is left (PR #278 review, cycle 3).
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { Editor } from '../../src/editor/Editor.tsx'
import type { EditorWords } from '../../src/editor/mode.ts'
import { TagsField, type TagsWords } from '../../src/editor/TagsField.tsx'
import type { LocalisedText } from '../../src/tree/types.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const words = Object.fromEntries(
  ['characters', 'lines', 'saving', 'saved', 'notSaved', 'retrying', 'retry', 'notEditable', 'changedElsewhere', 'sessionExpired', 'toOverview'].map((key) => [key, key]),
) as EditorWords
const loginWords = { email: 'email', password: 'password', signIn: 'signIn', loginFailed: '', loginLocked: '', requestFailed: '', sessionNotKept: '' }
const tagsWords: TagsWords = {
  tags: 'Tags',
  tagsHint: 'tagsHint',
  placeholderTag: 'placeholderTag',
  addTag: 'addTag',
  removeTag: 'Remove',
  tagTaken: 'tagTaken',
  hint: 'hint',
  requestFailed: 'requestFailed',
}

let root: Root
let container: HTMLDivElement
let sent: Array<{ method: string; body: unknown }>

beforeEach(() => {
  sent = []
  // The server stores the list it is sent and answers with it, as `PATCH { path: 'tags' }` does.
  vi.stubGlobal('fetch', (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body)) as { value: LocalisedText[] }
    sent.push({ method: init.method ?? 'GET', body })
    const answer = { revision: 2, manifest: { tags: body.value }, violations: [], tree: { advisory: 0, published: false, servable: false } }
    return Promise.resolve(new Response(JSON.stringify(answer), { status: 200 }))
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

/** Mounts the field on the `nl` page of a Tree whose default language is `en`. */
function mount(tags: LocalisedText[]): void {
  act(() => {
    root.render(
      <Editor treeId="t" lang="nl" languages={['en', 'nl']} words={words} loginWords={loginWords} adminHref="/admin" nodes={{}} violations={[]} tree={{ advisory: 0, published: false, servable: false }}>
        <TagsField treeId="t" lang="nl" defaultLanguage="en" tags={tags} words={tagsWords} />
      </Editor>,
    )
  })
}

/** Lets the fake `fetch` answer and React render what it answered. */
async function settle(): Promise<void> {
  for (let i = 0; i < 5; i += 1) await act(async () => {})
}

const chips = () => [...container.querySelectorAll<HTMLInputElement>('.panel-tag-text')]
const crosses = () => [...container.querySelectorAll<HTMLButtonElement>('.new-tree-remove')]

describe('a chip follows its tag (33.5)', () => {
  test('removing the first of two tags written only in a non-default language leaves the second its own text', async () => {
    mount([{ nl: 'Eerste' }, { nl: 'Tweede' }])
    expect(chips().map((chip) => chip.value)).toEqual(['Eerste', 'Tweede'])

    await act(async () => crosses()[0]!.click())
    await settle()

    expect(sent.at(-1)?.body).toEqual({ path: 'tags', value: [{ nl: 'Tweede' }] })
    expect(chips().map((chip) => chip.value)).toEqual(['Tweede'])
    expect(crosses()[0]!.getAttribute('aria-label')).toBe('Remove Tweede')

    // Focusing and leaving the chip that is left writes nothing: its text is the stored one.
    const writes = sent.length
    await act(async () => {
      chips()[0]!.focus()
      chips()[0]!.blur()
    })
    await settle()
    expect(sent.length).toBe(writes)
  })
})
