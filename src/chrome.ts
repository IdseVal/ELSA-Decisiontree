/**
 * The interface text the frontend owns -- labels, headings, the disclaimer -- as opposed
 * to Tree content (docs/specs/application.md section 3, ADR-5-chrome-languages).
 *
 * Chrome ships in English and Dutch as typed strings: `Record<ChromeLanguage, Chrome>`
 * makes a key missing from either language a compile error, which is what the contract
 * asks for and what a message-file library would not give.
 */

import type { LocalisedText } from './tree/types.ts'

/** The languages the chrome is written in. Adding one is a code change, not an ADR. */
export const CHROME_LANGUAGES = ['en', 'nl'] as const

export type ChromeLanguage = (typeof CHROME_LANGUAGES)[number]

/** The keys of `Chrome` that are plain strings: what a label record may point at. */
export type ChromeString = { [K in keyof Chrome]: Chrome[K] extends string ? K : never }[keyof Chrome]

/** Every string the interface says. Tree content never comes from here. */
export interface Chrome {
  yes: string
  no: string
  options: string
  sources: string
  sourceCaseLaw: string
  sourceLiterature: string
  images: string
  enlarge: string
  close: string
  credit: string
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
  disclaimer: string
  notFoundTitle: string
  notFoundText: string
  /** Read out after a link that leaves the app, so the new tab is not a surprise. */
  opensInNewTab: string
  /** The one button below a Terminal: the root Node with an empty Trail (10.3). */
  startAgain: string
  /**
   * The up arrow's accessible name, from the parent's title (10.2). A function of the title,
   * not a string with a placeholder, so a language that orders the sentence differently is
   * not forced into English word order (application.md 3.2).
   */
  up: (title: string) => string
  /** The two buttons of a paged Sheet, the enlarged view's included (12.3). */
  previous: string
  next: string
  /**
   * Which Image of how many: spoken in the enlarged view and on the control the strip
   * collapses to (10.5, step 1; 12.3).
   */
  imageCount: (index: number, total: number) => string
  /**
   * The notice shown at and below the floor of 10.4: the sentence that says the window is
   * too small, then the one for whichever dimension is short (both at the floor's corner).
   * The stylesheet shows the notice and picks the dimension; the markup carries all three.
   */
  minimumSize: string
  minimumWidth: string
  minimumHeight: string
  /** **[#134]** The deployment's name: the overview's chrome bar and title, the H1 of `llms.txt` (23.2, 23.5, 24.3). */
  siteTitle: string
  /** **[#134]** What this site is, in one sentence: the overview's description meta tag and the blockquote of `llms.txt`. */
  siteDescription: string
  /** **[#134]** The overview when no Tree is published (23.2). */
  noTrees: string
  /** **[#134]** The + tile of the creators' overview (26.4), which #137 draws. */
  newTree: string
  /** **[#134]** The link on the 404 page: the overview, since a Tree-less page has no root to start again from. */
  toOverview: string
  /** **[#135]** The admin area's pages without the script: every action is a JSON request (24.2). */
  needsJavaScript: string
  /** **[#135]** The 403 page (24.2). */
  forbiddenTitle: string
  forbiddenText: string
  /** **[#135]** The admin chrome bar (24.3): the logout button, the link to the account page and to the accounts page. */
  logout: string
  account: string
  accounts: string
  /** **[#135]** The login page (25.1). */
  signIn: string
  login: string
  password: string
  loginFailed: string
  loginLocked: string
  loginHelp: string
  requestFailed: string
  /** **[#135]** The account page (25.2). */
  yourName: string
  changePassword: string
  currentPassword: string
  newPassword: string
  repeatPassword: string
  passwordsDiffer: string
  wrongPassword: string
  sessionsEnded: string
  /** **[#135]** The accounts page (25.3). */
  newAccount: string
  create: string
  deactivate: string
  reactivate: string
  active: string
  deactivated: string
  administrator: string
  setPassword: string
  save: string
  /** **[#135]** The new-account Sheet's label for the display name, beside `login` (25.3). */
  displayName: string
  /** **[#135]** A refused field of the account forms (422): the rule it broke (20.1, 20.2). */
  nameLength: string
  loginInvalid: string
  loginTaken: string
  passwordLength: string
}

