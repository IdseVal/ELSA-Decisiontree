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
 * **[#222]** And the row of 41.7: the `+` and its Sheet, each next step's words a field of 19
 * and its move arrows; **[#233]** the one `+` wherever a step can take another next step, and its
 * Sheet's switch on a step without Links only (42.7).
 */
import type { ReactElement } from 'react'
import { describe, expect, test } from 'vitest'
import { editMode } from '../../src/admin/slots.tsx'
import { DeleteStep, RemoveEnd } from '../../src/editor/StepButtons.tsx'
import { AnswerMoves, refusalText, under, WordsForm } from '../../src/editor/Structure.tsx'
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
const { structure, answerMoves, sideAdd, sideDelete, stepButtons, field } = mode.slots

/** The elements a slot's fragment or element holds, flat. */
function children(element: ReactElement | null | undefined): ReactElement[] {
  const held = (element?.props as { children?: ReactElement | ReactElement[] })?.children
  return held === undefined ? [] : Array.isArray(held) ? held : [held]
}

const props = (element: ReactElement | null | undefined): Record<string, unknown> => (element?.props ?? {}) as Record<string, unknown>

describe('the Answer row (30.1; **[#222]** 41.7)', () => {
  const step = (target: string, en = 'A step') => ({ label: { en, nl: 'Een stap' }, target })
  const row = (extra: Partial<DraftNode> = {}, slot = structure!) => slot(node('start', extra)) as ReactElement[]

  const steps = (count: number) => Array.from({ length: count }, (_, i) => step(i % 2 === 0 ? 'n-2' : 'a-1', `Step ${i + 1}`))
  const english = { addNextStep: 'Add a next step', treeEndsHere: 'Tree ends here', nextStepWords: 'Words on the button', endingText: 'Text of the ending', characters: 'characters', confirm: 'Confirm', cancel: 'Cancel' }

  test('**[#233]** a Node without Links gets the one +, alone: no + Yes, + No or Tree ends here (42.7 item 1)', () => {
    const [add, ...rest] = row()
    expect(rest).toEqual([])
    expect(props(add)).toMatchObject({ className: 'structure-add' })
    // Keyed, as a list of the row's buttons is.
    expect(add!.key).toBe('add')
  })

  test('**[#233]** one to four next steps: the + after them; five: nothing more; an end: nothing (42.7 item 1)', () => {
    for (const count of [1, 2, 3, 4]) {
      expect(row({ kind: 'question', answers: steps(count) }).map((button) => props(button).className), `${count}`).toEqual(['structure-add'])
    }
    expect(row({ kind: 'question', answers: steps(5) })).toEqual([])
    expect(row({ kind: 'terminal', label: { en: 'Look elsewhere' } })).toEqual([])
  })

  test("**[#233]** the + is named addNextStep and opens a Sheet titled addNextStep, in the page's language, that goes to the step it made; on a step without Links it can end the step (42.7 item 2)", () => {
    const add = row().at(-1)
    const summary = props(add).summary as ReactElement
    expect(props(summary)).toMatchObject({ role: 'img', 'aria-label': 'Add a next step', children: '+' })
    const [page] = props(add).pages as ReactElement[]
    expect(page!.type).toBe(WordsForm)
    expect(props(page)).toEqual({ nodeId: 'start', lang: 'en', here: '/admin/trees/t/start', canEnd: true, words: english })
    const nl = editMode({ ...start, lang: 'nl' }, ['en', 'nl'], structureOf([])).slots.structure!
    const [nlPage] = props(row({}, nl).at(-1)).pages as ReactElement[]
    expect(props(nlPage)).toMatchObject({
      lang: 'nl',
      canEnd: true,
      words: { addNextStep: 'Volgende stap toevoegen', treeEndsHere: 'Boom eindigt hier', nextStepWords: 'Woorden op de knop', endingText: 'Tekst van het einde', confirm: 'Bevestigen' },
    })
    expect(props(props(row({}, nl).at(-1)).summary as ReactElement)['aria-label']).toBe('Volgende stap toevoegen')
  })

  test('**[#233]** the switch is offered on a step without Links only -- whatever its Options -- and not beside a next step (42.7 items 2 and 4)', () => {
    const canEnd = (extra: Partial<DraftNode>) => props((props(row(extra)[0]).pages as ReactElement[])[0]).canEnd
    expect(canEnd({ options: [{ title: { en: 'An aside' }, target: 'a-1' }] })).toBe(true)
    for (const count of [1, 2, 3, 4]) expect(canEnd({ kind: 'question', answers: steps(count) }), `${count}`).toBe(false)
  })

  test('a Node the page does not carry gets nothing: there is no address to go to', () => {
    expect(structure!(node('elsewhere'))).toEqual([])
    expect(answerMoves!(node('elsewhere', { kind: 'question', answers: [step('n-2'), step('a-1')] }), 0)).toBeNull()
  })

  test('**[#222]** each next step\'s words are a plain field of 19 in the page\'s language, its placeholder nextStepWords (41.7 item 2)', () => {
    const words = field!(node('start', { kind: 'question', answers: [step('n-2'), step('a-1', 'Maybe')] }), 'answers[1].label', 'Maybe', { characters: 19 }) as ReactElement
    expect(props(words)).toMatchObject({ nodeId: 'start', path: 'answers[1].label', lang: 'en', value: 'Maybe', limit: { characters: 19 }, placeholder: 'Words on the button' })
    expect(props(words)).not.toHaveProperty('select')
    // The target is no field: a next step is re-pointed through the API alone (30.6, amended).
    expect(field!(node('start'), 'answers[0].target', 'n-2', null)).toBeNull()
  })

  test('**[#222]** every next step of two or more carries its move arrows, told its place and the count; one alone has none (41.7 item 4)', () => {
    const three = node('start', { kind: 'question', answers: [step('n-2'), step('a-1'), step('n-3')] })
    for (const index of [0, 1, 2]) {
      const moves = answerMoves!(three, index) as ReactElement
      expect(moves.type).toBe(AnswerMoves)
      expect(props(moves)).toEqual({ nodeId: 'start', index, count: 3, words: { moveEarlier: 'Move earlier', moveLater: 'Move later' } })
    }
    expect(answerMoves!(node('start', { kind: 'question', answers: [step('n-2')] }), 0)).toBeNull()
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
  const centre = node('start', { kind: 'question', answers: [{ label: { en: 'Yes', nl: 'Ja' }, target: 'n-2' }], options: [{ title: { en: 'An aside' }, target: 'a-1' }] })

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
    expect(stepButtons!(node('start', { kind: 'question', answers: [{ label: { en: 'Yes' }, target: 'n-2' }, { label: { en: 'No' }, target: 'a-1' }] }))).toBeNull()
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
