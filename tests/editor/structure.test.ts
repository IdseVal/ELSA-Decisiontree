/**
 * **[#139]** The structure slots' decisions (docs/specs/application.md 30.1, 30.4, 30.6, 30.8),
 * read off the elements `editMode` builds without rendering them: which of the three
 * situations a Node's Links put it in, where the side-bubble `+` is drawn and where it is
 * absent, and where a deletion goes. **[#178]** No Link gets a menu any more, and the step's
 * red cross and "Tree does not end here after all" stand in place of the step menu (30.6, 30.8,
 * amended 2026-10-02). **[#177]** And the side bubble's
 * own (30.4, 30.5, 30.7, amended 2026-10-02): the `+` that creates at one click, on the centre
 * only; `deleteSideBubble` in each of the centre's Overlays, which takes the aside's Node
 * unless another Node leads to it; and the aside's title, which the Option button's follows.
 * And the two pure helpers of `Structure.tsx`: the address under a page, and a refusal's text.
 */
import type { ReactElement } from 'react'
import { describe, expect, test } from 'vitest'
import { editMode } from '../../src/admin/slots.tsx'
import { DeleteStep, RemoveEnd } from '../../src/editor/StepButtons.tsx'
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
  addresses: { start, 'n-3': under2, 'a-1': aside },
  root: 'start',
  centre: 'start',
  options: ['a-1'],
  shared,
  titles: { 'a-1': 'An aside' },
})
const mode = editMode(start, ['en', 'nl'], structureOf([]))
const { structure, sideAdd, sideDelete, stepButtons, field } = mode.slots

/** The elements a slot's fragment or element holds, flat. */
function children(element: ReactElement | null | undefined): ReactElement[] {
  const held = (element?.props as { children?: ReactElement | ReactElement[] })?.children
  return held === undefined ? [] : Array.isArray(held) ? held : [held]
}

const props = (element: ReactElement | null | undefined): Record<string, unknown> => (element?.props ?? {}) as Record<string, unknown>

describe('the Answer row (30.1)', () => {
  test('a Node without Links gets + Yes, the end Sheet and + No, in that order', () => {
    const [yes, end, no] = children(structure!(node('start')) as ReactElement)
    // **[#221]** Each sends `link: 'answer'` with the chrome word in every language of the Tree (41.7 item 1).
    expect(props(yes)).toMatchObject({ which: 'yes', label: { en: 'Yes', nl: 'Ja' }, nodeId: 'start', here: '/admin/trees/t/start' })
    expect(props(end)).toMatchObject({ className: 'structure-end' })
    expect(props(no)).toMatchObject({ which: 'no', label: { en: 'No', nl: 'Nee' } })
  })

  test('one Answer: the lone + for the word its label does not say in the language edited, at the Answer’s width (41.7 item 2)', () => {
    const one = (label: Record<string, string>) => structure!(node('start', { kind: 'question', answers: [{ label, target: 'n-2' }] })) as unknown as ReactElement[]
    expect(one({ en: 'Yes', nl: 'Ja' }).map(props)).toMatchObject([{ which: 'no', lone: true }])
    expect(one({ en: 'no', nl: '' }).map(props)).toMatchObject([{ which: 'yes', lone: true }])
    // **[#221]** Words that are neither: both stay, one click each, and neither is lone.
    expect(one({ en: 'Not sure', nl: 'Weet niet' }).map(props)).toMatchObject([
      { which: 'yes', lone: false },
      { which: 'no', lone: false },
    ])
  })

  test('both Answers, or an end: the public row, nothing added', () => {
    const step = (target: string) => ({ label: { en: 'A step', nl: 'Een stap' }, target })
    expect(structure!(node('start', { kind: 'question', answers: [step('n-2'), step('a-1')] }))).toBeNull()
    // **[#221]** Three or four: the public row too, until #222 adds its `+` (41.7 item 2).
    expect(structure!(node('start', { kind: 'question', answers: [step('n-2'), step('a-1'), step('n-2'), step('a-1')] }))).toBeNull()
    expect(structure!(node('start', { kind: 'terminal', label: { en: 'Look elsewhere' } }))).toBeNull()
  })

  test('**[#179]** the end Sheet asks for the words, in the page\'s language, and offers no outcome (36.3)', () => {
    const [, end] = children(structure!(node('start')) as ReactElement)
    const [page] = props(end).pages as ReactElement[]
    expect(props(page)).toEqual({
      nodeId: 'start',
      lang: 'en',
      heading: 'Tree ends here',
      words: { endingText: 'Text of the ending', characters: 'characters', confirm: 'Confirm', cancel: 'Cancel' },
    })
  })

  test('a Node the page does not carry gets nothing: there is no address to go to', () => {
    expect(structure!(node('elsewhere'))).toBeNull()
  })
})