const CHROME: Record<ChromeLanguage, Chrome> = {
  en: {
    yes: 'Yes',
    no: 'No',
    options: 'What this covers',
    sources: 'Legal sources',
    sourceCaseLaw: 'Case law',
    sourceLiterature: 'Literature',
    images: 'Images',
    enlarge: 'Enlarge',
    close: 'Close',
    credit: 'Credit',
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
    disclaimer:
      'This is not legal advice. Read the sources and consult a lawyer before you rely on an outcome.',
    notFoundTitle: 'This step does not exist',
    notFoundText: 'The address does not name a page of this site.',
    opensInNewTab: 'opens in a new tab',
    startAgain: 'Start again',
    up: (title) => `Back to: ${title}`,
    previous: 'Previous',
    next: 'Next',
    imageCount: (index, total) => `Image ${index} of ${total}`,
    minimumSize: 'This tool needs a larger window.',
    minimumWidth: 'Make it wider than 320 pixels.',
    minimumHeight: 'Make it taller than 480 pixels.',
    siteTitle: 'ELSA decision trees',
    siteDescription:
      'Interactive legal decision trees: answer one question at a time and arrive at an outcome, with the legal sources of every step.',
    noTrees: 'No decision tree is published here yet.',
    newTree: 'New tree',
    toOverview: 'All decision trees',
    needsJavaScript: 'The editor needs JavaScript. Switch it on to sign in and edit.',
    forbiddenTitle: 'Not yours to open',
    forbiddenText: 'Your account has no access to this page.',
    logout: 'Log out',
    account: 'Your account',
    accounts: 'Accounts',
    signIn: 'Sign in',
    login: 'Name',
    password: 'Password',
    loginFailed: 'Wrong name or password.',
    loginLocked: 'Too many attempts. Try again in a few minutes.',
    loginHelp: 'Ask your administrator for an account or a new password.',
    requestFailed: 'The server could not be reached. Try again.',
    yourName: 'Your name',
    changePassword: 'Change password',
    currentPassword: 'Current password',
    newPassword: 'New password',
    repeatPassword: 'New password again',
    passwordsDiffer: 'The two new passwords differ.',
    wrongPassword: 'The current password is wrong.',
    sessionsEnded: 'Your other sessions end when you change it.',
    newAccount: 'New account',
    create: 'Create',
    deactivate: 'Deactivate',
    reactivate: 'Reactivate',
    active: 'Active',
    deactivated: 'Deactivated',
    administrator: 'Administrator',
    setPassword: 'Set password',
    save: 'Save',
    displayName: 'Display name',
    nameLength: 'A name is 1 to 80 characters.',
    loginInvalid: 'Use 2 to 64 lowercase letters, digits and single hyphens.',
    loginTaken: 'This name is taken.',
    passwordLength: 'A password is 12 to 256 characters.',
  },
  nl: {
    yes: 'Ja',
    no: 'Nee',
    options: 'Wat hieronder valt',
    sources: 'Juridische bronnen',
    sourceCaseLaw: 'Rechtspraak',
    sourceLiterature: 'Literatuur',
    images: 'Afbeeldingen',
    enlarge: 'Vergroten',
    close: 'Sluiten',
    credit: 'Bronvermelding',
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
    disclaimer:
      'Dit is geen juridisch advies. Lees de bronnen en raadpleeg een jurist voordat u op een uitkomst vertrouwt.',
    notFoundTitle: 'Deze stap bestaat niet',
    notFoundText: 'Het adres verwijst niet naar een pagina van deze site.',
    opensInNewTab: 'opent in een nieuw tabblad',
    startAgain: 'Opnieuw beginnen',
    up: (title) => `Terug naar: ${title}`,
    previous: 'Vorige',
    next: 'Volgende',
    imageCount: (index, total) => `Afbeelding ${index} van ${total}`,
    minimumSize: 'Dit hulpmiddel heeft een groter venster nodig.',
    minimumWidth: 'Maak het breder dan 320 pixels.',
    minimumHeight: 'Maak het hoger dan 480 pixels.',
    siteTitle: 'ELSA-beslisbomen',
    siteDescription:
      'Interactieve juridische beslisbomen: beantwoord één vraag tegelijk en kom tot een uitkomst, met de juridische bronnen van elke stap.',
    noTrees: 'Hier is nog geen beslisboom gepubliceerd.',
    newTree: 'Nieuwe boom',
    toOverview: 'Alle beslisbomen',
    needsJavaScript: 'De editor heeft JavaScript nodig. Zet het aan om in te loggen en te bewerken.',
    forbiddenTitle: 'Geen toegang',
    forbiddenText: 'Uw account heeft geen toegang tot deze pagina.',
    logout: 'Uitloggen',
    account: 'Uw account',
    accounts: 'Accounts',
    signIn: 'Inloggen',
    login: 'Naam',
    password: 'Wachtwoord',
    loginFailed: 'Verkeerde naam of wachtwoord.',
    loginLocked: 'Te veel pogingen. Probeer het over een paar minuten opnieuw.',
    loginHelp: 'Vraag uw beheerder om een account of een nieuw wachtwoord.',
    requestFailed: 'De server is niet bereikbaar. Probeer het opnieuw.',
    yourName: 'Uw naam',
    changePassword: 'Wachtwoord wijzigen',
    currentPassword: 'Huidig wachtwoord',
    newPassword: 'Nieuw wachtwoord',
    repeatPassword: 'Nieuw wachtwoord nogmaals',
    passwordsDiffer: 'De twee nieuwe wachtwoorden verschillen.',
    wrongPassword: 'Het huidige wachtwoord klopt niet.',
    sessionsEnded: 'Uw andere sessies eindigen als u het wijzigt.',
    newAccount: 'Nieuw account',
    create: 'Aanmaken',
    deactivate: 'Deactiveren',
    reactivate: 'Heractiveren',
    active: 'Actief',
    deactivated: 'Gedeactiveerd',
    administrator: 'Beheerder',
    setPassword: 'Wachtwoord instellen',
    save: 'Opslaan',
    displayName: 'Weergavenaam',
    nameLength: 'Een naam is 1 tot 80 tekens.',
    loginInvalid: 'Gebruik 2 tot 64 kleine letters, cijfers en enkele koppeltekens.',
    loginTaken: 'Deze naam is al in gebruik.',
    passwordLength: 'Een wachtwoord is 12 tot 256 tekens.',
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

/**
 * `lang` for a chrome element: set only where the chrome speaks another language than the
 * content around it, so a screen reader pronounces both (docs/specs/application.md 3.1).
 */
export function chromeLang(contentLanguage: string): string | undefined {
  const language = chromeLanguage(contentLanguage)
  return language === contentLanguage ? undefined : language
}

/**
 * The text of a localised field, or a visible placeholder when the Tree does not have it in
 * `lang`. Rule V-L10N guarantees every declared language is there, so a miss means the Tree
 * changed under the running server (`getNode` re-reads the file and does not re-validate) --
 * an authoring error. The reader is told, honestly, rather than shown an empty element, and
 * the server says which Node and which field, so the author can find it.
 *
 * `where` names the field: `start.title`, `start.options[1].title`.
 */
export function text(localised: LocalisedText, lang: string, where: string): string {
  const value = localised[lang]
  if (value !== undefined) return value
  console.warn(`Tree text missing: ${where} has no text for the language "${lang}"`)
  return `[${chrome(lang).missingText}]`
}
