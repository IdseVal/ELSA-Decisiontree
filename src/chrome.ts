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
  share: string
  copied: string
  /** Shown instead of a confirmation when the browser refused the clipboard. */
  copyFailed: string
  language: string
  version: string
  /** Stands in for a text the Tree does not have in the language on screen (issue #9). */
  missingText: string
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
  /** The Branch below an explanation Node or a Terminal, back to the Trail entry above (10.3). */
  back: string
  /** The second Branch below a Terminal: the root Node with an empty Trail (10.3). */
  startAgain: string
  /**
   * The collapsed middle of a long Trail (10.2). A function of the count, not a string with
   * a placeholder, so a language that orders the sentence differently is not forced into
   * English word order (application.md 3.2).
   */
  trailMore: (hidden: number) => string
  /** The two buttons of a paged Sheet, and of the Carousel (section 12). */
  previous: string
  next: string
  /** The Carousel's position: which Image of how many is selected (section 12). */
  imageCount: (index: number, total: number) => string
  /** The notice shown below the smallest viewport the tree view works at (10.4, 10.5). */
  minimumSize: string
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
    share: 'Copy link',
    copied: 'Link copied',
    copyFailed: 'Copy this link yourself:',
    language: 'Language',
    version: 'Version',
    missingText: 'Text missing in this language',
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
    back: 'Back',
    startAgain: 'Start again',
    trailMore: (hidden) => (hidden === 1 ? '1 earlier step' : `${hidden} earlier steps`),
    previous: 'Previous',
    next: 'Next',
    imageCount: (index, total) => `Image ${index} of ${total}`,
    minimumSize: 'This tool needs a window of at least 320 by 480 pixels.',
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
    share: 'Kopieer link',
    copied: 'Link gekopieerd',
    copyFailed: 'Kopieer deze link zelf:',
    language: 'Taal',
    version: 'Versie',
    missingText: 'Tekst ontbreekt in deze taal',
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
    back: 'Terug',
    startAgain: 'Opnieuw beginnen',
    trailMore: (hidden) => (hidden === 1 ? '1 eerdere stap' : `${hidden} eerdere stappen`),
    previous: 'Vorige',
    next: 'Volgende',
    imageCount: (index, total) => `Afbeelding ${index} van ${total}`,
    minimumSize: 'Dit hulpmiddel heeft een venster van minimaal 320 bij 480 pixels nodig.',
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
