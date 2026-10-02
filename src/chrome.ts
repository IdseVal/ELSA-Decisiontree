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
  /** **[#162]** A 204 whose cookie the browser did not keep: cookies blocked, or a `Secure` cookie at a plain-HTTP address (20.4). */
  sessionNotKept: string
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
  /** **[#138]** The editor's Source controls (28.1): the add Sheet's control, title and button; the `...` Sheet's title, its fields and its remove button. */
  addSource: string
  editSource: string
  removeSource: string
  sourceKind: string
  sourceUrl: string
  /** **[#138]** The `legal` kind in the kind select; on the public page the heading `sources` says it (ADR-78-sources-heading). */
  sourceLegal: string
  /** **[#138]** The accessible name of a Terminal's outcome select, drawn as the badge (28.1). */
  outcome: string
  /** **[#138]** The counter pill on the rim (28.3): the accessible names of its two numbers. */
  characters: string
  lines: string
  /**
   * **[#172]** What belongs in each field, its placeholder while it is empty (28.2, amended
   * 2026-10-02): the Node's title and text, a Source's name and link, an Option's title, an
   * Image's description and credit, an explainer's term and explanation, the logo's
   * alternative text.
   */
  placeholderTitle: string
  placeholderText: string
  placeholderSourceLabel: string
  placeholderUrl: string
  placeholderOptionTitle: string
  placeholderImageDescription: string
  placeholderCredit: string
  placeholderTerm: string
  placeholderExplanation: string
  placeholderLogoAlt: string
  /** **[#138]** The autosave indicator (29.3 to 29.7) and the session Sheet (29.6). */
  saving: string
  saved: string
  notSaved: string
  retrying: string
  retry: string
  notEditable: string
  changedElsewhere: string
  sessionExpired: string
  publicBehind: string
  /** **[#137]** The state mark on a tile of the creators' overview (26.4). */
  published: string
  hidden: string
  notServable: string
  /** **[#137]** The new-Tree form (27.1) and its refusals at the field (27.2). */
  treeId: string
  treeIdHint: string
  treeIdFixed: string
  treeIdTaken: string
  treeIdReserved: string
  languages: string
  addLanguage: string
  makeDefault: string
  default: string
  /** **[#147]** Replaces `languagesFixed`: a Tree's languages change in the top panel (33.5). */
  languagesLater: string
  title: string
  /** **[#137] added in the build**: the cross on a language tag, and the tag grammar a refused tag is told (27.1). */
  removeLanguage: string
  languageHint: string
  /** **[#141]** Marking a term and the explainer Sheet (32): the rim's button and why it is disabled, the Sheet's field labels, whether a language marks the explainer, and the Sheet's remove. */
  mark: string
  unmark: string
  cannotMarkHere: string
  explainerLimit: string
  term: string
  explanation: string
  markedIn: string
  notMarkedIn: string
  /** **[#142]** The top panel (33): its button and heading, the four sections, the confirmations. */
  treeState: string
  publish: string
  todoCount: string
  todoBefore: string
  publishedAt: string
  publicLink: string
  publicBehindBecause: string
  notServableBecause: string
  confirmUnpublish: string
  confirm: string
  cancel: string
  removeStep: string
  collaborators: string
  creator: string
  invite: string
  cannotInvite: string
  removeCollaborator: string
  chooseAccount: string
  thisTree: string
  /** **[#147]** Removing a language asks once and names what goes (33.5): `{language}` and `{count}` are filled in. */
  confirmRemoveLanguage: string
  handOver: string
  handOverTo: string
  deleteTree: string
  unpublishFirst: string
  confirmDeleteTree: string
  /** **[#139]** The structure buttons (30.1, 30.3, 30.4): the end button, the side-bubble `+`, and the two choices of its Sheet. */
  treeEndsHere: string
  newSideBubble: string
  createNew: string
  linkExisting: string
  /** **[#139]** The link menu of an Answer or Option button (30.6, 30.7): its name and its two actions. */
  linkMenu: string
  changeTarget: string
  removeLink: string
  /** **[#139]** The step menu on the rim (30.8): its name, its two actions, and the confirmation of a delete. */
  stepMenu: string
  deleteStep: string
  removeEnd: string
  /** The confirmation named with the step's title: a function, so a language may order the sentence its own way (3.2). */
  confirmDelete: (title: string) => string
  /** **[#139]** The picker (30.6): its heading, and the placeholder of the new side-bubble's title. */
  pickTarget: string
  sideBubbleTitle: string
  /** **[#140]** The editor's pictures (31): the pickers, the attach Sheet, the enlarged view's four controls, the picker's two refusals. */
  addPicture: string
  attach: string
  makeMain: string
  moveEarlier: string
  moveLater: string
  removeImage: string
  fileTooLarge: string
  fileTypeRefused: string
  /** **[#140] added in the build**: the attach Sheet's description field's label (31.2); its second button is #139's `cancel`. */
  imageDescription: string
  /** **[#144]** The Theme panel in the top panel's "This Tree" section (33.8): its three parts and their controls. */
  theme: string
  logo: string
  logoAlt: string
  uploadLogo: string
  replaceLogo: string
  removeLogo: string
  colours: string
  chooseColours: string
  defaultColours: string
  /** The seven colour roles (tree-format.md 4.3.3), by what each paints, and the Answer label the contrast rule also measures. */
  colourBackground: string
  colourSurface: string
  colourText: string
  colourTextMuted: string
  colourAccent: string
  colourAccentSecondary: string
  colourDanger: string
  colourAnswerLabel: string
  /**
   * The warning's heading, and the two words of one line of it -- "<text> on <page>: 2.49 : 1,
   * needs 4.5 : 1" (issue #64). Strings, not a function: the panel says the line in the browser,
   * where a function from the server cannot go.
   */
  lowContrast: string
  contrastOn: string
  contrastNeeds: string
  fonts: string
  fontBody: string
  fontHeading: string
  fontFamily: string
  fontLicence: string
  fontFile: string
  fontWeight: string
  fontItalic: string
  addFont: string
  addFontFile: string
  removeFont: string
  removeFontFile: string
  themeFileRefused: string
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
    sessionNotKept: 'Your name and password are right, but this browser did not keep the session. Allow cookies for this site, or open it at the address it is published at.',
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
    addSource: 'Add a source',
    editSource: 'Edit this source',
    removeSource: 'Remove this source',
    sourceKind: 'Kind',
    sourceUrl: 'Link',
    sourceLegal: 'Legal',
    outcome: 'Outcome',
    characters: 'characters',
    lines: 'lines',
    placeholderTitle: 'Title',
    placeholderText: 'Text',
    placeholderSourceLabel: 'Name of the source',
    placeholderUrl: 'https://…',
    placeholderOptionTitle: 'Side bubble title',
    placeholderImageDescription: 'What the picture shows',
    placeholderCredit: 'Maker and licence',
    placeholderTerm: 'Word or phrase',
    placeholderExplanation: 'What it means',
    placeholderLogoAlt: 'What the logo says',
    saving: 'Saving',
    saved: 'Saved',
    notSaved: 'Not saved',
    retrying: 'retrying',
    retry: 'Retry now',
    notEditable: 'This tree can no longer be edited here',
    changedElsewhere: 'changed by a collaborator',
    sessionExpired: 'Your session has expired. Sign in to keep editing; nothing typed is lost.',
    publicBehind: 'the public copy is behind',
    published: 'Published',
    hidden: 'Hidden',
    notServable: 'Not served',
    treeId: 'Address name',
    treeIdHint: 'Lowercase letters, digits and single hyphens; at most 64.',
    treeIdFixed: 'The address name never changes after the tree is created: it is in every link to it.',
    treeIdTaken: 'A tree with this address name exists.',
    treeIdReserved: 'This word is reserved by the site. Choose another.',
    languages: 'Languages',
    addLanguage: 'Add',
    makeDefault: 'Make default',
    default: 'default',
    languagesLater: 'Languages can be added or removed later, in the tree’s panel.',
    title: 'Title',
    removeLanguage: 'Remove',
    languageHint: 'A language tag such as en, nl or pt-br.',
    mark: 'Mark',
    unmark: 'Unmark',
    cannotMarkHere: 'Select words on one line, outside emphasis, bold text, links and other marks.',
    explainerLimit: 'This step has eight explainers, the most it can hold.',
    term: 'Term',
    explanation: 'Explanation',
    markedIn: 'Marked in the text',
    notMarkedIn: 'Not marked in the text',
    treeState: 'Tree',
    publish: 'Publish',
    todoCount: 'things to do',
    todoBefore: 'To do before publishing:',
    publishedAt: 'Published',
    publicLink: 'Public link',
    publicBehindBecause: 'The public copy stays as it was until these are done:',
    notServableBecause: 'The public page is not served because of:',
    confirmUnpublish: 'Hide this tree? Links to it will stop working until it is published again.',
    confirm: 'Confirm',
    cancel: 'Cancel',
    removeStep: 'remove',
    collaborators: 'Collaborators',
    creator: 'creator',
    invite: 'Invite',
    cannotInvite: 'This account cannot be invited.',
    removeCollaborator: 'Remove',
    chooseAccount: 'Choose an account',
    thisTree: 'This tree',
    confirmRemoveLanguage: 'Remove {language}? The {count} texts written in it will be deleted.',
    handOver: 'Hand over',
    handOverTo: 'Hand over to',
    deleteTree: 'Delete this tree',
    unpublishFirst: 'Hide it first to delete it.',
    confirmDeleteTree: 'Delete this tree and its pictures for good? This cannot be undone.',
    treeEndsHere: 'Tree ends here',
    newSideBubble: 'New side bubble',
    createNew: 'Create a new one',
    linkExisting: 'Link an existing one',
    linkMenu: 'This link',
    changeTarget: 'Lead somewhere else',
    removeLink: 'Remove this link',
    stepMenu: 'This step',
    deleteStep: 'Delete this step',
    removeEnd: 'Does not end here after all',
    confirmDelete: (title) => `Delete "${title}"? What it led to stays.`,
    pickTarget: 'Which step?',
    sideBubbleTitle: 'The side bubble\u2019s title',
    addPicture: 'Add a picture',
    attach: 'Attach',
    makeMain: 'Make main picture',
    moveEarlier: 'Move earlier',
    moveLater: 'Move later',
    removeImage: 'Remove this picture',
    fileTooLarge: 'This file is too large: at most 5 MiB.',
    fileTypeRefused: 'This file type is refused: PNG, JPEG, GIF or WebP.',
    imageDescription: 'Description',
    theme: 'Theme',
    logo: 'Logo',
    logoAlt: 'Alternative text',
    uploadLogo: 'Upload a logo',
    replaceLogo: 'Replace the logo',
    removeLogo: 'Remove the logo',
    colours: 'Colours',
    chooseColours: 'Choose colours',
    defaultColours: 'Back to the default colours',
    colourBackground: 'Page',
    colourSurface: 'Bubble',
    colourText: 'Text',
    colourTextMuted: 'Secondary text',
    colourAccent: 'Accent',
    colourAccentSecondary: 'Buttons and links',
    colourDanger: 'Prohibited and errors',
    colourAnswerLabel: 'Button text',
    lowContrast: 'Hard to read on the public page:',
    contrastOn: 'on',
    contrastNeeds: 'needs',
    fonts: 'Fonts',
    fontBody: 'Running text',
    fontHeading: 'Headings',
    fontFamily: 'Family name',
    fontLicence: 'Licence',
    fontFile: 'WOFF2 file',
    fontWeight: 'Weight',
    fontItalic: 'Italic',
    addFont: 'Add the font',
    addFontFile: 'Add a file',
    removeFont: 'Remove this font',
    removeFontFile: 'Remove',
    themeFileRefused: 'This file type is refused: PNG or WebP for a logo, WOFF2 for a font.',
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
    sessionNotKept: 'Uw naam en wachtwoord kloppen, maar deze browser heeft de sessie niet bewaard. Sta cookies toe voor deze site, of open hem op het adres waarop hij gepubliceerd is.',
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
    addSource: 'Bron toevoegen',
    editSource: 'Deze bron bewerken',
    removeSource: 'Deze bron verwijderen',
    sourceKind: 'Soort',
    sourceUrl: 'Link',
    sourceLegal: 'Juridisch',
    outcome: 'Uitkomst',
    characters: 'tekens',
    lines: 'regels',
    placeholderTitle: 'Titel',
    placeholderText: 'Tekst',
    placeholderSourceLabel: 'Naam van de bron',
    placeholderUrl: 'https://…',
    placeholderOptionTitle: 'Titel van de zijbubbel',
    placeholderImageDescription: 'Wat de afbeelding laat zien',
    placeholderCredit: 'Maker en licentie',
    placeholderTerm: 'Woord of begrip',
    placeholderExplanation: 'Wat het betekent',
    placeholderLogoAlt: 'Wat er in het logo staat',
    saving: 'Opslaan',
    saved: 'Opgeslagen',
    notSaved: 'Niet opgeslagen',
    retrying: 'opnieuw proberen',
    retry: 'Nu opnieuw',
    notEditable: 'Deze boom kan hier niet meer worden bewerkt',
    changedElsewhere: 'gewijzigd door een medewerker',
    sessionExpired: 'Uw sessie is verlopen. Log in om verder te werken; niets van wat u typte gaat verloren.',
    publicBehind: 'de openbare versie loopt achter',
    published: 'Gepubliceerd',
    hidden: 'Verborgen',
    notServable: 'Niet getoond',
    treeId: 'Adresnaam',
    treeIdHint: 'Kleine letters, cijfers en enkele koppeltekens; hoogstens 64.',
    treeIdFixed: 'De adresnaam verandert nooit nadat de boom is aangemaakt: hij staat in elke link ernaartoe.',
    treeIdTaken: 'Er bestaat al een boom met deze adresnaam.',
    treeIdReserved: 'Dit woord is gereserveerd door de site. Kies een ander.',
    languages: 'Talen',
    addLanguage: 'Toevoegen',
    makeDefault: 'Maak standaard',
    default: 'standaard',
    languagesLater: 'Talen kunnen later worden toegevoegd of verwijderd, in het paneel van de boom.',
    title: 'Titel',
    removeLanguage: 'Verwijderen',
    languageHint: 'Een taalcode zoals en, nl of pt-br.',
    mark: 'Markeren',
    unmark: 'Markering weghalen',
    cannotMarkHere: 'Kies woorden op één regel, buiten nadruk, vette tekst, links en andere markeringen.',
    explainerLimit: 'Deze stap heeft acht uitleggen, het meeste dat hij kan bevatten.',
    term: 'Term',
    explanation: 'Uitleg',
    markedIn: 'Gemarkeerd in de tekst',
    notMarkedIn: 'Niet gemarkeerd in de tekst',
    treeState: 'Boom',
    publish: 'Publiceren',
    todoCount: 'punten te doen',
    todoBefore: 'Te doen voor publicatie:',
    publishedAt: 'Gepubliceerd',
    publicLink: 'Openbare link',
    publicBehindBecause: 'De openbare versie blijft zoals ze was tot dit is gedaan:',
    notServableBecause: 'De openbare pagina wordt niet getoond vanwege:',
    confirmUnpublish: 'Deze boom verbergen? Links ernaar werken niet meer tot hij weer gepubliceerd is.',
    confirm: 'Bevestigen',
    cancel: 'Annuleren',
    removeStep: 'verwijderen',
    collaborators: 'Medewerkers',
    creator: 'maker',
    invite: 'Uitnodigen',
    cannotInvite: 'Dit account kan niet worden uitgenodigd.',
    removeCollaborator: 'Verwijderen',
    chooseAccount: 'Kies een account',
    thisTree: 'Deze boom',
    confirmRemoveLanguage: '{language} verwijderen? De {count} teksten die erin geschreven zijn worden gewist.',
    handOver: 'Overdragen',
    handOverTo: 'Overdragen aan',
    deleteTree: 'Deze boom verwijderen',
    unpublishFirst: 'Verberg hem eerst om hem te verwijderen.',
    confirmDeleteTree: 'Deze boom en zijn afbeeldingen voorgoed verwijderen? Dit kan niet ongedaan worden.',
    treeEndsHere: 'Boom eindigt hier',
    newSideBubble: 'Nieuwe zijbubbel',
    createNew: 'Een nieuwe maken',
    linkExisting: 'Een bestaande koppelen',
    linkMenu: 'Deze koppeling',
    changeTarget: 'Ergens anders heen',
    removeLink: 'Deze koppeling verwijderen',
    stepMenu: 'Deze stap',
    deleteStep: 'Deze stap verwijderen',
    removeEnd: 'Eindigt hier toch niet',
    confirmDelete: (title) => `"${title}" verwijderen? Waar die heen leidde blijft.`,
    pickTarget: 'Welke stap?',
    sideBubbleTitle: 'De titel van de zijbubbel',
    addPicture: 'Afbeelding toevoegen',
    attach: 'Toevoegen',
    makeMain: 'Hoofdafbeelding maken',
    moveEarlier: 'Naar voren',
    moveLater: 'Naar achteren',
    removeImage: 'Deze afbeelding verwijderen',
    fileTooLarge: 'Dit bestand is te groot: hoogstens 5 MiB.',
    fileTypeRefused: 'Dit bestandstype wordt geweigerd: PNG, JPEG, GIF of WebP.',
    imageDescription: 'Beschrijving',
    theme: 'Thema',
    logo: 'Logo',
    logoAlt: 'Alternatieve tekst',
    uploadLogo: 'Een logo uploaden',
    replaceLogo: 'Logo vervangen',
    removeLogo: 'Logo verwijderen',
    colours: 'Kleuren',
    chooseColours: 'Kleuren kiezen',
    defaultColours: 'Terug naar de standaardkleuren',
    colourBackground: 'Pagina',
    colourSurface: 'Bubbel',
    colourText: 'Tekst',
    colourTextMuted: 'Bijtekst',
    colourAccent: 'Accent',
    colourAccentSecondary: 'Knoppen en links',
    colourDanger: 'Verboden en fouten',
    colourAnswerLabel: 'Knoptekst',
    lowContrast: 'Slecht leesbaar op de publieke pagina:',
    contrastOn: 'op',
    contrastNeeds: 'nodig is',
    fonts: 'Lettertypen',
    fontBody: 'Lopende tekst',
    fontHeading: 'Koppen',
    fontFamily: 'Familienaam',
    fontLicence: 'Licentie',
    fontFile: 'WOFF2-bestand',
    fontWeight: 'Gewicht',
    fontItalic: 'Cursief',
    addFont: 'Lettertype toevoegen',
    addFontFile: 'Bestand toevoegen',
    removeFont: 'Dit lettertype verwijderen',
    removeFontFile: 'Verwijderen',
    themeFileRefused: 'Dit bestandstype wordt geweigerd: PNG of WebP voor een logo, WOFF2 voor een lettertype.',
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
