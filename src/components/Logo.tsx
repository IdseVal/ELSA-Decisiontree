/**
 * The Tree's logo in the chrome bar (docs/specs/application.md 13.2). A Tree that names no
 * logo shows its own title as text in the same place, so the bar is never empty and the
 * frontend still carries no lab's mark of its own (core document section 9).
 *
 * The file is shown through `<img>`, never inlined: an SVG is a document, and one that
 * arrived with a third-party Tree must not be able to run script on this origin. The
 * theme route's headers (5.5) make it inert even when it is opened directly.
 */
import { themeLogo } from '../theme.ts'
import type { LocalisedText, Theme } from '../tree/types.ts'
import { themeHref } from '../url.ts'
import { chrome, chromeLang, text } from '../chrome.ts'

export function Logo({
  theme,
  /** The Tree's title: what stands in for a logo the Theme does not give. */
  title,
  lang,
}: {
  theme: Theme | undefined
  title: LocalisedText
  lang: string
}) {
  const logo = themeLogo(theme)
  if (!logo) return <span className="tree-title">{text(title, lang, 'tree.title')}</span>

  const image = (
    <img
      className="logo"
      src={themeHref(logo.file)}
      // The lab's name, from the Theme (tree-format.md 4.3.1) and in the language on screen.
      alt={text(logo.alt, lang, 'theme.logo.alt')}
    />
  )
  if (!logo.url) return image

  // Linked to and opened in a new tab; never fetched by the application (13.2, 13.5).
  return (
    <a
      className="logo-link"
      href={logo.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-describedby="logo-new-tab"
    >
      {image}
      {/* Hidden, not clipped off screen: a description is read from a hidden element all the
          same, and a clipped element has content wider than itself (application.md 10.6). */}
      <span hidden id="logo-new-tab" lang={chromeLang(lang)}>
        {chrome(lang).opensInNewTab}
      </span>
    </a>
  )
}
