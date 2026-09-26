/**
 * **[#139]** The structure slots' decisions (docs/specs/application.md 30.1, 30.4, 30.6, 30.8),
 * read off the elements `editMode` builds without rendering them: which of the three
 * situations a Node's Links put it in, where the side-bubble `+` is drawn and where it is
 * absent, which Link gets a menu, and where a deletion goes. And the two pure helpers of
 * `Structure.tsx`: the address under a page, and a refusal's text.
 */
import type { ReactElement } from 'react'
import { describe, expect, test } from 'vitest'
import { editMode } from '../../src/admin/slots.tsx'
import type { LinkRef } from '../../src/editor/mode.ts'
import { refusalText, under } from '../../src/editor/Structure.tsx'
import type { DraftNode } from '../../src/tree/types.ts'
import type { PageAddress } from '../../src/url.ts'

const start: PageAddress = { treeId: 't', trail: [], nodeId: 'start', lang: 'en', defaultLang: 'en' }
const under2: PageAddress = { ...start, trail: ['start', 'n-2'], nodeId: 'n-3' }
const aside: PageAddress = { ...start, trail: ['start'], nodeId: 'a-1' }

function node(id: string, extra: Partial<DraftNode> = {}): DraftNode {
  return { id, kind: 'explanation', title: { en: `Title of ${id}` }, description: {}, sources: [], images: [], options: [], explainers: [], ...extra } as DraftNode
}

const mode = editMode(start, ['en', 'nl'], {
  index: [
    { id: 'start', title: 'Start' },
    { id: 'n-2', title: '' },
    { id: 'a-1', title: 'An aside' },
  ],
  addresses: { start, 'n-3': under2, 'a-1': aside },
  root: 'start',
  centre: 'start',
})
const { structure, linkMenu, sideAdd, stepMenu } = mode.slots

/** The elements a slot's fragment or element holds, flat. */
function children(element: ReactElement | null | undefined): ReactElement[] {
  const held = (element?.props as { children?: ReactElement | ReactElement[] })?.children
  return held === undefined ? [] : Array.isArray(held) ? held : [held]
}

const props = (element: ReactElement | null | undefined): Record<string, unknown> => (element?.props ?? {}) as Record<string, unknown>

describe('the Answer row (30.1)', () => {
  test('a Node without Links gets + Yes, the end Sheet and + No, in that order', () => {
    const [yes, end, no] = children(structure!(node('start')) as ReactElement)
    expect(props(yes)).toMatchObject({ link: 'yes', nodeId: 'start', here: '/admin/trees/t/start' })
    expect(props(end)).toMatchObject({ className: 'structure-end' })
    expect(props(no)).toMatchObject({ link: 'no' })
  })

  test('one Answer: the lone + for the other, at the Answer’s width', () => {
    expect(props(structure!(node('start', { kind: 'question', answers: { yes: 'n-2' } })) as ReactElement)).toMatchObject({ link: 'no', lone: true })
    expect(props(structure!(node('start', { kind: 'question', answers: { no: 'n-2' } })) as ReactElement)).toMatchObject({ link: 'yes', lone: true })
  })

  test('both Answers, or an end: the public row, nothing added', () => {
    expect(structure!(node('start', { kind: 'question', answers: { yes: 'n-2', no: 'a-1' } }))).toBeNull()
    expect(structure!(node('start', { kind: 'terminal', outcome: 'refer' }))).toBeNull()
  })

  test('a Node the page does not carry gets nothing: there is no address to go to', () => {
    expect(structure!(node('elsewhere'))).toBeNull()
  })
})

