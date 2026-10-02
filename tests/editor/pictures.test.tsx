// @vitest-environment jsdom
/**
 * **[#140]** The editor's pictures (docs/specs/application.md 31; ADR-133-images-in-the-editor),
 * mounted with the Editor around them and a fake `fetch`: a picked file goes to the upload
 * route as `multipart/form-data` and opens the attach Sheet, whose `attach` is disabled until
 * a credit is typed and then sends `add-image` with the credit and the description in the
 * page's language; `cancel` deletes the uploaded file; a 413 and a 415 are said in the
 * indicator in the chrome's words; the enlarged view's controls are absent where they would
 * do nothing, and a removed Image's file is deleted only after `remove-image` was accepted.
 * **[#174]** The strip's `+` is named, and labelled beside it, "Add an extra image" while the
 * slot keeps "Add a picture"; the attach Sheet's two fields each carry a hint behind their
 * label, described by its explanation.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { Editor, SaveIndicator } from '../../src/editor/Editor.tsx'
import { ImageControls, TURN_EVENT } from '../../src/editor/ImageControls.tsx'
import { ImageSlot, pictureRefusal } from '../../src/editor/ImageSlot.tsx'
import type { EditorWords } from '../../src/editor/mode.ts'
import type { DraftNode } from '../../src/tree/types.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const words = Object.fromEntries(
  ['characters', 'lines', 'saving', 'saved', 'notSaved', 'retrying', 'retry', 'notEditable', 'changedElsewhere', 'sessionExpired', 'publicBehind', 'toOverview'].map((key) => [key, key]),
) as EditorWords
const loginWords = { login: 'login', password: 'password', signIn: 'signIn', loginFailed: '', loginLocked: '', requestFailed: '', sessionNotKept: '' }
const pickerWords = {
  addPicture: 'addPicture',
  fileTooLarge: 'fileTooLarge',
  fileTypeRefused: 'fileTypeRefused',
  credit: 'credit',
  imageDescription: 'imageDescription',
  attach: 'attach',
  cancel: 'cancel',
  placeholderCredit: 'placeholderCredit',
  placeholderImageDescription: 'placeholderImageDescription',
  addExtraPicture: 'addExtraPicture',
  hint: 'hint',
  creditHint: 'creditHint',
  imageDescriptionHint: 'imageDescriptionHint',
}
const controlWords = { makeMain: 'makeMain', moveEarlier: 'moveEarlier', moveLater: 'moveLater', removeImage: 'removeImage' }

const node = (files: string[]): DraftNode => ({
  id: 'start',
  kind: 'explanation',
  title: { en: 'T' },
  description: { en: 'D' },
  metadata: { version: '1' },
  sources: [],
  images: files.map((file) => ({ file, description: { en: '' }, credit: 'c' })),
  options: [],
  explainers: [],
})

const writeResponse = (stored: DraftNode) => ({
  revision: 2,
  node: stored,
  violations: [],
  tree: { advisory: 0, published: false, publicCopyCurrent: true },
})

let root: Root
let container: HTMLDivElement
let sent: Array<{ method: string; url: string; body: unknown }>
let answer: (method: string, url: string) => Response

beforeEach(() => {
  sent = []
  vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
    const body = init.body instanceof FormData ? init.body : init.body === undefined ? undefined : (JSON.parse(String(init.body)) as unknown)
    sent.push({ method: init.method ?? 'GET', url, body })
    return Promise.resolve(answer(init.method ?? 'GET', url))
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

function mount(children: React.ReactNode, files: string[] = []): void {
  act(() => {
    root.render(
      <Editor treeId="t" lang="en" languages={['en']} words={words} loginWords={loginWords} adminHref="/admin" nodes={{ start: node(files) }} violations={[]} tree={{ advisory: 0, published: false, publicCopyCurrent: true, servable: false }}>
        <SaveIndicator words={words} />
        {children}
      </Editor>,
    )
  })
}

/** Lets the fake `fetch` answer and React render what it answered. */
async function settle(): Promise<void> {
  for (let i = 0; i < 5; i += 1) await act(async () => {})
}

