'use client'

/**
 * The four controls under a picture in the enlarged view (docs/specs/application.md 31.3,
 * 31.4; ADR-133-images-in-the-editor decisions 3 and 4): `makeMain` (absent on the main
 * image), `moveEarlier` and `moveLater` (absent at the ends), and `removeImage`, each one
 * operation of 22.2 sent at once. The slot and the strip repaint from the response; the
 * enlarged view follows the picture to its new page, told by `TURN_EVENT` from here. A removed
 * Image's file is deleted once its entry is gone, best effort: a 409 while the published copy
 * still names it is expected, and the store sweeps after the next publish (22.6). No
 * confirmation: the picture is one upload away.
 *
 * Imports of `src/`: types (34.4).
 */
import { useRef } from 'react'
import { useEditor } from './Editor.tsx'
import { deleteImage } from './writes.ts'

/**
 * The DOM event that turns the enlarged view to `detail` -- the page the picture is on after
 * a move -- dispatched from inside it, so it reaches the one enlarged view it came from.
 */
export const TURN_EVENT = 'elsa-enlarged-turn'

/** The chrome words the controls say; strings, because a client component takes no module. */
export interface ImageControlWords {
  makeMain: string
  moveEarlier: string
  moveLater: string
  removeImage: string
}

export function ImageControls({
  nodeId,
  index,
  count,
  file,
  words,
}: {
  nodeId: string
  /** The picture's place in the Node's `images`: 0 is the main image (tree-format.md 5.2). */
  index: number
  /** How many Images the Node has. */
  count: number
  file: string
  words: ImageControlWords
}) {
  const api = useEditor()
  const root = useRef<HTMLDivElement>(null)

  const turn = (page: number): void => {
    root.current?.dispatchEvent(new CustomEvent(TURN_EVENT, { detail: page, bubbles: true }))
  }

  const move = (to: number): void => {
    api.operate(nodeId, { op: 'move-image', from: index, to }, undefined, () => turn(to))
  }

  const remove = (): void => {
    api.operate(nodeId, { op: 'remove-image', index }, undefined, () => {
      void deleteImage(api.treeId, file)
      // The last picture gone, the enlarged view goes with the Carousel's band.
      if (count > 1) turn(Math.min(index, count - 2))
    })
  }

  return (
    <div ref={root} className="editor-image-controls">
      {index > 0 && (
        <button type="button" className="editor-operation" disabled={api.readOnly} onClick={() => move(0)}>
          {words.makeMain}
        </button>
      )}
      {index > 0 && (
        <button type="button" className="editor-operation" disabled={api.readOnly} onClick={() => move(index - 1)}>
          {words.moveEarlier}
        </button>
      )}
      {index < count - 1 && (
        <button type="button" className="editor-operation" disabled={api.readOnly} onClick={() => move(index + 1)}>
          {words.moveLater}
        </button>
      )}
      <button type="button" className="editor-operation" disabled={api.readOnly} onClick={remove}>
        {words.removeImage}
      </button>
    </div>
  )
}
