'use client'

/**
 * The page of the step menu's Sheet (docs/specs/application.md 30.8; ADR-133-structure-editing
 * decision 8): the step's id in `text-muted`, `removeEnd` on a Terminal (`remove-terminal`,
 * after which the Node is without Links again and the row offers the three buttons), and
 * `deleteStep` on every Node but the root, followed by `confirmDelete` in place naming the
 * step's title, which sends the deletion through the queue and then goes to the parent --
 * `trailHref` of the entry above -- or, with no Trail, to the root. The store removes every
 * Link to the step in the same write; what the step led to stays (30.9).
 *
 * The Sheet and its 24-pixel `...` on the rim are built server side by the `stepMenu` slot.
 * Imports of `src/`: nothing but its own folder (34.4).
 */
import { useRef, useState } from 'react'
import { useEditor } from './Editor.tsx'
import { refusalText, useResetOnClose } from './Structure.tsx'
import type { Answer } from './writes.ts'

/** The chrome words the step menu says; strings, because a client component takes no module. */
export interface StepMenuWords {
  removeEnd: string
  deleteStep: string
  /** The confirmation, already said with the step's title (the chrome's `confirmDelete`). */
  confirmDelete: string
  confirm: string
  cancel: string
}

export function StepMenuForm({
  nodeId,
  heading,
  root,
  terminal,
  parentHref,
  words,
}: {
  nodeId: string
  /** The step's title in the page's language, or the placeholder: the Sheet's heading. */
  heading: string
  /** The root Node has no `deleteStep` (30.8). */
  root: boolean
  /** A Terminal has `removeEnd` (30.3). */
  terminal: boolean
  /** Where a delete goes: the parent, or the root when the page has no Trail. */
  parentHref: string
  words: StepMenuWords
}) {
  const api = useEditor()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const form = useRef<HTMLDivElement>(null)
  // A reopened Sheet starts at its menu, not at a confirmation left behind.
  useResetOnClose(form, () => {
    setConfirming(false)
    setError(null)
  })

  const refused = (answer: Answer): boolean => {
    if (answer.status >= 200 && answer.status < 300) return false
    setError(refusalText(answer))
    return true
  }

  const removeEnd = (button: HTMLElement): void => {
    if (busy || api.readOnly) return
    setBusy(true)
    setError(null)
    api.operate(nodeId, { op: 'remove-terminal' }, undefined, (answer) => {
      setBusy(false)
      if (refused(answer)) return
      const details = button.closest('details')
      if (details) details.open = false
    })
  }

  const deleteStep = (): void => {
    if (busy || api.readOnly) return
    setBusy(true)
    setError(null)
    api.operate(nodeId, { delete: true }, undefined, (answer) => {
      if (refused(answer)) {
        setBusy(false)
        return
      }
      window.location.assign(parentHref)
    })
  }

  return (
    <div ref={form} className="structure-form structure-form--step" data-mode={confirming ? 'confirm' : 'menu'}>
      <h2>{heading}</h2>
      <p className="structure-id">{nodeId}</p>
      {confirming ? (
        <>
          <p className="structure-confirm">{words.confirmDelete}</p>
          <div className="structure-actions">
            <button type="button" className="admin-submit admin-submit--danger" disabled={api.readOnly || busy} onClick={deleteStep}>
              {words.confirm}
            </button>
            <button type="button" className="admin-link" disabled={busy} onClick={() => setConfirming(false)}>
              {words.cancel}
            </button>
          </div>
        </>
      ) : (
        <>
          {terminal && (
            <button type="button" className="admin-submit" disabled={api.readOnly || busy} onClick={(event) => removeEnd(event.currentTarget)}>
              {words.removeEnd}
            </button>
          )}
          {!root && (
            <button type="button" className="admin-submit admin-submit--danger" disabled={api.readOnly || busy} onClick={() => setConfirming(true)}>
              {words.deleteStep}
            </button>
          )}
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
