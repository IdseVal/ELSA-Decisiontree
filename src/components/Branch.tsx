/**
 * One Link drawn as a Branch (docs/specs/application.md 10.3): an ordinary `<a href>` that
 * shows its target's title -- from the title index, never from a second Node read -- with,
 * where the kind of Branch asks for it, a chrome word above the title (`yes`, `no`, `back`,
 * `startAgain`) or the Option's first Image beside it as a thumbnail.
 *
 * Every Branch is a plain link so that following one works without JavaScript (section 14);
 * the slide of section 11 (#42) is an enhancement layered on the same element.
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
}: {
  href: string
  /** The target's title, in the content language. */
  title: ReactNode
  /** The chrome word above the title, when the kind of Branch carries one. */
  word?: string
  /** Set when the chrome word speaks another language than the title under it. */
  wordLang?: string | undefined
  /** An Option's first Image, shown at 64 pixels beside the label (10.3). */
  image?: { src: string; alt: string }
  className: string
  rel?: string
}) {
  return (
    <a className={`branch ${className}`} href={href} rel={rel}>
      {image && (
        <img
          className="branch-image"
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
