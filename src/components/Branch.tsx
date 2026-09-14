/**
 * One Link drawn as a Branch (docs/specs/application.md 10.3): an ordinary `<a href>` that
 * shows its target's title -- from the title index, never from a second Node read -- with,
 * where the kind of Branch asks for it, a chrome word above the title (`yes`, `no`, `back`,
 * `startAgain`) or the Option's first Image beside it as a thumbnail.
 *
 * Every Branch is a plain link so that following one works without JavaScript (section 14);
 * the slide of section 11 is an enhancement layered on the same element. A Branch whose
 * target has a placement is marked `data-slide`; `start`, `startAgain` and a Trail entry
 * older than the grandparent have none and are only links (11.1).
 */
import type { ReactNode } from 'react'

export function Branch({
  href,
  title,
  word,
  wordLang,
  image,
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
  /**
   * An Option's first Image, shown at 64 pixels beside the label (10.3). `withheld` in a
   * neighbour frame: the same 64 pixels, and no image URL (11.4).
   */
  image?: { src: string; alt: string } | 'withheld'
  className: string
  rel?: string
  /** Its target has a placement in the neighbourhood, so following it slides there (11.1). */
  slides?: boolean
}) {
  return (
    <a className={`branch ${className}`} href={href} rel={rel} data-slide={slides ? '' : undefined}>
      {image === 'withheld' && <span className="branch-image" />}
      {image && image !== 'withheld' && (
        // `option-image` is the name the first Tree's walk (tests/first-tree/walk.spec.ts,
        // PR #54) finds an Option's picture by; the Branch is the only one that carries one.
        <img
          className="branch-image option-image"
          src={image.src}
          alt={image.alt}
          width={64}
          height={64}
          loading="lazy"
        />
      )}
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
