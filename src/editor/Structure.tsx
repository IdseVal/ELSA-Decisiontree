'use client'

/**
 * The structure editing (docs/specs/application.md 30; ADR-133-structure-editing), as the
 * client leaves of the structure slots: **[#233]** `WordsForm` is the page of the row's one `+`
 * Sheet, a switch `treeEndsHere` on a step without Links and one field, the words on the new
 * button or the ending's, with `confirm` and `cancel` (42.7; ADR-231-one-plus) -- `+ Yes`, `+ No`
 * and the row's own `treeEndsHere` Sheet are gone; **[#222]**
 * `AnswerMoves` the `moveEarlier` / `moveLater` controls on a next step's outline (41.7 item 4).
 * **[#177]** `SideAdd` is the side-bubble `+` of the fan, which creates
 * at one click (30.4), and `SideDelete` the `deleteSideBubble` button at the bottom of an
 * opened side bubble (30.7; ADR-177-side-bubble-editing). **[#178]** The link menu of an Answer
 * or an Option button and its picker are gone: the editor no longer re-points a button at an
 * existing step (30.6, amended; ADR-178-step-buttons). The Sheets themselves are built server
 * side by the slots, so a client component takes strings and ids and reaches the queue through
 * the editor's context (34.4).
 *
 * A creation goes through the queue as every write does and, once applied, navigates to the
 * Node it made: `followHref` of a new Answer target, the aside's address under this page for
 * a new Option -- a plain navigation, never the slide (30.2, 34.5). An end repaints the page
 * from the response (29.7).
 *
 * Imports of `src/`: types and **[#179]** `tree/measure.ts`, for the ending's counter (34.4).
 */
import { useEffect, useRef, useState, type FormEvent, type MouseEvent, type RefObject } from 'react'
import { countedLength } from '../tree/measure.ts'
import { useEditor } from './Editor.tsx'
import { heldToLimit } from './Field.tsx'
import { plainLine } from './fields.ts'
import type { FieldLimit } from './mode.ts'
import type { Answer, Change, Refusal, WriteResponse } from './writes.ts'

/** **[#179]** The ending's words, and **[#222]** a next step's, are at most 19 characters (tree-format.md 5.7). */
const WORDS_LIMIT: FieldLimit = { characters: 19 }

/**
 * The address of a Node under the page `here` (4.1): `/<here's path>/<id>`, the query
 * string kept, so a new Answer target is reached by `followHref` and a new aside by the
 * address that renders this page with its Overlay open (30.2, 30.4).
 */
export function under(here: string, id: string): string {
  const at = here.indexOf('?')
  const path = at < 0 ? here : here.slice(0, at)
  const query = at < 0 ? '' : here.slice(at)
  return `${path}/${encodeURIComponent(id)}${query}`
}

/** The message of a refused write, for the Sheet that sent it (30.3): the violations' own words, or the code. */
export function refusalText(answer: Answer): string {
  const body = answer.body as Refusal | null
  const violations = body?.violations ?? []
  if (violations.length > 0) return violations.map((violation) => `${violation.rule} ${violation.keyPath}: ${violation.message}`).join('; ')
  return body?.error ?? `${answer.status}`
}

/** Whether an answer applied (2xx with a write response). */
function accepted(answer: Answer): answer is Answer & { body: WriteResponse } {
  return answer.status >= 200 && answer.status < 300 && answer.body !== null && 'node' in answer.body
}

/** Leaves the page for `href`: a plain navigation, the same as following the link (30.2). */
function goTo(href: string): void {
  window.location.assign(href)
}

/** Closes the Sheet a form is on the page of (the nearest `<details>`), as a Sheet's own close does. */
function closeSheetAround(element: Element | null): void {
  const details = element?.closest('details')
  if (details) details.open = false
}

