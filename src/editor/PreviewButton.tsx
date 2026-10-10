'use client'

/**
 * **[#205]** The preview button (docs/specs/application.md 40.5, 40.6; ADR-205-preview-buttons,
 * ADR-205-way-there-and-back): a link at the top left under the editor's bar to the preview of
 * the editor's own address, drawn while the Tree is hidden -- gone when the panel publishes it,
 * back when it unpublishes, without a reload.
 *
 * A plain click first writes every value the queue holds and follows the link once the store
 * has accepted them all, so the preview shows them and the page's `beforeunload` question never
 * comes from the button; while it waits, the button is busy and a second click adds nothing. A
 * modified click opens a tab, as on any link.
 *
 * Imports of `src/`: nothing but its own folder (34.4).
 */
import { useState, type MouseEvent } from 'react'
import { useEditor } from './Editor.tsx'

export function PreviewButton({
  href,
  word,
  uiLang,
}: {
  /** The preview of the editor's address: its Trail, its Node, its `?lang` (40.6). */
  href: string
  /** `preview`: the words from 1000 pixels wide, and the name and `title` at every width. */
  word: string
  /** Set when the chrome speaks another language than the content. */
  uiLang: string | undefined
}) {
  const api = useEditor()
  const [waiting, setWaiting] = useState(false)
  if (api.tree.published) return null

  const onClick = (event: MouseEvent<HTMLAnchorElement>): void => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    if (waiting) return
    setWaiting(true)
    void api.settle().then(() => window.location.assign(href))
  }

  return (
    <a className="preview-button" href={href} aria-label={word} title={word} lang={uiLang} aria-busy={waiting || undefined} data-editor-ui="" onClick={onClick}>
      {/* An eye: an almond outline and a round pupil. */}
      <svg className="float-icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M1.2 8C2.9 5 5.2 3.5 8 3.5S13.1 5 14.8 8C13.1 11 10.8 12.5 8 12.5S2.9 11 1.2 8Z" />
        <circle cx="8" cy="8" r="2.2" />
      </svg>
      <span className="float-words">{word}</span>
    </a>
  )
}
