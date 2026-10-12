'use client'

/**
 * **[#174]** An information hint (docs/specs/application.md 31.2, 31.3; issue #174): a small
 * "i" in a circle after a field's label that says why the field is asked. Hovering it,
 * focusing it with the keyboard or tapping it shows the explanation in a small panel; leaving
 * it, blurring it or Escape closes it. The explanation is the control's accessible
 * description, so a screen reader says it on arrival, open or not.
 *
 * It is the explainer's panel (10.8) on another trigger: `usePanelTriggers` opens, places and
 * closes it, one panel open in the whole document, and Escape closes it before the Sheet
 * around it hears the key. The panel is placed in its containing block -- the Sheet's panel
 * -- below the "i" where it fits and above it otherwise, and never leaves it.
 *
 * Imports of `src/`: `components/Explainer.tsx` (34.4).
 */
import { useRef } from 'react'
import { usePanelTriggers } from '../components/Explainer.tsx'

export function Hint({
  id,
  text,
  name,
}: {
  /** The panel's id, unique on the page: the control's `aria-describedby`. */
  id: string
  /** Why the field is asked: plain sentences, a chrome string. */
  text: string
  /** The control's accessible name, the same on every hint (`hint`). */
  name: string
}) {
  const element = useRef<HTMLSpanElement>(null)
  const panels = usePanelTriggers('.hint-mark', element)
  return (
    <span ref={element} className="hint" {...panels}>
      <button type="button" className="hint-mark" aria-label={name} aria-describedby={id}>
        i
      </button>
      <span className="hint-panel" role="tooltip" id={id}>
        {text}
      </span>
    </span>
  )
}
