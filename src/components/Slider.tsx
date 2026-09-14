'use client'

/**
 * The slide (docs/specs/application.md 11.1, 11.3; ADR-38-transitions): following a Branch
 * moves the tree layer -- one element, one transform -- until the target's Bubble is in the
 * centre, while the client navigation to the Branch's own `href` fetches the target's page.
 * The address bar ends where a plain link would have left it, because it is the router
 * pushing that same link.
 *
 * The server renders each neighbour (`src/neighbourhood.ts`) into this page's payload as a
 * frame, and hands them over as props with the position `TreeView` drew them in, one layer
 * away in the Branch's direction. A frame is mounted only for the slide that shows it,
 * hidden from assistive technology and out of the tab order: at rest the layer holds the
 * page as it is without JavaScript, and nothing else (section 14).
 *
 * A slide has two halves, on two pages. The page the reader leaves moves its layer towards
 * the target; when the target's payload arrives, the target's page takes over the same
 * motion at the same moment, with the page it replaced drawn where it was -- so nothing on
 * screen jumps whenever the payload lands. A history step (back, forward) has only the
 * second half: a page that finds the page shown before it among its neighbours slides in
 * from there, which is what makes back reverse the slide.
 *
 * While a slide runs the layer is `position: fixed` and exactly as large as the two frames
 * it shows. Fixed, it is part of no element's scrollable area; that large, nothing in it is
 * larger than itself -- so the no-scroll rule holds mid-slide too (10.6). A slide never
 * begins with a Sheet open: following a Branch closes any Sheet in the layer first.
 */
import { useRouter } from 'next/navigation'
import { useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'

/** One neighbour frame, and where it is drawn, in widths and heights of the layer. */
export interface Neighbour {
  href: string
  x: number
  y: number
  frame: ReactNode
}

/** Long enough to be read as a movement through the tree, short enough not to be waited for. */
const DURATION = 520
/** The stylesheet's `--ease`: quick to leave, gentle to arrive. */
const EASING = 'cubic-bezier(0.2, 0.7, 0.2, 1)'

/**
 * The slide a click started, for the target's page to take over. Module state, because the
 * page that started it is unmounted by the time the page that finishes it mounts.
 */
let started: { from: string; to: string; x: number; y: number; at: number } | null = null
/** The page shown last in this document, so a history step can slide back from it. */
let shownLast: string | null = null

/** A slide in progress: the one frame it shows besides the centre, and where. */
interface Slide {
  frame: ReactNode
  x: number
  y: number
  /** The layer's box at rest, which the fixed layer reproduces. */
  rect: DOMRect
  /** True on the page that arrives: it moves from the frame to its own centre. */
  arriving: boolean
  /** Milliseconds of the slide already run, by the page that started it. */
  elapsed: number
}

export function Slider({ href, neighbours, children }: { href: string; neighbours: Neighbour[]; children: ReactNode }) {
  const router = useRouter()
  const layer = useRef<HTMLDivElement>(null)
  const [slide, setSlide] = useState<Slide | null>(null)

  // Arrival: take over a slide a click started towards this page, or slide in from the
  // page shown before when a history step came from a neighbour.
  useLayoutEffect(() => {
    const previous = shownLast
    const handed = started?.to === href ? started : null
    shownLast = href
    started = null
    if (!layer.current || reducedMotion()) return

    const rect = layer.current.getBoundingClientRect()
    if (handed) {
      const elapsed = performance.now() - handed.at
      if (elapsed >= DURATION) return
      // The page left behind lies opposite the way the slide went.
      const from = neighbours.find((n) => n.href === handed.from)
      setSlide({ frame: from?.frame, x: -handed.x, y: -handed.y, rect, arriving: true, elapsed })
      return
    }
    const from = neighbours.find((n) => n.href === previous)
    if (from) setSlide({ frame: from.frame, x: from.x, y: from.y, rect, arriving: true, elapsed: 0 })
    // Once per page: `TreeView` keys this component by its page, so a new page is a new mount.
  }, [])

  useLayoutEffect(() => {
    if (!slide || !layer.current) return
    const away = `translate(${-slide.x * slide.rect.width}px, ${-slide.y * slide.rect.height}px)`
    const animation = layer.current.animate(
      slide.arriving ? [{ transform: away }, { transform: 'none' }] : [{ transform: 'none' }, { transform: away }],
      // The page that leaves holds its last frame until the target's page replaces it.
      { duration: DURATION, easing: EASING, fill: slide.arriving ? 'none' : 'forwards' },
    )
    animation.currentTime = slide.elapsed
    if (slide.arriving) animation.finished.then(() => setSlide(null), () => {})
    return () => animation.cancel()
  }, [slide])

  /** A click on a Branch whose target is drawn in this layer: slide to it and navigate. */
  function follow(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return
    }
    const link = (event.target as Element).closest('a[data-slide]')
    const target = link && neighbours.find((n) => n.href === link.getAttribute('href'))
    // Any other link -- a Trail entry older than the grandparent, `startAgain`, a Sheet's
    // list -- is the ordinary link it looks like (11.3).
    if (!target || !layer.current) return
    event.preventDefault()
    // A Sheet's panel is `position: fixed`, and a transformed layer is the box a fixed
    // descendant is laid out in: left open, the panel would travel with the tree. The keyboard
    // reaches a Branch behind the backdrop, so a slide can start with one open; the page it
    // reaches opens with every Sheet closed anyway.
    for (const sheet of layer.current.querySelectorAll<HTMLDetailsElement>('details.sheet[open]')) sheet.open = false

    // A click during a slide navigates at once; the page it reaches slides in from this one.
    if (!slide && !reducedMotion()) {
      started = { from: href, to: target.href, x: target.x, y: target.y, at: performance.now() }
      const rect = layer.current.getBoundingClientRect()
      setSlide({ frame: target.frame, x: target.x, y: target.y, rect, arriving: false, elapsed: 0 })
    }
    router.push(target.href, { scroll: false })
  }

  const boxes = slide && box(slide)
  return (
    <div className="tree-layer" ref={layer} onClick={follow} data-sliding={slide ? '' : undefined} style={boxes?.layer}>
      <div className="tree-frame" style={boxes?.centre}>
        {children}
      </div>
      {slide?.frame && (
        <div className="tree-frame" aria-hidden inert style={boxes?.neighbour}>
          {slide.frame}
        </div>
      )}
    </div>
  )
}

/**
 * The fixed layer and its two frames while a slide runs, in pixels: the layer covers the
 * centre frame, at the layer's box at rest, and the neighbour frame beside it.
 */
function box({ x, y, rect }: Slide): { layer: CSSProperties; centre: CSSProperties; neighbour: CSSProperties } {
  const { width, height } = rect
  const left = Math.min(0, x)
  const top = Math.min(0, y)
  return {
    layer: {
      left: rect.left + left * width,
      top: rect.top + top * height,
      width: (1 + Math.abs(x)) * width,
      height: (1 + Math.abs(y)) * height,
    },
    centre: { left: -left * width, top: -top * height, width, height },
    neighbour: { left: (x - left) * width, top: (y - top) * height, width, height },
  }
}

/** The reader's setting removes the motion, never the navigation (11.3). */
function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