/** Picks `file` in the picker's input, as the browser's file chooser does. */
async function pick(file: File): Promise<void> {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]')!
  Object.defineProperty(input, 'files', { value: [file], configurable: true })
  await act(async () => {
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await settle()
}

/** Types into an input the way React hears it. */
function type(input: HTMLInputElement, text: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  act(() => {
    setter.call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

const png = () => new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'My Photo.PNG', { type: 'image/png' })
const panel = () => document.body.querySelector<HTMLElement>('.editor-attach-panel')
const status = () => container.querySelector('[role="status"]')!.textContent

describe('pictureRefusal (31.6)', () => {
  test('413 and 415 in the chrome’s words, a 422 by its first violation’s message, else its code', () => {
    expect(pictureRefusal(413, { error: 'too-large', violations: [] }, pickerWords)).toBe('fileTooLarge')
    expect(pictureRefusal(415, { error: 'type', violations: [] }, pickerWords)).toBe('fileTypeRefused')
    const violation = { file: 'images', keyPath: 'file', rule: 'V-IMAGE', message: 'not a file of images/' }
    expect(pictureRefusal(422, { error: 'malformed', violations: [violation] }, pickerWords)).toBe('not a file of images/')
    expect(pictureRefusal(422, { error: 'malformed' }, pickerWords)).toBe('malformed')
    expect(pictureRefusal(0, null, pickerWords)).toBe('0')
  })
})

describe('the picker and the attach Sheet (31.1, 31.2)', () => {
  test('a picked file is uploaded as multipart; attach is disabled until a credit is typed, then sends add-image', async () => {
    answer = (method) =>
      method === 'POST'
        ? new Response(JSON.stringify({ file: 'my-photo-0a1b2c3d.png', width: 300, height: 200 }), { status: 201 })
        : new Response(JSON.stringify(writeResponse(node(['my-photo-0a1b2c3d.png']))), { status: 200 })
    mount(<ImageSlot nodeId="start" place="slot" images="/admin/api/trees/t/images/" words={pickerWords} />)
    expect(container.querySelector('input[type="file"]')!.getAttribute('accept')).toBe('image/png, image/jpeg, image/gif, image/webp')

    await pick(png())
    expect(sent[0]!.method).toBe('POST')
    expect(sent[0]!.url).toBe('/admin/api/trees/t/images')
    expect((sent[0]!.body as FormData).get('file')).toBeInstanceOf(File)

    const sheet = panel()!
    expect(sheet.querySelector('img')!.getAttribute('src')).toBe('/admin/api/trees/t/images/my-photo-0a1b2c3d.png')
    expect(sheet.querySelector('img')!.getAttribute('width')).toBe('300')
    expect(sheet.querySelector('figcaption')!.textContent).toBe('my-photo-0a1b2c3d.png')
    const [credit, description] = [...sheet.querySelectorAll<HTMLInputElement>('input')]
    const attach = sheet.querySelector<HTMLButtonElement>('button[type="submit"]')!
    expect(attach.disabled).toBe(true)
    type(credit!, '   ')
    expect(attach.disabled).toBe(true)
    type(credit!, 'Photo: Anna')
    expect(attach.disabled).toBe(false)
    type(description!, 'A picture of a tree')

    await act(async () => attach.click())
    await settle()
    expect(sent[1]).toEqual({
      method: 'PATCH',
      url: '/admin/api/trees/t/nodes/start',
      body: { op: 'add-image', file: 'my-photo-0a1b2c3d.png', credit: 'Photo: Anna', description: { en: 'A picture of a tree' } },
    })
    expect(panel()).toBeNull()
    expect(sent.some((request) => request.method === 'DELETE')).toBe(false)
  })

  test('cancel deletes the uploaded file and attaches nothing', async () => {
    answer = (method) => (method === 'POST' ? new Response(JSON.stringify({ file: 'x-00000000.png', width: 1, height: 1 }), { status: 201 }) : new Response(null, { status: 204 }))
    mount(<ImageSlot nodeId="start" place="slot" images="/admin/api/trees/t/images/" words={pickerWords} />)
    await pick(png())
    const cancel = [...panel()!.querySelectorAll('button')].find((button) => button.textContent === 'cancel')!
    await act(async () => cancel.click())
    await settle()
    expect(sent.map((request) => `${request.method} ${request.url}`)).toEqual(['POST /admin/api/trees/t/images', 'DELETE /admin/api/trees/t/images/x-00000000.png'])
    expect(panel()).toBeNull()
  })

  test('[#174] the strip’s + is named and labelled addExtraPicture; the slot keeps addPicture', () => {
    mount(<ImageSlot nodeId="start" place="strip" images="/admin/api/trees/t/images/" words={pickerWords} />)
    const strip = container.querySelector('.editor-picker--strip')!
    expect(strip.querySelector('input')!.getAttribute('aria-label')).toBe('addExtraPicture')
    // The label beside it is seen, not read twice; no native tooltip says it a second time.
    expect(strip.hasAttribute('title')).toBe(false)
    // It stands in its room, the band's third column, the `+`'s next sibling (31.1).
    const room = strip.nextElementSibling!
    expect(room.className).toBe('editor-picker-room')
    expect(room.getAttribute('aria-hidden')).toBe('true')
    expect([...room.children].map((child) => child.className)).toEqual(['editor-picker-label'])
    expect(room.textContent).toBe('addExtraPicture')

    mount(<ImageSlot nodeId="start" place="slot" images="/admin/api/trees/t/images/" words={pickerWords} />)
    const slot = container.querySelector('.editor-picker--slot')!
    expect(slot.querySelector('input')!.getAttribute('aria-label')).toBe('addPicture')
    expect(slot.getAttribute('title')).toBe('addPicture')
    expect(container.querySelector('.editor-picker-room, .editor-picker-label')).toBeNull()
  })

  test('[#174] each field of the attach Sheet has a hint behind its label, described by why it is asked', async () => {
    answer = () => new Response(JSON.stringify({ file: 'x-00000000.png', width: 1, height: 1 }), { status: 201 })
    mount(<ImageSlot nodeId="start" place="slot" images="/admin/api/trees/t/images/" words={pickerWords} />)
    await pick(png())
    const sheet = panel()!
    const rows = [...sheet.querySelectorAll('.editor-row')]
    expect(rows).toHaveLength(2)
    for (const [row, label, explanation] of [
      [rows[0]!, 'credit', 'creditHint'],
      [rows[1]!, 'imageDescription', 'imageDescriptionHint'],
    ] as const) {
      const input = row.querySelector('input')!
      // The field is named by its label alone: the hint is a control beside it, not inside it.
      expect(row.querySelector(`label[for="${input.id}"]`)!.textContent).toBe(label)
      const mark = row.querySelector<HTMLButtonElement>('button.hint-mark')!
      expect(mark.type).toBe('button')
      expect(mark.getAttribute('aria-label')).toBe('hint')
      const description = document.getElementById(mark.getAttribute('aria-describedby')!)!
      expect(description.getAttribute('role')).toBe('tooltip')
      expect(description.textContent).toBe(explanation)
      expect(description.previousElementSibling).toBe(mark)
    }
  })

  test.each([
    [413, 'too-large', 'fileTooLarge'],
    [415, 'type', 'fileTypeRefused'],
  ])('a %i opens no Sheet and the indicator says not saved and %s', async (code, error, said) => {
    answer = () => new Response(JSON.stringify({ error, violations: [] }), { status: code })
    mount(<ImageSlot nodeId="start" place="strip" images="/admin/api/trees/t/images/" words={pickerWords} />)
    await pick(png())
    expect(panel()).toBeNull()
    expect(status()).toContain('notSaved')
    expect(status()).toContain(said)
  })
})

describe('the enlarged view’s controls (31.3, 31.4)', () => {
  const labels = () => [...container.querySelectorAll('.editor-image-controls button')].map((button) => button.textContent)

  test('the main image has no makeMain and no moveEarlier; the last has no moveLater', () => {
    mount(<ImageControls nodeId="start" index={0} count={3} file="a.png" words={controlWords} />, ['a.png', 'b.png', 'c.png'])
    expect(labels()).toEqual(['moveLater', 'removeImage'])
    mount(<ImageControls nodeId="start" index={2} count={3} file="c.png" words={controlWords} />, ['a.png', 'b.png', 'c.png'])
    expect(labels()).toEqual(['makeMain', 'moveEarlier', 'removeImage'])
  })

  test('makeMain sends move-image to 0 and turns the enlarged view to page 0 once accepted', async () => {
    answer = () => new Response(JSON.stringify(writeResponse(node(['b.png', 'a.png']))), { status: 200 })
    mount(<ImageControls nodeId="start" index={1} count={2} file="b.png" words={controlWords} />, ['a.png', 'b.png'])
    const turned: number[] = []
    container.addEventListener(TURN_EVENT, (event) => turned.push((event as CustomEvent<number>).detail))
    const makeMain = [...container.querySelectorAll('button')].find((button) => button.textContent === 'makeMain')!
    await act(async () => makeMain.click())
    await settle()
    expect(sent[0]!.body).toEqual({ op: 'move-image', from: 1, to: 0 })
    expect(turned).toEqual([0])
  })

  test('removeImage sends remove-image, and deletes the file only after it was accepted; a refused removal deletes nothing', async () => {
    answer = (method) => (method === 'PATCH' ? new Response(JSON.stringify(writeResponse(node(['a.png']))), { status: 200 }) : new Response(null, { status: 409 }))
    mount(<ImageControls nodeId="start" index={1} count={2} file="b.png" words={controlWords} />, ['a.png', 'b.png'])
    const remove = () => [...container.querySelectorAll('button')].find((button) => button.textContent === 'removeImage')!
    await act(async () => remove().click())
    await settle()
    expect(sent.map((request) => `${request.method} ${request.url}`)).toEqual(['PATCH /admin/api/trees/t/nodes/start', 'DELETE /admin/api/trees/t/images/b.png'])
    expect(sent[0]!.body).toEqual({ op: 'remove-image', index: 1 })

    sent = []
    answer = () => new Response(JSON.stringify({ error: 'invalid', violations: [] }), { status: 422 })
    await act(async () => remove().click())
    await settle()
    expect(sent.map((request) => request.method)).toEqual(['PATCH'])
  })
})
