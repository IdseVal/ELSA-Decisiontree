/**
 * One Link drawn as a Branch (docs/specs/application.md 10.3): an ordinary `<a href>` that
 * shows its target's title -- from the title index, never from a second Node read -- with,
 * where the kind of Branch asks for it, a chrome word and a colon before the title in one
 * run (`yes`, `no`, `startAgain`: "Yes: Annex III areas") or the Option's first Image beside
 * it as a thumbnail.
 *
 * Every Branch is a plain link so that following one works without JavaScript (section 14);
 * the slide of section 11 is an enhancement layered on the same element. A Branch whose
 * target has a placement is marked `data-slide`; `startAgain` and a Branch whose target
 * another direction placed at a different address have none and are only links (11.1, 11.3). The neighbourhood's dropped targets
 * never reach a Branch: the loader rejects a Link to a missing Node at start-up.
 */
import type { ReactNode } from 'react'

export function Branch({
  href,
  title,
  word,
  wordLang,
  image,
  className,
  slides = false,
}: {
  href: string
  /** The target's title, in the content language. */
  title: ReactNode
  /** The chrome word before the title, when the kind of Branch carries one. */
  word?: string
  /** Set when the chrome word speaks another language than the title under it. */
  wordLang?: string | undefined
  /**
   * An Option's first Image, shown at 64 pixels beside the label (10.3). `withheld` in a
   * neighbour frame: the same 64 pixels, and no image URL (11.4).
   */
  image?: { src: string; alt: string } | 'withheld'
  className: string
  /** Its target has a placement in the neighbourhood, so following it slides there (11.1). */
  slides?: boolean
}) {
  return (
    <a className={`branch ${className}`} href={href} data-slide={slides ? '' : undefined}>
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
        {/* One run, not a word stacked over a title: the label is read in one breath (10.3). */}
        {word !== undefined && (
          <>
            <span className="branch-word" lang={wordLang}>
              {word}
            </span>
            <span className="branch-colon">: </span>
          </>
        )}
        <span className="branch-title">{title}</span>
      </span>
    </a>
  )
}