describe('the link menu (30.6)', () => {
  const half = node('start', { kind: 'question', answers: { yes: 'n-2' }, options: [{ title: { en: 'O' }, target: 'a-1' }] })
  const menu = (link: LinkRef) => linkMenu!(half, link) as ReactElement | null

  test('the Answer that exists has one; the one the + stands for has none', () => {
    expect(props(menu({ kind: 'yes' }))).toMatchObject({ className: 'link-menu link-menu--yes' })
    expect(menu({ kind: 'no' })).toBeNull()
  })

  test('an Option’s carries its target and its title; an index past the list has none', () => {
    const page = (props(menu({ kind: 'option', index: 0 })).pages as ReactElement[])[0]
    expect(props(page)).toMatchObject({ link: { kind: 'option', target: 'a-1', title: 'O' }, here: '/admin/trees/t/start' })
    expect(menu({ kind: 'option', index: 1 })).toBeNull()
  })

  test('the picker lists every other Node of the index, in its order', () => {
    const page = (props(menu({ kind: 'yes' })).pages as ReactElement[])[0]
    expect(props(page).nodes).toEqual([
      { id: 'n-2', title: '' },
      { id: 'a-1', title: 'An aside' },
    ])
  })
})

describe('the side-bubble + (30.4, 30.5)', () => {
  test('on the centre it is the fan’s, in the Sheets’ own group; on an aside it is the Overlay list’s, in a group of its own', () => {
    expect(props(sideAdd!(node('start')) as ReactElement)).toMatchObject({ className: 'side-add', name: 'sheet' })
    expect(props(sideAdd!(node('a-1')) as ReactElement)).toMatchObject({ className: 'side-add side-add--list', name: 'side-sheet' })
    expect(props((props(sideAdd!(node('a-1')) as ReactElement).pages as ReactElement[])[0])).toMatchObject({ here: '/admin/trees/t/start/a-1' })
  })

  test('absent at eight Options, on a Terminal, and on a Node the page does not carry', () => {
    const eight = Array.from({ length: 8 }, (_, i) => ({ title: { en: `O${i}` }, target: `o-${i}` }))
    expect(sideAdd!(node('start', { options: eight }))).toBeNull()
    expect(sideAdd!(node('start', { kind: 'terminal', outcome: 'applicable' }))).toBeNull()
    expect(sideAdd!(node('elsewhere'))).toBeNull()
  })
})

describe('the step menu (30.8)', () => {
  test('the root has no deleteStep and a Terminal has removeEnd; a step under a Trail goes back to the entry above, the root to itself', () => {
    const root = (props(stepMenu!(node('start', { kind: 'terminal', outcome: 'refer' })) as ReactElement).pages as ReactElement[])[0]
    expect(props(root)).toMatchObject({ root: true, terminal: true, parentHref: '/admin/trees/t/start', heading: 'Title of start' })
    const deep = (props(stepMenu!(node('n-3')) as ReactElement).pages as ReactElement[])[0]
    expect(props(deep)).toMatchObject({ root: false, terminal: false, parentHref: '/admin/trees/t/start/n-2' })
    expect((props(deep).words as { confirmDelete: string }).confirmDelete).toBe('Delete "Title of n-3"? What it led to stays.')
    expect(stepMenu!(node('elsewhere'))).toBeNull()
  })

  test('an empty title is said with the placeholder', () => {
    const page = (props(stepMenu!(node('start', { title: {} })) as ReactElement).pages as ReactElement[])[0]
    expect(props(page).heading).toBe('Text missing in this language')
  })
})

describe('the helpers', () => {
  test('under() puts the id after the path and before the query', () => {
    expect(under('/admin/trees/t/start', 'n-1')).toBe('/admin/trees/t/start/n-1')
    expect(under('/admin/trees/t/start?lang=nl', 'n-1')).toBe('/admin/trees/t/start/n-1?lang=nl')
  })

  test('refusalText() says the violations, else the code, else the status', () => {
    expect(refusalText({ status: 422, body: { violations: [{ file: 'n', keyPath: 'options', rule: 'schema', message: 'boolean schema is false', advisory: false }] } })).toBe(
      'schema options: boolean schema is false',
    )
    expect(refusalText({ status: 409, body: { error: 'root' } })).toBe('root')
    expect(refusalText({ status: 500, body: null })).toBe('500')
  })
})
