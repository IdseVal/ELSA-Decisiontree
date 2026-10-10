/**
 * **[#234]** The seam between the slide and the editor's autosave (docs/specs/application.md
 * 34.4, 42.8; ADR-231-slide-in-the-editor decision 6): a context, null by default, that the
 * editor's provider fills from its write queue and `Slider` reads. With none -- the public page,
 * the preview of a hidden Tree -- a slide goes as 11.3 has it; with one, `Slider` intercepts a
 * click only while `ready()`, and navigates when `settle()` resolves `true`.
 *
 * A context in the components, importing only React, so that `Slider` asks the queue without
 * importing the editor's modules (34.4): the public page ships none of them.
 */
import { createContext } from 'react'

/** What a slide asks of the page's autosave before it navigates (42.8). */
export interface SlideGate {
  /** False while the queue retries a failed write (29.5): the control is then followed as the plain link it is. */
  ready(): boolean
  /**
   * Writes every field value waiting out its 600 ms at once, and resolves `true` once the queue
   * holds nothing not yet accepted -- or `false` if a write fails or the session expires first,
   * and the slide is undone.
   */
  settle(): Promise<boolean>
}

export const SlideGate = createContext<SlideGate | null>(null)
