/**
 * **[#139]** The structure slots' decisions (docs/specs/application.md 30.1, 30.4, 30.6, 30.8),
 * read off the elements `editMode` builds without rendering them: which of the three
 * situations a Node's Links put it in, where the side-bubble `+` is drawn and where it is
 * absent, which Link gets a menu, and where a deletion goes. **[#177]** And the side bubble's
 * own (30.4, 30.5, 30.7, amended 2026-10-02): the `+` that creates at one click, on the centre
 * only; `deleteSideBubble` in each of the centre's Overlays, which takes the aside's Node
 * unless another Node leads to it; and the aside's title, which the Option button's follows.
 * And the two pure helpers of `Structure.tsx`: the address under a page, and a refusal's text.
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

const structureOf = (shared: string[]) => ({
  index: [
    { id: 'start', title: 'Start' },
    { id: 'n-2', title: '' },
    { id: 'a-1', title: 'An aside' },
  ],
  addresses: { start, 'n-3': under2, 'a-1': aside },
  root: 'start',
  centre: 'start',
  options: ['a-1'],
  shared,
})
const mode = editMode(start, ['en', 'nl'], structureOf([]))
const { structure, linkMenu, sideAdd, sideDelete, stepMenu, field } = mode.slots

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
  test('**[#177]** on the centre it is the fan’s button itself, no Sheet: it creates from the centre and lands under its address', () => {
    const add = sideAdd!(node('start')) as ReactElement
    expect(props(add)).toEqual({ nodeId: 'start', here: '/admin/trees/t/start', word: 'New side bubble', wordLang: undefined })
    expect(props(add).pages).toBeUndefined()
  })

  test('**[#177]** an aside in an Overlay has none: its Overlay offers no new side bubble', () => {
    expect(sideAdd!(node('a-1'))).toBeNull()
  })

  test('absent at eight Options, on a Terminal, and on a Node the page does not carry', () => {
    const eight = Array.from({ length: 8 }, (_, i) => ({ title: { en: `O${i}` }, target: `o-${i}` }))
    expect(sideAdd!(node('start', { options: eight }))).toBeNull()
    expect(sideAdd!(node('start', { kind: 'terminal', outcome: 'applicable' }))).toBeNull()
    expect(sideAdd!(node('elsewhere'))).toBeNull()
  })
})

describe('**[#177]** deleteSideBubble in the centre’s Overlays (30.7)', () => {
  const centre = node('start', { kind: 'question', answers: { yes: 'n-2' }, options: [{ title: { en: 'An aside' }, target: 'a-1' }] })

  test('the Overlay of each Option holds it: the aside goes with this step’s Option, and the page goes back to the step', () => {
    const remove = sideDelete!(centre, 0) as ReactElement
    expect(props(remove)).toMatchObject({ parentId: 'start', asideId: 'a-1', lang: 'en', title: 'An aside', shared: false, centreHref: '/admin/trees/t/start' })
    // The confirmation names the title as it stands when it is asked: the sentence travels in two parts around it.
    const words = props(remove).words as { confirmBefore: string; confirmAfter: string; deleteSideBubble: string; confirmUntitled: string }
    expect(`${words.confirmBefore}An aside${words.confirmAfter}`).toBe('Delete the side bubble "An aside"?')
    expect(words.deleteSideBubble).toBe('Delete side bubble')
    expect(words.confirmUntitled).toBe('Delete this side bubble? It has no title yet.')
  })

  test('an aside another Node leads to as well is marked shared: only this step’s Option goes', () => {
    const shared = editMode(start, ['en', 'nl'], structureOf(['a-1'])).slots.sideDelete!(centre, 0) as ReactElement
    expect(props(shared)).toMatchObject({ shared: true })
    expect((props(shared).words as { stays: string }).stays).toBe('Another step leads to it too: it stays there.')
  })

  test('in Dutch the sentence keeps its own order around the title', () => {
    const nl = editMode({ ...start, lang: 'nl' }, ['en', 'nl'], structureOf([])).slots.sideDelete!(centre, 0) as ReactElement
    const words = props(nl).words as { confirmBefore: string; confirmAfter: string; deleteSideBubble: string }
    expect(`${words.confirmBefore}Een zijpad${words.confirmAfter}`).toBe('De zijbubbel "Een zijpad" verwijderen?')
    expect(words.deleteSideBubble).toBe('Zijbubbel verwijderen')
  })

  test('none past the list, and none on a Node that is not the centre', () => {
    expect(sideDelete!(centre, 1)).toBeNull()
    expect(sideDelete!(node('a-1', { options: [{ title: { en: 'Deeper' }, target: 'n-2' }] }), 0)).toBeNull()
  })
})

describe('**[#177]** the Option button’s title follows its aside’s (30.5)', () => {
  test('the aside’s title field names the centre’s Option to it as its follower, held to the button’s 60', () => {
    const title = field!(node('a-1'), 'title', 'An aside', { characters: 80 }) as ReactElement
    expect(props(title).follower).toEqual({ nodeId: 'start', path: 'options[0].title', limit: { characters: 60 } })
  })

  test('the centre’s own title, an aside’s other fields and a Node the centre does not lead to have none', () => {
    expect(props(field!(node('start'), 'title', 'Start', { characters: 80 }) as ReactElement).follower).toBeUndefined()
    expect(props(field!(node('a-1'), 'description', '', { characters: 150, lines: 2 }) as ReactElement).follower).toBeUndefined()
    expect(props(field!(node('n-2'), 'title', '', { characters: 80 }) as ReactElement).follower).toBeUndefined()
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
