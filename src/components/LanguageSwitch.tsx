/**
 * The language switch: the languages the loaded Tree declares and nothing else
 * (docs/CORE_DOCUMENT.md 3.2). Each is a link to the page the reader is on, said in that
 * language (`withLang`, docs/specs/application.md 4.1), so choosing one never costs them
 * their place in the walk and the choice travels in the link they share.
 *
 * It is links, not a form or a menu: the switch works with JavaScript switched off, which
 * is what application.md section 1 promises for everything but the thumbnails and sharing.
 */
import { chrome, CHROME_LANGUAGES, chromeLang, type ChromeLanguage } from '../chrome.ts'
import { withLang, type PageAddress } from '../url.ts'

/**
 * The name of a language in that language itself -- `nl` reads "Nederlands", not "Dutch" --
 * so a reader recognises their own without first knowing the one on screen. The names are
 * the platform's own CLDR data; a tag the platform does not know is shown as the tag, which
 * is still something a reader of a third-party Tree can act on (core document section 9).
 */
export function endonym(tag: string): string {
  try {
    return new Intl.DisplayNames([tag], { type: 'language' }).of(tag) ?? tag
  } catch {
    return tag
  }
}

export function LanguageSwitch({
  address,
  /** Exactly the Tree's declared languages, in the order the manifest declares them. */
  languages,
}: {
  address: PageAddress
  languages: string[]
}) {
  return <Switch current={address.lang} languages={languages} href={(language) => withLang(address, language)} />
}

/**
 * **[#134]** The switch of a page whose words are all chrome -- the overview, the 404 page
 * (24.3): the chrome's own languages, each a link `href` builds for that page.
 */
export function ChromeLanguageSwitch({ lang, href }: { lang: ChromeLanguage; href: (lang: ChromeLanguage) => string }) {
  return <Switch current={lang} languages={CHROME_LANGUAGES} href={(language) => href(language as ChromeLanguage)} />
}

function Switch({
  current,
  languages,
  href,
}: {
  /** The language on screen. */
  current: string
  languages: readonly string[]
  href: (language: string) => string
}) {
  const ui = chrome(current)

  return (
    <nav className="language-switch" aria-labelledby="language-label">
      {/* The name of the region is chrome and may be in another language than the language
          names under it, each of which is in its own. Only a referenced element can say so. */}
      <span hidden id="language-label" lang={chromeLang(current)}>
        {ui.language}
      </span>
      <ul>
        {languages.map((language) => (
          <li key={language}>
            {language === current ? (
              // Where the reader already is: named, so they can see which language this is,
              // but not a link to the page they are looking at.
              <span className="language language--current" lang={language} aria-current="true">
                {endonym(language)}
              </span>
            ) : (
              <a className="language" href={href(language)} lang={language}>
                {endonym(language)}
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
