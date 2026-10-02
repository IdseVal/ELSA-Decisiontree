'use client'

/**
 * The two pickers of docs/specs/application.md 31.1 (ADR-133-images-in-the-editor decisions
 * 1, 2 and 7): the **empty slot** above a Node's title, where it has no Image, and the `+`
 * thumbnail after the strip, while it has fewer than ten. Each is a file input -- PNG, JPEG,
 * GIF or WebP -- and a drop target for one file. The file goes to the upload route and, once
 * stored, the attach Sheet asks for its credit; what the route refuses is said in the
 * indicator (31.6) and the picker stays where it was.
 *
 * Imports of `src/`: types (34.4).
 */
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { AttachSheet, type AttachWords } from './AttachSheet.tsx'
import { useEditor } from './Editor.tsx'
import { uploadImage, type Refusal, type Uploaded } from './writes.ts'

/** The four raster types the upload route takes (22.6); the route sniffs the bytes all the same. */
const ACCEPT = 'image/png, image/jpeg, image/gif, image/webp'

/** The chrome words a picker says; strings, because a client component takes no module. */
export interface PickerWords extends AttachWords {
  addPicture: string
  /** **[#174]** The strip's `+`: its name, and the label beside it on hover and on keyboard focus. */
  addExtraPicture: string
  fileTooLarge: string
  fileTypeRefused: string
}

/** What the indicator says for an upload the route did not store (31.6). */
export function pictureRefusal(status: number, body: Uploaded | Refusal | null, words: Pick<PickerWords, 'fileTooLarge' | 'fileTypeRefused'>): string {
  if (status === 413) return words.fileTooLarge
  if (status === 415) return words.fileTypeRefused
  const refusal = body && 'error' in body ? body : null
  return refusal?.violations?.[0]?.message ?? refusal?.error ?? String(status)
}

export function ImageSlot({
  nodeId,
  place,
  images,
  words,
}: {
  nodeId: string
  /** The empty slot above the title, or the `+` after the strip. */
  place: 'slot' | 'strip'
  /** The admin image route's folder for this Tree, to which a file name is appended (31.5). */
  images: string
  words: PickerWords
}) {
  const api = useEditor()
  const input = useRef<HTMLInputElement>(null)
  const [uploaded, setUploaded] = useState<Uploaded | null>(null)
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)

  const upload = async (file: File): Promise<void> => {
    if (api.readOnly || busy) return
    api.refusePicture(null)
    setBusy(true)
    const answer = await uploadImage(api.treeId, file)
    setBusy(false)
    if (answer.status === 201 && answer.body && 'file' in answer.body) setUploaded(answer.body)
    else api.refusePicture(pictureRefusal(answer.status, answer.body, words))
  }

  const onChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    // Emptied, so that the same file picked again after a refusal or a cancel is a change.
    event.target.value = ''
    if (file) void upload(file)
  }

  const carriesFile = (event: DragEvent): boolean => event.dataTransfer.types.includes('Files')

  const onDragOver = (event: DragEvent<HTMLLabelElement>): void => {
    if (!carriesFile(event)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setOver(true)
  }

  const onDrop = (event: DragEvent<HTMLLabelElement>): void => {
    if (!carriesFile(event)) return
    event.preventDefault()
    setOver(false)
    const file = event.dataTransfer.files[0]
    if (file) void upload(file)
  }

  const shape = place === 'slot' ? 'main-image main-image--empty editor-picker editor-picker--slot' : 'editor-picker editor-picker--strip'
  // The slot says "Add a picture"; the strip's `+` adds another and says so, beside it (#174).
  const name = place === 'slot' ? words.addPicture : words.addExtraPicture
  return (
    <>
      <label
        className={`${shape}${over ? ' editor-picker--over' : ''}`}
        title={place === 'slot' ? name : undefined}
        aria-busy={busy || undefined}
        onDragOver={onDragOver}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        <input ref={input} className="editor-picker-input" type="file" accept={ACCEPT} aria-label={name} disabled={api.readOnly} onChange={onChange} />
        <span aria-hidden="true">+</span>
      </label>
      {/* Seen, not read: the input's own name says the same words. The room around them is the band's third column, which decides the side of the `+` they stand on (31.1). */}
      {place === 'strip' && (
        <span className="editor-picker-room" aria-hidden="true">
          <span className="editor-picker-label">{name}</span>
        </span>
      )}
      {uploaded && (
        <AttachSheet
          nodeId={nodeId}
          uploaded={uploaded}
          src={`${images}${encodeURIComponent(uploaded.file)}`}
          words={words}
          onClose={() => {
            setUploaded(null)
            input.current?.focus()
          }}
        />
      )}
    </>
  )
}