describe('**[#178]** no link menu (30.6, amended)', () => {
  test('no Answer or Option button gets a `...`: the slot is gone, and with it the picker', () => {
    expect('linkMenu' in mode.slots).toBe(false)
    expect('stepMenu' in mode.slots).toBe(false)
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
    expect(sideAdd!(node('start', { kind: 'terminal', label: { en: 'Applies' } }))).toBeNull()
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

  test('**[#179]** a Terminal\'s words are a plain field of 19 in the page\'s language, drawn as the badge, the placeholder endingText (36.3)', () => {
    const words = field!(node('n-3', { kind: 'terminal', label: { en: 'Applies' } }), 'terminal.label', 'Applies', { characters: 19 }) as ReactElement
    expect(props(words)).toMatchObject({ nodeId: 'n-3', path: 'terminal.label', lang: 'en', value: 'Applies', limit: { characters: 19 }, className: 'outcome', placeholder: 'Text of the ending' })
    expect(props(words)).not.toHaveProperty('select')
    // The old field is no field: the slot draws nothing for it.
    expect(field!(node('n-3'), 'terminal.outcome', 'refer', null)).toBeNull()
  })

  test('the centre’s own title, an aside’s other fields and a Node the centre does not lead to have none', () => {
    expect(props(field!(node('start'), 'title', 'Start', { characters: 80 }) as ReactElement).follower).toBeUndefined()
    expect(props(field!(node('a-1'), 'description', '', { characters: 150, lines: 2 }) as ReactElement).follower).toBeUndefined()
    expect(props(field!(node('n-2'), 'title', '', { characters: 80 }) as ReactElement).follower).toBeUndefined()
  })
})

describe('**[#178]** the step’s buttons beside the up arrow (30.8, amended)', () => {
  /** The elements the slot's fragment holds, its absent ones dropped. */
  const buttons = (drawn: unknown): ReactElement[] => children(drawn as ReactElement).filter((child): child is ReactElement => Boolean(child))

  test('a step under a Trail that does not end has the red cross alone, which goes back to the entry above', () => {
    const [cross, ...rest] = buttons(stepButtons!(node('n-3')))
    expect(rest).toEqual([])
    expect(cross!.type).toBe(DeleteStep)
    expect(props(cross)).toMatchObject({ nodeId: 'n-3', lang: 'en', title: 'Title of n-3', parentHref: '/admin/trees/t/start/n-2' })
  })

  test('a step that ends has the cross and "Tree does not end here after all"', () => {
    const [cross, end] = buttons(stepButtons!(node('n-3', { kind: 'terminal', label: { en: 'Look elsewhere' } })))
    expect(cross!.type).toBe(DeleteStep)
    expect(end!.type).toBe(RemoveEnd)
    expect(props(end)).toMatchObject({ nodeId: 'n-3', word: 'Tree does not end here after all' })
  })

  test('the first step has no cross: nothing at all when it does not end, the ending’s button alone when it does', () => {
    expect(stepButtons!(node('start'))).toBeNull()
    expect(stepButtons!(node('start', { kind: 'question', answers: { yes: 'n-2', no: 'a-1' } }))).toBeNull()
    const [end, ...rest] = buttons(stepButtons!(node('start', { kind: 'terminal', label: { en: 'Look elsewhere' } })))
    expect(rest).toEqual([])
    expect(end!.type).toBe(RemoveEnd)
  })

  test('a step with no Trail goes to the root once deleted; a Node the page does not carry gets nothing', () => {
    const noTrail = editMode({ ...start, nodeId: 'n-3' }, ['en'], { ...structureOf([]), addresses: { 'n-3': { ...start, nodeId: 'n-3' } } }).slots
    expect(props(buttons(noTrail.stepButtons!(node('n-3')))[0])).toMatchObject({ parentHref: '/admin/trees/t/start' })
    expect(stepButtons!(node('elsewhere'))).toBeNull()
  })

  test('the cross is named "Delete this step"; the confirmation names the title around it, or says the step has none yet', () => {
    const words = props(buttons(stepButtons!(node('n-3')))[0]).words as { deleteStep: string; confirmBefore: string; confirmAfter: string; confirmUntitled: string; confirm: string; cancel: string }
    expect(words.deleteStep).toBe('Delete this step')
    expect(`${words.confirmBefore}Title of n-3${words.confirmAfter}`).toBe('Delete "Title of n-3"? What it led to stays.')
    expect(words.confirmUntitled).toBe('Delete this step? It has no title yet. What it led to stays.')
    expect([words.confirm, words.cancel]).toEqual(['Confirm', 'Cancel'])
    expect(props(buttons(stepButtons!(node('n-3', { title: {} })))[0]).title).toBe('')
  })

  test('in Dutch: the sentence keeps its own order around the title, and the ending’s button says it likewise', () => {
    const nl = editMode({ ...under2, lang: 'nl' }, ['en', 'nl'], structureOf([])).slots
    const [cross, end] = buttons(nl.stepButtons!(node('n-3', { kind: 'terminal', label: { nl: 'Elders geregeld' }, title: { nl: 'Een stap' } })))
    const words = props(cross).words as { deleteStep: string; confirmBefore: string; confirmAfter: string; confirmUntitled: string }
    expect(words.deleteStep).toBe('Deze stap verwijderen')
    expect(`${words.confirmBefore}Een stap${words.confirmAfter}`).toBe('"Een stap" verwijderen? Waar die heen leidde blijft.')
    expect(words.confirmUntitled).toBe('Deze stap verwijderen? Hij heeft nog geen titel. Waar hij heen leidde blijft.')
    expect(props(end).word).toBe('Boom eindigt hier toch niet')
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