/** Runs `reset` when the Sheet around `root` closes, so a reopened Sheet starts at its first page. */
export function useResetOnClose(root: RefObject<HTMLElement | null>, reset: () => void): void {
  useEffect(() => {
    const details = root.current?.closest('details')
    if (!details) return
    const onToggle = (): void => {
      if (!details.open) reset()
    }
    details.addEventListener('toggle', onToggle)
    return () => details.removeEventListener('toggle', onToggle)
    // `reset` only sets state; the listener is bound once, to the Sheet the form is on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/**
 * A creation from the Node `nodeId` that navigates to the Node it made, under the page `here`
 * (30.2, 30.4): `create` sends it once, and `busy` holds the button down until the page leaves
 * or the write is refused.
 */
function useCreation(nodeId: string, here: string, from: { link: 'option' }): { busy: boolean; create: () => void } {
  const api = useEditor()
  const [busy, setBusy] = useState(false)
  const create = (): void => {
    if (busy) return
    setBusy(true)
    api.operate(nodeId, { create: { from: { node: nodeId, ...from } } }, undefined, (answer) => {
      if (accepted(answer) && answer.body.node) goTo(under(here, answer.body.node.id))
      else setBusy(false)
    })
  }
  return { busy, create }
}

/**
 * **[#177]** The side-bubble `+` in the fan (30.4, amended 2026-10-02): one click creates the
 * Option and its explanation Node, both with an empty title, and navigates to the aside's
 * address under this page, which renders it with the new side bubble's Overlay open -- no
 * Sheet, no question. Drawn as the Option button it makes: `+` where the picture is, `word`
 * where the title is, in `wordLang` where the chrome speaks another language than the content.
 */
export function SideAdd({ nodeId, here, word, wordLang }: { nodeId: string; here: string; word: string; wordLang?: string }) {
  const api = useEditor()
  const { busy, create } = useCreation(nodeId, here, { link: 'option' })
  return (
    <button type="button" className="side-add" disabled={api.readOnly || busy} onClick={create}>
      <span className="option-image option-image--empty side-add-plus" aria-hidden="true">
        +
      </span>
      <span className="option-title" lang={wordLang}>
        {word}
      </span>
    </button>
  )
}

/**
 * **[#179]** The chrome words a `WordsForm` says (36.3), **[#233]** in both states of its switch
 * (42.7 item 2): its heading `addNextStep`, the switch's `treeEndsHere`, and the field's label,
 * `nextStepWords` with the switch off and `endingText` with it on; strings, because a client
 * component takes no module.
 */
export interface FormWords {
  addNextStep: string
  treeEndsHere: string
  nextStepWords: string
  endingText: string
  characters: string
  confirm: string
  cancel: string
}

/**
 * **[#233]** The page of the row's one `+` Sheet (42.7 items 2 to 4; ADR-231-one-plus), titled
 * `addNextStep`. On a step without Links (`canEnd`) it holds a switch, `treeEndsHere`, off when
 * the Sheet opens; a step with next steps cannot end, and its Sheet has none. **[#179]** One plain
 * field for the words in the page's language `lang`, focused when the Sheet opens, its typing
 * stopped at 19 characters with the counter on it as every field's (28.3, 28.4), labelled by the
 * switch's state; turning the switch keeps what it holds. `confirm` is enabled once it holds a
 * character that is not white space -- Enter is the same. `cancel` closes the Sheet, and a Sheet
 * closed opens empty again, the switch off.
 *
 * The switch says what `confirm` makes. Off: a next step with those words, every other language
 * `""`, appended last, and the editor goes to the step it made under the page `here` (41.7 item
 * 3); a refusal -- a sixth -- is shown on the Sheet. On: the Node a Terminal with those words
 * (36.3), the page repainting from the response with this Sheet gone with the row; a refusal -- a
 * Node with Options cannot end (V-TERMINAL, 30.3) -- is shown on the Sheet, the switch and the
 * words kept, so the creator can turn it off and add a next step instead.
 */
export function WordsForm({ nodeId, lang, here, canEnd, words }: { nodeId: string; lang: string; here: string; canEnd: boolean; words: FormWords }) {
  const api = useEditor()
  const root = useRef<HTMLFormElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [ends, setEnds] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const confirmable = text.trim() !== '' && !busy && !api.readOnly
  useResetOnClose(root, () => {
    setText('')
    setEnds(false)
    setError(null)
  })

  // The field takes the focus when the Sheet opens: the words are the one thing it asks for.
  useEffect(() => {
    const details = input.current?.closest('details')
    if (!details) return
    const onToggle = (): void => {
      if (details.open) input.current?.focus()
    }
    details.addEventListener('toggle', onToggle)
    return () => details.removeEventListener('toggle', onToggle)
  }, [])

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (!confirmable) return
    setBusy(true)
    setError(null)
    const form = event.currentTarget
    const link = ends ? 'end' : 'answer'
    api.operate(nodeId, { create: { from: { node: nodeId, link, label: { [lang]: text.trim() } } } }, undefined, (answer) => {
      // A new next step is edited on its own page: `confirm` stays down until the page goes (30.2).
      if (link === 'answer' && accepted(answer) && answer.body.node) {
        goTo(under(here, answer.body.node.id))
        return
      }
      setBusy(false)
      if (accepted(answer)) closeSheetAround(form)
      else setError(refusalText(answer))
    })
  }

  const id = `${nodeId}-add-words`
  const name = ends ? words.endingText : words.nextStepWords
  return (
    <form ref={root} className={`structure-form structure-form--${ends ? 'end' : 'next'}`} noValidate onSubmit={onSubmit}>
      <h2>{words.addNextStep}</h2>
      {canEnd && (
        <label className="structure-switch">
          <input type="checkbox" role="switch" checked={ends} disabled={api.readOnly} onChange={(event) => setEnds(event.target.checked)} />
          {words.treeEndsHere}
        </label>
      )}
      {/* A row, not a label: the counter is no part of the field's name. */}
      <div className="editor-row">
        <label htmlFor={id}>{name}</label>
        <span className="structure-ending-field">
          <input
            ref={input}
            id={id}
            className="editor-url"
            lang={lang}
            value={text}
            placeholder={name}
            disabled={api.readOnly}
            onChange={(event) => setText(heldToLimit(event.target, text, plainLine(event.target.value), WORDS_LIMIT))}
          />
          <span className="editor-pill structure-ending-count">
            <span aria-label={words.characters}>
              {countedLength(text)} / {WORDS_LIMIT.characters}
            </span>
          </span>
        </span>
      </div>
      {error !== null && (
        <p className="admin-error structure-error" role="alert">
          {error}
        </p>
      )}
      <div className="structure-actions">
        <button type="submit" className="admin-submit" disabled={!confirmable}>
          {words.confirm}
        </button>
        <button type="button" className="admin-link" onClick={(event) => closeSheetAround(event.currentTarget)}>
          {words.cancel}
        </button>
      </div>
    </form>
  )
}

/**
 * **[#222]** `moveEarlier` and `moveLater` on the outline of the next step at `index` of `count`
 * (41.7 item 4): 24-pixel round controls, the first absent on the first button and the second on
 * the last, each sending `move-answer { index, to }` at once; the page repaints the row in its new
 * order. They stand inside the button's link, whose click Chromium follows from a button inside it
 * too: each click is kept from it, as a field's is (`Field`).
 */
export function AnswerMoves({ nodeId, index, count, words }: { nodeId: string; index: number; count: number; words: { moveEarlier: string; moveLater: string } }) {
  const api = useEditor()
  const move = (event: MouseEvent, to: number): void => {
    event.preventDefault()
    api.operate(nodeId, { op: 'move-answer', index, to })
  }
  return (
    <>
      {index > 0 && (
        <button type="button" className="answer-move answer-move--earlier" aria-label={words.moveEarlier} title={words.moveEarlier} disabled={api.readOnly} onClick={(event) => move(event, index - 1)}>
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path d="M15 5 8 12l7 7" />
          </svg>
        </button>
      )}
      {index < count - 1 && (
        <button type="button" className="answer-move answer-move--later" aria-label={words.moveLater} title={words.moveLater} disabled={api.readOnly} onClick={(event) => move(event, index + 1)}>
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path d="m9 5 7 7-7 7" />
          </svg>
        </button>
      )}
    </>
  )
}

/**
 * **[#177]** What `SideDelete` says; strings, because a client component takes no module. The
 * confirmation names the title as it stands when it is asked, so the sentence travels as the
 * two parts around the title (the chrome's `confirmDeleteSideBubble`, cut where it puts it).
 */
export interface SideDeleteWords {
  deleteSideBubble: string
  confirmBefore: string
  confirmAfter: string
  /** The confirmation of a side bubble without a title yet. */
  confirmUntitled: string
  /** Said after it where another step leads to the aside too. */
  stays: string
  confirm: string
  cancel: string
}

/**
 * **[#177]** `deleteSideBubble`, at the bottom of the side bubble the Option `parentId` ->
 * `asideId` opens (30.7, amended 2026-10-02). It asks once, in place, naming the side bubble's
 * title, then deletes the aside's Node with every Link to it -- this step's Option among them,
 * in the same write (22.4) -- or, where another step leads to the aside too (`shared`), removes
 * only this step's Option and the aside stays. Either way the page then goes to `centreHref`,
 * this step's own address: the Overlay closes and the fan closes the gap. What the aside led
 * to stays in the draft, as for every deleted step (30.8, 30.9).
 */
export function SideDelete({
  parentId,
  asideId,
  lang,
  title,
  shared,
  centreHref,
  words,
}: {
  parentId: string
  asideId: string
  lang: string
  /** The aside's title as the page rendered it; the last response's is said once there is one. */
  title: string
  shared: boolean
  centreHref: string
  words: SideDeleteWords
}) {
  const api = useEditor()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  useResetOnClose(root, () => {
    setConfirming(false)
    setError(null)
  })
  // The button the creator pressed is gone: the focus goes to the choice that keeps the side bubble.
  useEffect(() => {
    if (confirming) cancel.current?.focus()
  }, [confirming])

  const named = (api.nodes[asideId]?.title[lang] ?? title).trim()
  const remove = (): void => {
    if (busy || api.readOnly) return
    setBusy(true)
    setError(null)
    const [nodeId, change]: [string, Change] = shared ? [parentId, { op: 'remove-option', target: asideId }] : [asideId, { delete: true }]
    api.operate(nodeId, change, undefined, (answer) => {
      if (answer.status >= 200 && answer.status < 300) {
        goTo(centreHref)
        return
      }
      setBusy(false)
      setError(refusalText(answer))
    })
  }

  return (
    <div ref={root} className="side-delete" data-mode={confirming ? 'confirm' : 'button'}>
      {confirming ? (
        <>
          <p className="structure-confirm">
            {named === '' ? words.confirmUntitled : `${words.confirmBefore}${named}${words.confirmAfter}`}
            {shared && ` ${words.stays}`}
          </p>
          <div className="structure-actions">
            <button type="button" className="admin-submit admin-submit--danger" disabled={api.readOnly || busy} onClick={remove}>
              {words.confirm}
            </button>
            <button ref={cancel} type="button" className="admin-link" disabled={busy} onClick={() => setConfirming(false)}>
              {words.cancel}
            </button>
          </div>
        </>
      ) : (
        <button type="button" className="side-delete-button" disabled={api.readOnly} onClick={() => setConfirming(true)}>
          {words.deleteSideBubble}
        </button>
      )}
      {error !== null && (
        <p className="admin-error structure-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
