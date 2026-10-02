'use client'

/**
 * The structure editing (docs/specs/application.md 30; ADR-133-structure-editing), as the
 * client leaves of the structure slots: `AnswerAdd` is the `+ Yes` / `+ No` button of the
 * Answer row (30.1, 30.2); `EndForm` the page of the `treeEndsHere` Sheet, the four outcomes
 * and `confirm` (30.3); `LinkMenuForm` the page of an Answer's or an Option's `...` Sheet,
 * `changeTarget` with the picker and `removeLink` (30.6, 30.7). **[#177]** `SideAdd` is the
 * side-bubble `+` of the fan, which creates at one click (30.4), and `SideDelete` the
 * `deleteSideBubble` button at the bottom of an opened side bubble (30.7; ADR-177-side-bubble-
 * editing). The Sheets themselves are built server side by the slots, so a client component
 * takes strings and ids and reaches the queue through the editor's context (34.4).
 *
 * A creation goes through the queue as every write does and, once applied, navigates to the
 * Node it made: `followHref` of a new Answer target, the aside's address under this page for
 * a new Option -- a plain navigation, never the slide (30.2, 34.5). A re-pointing or a removal
 * repaints the page from the response (29.7).
 *
 * Imports of `src/`: types, and nothing else (34.4).
 */
import { useEffect, useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react'
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
  changeTarget: string
  removeLink: string
  pickTarget: string
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
function useCreation(nodeId: string, here: string, link: 'yes' | 'no' | 'option'): { busy: boolean; create: () => void } {
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
  return { busy, create }
}

/**
 * `+ Yes` or `+ No` (30.1): creates the Answer's target and navigates to it (30.2). `lone`
 * when the other Answer exists, so the button takes that Answer's 620 pixels.
 */
export function AnswerAdd({ nodeId, link, here, word, lone = false }: { nodeId: string; link: 'yes' | 'no'; here: string; word: string; lone?: boolean }) {
  const api = useEditor()
  const { busy, create } = useCreation(nodeId, here, link)
  return (
    <button type="button" className={`structure structure--${link}${lone ? ' structure--lone' : ''}`} disabled={api.readOnly || busy} onClick={create}>
      + {word}
    </button>
  )
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
  const { busy, create } = useCreation(nodeId, here, 'option')
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
function Picker({ nodes, words, head, onPick }: { nodes: Pickable[]; words: StructureWords; head?: ReactNode; onPick: (node: Pickable, button: HTMLElement) => void }) {
  const api = useEditor()
  return (
    <div className="structure-picker">
      <h2>{words.pickTarget}</h2>
      {head}
      <ul className="structure-picker-list" data-scroll-box="">
        {nodes.map((node) => (
          <li key={node.id}>
            <button type="button" className="structure-pick" disabled={api.readOnly} onClick={(event) => onPick(node, event.currentTarget)}>
              <span className="structure-pick-title">{node.title || words.missingText}</span> <span className="structure-pick-id">{node.id}</span>
            </button>
          </li>
        ))}
      </ul>
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
  const root = useRef<HTMLDivElement>(null)
  useResetOnClose(root, () => {
    setPicking(false)
    setError(null)
  })

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
    <div ref={root} className="structure-form structure-form--link" data-mode={picking ? 'pick' : 'menu'}>
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
            onPick={(target, button) => rePoint(target, button)}
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
