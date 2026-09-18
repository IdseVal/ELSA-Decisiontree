/**
 * One Link drawn as a Branch (docs/specs/application.md 10.3): an ordinary `<a href>` that
 * shows its target's title -- from the title index, never from a second Node read -- with,
 * where the kind of Branch asks for it, a chrome word above the title (`yes`, `no`,
 * `startAgain`). An Option is not a Branch since 10.9: it is the control of its Overlay
 * (`TreeView`), and nothing slides to it.
 *
 * Every Branch is a plain link so that following one works without JavaScript (section 14);
 * the slide of section 11 is an enhancement layered on the same element. A Branch whose
 * target has a placement is marked `data-slide`; `start`, `startAgain`, a Trail entry older
 * than the grandparent and a Branch whose target another direction placed at a different
 * address have none and are only links (11.1, 11.3). The neighbourhood's dropped targets
 * never reach a Branch: the loader rejects a Link to a missing Node at start-up.
 */
import type { ReactNode } from 'react'

export function Branch({
  href,
  title,
  word,
  wordLang,
  className,
  rel,
  slides = false,
}: {
  href: string
  /** The target's title, in the content language. */
  title: ReactNode
  /** The chrome word above the title, when the kind of Branch carries one. */
  word?: string
  /** Set when the chrome word speaks another language than the title under it. */
  wordLang?: string | undefined
  className: string
  rel?: string
  /** Its target has a placement in the neighbourhood, so following it slides there (11.1). */
  slides?: boolean
}) {
  return (
    <a className={`branch ${className}`} href={href} rel={rel} data-slide={slides ? '' : undefined}>
      <span className="branch-label">
        {word !== undefined && (
          <span className="branch-word" lang={wordLang}>
            {word}
          </span>
        )}
        <span className="branch-title">{title}</span>
      </span>
    </a>
  )
}
