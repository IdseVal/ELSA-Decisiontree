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
 * **[#141]** Enter on a focused term dispatches it too (32.3).
 *
 * **[#174]** The mechanism is `usePanelTriggers`, which the editor's information hint
 * (`src/editor/Hint.tsx`) sets on a trigger of its own: one kind of panel, not two.
 */
import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent, type PointerEvent, type RefObject } from 'react'

/** The panel open in the document, of whichever text: opening another closes it. */
let openPanel: HTMLElement | null = null

/** The panel that belongs to `term`, its next sibling: an explainer's, or **[#174]** a hint's. */
function panelOf(term: Element): HTMLElement | null {
  const next = term.nextElementSibling
  return next instanceof HTMLElement && next.matches('[role="tooltip"]') ? next : null
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

  const area = paddingBox(panel.offsetParent)
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

/**
 * The box a panel is placed in: its containing block's padding box, which absolute positions
 * count from. The text area has no border, so this is its whole box; **[#174]** a hint's
 * containing block is a Sheet's panel, and the panel stays inside that panel's border (10.6).
 */
function paddingBox(parent: Element | null): { top: number; left: number; width: number; height: number } | null {
  if (!parent) return null
  const box = parent.getBoundingClientRect()
  const border = getComputedStyle(parent)
  const top = parseFloat(border.borderTopWidth)
  const right = parseFloat(border.borderRightWidth)
  const bottom = parseFloat(border.borderBottomWidth)
  const left = parseFloat(border.borderLeftWidth)
  return { top: box.top + top, left: box.left + left, width: box.width - left - right, height: box.height - top - bottom }
}

/** Escape closes the open panel before anything else hears it: a second Escape closes a Sheet. */
function onEscape(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || openPanel === null) return
  close()
  event.stopPropagation()
}

/**
 * The handlers that open and close the panel of every trigger matching `selector` inside the
 * element they are set on (10.8): on hover, on keyboard focus and on tap; on leaving, on blur
 * and on Escape; one panel open in the whole document, and none left open by the element when
 * it goes. A trigger's panel is its next sibling. **[#174]** The explainer's terms use them,
 * and so does the editor's information hint.
 */
export function usePanelTriggers(selector: string, element: RefObject<HTMLElement | null>) {
  // Whether the trigger under a finger was already open when it went down, so the tap that
  // follows -- which focuses the trigger, and so opens it -- knows to close it instead.
  const tappedOpen = useRef(false)

  useEffect(() => {
    const own = element.current
    // A neighbour frame unmounted at the end of a slide must leave the centre's panel open.
    return () => {
      if (openPanel && own?.contains(openPanel)) close()
    }
  }, [element])

  const triggerAt = (target: EventTarget): Element | null => (target instanceof Element ? target.closest(selector) : null)

  return {
    onPointerOver(event: PointerEvent<HTMLElement>): void {
      if (event.pointerType === 'touch') return
      const trigger = triggerAt(event.target)
      if (trigger) open(trigger)
    },

    // Leaving the trigger, or its panel, for anything that is neither closes it.
    onPointerOut(event: PointerEvent<HTMLElement>): void {
      if (event.pointerType === 'touch' || openPanel === null) return
      const to = event.relatedTarget
      const trigger = openPanel.previousElementSibling
      if (to instanceof Node && (openPanel.contains(to) || trigger?.contains(to))) return
      close()
    },

    onPointerDown(event: PointerEvent<HTMLElement>): void {
      const trigger = triggerAt(event.target)
      tappedOpen.current = event.pointerType === 'touch' && trigger !== null && panelOf(trigger) === openPanel
    },

    onClick(event: MouseEvent<HTMLElement>): void {
      const trigger = triggerAt(event.target)
      if (!trigger) return
      if (tappedOpen.current) close()
      else open(trigger)
      tappedOpen.current = false
    },

    onFocus(event: FocusEvent<HTMLElement>): void {
      const trigger = triggerAt(event.target)
      if (trigger) open(trigger)
    },

    onBlur(event: FocusEvent<HTMLElement>): void {
      const trigger = triggerAt(event.target)
      if (trigger && openPanel === panelOf(trigger)) close()
    },
  }
}

export function Explainer({ html, termEvent }: { html: string; /** The event a click on a term dispatches instead of the tap toggle (34.2). */ termEvent?: string }) {
  // Until the script runs the stylesheet opens the panels (section 14); once it does, the
  // attribute hands them to the handlers below and the CSS-only rules stand down.
  const [enhanced, setEnhanced] = useState(false)
  const element = useRef<HTMLDivElement>(null)
  const panels = usePanelTriggers('.term', element)

  useEffect(() => setEnhanced(true), [])

  const termAt = (target: EventTarget): Element | null => (target instanceof Element ? target.closest('.term') : null)

  /** Edit mode: the term asks for its explainer Sheet. */
  const dispatch = (term: Element, name: string): void => {
    // The panel's id is `<prefix>e-<explainer id>[--n]`: the id is what follows `e-`.
    const id = (panelOf(term)?.id ?? '').replace(/^.*?e-/, '').replace(/--\d+$/, '')
    term.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: { id } }))
  }

  const onClick = (event: MouseEvent<HTMLDivElement>): void => {
    const term = termAt(event.target)
    if (term && termEvent !== undefined) dispatch(term, termEvent)
    else panels.onClick(event)
  }

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    const term = termAt(event.target)
    if (termEvent === undefined || !term || event.key !== 'Enter') return
    event.preventDefault()
    dispatch(term, termEvent)
  }

  return (
    <div
      ref={element}
      className="prose"
      data-enhanced={enhanced ? '' : undefined}
      onPointerOver={panels.onPointerOver}
      onPointerOut={panels.onPointerOut}
      onPointerDown={panels.onPointerDown}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onFocus={panels.onFocus}
      onBlur={panels.onBlur}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
