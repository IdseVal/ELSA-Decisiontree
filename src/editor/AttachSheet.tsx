'use client'

/**
 * The attach Sheet (docs/specs/application.md 31.2; ADR-133-images-in-the-editor decision
 * 2): what opens once the upload route has stored a picture. It shows the picture through the
 * admin image route and the file name the server gave, asks for the credit -- **required**:
 * `attach` is disabled while it is empty, because the moment a creator has the source in
 * front of them is when they upload it (core document 10.12, 10.26) -- and for a description
 * in the page's language, which may wait. `attach` sends `add-image` through the queue and the
 * page repaints from its response; `cancel`, Escape and the backdrop delete the file again,
 * so the folder holds no picture nobody named (a 409 -- the same bytes named elsewhere -- is
 * somebody's file, and ignored).
 *
 * Laid over the page from the document's body, so a Sheet it was opened from -- an Overlay --
 * neither clips it nor closes under it.
 *
 * Imports of `src/`: `tree/measure.ts`, and types (34.4).
 */
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { countedLength } from '../tree/measure.ts'
import { useEditor } from './Editor.tsx'
import { plainLine } from './fields.ts'
import { Hint } from './Hint.tsx'
import { deleteImage, type Uploaded } from './writes.ts'

/** The credit and the description are 120 characters each (tree-format.md 5.7). */
const LIMIT = 120

/** The chrome words the Sheet says; strings, because a client component takes no module. */
export interface AttachWords {
  credit: string
  imageDescription: string
  attach: string
  cancel: string
  /** **[#174]** The hint behind each field's label: its name, and why each is asked. */
  hint: string
  creditHint: string
  imageDescriptionHint: string
}

export function AttachSheet({
  nodeId,
  uploaded,
  src,
  words,
  onClose,
}: {
  nodeId: string
  /** The upload route's answer: the server's file name and the picture's size (22.6). */
  uploaded: Uploaded
  /** The picture through the admin image route (31.5). */
  src: string
  words: AttachWords
  /** The Sheet is done, attached or cancelled; the picker takes the focus back. */
  onClose: () => void
}) {
  const api = useEditor()
  const credit = useRef<HTMLInputElement>(null)
  const [creditText, setCreditText] = useState('')
  const [description, setDescription] = useState('')
  const creditOver = countedLength(creditText) > LIMIT
  const descriptionOver = countedLength(description) > LIMIT
  const attachable = creditText.trim() !== '' && !creditOver && !descriptionOver && !api.readOnly

  useEffect(() => credit.current?.focus(), [])

  const cancel = (): void => {
    void deleteImage(api.treeId, uploaded.file)
    onClose()
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (!attachable) return
    const text = description.trim()
    api.operate(nodeId, { op: 'add-image', file: uploaded.file, credit: creditText.trim(), description: text === '' ? {} : { [api.lang]: text } })
    onClose()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'Escape') return
    // Consumed here: React's tree runs through the Overlay this Sheet may have been opened from.
    event.stopPropagation()
    event.preventDefault()
    cancel()
  }

  return createPortal(
    <div className="editor-attach" onKeyDown={onKeyDown}>
      <div className="sheet-backdrop" onClick={cancel} />
      <div className="sheet-panel editor-attach-panel" role="dialog" aria-modal="true" aria-labelledby="attach-file">
        <figure className="editor-attach-figure">
          <img src={src} alt="" width={uploaded.width} height={uploaded.height} />
          <figcaption id="attach-file">{uploaded.file}</figcaption>
        </figure>
        <form className="source-editor editor-attach-form" noValidate onSubmit={onSubmit}>
          {/* A row, not a label: the hint is a control of its own, and a label's text would name the field with it (#174). */}
          <div className="editor-row">
            <span>
              <label htmlFor="attach-credit">{words.credit}</label>
              <Hint id="attach-credit-hint" text={words.creditHint} name={words.hint} />
            </span>
            <input
              ref={credit}
              id="attach-credit"
              className="editor-url"
              value={creditText}
              required
              aria-invalid={creditOver ? true : undefined}
              onChange={(event) => setCreditText(plainLine(event.target.value))}
            />
          </div>
          <div className="editor-row">
            <span>
              <label htmlFor="attach-description">{words.imageDescription}</label>
              <Hint id="attach-description-hint" text={words.imageDescriptionHint} name={words.hint} />
            </span>
            <input
              id="attach-description"
              className="editor-url"
              lang={api.lang}
              value={description}
              aria-invalid={descriptionOver ? true : undefined}
              onChange={(event) => setDescription(plainLine(event.target.value))}
            />
          </div>
          <div className="sheet-controls">
            <button type="submit" className="admin-submit" disabled={!attachable}>
              {words.attach}
            </button>
            <button type="button" onClick={cancel}>
              {words.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
