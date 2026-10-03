'use client'

/**
 * **[#178]** The step's two buttons beside the up arrow, in place of #139's step menu
 * (docs/specs/application.md 30.8, amended 2026-10-02; ADR-178-step-buttons): `DeleteStep`, the
 * red cross on every Node but the root, which asks once, in place, naming the step's title as it
 * stands, and then sends the deletion through the queue and goes to the parent -- `trailHref` of
 * the entry above -- or, with no Trail, to the root; and `RemoveEnd`, "Tree does not end here
 * after all" on a Terminal (`remove-terminal`), after which the Node is without Links again and
 * the row offers the three buttons (30.1). The store removes every Link to a deleted step in the
 * same write; what the step led to stays (30.9).
 *
 * Both are built server side by the `stepButtons` slot, which hands over strings and ids (34.4).
 * Imports of `src/`: nothing but its own folder.
 */
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { useEditor } from './Editor.tsx'
import { refusalText } from './Structure.tsx'

/**
 * What `DeleteStep` says; strings, because a client component takes no module. The confirmation
 * names the title as it stands when it is asked, so the sentence travels as the two parts around
 * the title (the chrome's `confirmDelete`, cut where it puts it).
 */
export interface DeleteStepWords {
  /** The cross's name and its hover text. */
  deleteStep: string
  confirmBefore: string
  confirmAfter: string
  /** The confirmation of a step without a title yet. */
  confirmUntitled: string
  confirm: string
  cancel: string
}

/**
 * The red cross (30.8, amended). A click asks, in a panel hung under the step's band over the
 * Sheets' veil, with the focus on `cancel`; `confirm` deletes. Escape, `cancel` and a click on
 * the veil keep the step and give the focus back to the cross.
 */
export function DeleteStep({
  nodeId,
  lang,
  title,
  parentHref,
  words,
  uiLang,
}: {
  nodeId: string
  lang: string
  /** The step's title as the page rendered it; the last response's is said once there is one. */
  title: string
  /** Where the page goes after the delete: the parent, or the root when the page has no Trail. */
  parentHref: string
  words: DeleteStepWords
  /** Set when the chrome speaks another language than the content. */
  uiLang: string | undefined
}) {
  const api = useEditor()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const cross = useRef<HTMLButtonElement>(null)
  const cancelButton = useRef<HTMLButtonElement>(null)
  const question = useId()
  // The cross the creator pressed stays under the veil: the focus goes to the choice that keeps the step.
  useEffect(() => {
    if (confirming) cancelButton.current?.focus()
  }, [confirming])

  const cancel = (): void => {
    if (busy) return
    setConfirming(false)
    setError(null)
    cross.current?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'Escape') return
    // Consumed, so a Sheet's document listener does not take the same key (Sheet.tsx).
    event.preventDefault()
    cancel()
  }

  const remove = (): void => {
    if (busy || api.readOnly) return
    setBusy(true)
    setError(null)
    api.operate(nodeId, { delete: true }, undefined, (answer) => {
      if (answer.status >= 200 && answer.status < 300) {
        window.location.assign(parentHref)
        return
      }
      setBusy(false)
      setError(refusalText(answer))
    })
  }

  const named = (api.nodes[nodeId]?.title[lang] ?? title).trim()
  return (
    <>
      <button
        ref={cross}
        type="button"
        className="step-delete"
        title={words.deleteStep}
        lang={uiLang}
        aria-expanded={confirming}
        disabled={api.readOnly}
        onClick={() => setConfirming(true)}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M3 3l8 8M11 3l-8 8" />
        </svg>
      </button>
      {confirming && (
        <>
          <div className="sheet-backdrop" onClick={cancel} />
          <div className="step-confirm" role="alertdialog" aria-labelledby={question} lang={uiLang} onKeyDown={onKeyDown}>
            <p id={question} className="structure-confirm">
              {named === '' ? words.confirmUntitled : `${words.confirmBefore}${named}${words.confirmAfter}`}
            </p>
            <div className="structure-actions">
              <button type="button" className="admin-submit admin-submit--danger" disabled={api.readOnly || busy} onClick={remove}>
                {words.confirm}
              </button>
              <button ref={cancelButton} type="button" className="admin-link" disabled={busy} onClick={cancel}>
                {words.cancel}
              </button>
            </div>
            {error !== null && (
              <p className="admin-error structure-error" role="alert">
                {error}
              </p>
            )}
          </div>
        </>
      )}
    </>
  )
}

/**
 * "Tree does not end here after all" (30.3, 30.8, amended): removes the Terminal's ending at
 * once, as the step menu's `removeEnd` did. The response repaints the page (29.7): the badge
 * goes, the row offers the three buttons, and this button goes with the ending. A refusal --
 * a collaborator removed the ending first -- is said under the button, as the menu said it.
 */
export function RemoveEnd({ nodeId, word, uiLang }: { nodeId: string; word: string; uiLang: string | undefined }) {
  const api = useEditor()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const remove = (): void => {
    if (busy || api.readOnly) return
    setBusy(true)
    setError(null)
    api.operate(nodeId, { op: 'remove-terminal' }, undefined, (answer) => {
      setBusy(false)
      if (answer.status < 200 || answer.status >= 300) setError(refusalText(answer))
    })
  }
  return (
    <span className="step-end" lang={uiLang}>
      <button type="button" disabled={api.readOnly || busy} onClick={remove}>
        {word}
      </button>
      {error !== null && (
        <span className="admin-error step-end-error" role="alert">
          {error}
        </span>
      )}
    </span>
  )
}
