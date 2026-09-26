'use client'

/**
 * The structure editing (docs/specs/application.md 30; ADR-133-structure-editing), as the
 * client leaves of the four slots #139 fills: `AnswerAdd` is the `+ Yes` / `+ No` button of
 * the Answer row (30.1, 30.2); `EndForm` the page of the `treeEndsHere` Sheet, the four
 * outcomes and `confirm` (30.3); `SideAddForm` the page of the side-bubble `+` Sheet, a
 * title for a new aside or the picker for an existing one (30.4); `LinkMenuForm` the page of
 * an Answer's or an Option's `...` Sheet, `changeTarget` with the picker and `removeLink`
 * (30.6, 30.7). The Sheets themselves are built server side by the slots, so a client
 * component takes strings and ids and reaches the queue through the editor's context (34.4).
 *
 * A creation goes through the queue as every write does and, once applied, navigates to the
 * Node it made: `followHref` of a new Answer target, the aside's address under this page for
 * a new Option -- a plain navigation, never the slide (30.2, 34.5). A re-pointing or a removal
 * repaints the page from the response (29.7).
 *
 * Imports of `src/`: types, and nothing else (34.4).
 */
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { useEditor } from './Editor.tsx'
import type { Answer, Change, Refusal, WriteResponse } from './writes.ts'

/** A Node of the draft as the picker lists it (30.6): its id and its title in the page's language. */
export interface Pickable {
  id: string
  title: string
}

/** One choice of the outcome Sheet: the outcome and its badge text (30.3). */
export interface OutcomeChoice {
  value: string
  label: string
}

/** The chrome words the structure controls say; strings, because a client component takes no module. */
export interface StructureWords {
  yes: string
  no: string
  confirm: string
  cancel: string
  createNew: string
  linkExisting: string
  changeTarget: string
  removeLink: string
  pickTarget: string
  sideBubbleTitle: string
  newSideBubble: string
  missingText: string
}

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

/**
 * `+ Yes` or `+ No` (30.1): creates the Answer's target and navigates to it (30.2). `lone`
 * when the other Answer exists, so the button takes that Answer's 620 pixels.
 */
export function AnswerAdd({ nodeId, link, here, word, lone = false }: { nodeId: string; link: 'yes' | 'no'; here: string; word: string; lone?: boolean }) {
  const api = useEditor()
  const [busy, setBusy] = useState(false)
  const create = (): void => {
    if (busy) return
    setBusy(true)
    api.operate(nodeId, { create: { from: { node: nodeId, link } } }, undefined, (answer) => {
      if (accepted(answer) && answer.body.node) goTo(under(here, answer.body.node.id))
      else setBusy(false)
    })
  }
  return (
    <button type="button" className={`structure structure--${link}${lone ? ' structure--lone' : ''}`} disabled={api.readOnly || busy} onClick={create}>
      + {word}
    </button>
  )
}

/**
 * The page of the `treeEndsHere` Sheet (30.3): the four outcomes as radio choices and
 * `confirm`, which makes the Node a Terminal. A refusal -- a Node with Options cannot end --
 * is shown on the Sheet; on success the page repaints and this Sheet is gone with the row.
 */
