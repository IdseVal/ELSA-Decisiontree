'use client'

/**
 * The explainer panels of one rich text (docs/specs/application.md 10.8,
 * ADR-78-explainers decision 6). `src/markdown.ts` has already written each marked term as a
 * focusable `.term` with its `.explainer` panel as the next sibling, and without JavaScript
 * the stylesheet opens that panel on hover and on focus at the foot of the text area
 * (section 14). The script adds only what CSS cannot: closing on Escape, opening and closing
 * on tap, one panel open at a time in the whole document, and placing the panel against the
 * term's line -- below it where it fits inside the text area, above it otherwise, shifted
 * sideways to stay inside.
 *
 * It takes the rendered text as a string, as the other client components take strings, and
 * listens on its own element for events from the terms inside it.
 *
 * **[#138]** In edit mode (34.2, `onTermClick`) a click on a term dispatches the named DOM
 * event, bubbling, with the explainer's id in `detail`, instead of toggling the panel:
 * the explainer Sheet of #141 listens for it. Hover and focus still open the panel.
 */
import { useEffect, useRef, useState, type FocusEvent, type MouseEvent, type PointerEvent } from 'react'

/** The panel open in the document, of whichever text: opening another closes it. */
let openPanel: HTMLElement | null = null

/** The panel that belongs to `term`, its next sibling. */
function panelOf(term: Element): HTMLElement | null {
  const next = term.nextElementSibling
  return next instanceof HTMLElement && next.matches('.explainer') ? next : null
}

/**
 * Closes the open panel, if there is one. The document listens for Escape and resize only
 * while a panel is open, so a Bubble mounted or unmounted by a slide cannot take the
 * listeners of another away.
 */
function close(): void {
  openPanel?.removeAttribute('data-open')
  // A panel open() cannot measure keeps no place from an earlier opening.
  openPanel?.style.removeProperty('top')
  openPanel?.style.removeProperty('left')
  openPanel = null
  document.removeEventListener('keydown', onEscape, true)
  window.removeEventListener('resize', close)
}

/**
 * Opens the panel of `term` and places it. The text area is the panel's containing block; a
 * term wrapped over two lines is left by its last line when the panel goes below and by its
 * first when it goes above, so the panel always touches the words that opened it and the
 * pointer can cross onto it. The document listens for Escape and resize until it closes.
 */
function open(term: Element): void {
  const panel = panelOf(term)
  if (!panel || panel === openPanel) return
  close()
  panel.setAttribute('data-open', '')
  openPanel = panel
  document.addEventListener('keydown', onEscape, true)
  // The panel's place is in pixels of the text area as it is now; a resized window would
  // leave it where the area no longer is, and outside the page (10.6).
  window.addEventListener('resize', close)

  const area = panel.offsetParent?.getBoundingClientRect()
  const lines = term.getClientRects()
  const first = lines[0]
  const last = lines[lines.length - 1]
  if (!area || !first || !last) return
  const { width, height } = panel.getBoundingClientRect()
  const below = last.bottom - area.top
  const above = first.top - area.top - height
  const roomBelow = area.height - below
  const roomAbove = first.top - area.top
  // At the guaranteed viewport one of the two always fits -- the panel is at most 148 pixels,
  // the text area 364 (10.8). In a shorter area neither may: the panel then takes the side
  // with more room and is kept inside the area, where it lies over the least of the text.
  let top: number
  if (height <= roomBelow) top = below
  else if (height <= roomAbove) top = above
  else top = roomAbove > roomBelow ? above : below
  const left = Math.min(Math.max(first.left - area.left, 0), area.width - width)
  panel.style.top = `${Math.max(0, Math.min(top, area.height - height))}px`
  panel.style.left = `${Math.max(0, left)}px`
}

/** Escape closes the open panel before anything else hears it: a second Escape closes a Sheet. */
function onEscape(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || openPanel === null) return
  close()
  event.stopPropagation()
}

export function Explainer({ html, termEvent }: { html: string; /** The event a click on a term dispatches instead of the tap toggle (34.2). */ termEvent?: string }) {
  // Until the script runs the stylesheet opens the panels (section 14); once it does, the
  // attribute hands them to the handlers below and the CSS-only rules stand down.
  const [enhanced, setEnhanced] = useState(false)
  // Whether the term under a finger was already open when it went down, so the tap that
  // follows -- which focuses the term, and so opens it -- knows to close it instead.
  const tappedOpen = useRef(false)
  const element = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setEnhanced(true)
    const text = element.current
    // A neighbour frame unmounted at the end of a slide must leave the centre's panel open.
    return () => {
      if (openPanel && text?.contains(openPanel)) close()
    }
  }, [])

  const termAt = (target: EventTarget): Element | null => (target instanceof Element ? target.closest('.term') : null)

  const onPointerOver = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.pointerType === 'touch') return
    const term = termAt(event.target)
    if (term) open(term)
  }

  // Leaving the term, or its panel, for anything that is neither closes it.
  const onPointerOut = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.pointerType === 'touch' || openPanel === null) return
    const to = event.relatedTarget
    const term = openPanel.previousElementSibling
    if (to instanceof Node && (openPanel.contains(to) || term?.contains(to))) return
    close()
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    const term = termAt(event.target)
    tappedOpen.current = event.pointerType === 'touch' && term !== null && panelOf(term) === openPanel
  }

  const onClick = (event: MouseEvent<HTMLDivElement>): void => {
    const term = termAt(event.target)
    if (!term) return
    if (termEvent !== undefined) {
      // The panel's id is `<prefix>e-<explainer id>[--n]`: the id is what follows `e-`.
      const id = (panelOf(term)?.id ?? '').replace(/^.*?e-/, '').replace(/--\d+$/, '')
      term.dispatchEvent(new CustomEvent(termEvent, { bubbles: true, detail: { id } }))
      tappedOpen.current = false
      return
    }
    if (tappedOpen.current) close()
    else open(term)
    tappedOpen.current = false
  }

  const onFocus = (event: FocusEvent<HTMLDivElement>): void => {
    const term = termAt(event.target)
    if (term) open(term)
  }

  const onBlur = (event: FocusEvent<HTMLDivElement>): void => {
    const term = termAt(event.target)
    if (term && openPanel === panelOf(term)) close()
  }

  return (
    <div
      ref={element}
      className="prose"
      data-enhanced={enhanced ? '' : undefined}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onPointerDown={onPointerDown}
      onClick={onClick}
      onFocus={onFocus}
      onBlur={onBlur}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
