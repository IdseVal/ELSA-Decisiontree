/**
 * The interface text the frontend owns -- labels, headings, the disclaimer -- as opposed
 * to Tree content (docs/specs/application.md section 3, ADR-5-chrome-languages).
 *
 * Chrome ships in English and Dutch as typed strings: `Record<ChromeLanguage, Chrome>`
 * makes a key missing from either language a compile error, which is what the contract
 * asks for and what a message-file library would not give.
 */

/** The languages the chrome is written in. Adding one is a code change, not an ADR. */
export const CHROME_LANGUAGES = ['en', 'nl'] as const

export type ChromeLanguage = (typeof CHROME_LANGUAGES)[number]

/** Every string the interface says. Tree content never comes from here. */
export interface Chrome {
  yes: string
  no: string
  options: string
  sources: string
  sourceLegal: string
  sourceCaseLaw: string
  sourceLiterature: string
  images: string
  enlarge: string
  close: string
  credit: string
  trail: string
  start: string
  back: string
  share: string
  copied: string
  language: string
  version: string
  outcomeNotApplicable: string
  outcomeApplicable: string
  outcomeProhibited: string
  outcomeRefer: string
  explanationOnly: string
  disclaimer: string
  notFoundTitle: string
  notFoundText: string
  /** Read out after a link that leaves the app, so the new tab is not a surprise. */
  opensInNewTab: string
}

const CHROME: Record<ChromeLanguage, Chrome> = {
  en: {
    yes: 'Yes',
    no: 'No',
    options: 'What this covers',
    sources: 'Sources',
    sourceLegal: 'Legal',
    sourceCaseLaw: 'Case law',
    sourceLiterature: 'Literature',
    images: 'Images',
    enlarge: 'Enlarge',
    close: 'Close',
    credit: 'Credit',
    trail: 'Your path',
    start: 'Start',
    back: 'Back',
    share: 'Copy link',
    copied: 'Link copied',
    language: 'Language',
    version: 'Version',
    outcomeNotApplicable: 'Does not apply',
    outcomeApplicable: 'Applies',
    outcomeProhibited: 'Prohibited',
    outcomeRefer: 'Look elsewhere',
    explanationOnly: 'This step only explains. Go back to answer the question.',
    disclaimer:
      'This is not legal advice. Read the sources and consult a lawyer before you rely on an outcome.',
    notFoundTitle: 'This step does not exist',
    notFoundText: 'The address does not name a step of this tree.',
    opensInNewTab: 'opens in a new tab',
  },
  nl: {
    yes: 'Ja',
    no: 'Nee',
    options: 'Wat hieronder valt',
    sources: 'Bronnen',
    sourceLegal: 'Wetgeving',
    sourceCaseLaw: 'Rechtspraak',
    sourceLiterature: 'Literatuur',
    images: 'Afbeeldingen',
    enlarge: 'Vergroten',
    close: 'Sluiten',
    credit: 'Bronvermelding',
    trail: 'Uw pad',
    start: 'Begin',
    back: 'Terug',
    share: 'Kopieer link',
    copied: 'Link gekopieerd',
    language: 'Taal',
    version: 'Versie',
    outcomeNotApplicable: 'Niet van toepassing',
    outcomeApplicable: 'Van toepassing',
    outcomeProhibited: 'Verboden',
    outcomeRefer: 'Elders geregeld',
    explanationOnly: 'Deze stap geeft alleen uitleg. Ga terug om de vraag te beantwoorden.',
    disclaimer:
      'Dit is geen juridisch advies. Lees de bronnen en raadpleeg een jurist voordat u op een uitkomst vertrouwt.',
    notFoundTitle: 'Deze stap bestaat niet',
    notFoundText: 'Het adres verwijst niet naar een stap van deze boom.',
    opensInNewTab: 'opent in een nieuw tabblad',
  },
}

/**
 * The chrome language for content in `contentLanguage`: its primary subtag when that is a
 * chrome language (`nl-be` gives `nl`), English otherwise. The content language itself is
 * never changed by this rule.
 */
export function chromeLanguage(contentLanguage: string): ChromeLanguage {
  const primary = contentLanguage.split('-')[0] ?? ''
  return (CHROME_LANGUAGES as readonly string[]).includes(primary) ? (primary as ChromeLanguage) : 'en'
}

/** The chrome strings to show beside content in `contentLanguage`. */
export function chrome(contentLanguage: string): Chrome {
  return CHROME[chromeLanguage(contentLanguage)]
}