export function EndForm({ nodeId, outcomes, heading, words }: { nodeId: string; outcomes: OutcomeChoice[]; heading: string; words: StructureWords }) {
  const api = useEditor()
  const [outcome, setOutcome] = useState(outcomes[0]?.value ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (busy || api.readOnly) return
    setBusy(true)
    setError(null)
    const form = event.currentTarget
    api.operate(nodeId, { create: { from: { node: nodeId, link: 'end', outcome } } }, undefined, (answer) => {
      setBusy(false)
      if (accepted(answer)) closeSheetAround(form)
      else setError(refusalText(answer))
    })
  }

  return (
    <form className="structure-form structure-form--end" noValidate onSubmit={onSubmit}>
      <h2>{heading}</h2>
      <ul className="structure-outcomes" role="radiogroup" aria-label={heading}>
        {outcomes.map((choice) => (
          <li key={choice.value}>
            <label>
              <input type="radio" name={`${nodeId}-outcome`} value={choice.value} checked={outcome === choice.value} onChange={() => setOutcome(choice.value)} />
              <span className={`outcome outcome--${choice.value} structure-outcome`}>{choice.label}</span>
            </label>
          </li>
        ))}
      </ul>
      {error !== null && (
        <p className="admin-error structure-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="admin-submit" disabled={api.readOnly || busy}>
        {words.confirm}
      </button>
    </form>
  )
}

/**
 * The picker (30.6): every Node of the draft by its title in the page's language, in file
 * order, its id in `text-muted` beside it, the current Node excluded by the slot. Ids and
 * titles from the index, never Nodes, in a box that scrolls where the list is long (26.3).
 */
function Picker({ nodes, words, head, onPick }: { nodes: Pickable[]; words: StructureWords; head?: ReactNode; onPick: (node: Pickable) => void }) {
  const api = useEditor()
  return (
    <div className="structure-picker">
      <h2>{words.pickTarget}</h2>
      {head}
      <ul className="structure-picker-list" data-scroll-box="">
        {nodes.map((node) => (
          <li key={node.id}>
            <button type="button" className="structure-pick" disabled={api.readOnly} onClick={() => onPick(node)}>
              <span className="structure-pick-title">{node.title || words.missingText}</span> <span className="structure-pick-id">{node.id}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * The page of the side-bubble `+` Sheet (30.4): `createNew` -- one field, the title in the
 * page's language, which creates the aside and its Option in one write and navigates to the
 * aside's address under this page -- or `linkExisting`, the picker, which adds an Option to
 * the chosen Node with that Node's title and repaints. `here` is the address of the Node
 * the `+` belongs to: the centre's, or an aside's for the Overlay's list.
 */
export function SideAddForm({ nodeId, lang, here, nodes, words }: { nodeId: string; lang: string; here: string; nodes: Pickable[]; words: StructureWords }) {
  const api = useEditor()
  const [mode, setMode] = useState<'choose' | 'create' | 'link'>('choose')
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const done = (answer: Answer, form: Element | null, then: (response: WriteResponse) => void): void => {
    setBusy(false)
    if (!accepted(answer)) {
      setError(refusalText(answer))
      return
    }
    closeSheetAround(form)
    setMode('choose')
    then(answer.body)
  }

  const onCreate = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (busy || api.readOnly) return
    setBusy(true)
    setError(null)
    const form = event.currentTarget
    const text = title.replace(/\r\n?|\n/g, ' ').trim()
    api.operate(nodeId, { create: { from: { node: nodeId, link: 'option' }, title: text === '' ? {} : { [lang]: text } } }, undefined, (answer) =>
      done(answer, form, (response) => {
        if (response.node) goTo(under(here, response.node.id))
      }),
    )
  }

  const onPick = (target: Pickable, form: Element | null): void => {
    if (busy || api.readOnly) return
    setBusy(true)
    setError(null)
    const change: Change = { op: 'add-option', target: target.id, title: target.title === '' ? {} : { [lang]: target.title } }
    api.operate(nodeId, change, undefined, (answer) => done(answer, form, () => setTitle('')))
  }

  return (
    <div className="structure-form structure-form--side" data-mode={mode}>
      {mode === 'choose' && (
        <>
          <h2>{words.newSideBubble}</h2>
          <button type="button" className="admin-submit" disabled={api.readOnly} onClick={() => setMode('create')}>
            {words.createNew}
          </button>
          <button type="button" className="admin-submit" disabled={api.readOnly || nodes.length === 0} onClick={() => setMode('link')}>
            {words.linkExisting}
          </button>
        </>
      )}
      {mode === 'create' && (
        <form noValidate onSubmit={onCreate}>
          <h2>{words.createNew}</h2>
          <label className="editor-row">
            <span>{words.sideBubbleTitle}</span>
            <input
              className="editor-url structure-title"
              type="text"
              value={title}
              maxLength={2000}
              autoFocus
              disabled={api.readOnly}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setTitle(event.target.value)}
            />
          </label>
          <div className="structure-actions">
            <button type="submit" className="admin-submit" disabled={api.readOnly || busy}>
              {words.confirm}
            </button>
            <button type="button" className="admin-link" onClick={() => setMode('choose')}>
              {words.cancel}
            </button>
          </div>
        </form>
      )}
      {mode === 'link' && (
        <div className="structure-link">
          <Picker nodes={nodes} words={words} onPick={(target) => onPick(target, document.activeElement)} />
          <button type="button" className="admin-link" onClick={() => setMode('choose')}>
            {words.cancel}
          </button>
        </div>
      )}
      {error !== null && (
        <p className="admin-error structure-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/** Which Link a link menu is for (30.6): an Answer by its key, an Option by its target. */
export type MenuLink = { kind: 'yes' | 'no' } | { kind: 'option'; target: string; title: string }

/**
 * The page of an Answer's or an Option's `...` Sheet (30.6, 30.7): `changeTarget` opens
 * the picker -- for an Answer with `createNew` above it -- and `removeLink` removes the
 * Answer or the Option, the target staying in the draft. A new target of the wrong kind is
 * stored and reported by the store's advisory rule, at the button and in the to-do.
 */
export function LinkMenuForm({ nodeId, lang, link, here, nodes, words }: { nodeId: string; lang: string; link: MenuLink; here: string; nodes: Pickable[]; words: StructureWords }) {
  const api = useEditor()
  const [picking, setPicking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const send = (change: Change, form: Element | null, then?: (response: WriteResponse) => void): void => {
    if (busy || api.readOnly) return
    setBusy(true)
    setError(null)
    api.operate(nodeId, change, undefined, (answer) => {
      setBusy(false)
      if (!accepted(answer)) {
        setError(refusalText(answer))
        return
      }
      closeSheetAround(form)
      setPicking(false)
      then?.(answer.body)
    })
  }

  const remove = (form: Element | null): void => {
    send(link.kind === 'option' ? { op: 'remove-option', target: link.target } : { op: 'remove-answer', answer: link.kind }, form)
  }

  const rePoint = (target: Pickable, form: Element | null): void => {
    if (link.kind !== 'option') {
      send({ op: 'set-answer', answer: link.kind, target: target.id }, form)
      return
    }
    // An Option is re-pointed by removing it and adding one to the new target with the same
    // title (30.6): two writes, in order, through the one queue. The removal is sent first
    // and its answer is not waited for: the addition is queued behind it (29.2).
    if (busy || api.readOnly) return
    api.operate(nodeId, { op: 'remove-option', target: link.target })
    send({ op: 'add-option', target: target.id, title: link.title === '' ? {} : { [lang]: link.title } }, form)
  }

  const createNew = (form: Element | null): void => {
    if (link.kind === 'option') return
    send({ create: { from: { node: nodeId, link: link.kind } } }, form, (response) => {
      if (response.node) goTo(under(here, response.node.id))
    })
  }

  return (
    <div className="structure-form structure-form--link" data-mode={picking ? 'pick' : 'menu'}>
      {picking ? (
        <div className="structure-link">
          <Picker
            nodes={nodes}
            words={words}
            head={
              link.kind === 'option' ? undefined : (
                <button type="button" className="admin-submit" disabled={api.readOnly || busy} onClick={(event) => createNew(event.currentTarget)}>
                  {words.createNew}
                </button>
              )
            }
            onPick={(target) => rePoint(target, document.activeElement)}
          />
          <button type="button" className="admin-link" onClick={() => setPicking(false)}>
            {words.cancel}
          </button>
        </div>
      ) : (
        <>
          <h2>{link.kind === 'option' ? link.title || words.missingText : `${link.kind === 'yes' ? words.yes : words.no}`}</h2>
          <button type="button" className="admin-submit" disabled={api.readOnly || busy} onClick={() => setPicking(true)}>
            {words.changeTarget}
          </button>
          <button type="button" className="admin-submit admin-submit--danger" disabled={api.readOnly || busy} onClick={(event) => remove(event.currentTarget)}>
            {words.removeLink}
          </button>
        </>
      )}
      {error !== null && (
        <p className="admin-error structure-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
