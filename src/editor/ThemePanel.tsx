'use client'

/**
 * **[#144]** The Theme panel (docs/specs/application.md 33.8): the Tree's logo with its
 * alternative text, its seven colours by role, and a font family per role with its files and
 * licence line (tree-format.md 4.3), inside the top panel's "This Tree" section (33.5,
 * ADR-133-top-panel decision 5).
 *
 * Each part is written whole or removed -- `PATCH .../trees/<t>` with `theme.<part>` -- so the
 * draft never holds half a palette or a family without its licence (4.3's "complete or
 * absent"). Files go up first, through `POST .../trees/<t>/theme`, and the part that names
 * them is written after. Every answer refreshes the page, so the draft's look -- its
 * `<style>` and its logo in the chrome bar -- follows at once (24.3).
 *
 * The contrast rule the public page is held to (issue #64) is checked on the chosen colours
 * as they change, and a shortfall is a warning, never a refusal: the format leaves contrast
 * to the Theme's author (4.3.3). Imports of `src/`: types, `contrast.ts` and `tree/grammar.ts`
 * (34.4).
 *
 * **[#180]** The fonts part is a dropdown per role (37.2): the role's empty choice, the
 * families the application ships, the Tree's own family and, last, "Upload a font file…". A
 * library family is one write, `use-library-font` (37.3); an upload proposes the font's own
 * name and takes a licence from a second dropdown (37.4, 37.5). A name the other role uses for
 * other files is refused before anything is sent. And every item a creator without a design
 * background would not understand alone has an information hint (#174's `Hint`).
 */
import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import type { Chrome } from '../chrome.ts'
import { shortfalls, type Shortfall } from '../contrast.ts'
import type { FontLicence } from '../fonts.ts'
import { refusedInFamily } from '../tree/grammar.ts'
import type { ColourRole, Colours, FontFamily, FontFile, Logo, Theme } from '../tree/types.ts'
import { useEditor } from './Editor.tsx'
import { heldToLimit } from './Field.tsx'
import { Hint } from './Hint.tsx'
import type { FieldLimit } from './mode.ts'
import { themeCalls, type Refusal, type Typed, type WriteResponse } from './writes.ts'

/** **[#172]** The logo's alternative text is 80 characters (tree-format.md 5.7): its typing stops there (28.4). */
const ALT_LIMIT: FieldLimit = { characters: 80 }
/** **[#180]** A family's name is 64 characters, and a licence line 200 (tree-format.md 4.3.2, 5.7). */
const NAME_LIMIT: FieldLimit = { characters: 64 }
const LICENCE_LIMIT: FieldLimit = { characters: 200 }

/** The chrome strings the Theme panel says. */
export type ThemeWords = Pick<
  Chrome,
  | 'theme'
  | 'logo'
  | 'logoAlt'
  | 'placeholderLogoAlt'
  | 'uploadLogo'
  | 'replaceLogo'
  | 'removeLogo'
  | 'colours'
  | 'chooseColours'
  | 'defaultColours'
  | 'colourBackground'
  | 'colourSurface'
  | 'colourText'
  | 'colourTextMuted'
  | 'colourAccent'
  | 'colourAccentSecondary'
  | 'colourDanger'
  | 'colourAnswerLabel'
  | 'lowContrast'
  | 'contrastOn'
  | 'contrastNeeds'
  | 'fonts'
  | 'fontBody'
  | 'fontHeading'
  | 'fontFamily'
  | 'fontLicence'
  | 'fontFile'
  | 'fontWeight'
  | 'fontItalic'
  | 'addFont'
  | 'addFontFile'
  | 'removeFont'
  | 'removeFontFile'
  | 'fileTooLarge'
  | 'themeFileRefused'
  | 'notSaved'
  | 'requestFailed'
  | 'hint'
  | 'fontDefault'
  | 'fontSameAsBody'
  | 'fontLibraryGroup'
  | 'fontOwnGroup'
  | 'fontUpload'
  | 'fontNameTaken'
  | 'licenceOther'
  | 'colourBackgroundHint'
  | 'colourSurfaceHint'
  | 'colourTextHint'
  | 'colourTextMutedHint'
  | 'colourAccentHint'
  | 'colourAccentSecondaryHint'
  | 'colourDangerHint'
  | 'contrastHint'
  | 'logoAltHint'
  | 'fontBodyHint'
  | 'fontHeadingHint'
  | 'fontLicenceHint'
  | 'fontFileHint'
>

/** **[#180]** A family of the font library as the panel offers it: its id, and the entry `use-library-font` writes for it (37.3). */
export interface LibraryChoice {
  id: string
  entry: FontFamily
}

/** How long a colour waits for the next change before it is saved: a picker dragged is one write, not fifty. */
const COLOUR_SETTLE_MS = 400

/** The seven roles in the format's order (4.3.3), each with the word that says what it paints, and **[#180]** its hint. */
const ROLES: readonly [ColourRole, keyof ThemeWords, keyof ThemeWords][] = [
  ['background', 'colourBackground', 'colourBackgroundHint'],
  ['surface', 'colourSurface', 'colourSurfaceHint'],
  ['text', 'colourText', 'colourTextHint'],
  ['text-muted', 'colourTextMuted', 'colourTextMutedHint'],
  ['accent', 'colourAccent', 'colourAccentHint'],
  ['accent-secondary', 'colourAccentSecondary', 'colourAccentSecondaryHint'],
  ['danger', 'colourDanger', 'colourDangerHint'],
]

export function ThemePanel({
  treeId,
  lang,
  languages,
  words,
  theme: initialTheme,
  defaults,
  filesHref,
  library,
  licences,
}: {
  treeId: string
  /** The page's language: the alternative text is edited in it, as every field is (28.2). */
  lang: string
  languages: string[]
  words: ThemeWords
  /** The draft's Theme at load. */
  theme: Theme | undefined
  /** The frontend's default palette (13.4): what `chooseColours` starts from, so nothing changes until a colour does. */
  defaults: Colours
  /** Where the draft's theme files are fetched, the file's name to be appended (the admin route). */
  filesHref: string
  /** **[#180]** The families the application ships, in the dropdown's order (37.1). */
  library: LibraryChoice[]
  /** **[#180]** The licence dropdown's six entries (37.5). */
  licences: readonly FontLicence[]
}) {
  const router = useRouter()
  const { setTree, readOnly } = useEditor()
  const [theme, setTheme] = useState<Theme>(initialTheme ?? {})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null)
  const disabled = busy || readOnly

  useEffect(() => () => clearTimeout(settle.current ?? undefined), [])

  /** What a refused request is told: the rules it broke, or the upload's reason, or the network. */
  const refusal = (answer: Typed<unknown>): string => {
    if (answer.status === 413) return words.fileTooLarge
    if (answer.status === 415) return words.themeFileRefused
    const violations = (answer.body as Refusal | null)?.violations ?? []
    if (answer.status === 422 && violations.length > 0) return `${words.notSaved}: ${violations.map((v) => `${v.keyPath} ${v.message}`).join('; ')}`
    return words.requestFailed
  }

  /** Sends one write of the Theme; the panel takes the stored Theme from the answer and the page repaints in it. */
  const send = async (write: () => Promise<Typed<WriteResponse>>): Promise<boolean> => {
    setBusy(true)
    setError(null)
    try {
      const answer = await write()
      if (answer.status !== 200 || !answer.body || !('manifest' in answer.body)) {
        setError(refusal(answer))
        return false
      }
      const written = answer.body as WriteResponse
      // A colour still settling is newer than the answer: the answer must not paint it back.
      if (!settle.current) setTheme(written.manifest?.theme ?? {})
      setTree(written.tree)
      router.refresh()
      return true
    } finally {
      setBusy(false)
    }
  }

  /** Writes one part whole, or removes it with null. */
  const save = <Part extends keyof Theme>(part: Part, value: Theme[Part] | null): Promise<boolean> => send(() => themeCalls.write(treeId, part, value))

  /** Uploads one file into the Tree's theme/ and answers the server's name for it, and **[#180]** a font's own family name; or null. */
  const upload = async (file: File | null | undefined): Promise<{ file: string; family?: string } | null> => {
    if (!file) return null
    setBusy(true)
    setError(null)
    try {
      const answer = await themeCalls.upload(treeId, file)
      if (answer.status === 201 && answer.body && 'file' in answer.body) return answer.body
      setError(refusal(answer))
      return null
    } finally {
      setBusy(false)
    }
  }

  const logo = theme.logo
  const uploadLogo = async (file: File | undefined): Promise<void> => {
    const light = (await upload(file))?.file
    if (!light) return
    // A new logo's alternative text is still to write in every language: the to-do list says so (19.2).
    const next: Logo = logo ? { ...logo, light } : { light, alt: Object.fromEntries(languages.map((language) => [language, ''])) }
    await save('logo', next)
  }

  const colours = theme.colours
  const changeColour = (role: ColourRole, value: string): void => {
    if (!colours) return
    const next = { ...colours, [role]: value }
    setTheme((held) => ({ ...held, colours: next }))
    clearTimeout(settle.current ?? undefined)
    settle.current = setTimeout(() => {
      settle.current = null
      void save('colours', next)
    }, COLOUR_SETTLE_MS)
  }

  // A colour still settling would otherwise land after the default and write the old palette back.
  const defaultColours = (): Promise<boolean> => {
    clearTimeout(settle.current ?? undefined)
    settle.current = null
    return save('colours', null)
  }

  const families = theme.fonts ?? []

  return (
    <div className="theme-panel" data-theme-panel="">
      <h4>{words.theme}</h4>

      <div className="theme-part" data-part="logo">
        <h5>{words.logo}</h5>
        {logo ? (
          <>
            <img className="theme-logo" src={`${filesHref}${encodeURIComponent(logo.light)}`} alt={logo.alt[lang] ?? ''} />
            <AltText key={`${logo.light} ${logo.alt[lang] ?? ''}`} words={words} lang={lang} value={logo.alt[lang] ?? ''} disabled={disabled} onSave={(value) => save('logo', { ...logo, alt: { ...logo.alt, [lang]: value } })} />
            <div className="panel-actions">
              <FilePicker label={words.replaceLogo} accept="image/png,image/webp" disabled={disabled} onFile={uploadLogo} />
              <button type="button" className="admin-link" disabled={disabled} onClick={() => save('logo', null)}>
                {words.removeLogo}
              </button>
            </div>
          </>
        ) : (
          <FilePicker label={words.uploadLogo} accept="image/png,image/webp" disabled={disabled} onFile={uploadLogo} />
        )}
      </div>

      <div className="theme-part" data-part="colours">
        <h5>{words.colours}</h5>
        {colours ? (
          <>
            <div className="theme-colours">
              {ROLES.map(([role, word, hint]) => (
                // A row, not a label: the hint is a control of its own, and a label's text would name the picker with it (#174).
                <div key={role} className="theme-colour">
                  <input type="color" id={`theme-colour-${role}`} data-role={role} value={colours[role]} disabled={readOnly} onChange={(event) => changeColour(role, event.currentTarget.value)} />
                  <label htmlFor={`theme-colour-${role}`}>{words[word] as string}</label>
                  <Hint id={`theme-colour-${role}-hint`} text={words[hint] as string} name={words.hint} />
                </div>
              ))}
            </div>
            <ContrastWarning words={words} found={shortfalls(colours)} />
            <button type="button" className="admin-link" disabled={disabled} onClick={defaultColours}>
              {words.defaultColours}
            </button>
          </>
        ) : (
          <button type="button" className="admin-submit" disabled={disabled} onClick={() => save('colours', defaults)}>
            {words.chooseColours}
          </button>
        )}
      </div>

      <div className="theme-part" data-part="fonts">
        <h5>{words.fonts}</h5>
        {(['body', 'heading'] as const).map((role) => {
          const others = families.filter((candidate) => candidate.role !== role)
          return (
            <FontRole
              key={role}
              role={role}
              family={families.find((candidate) => candidate.role === role)}
              other={others[0]}
              library={library}
              licences={licences}
              words={words}
              disabled={disabled}
              onReplace={(next) => {
                const written = next ? [...others, next] : others
                return save('fonts', written.length > 0 ? written : null)
              }}
              onLibrary={(id) => send(() => themeCalls.useLibraryFont(treeId, role, id))}
              onUpload={upload}
            />
          )
        })}
      </div>

      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/** A file input dressed as a link-button: choosing a file is the action. */
function FilePicker({ label, accept, disabled, onFile }: { label: string; accept: string; disabled: boolean; onFile: (file: File | undefined) => void }) {
  return (
    <label className="admin-link theme-file" data-disabled={disabled || undefined}>
      {label}
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(event) => {
          onFile(event.currentTarget.files?.[0])
          // Cleared, so choosing the same file again after a refusal is a change too.
          event.currentTarget.value = ''
        }}
      />
    </label>
  )
}

/**
 * The logo's alternative text in the page's language, saved when the field is left (28.2);
 * **[#172]** it says what belongs in it while empty and its typing stops at 80 (28.4).
 * **[#180]** With a hint that says what it is for.
 */
function AltText({ words, lang, value, disabled, onSave }: { words: ThemeWords; lang: string; value: string; disabled: boolean; onSave: (value: string) => void }) {
  const [text, setText] = useState(value)
  return (
    <div className="admin-field">
      <span>
        <label htmlFor="theme-logo-alt">
          {words.logoAlt} <span className="panel-tag">{lang}</span>
        </label>
        <Hint id="theme-logo-alt-hint" text={words.logoAltHint} name={words.hint} />
      </span>
      <input
        id="theme-logo-alt"
        lang={lang}
        value={text}
        placeholder={words.placeholderLogoAlt}
        disabled={disabled}
        onChange={(event) => setText(heldToLimit(event.currentTarget, text, event.currentTarget.value, ALT_LIMIT))}
        onBlur={() => text !== value && onSave(text)}
      />
    </div>
  )
}

/** **[#180]** Whether two names are one family to the browser, which matches a family name without regard to case. */
function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

/** **[#180]** Whether two families' files are the same faces: each file with its weight and style. */
function sameFiles(a: readonly FontFile[], b: readonly FontFile[]): boolean {
  const faces = (files: readonly FontFile[]): string => files.map((face) => `${face.file} ${face.weight} ${face.style}`).sort().join('\n')
  return faces(a) === faces(b)
}

/** **[#180]** Whether a role's entry is the library family `entry` (37.2): its name, its files and its licence, whatever its role. */
function isEntry(family: FontFamily, entry: FontFamily): boolean {
  return family.family === entry.family && family.licence === entry.licence && sameFiles(family.files, entry.files)
}

/**
 * **[#180]** Whether `name` over `files` would be a new pairing with the other role's family
 * (37.4, ADR-171-font-dropdown decisions 5 and 6): the other role's family has that name and
 * other files, and two sets of files under one name are one family to the browser, which mixes
 * their faces.
 */
function nameTaken(name: string, files: readonly FontFile[], other: FontFamily | undefined): boolean {
  return other !== undefined && sameName(other.family, name) && !sameFiles(other.files, files)
}

/** **[#180]** What an upload has left to give before its family is written: the server's name for the file, and the name proposed for the family. */
interface Uploaded {
  file: string
  family: string
}

/**
 * **[#180]** One role's font (37.2): the dropdown, and under it what the choice needs. A library
 * family shows its licence, fixed, and nothing else; the Tree's own family keeps 33.8's
 * controls; an upload in progress shows the file field, then the proposed name, the licence,
 * the weight and the style.
 */
function FontRole({
  role,
  family,
  other,
  library,
  licences,
  words,
  disabled,
  onReplace,
  onLibrary,
  onUpload,
}: {
  role: FontFamily['role']
  /** The role's entry, if the Theme has one. */
  family: FontFamily | undefined
  /** The other role's entry, against whose name a new name is held (37.4). */
  other: FontFamily | undefined
  library: LibraryChoice[]
  licences: readonly FontLicence[]
  words: ThemeWords
  disabled: boolean
  /** Writes the fonts part with `next` as this role's entry, or without one for null. */
  onReplace: (next: FontFamily | null) => Promise<boolean>
  onLibrary: (id: string) => Promise<boolean>
  onUpload: (file: File | undefined) => Promise<{ file: string; family?: string } | null>
}) {
  // Null: no upload under way; `choosing`: the file field is out; an `Uploaded`: the file is up, the family not yet written.
  const [upload, setUpload] = useState<'choosing' | Uploaded | null>(null)
  const [refused, setRefused] = useState<string | null>(null)
  // A refused choice is told until the role's entry next changes, by this panel or a collaborator's write.
  useEffect(() => setRefused(null), [family])
  const chosen = family && library.find((candidate) => isEntry(family, candidate.entry))
  const current = !family ? '' : chosen ? `library:${chosen.id}` : 'own'
  const heading = `theme-font-${role}`

  const choose = async (choice: string): Promise<void> => {
    setRefused(null)
    if (choice === 'upload') return setUpload('choosing')
    setUpload(null)
    if (choice === current || choice === 'own') return
    if (choice === '') {
      await onReplace(null)
      return
    }
    const id = choice.slice('library:'.length)
    const entry = library.find((candidate) => candidate.id === id)?.entry
    if (!entry) return
    // Before anything is sent: the library's 400 700 under a name the other role has would overlap its faces (37.2).
    if (other && sameName(other.family, entry.family) && !isEntry(other, entry)) return setRefused(words.fontNameTaken)
    await onLibrary(id)
  }

  const uploaded = async (file: File | undefined): Promise<void> => {
    const answer = await onUpload(file)
    if (answer) setUpload({ file: answer.file, family: answer.family ?? '' })
  }

  return (
    <div className="theme-font" data-font-role={role}>
      <div className="theme-font-head">
        <h6 id={heading}>{role === 'body' ? words.fontBody : words.fontHeading}</h6>
        <Hint id={`${heading}-hint`} text={role === 'body' ? words.fontBodyHint : words.fontHeadingHint} name={words.hint} />
      </div>
      <select className="editor-select panel-select" aria-labelledby={heading} value={upload ? 'upload' : current} disabled={disabled} onChange={(event) => void choose(event.currentTarget.value)}>
        <option value="">{role === 'body' ? words.fontDefault : words.fontSameAsBody}</option>
        <optgroup label={words.fontLibraryGroup}>
          {library.map((candidate) => (
            <option key={candidate.id} value={`library:${candidate.id}`}>
              {candidate.entry.family}
            </option>
          ))}
        </optgroup>
        {family && !chosen && (
          <optgroup label={words.fontOwnGroup}>
            <option value="own">{family.family}</option>
          </optgroup>
        )}
        <option value="upload">{words.fontUpload}</option>
      </select>
      {refused && (
        <p className="admin-error" role="alert">
          {refused}
        </p>
      )}

      {upload === 'choosing' && <UploadField id={`theme-font-${role}-upload`} words={words} disabled={disabled} onFile={uploaded} />}
      {upload && upload !== 'choosing' && (
        <NewFamily
          key={upload.file}
          uploaded={upload}
          role={role}
          other={other}
          licences={licences}
          words={words}
          disabled={disabled}
          onAdd={async (next) => {
            const saved = await onReplace(next)
            if (saved) setUpload(null)
            return saved
          }}
        />
      )}

      {!upload && chosen && family && (
        <p className="theme-font-licence">
          {words.fontLicence}: {licences.find((licence) => licence.stored === family.licence)?.name ?? family.licence}
        </p>
      )}

      {!upload && family && !chosen && (
        <>
          <FamilyName
            key={`family ${family.family}`}
            id={`theme-font-${role}-name`}
            words={words}
            value={family.family}
            disabled={disabled}
            // A write that keeps the role's name is never refused for it (ADR-171-font-dropdown decision 6).
            taken={(name) => !sameName(name, family.family) && nameTaken(name, family.files, other)}
            onSave={(name) => onReplace({ ...family, family: name })}
          />
          <LicencePicker key={`licence ${family.licence}`} licences={licences} words={words} value={family.licence} disabled={disabled} onChange={(licence) => void onReplace({ ...family, licence })} />
          <ul className="theme-font-files">
            {family.files.map((face, index) => (
              <li key={face.file}>
                <code>{face.file}</code> {face.weight} {face.style === 'italic' ? words.fontItalic : ''}
                <button
                  type="button"
                  className="admin-link"
                  disabled={disabled}
                  onClick={() => onReplace(family.files.length > 1 ? { ...family, files: family.files.filter((_, at) => at !== index) } : null)}
                >
                  {words.removeFontFile}
                </button>
              </li>
            ))}
          </ul>
          <FontFileForm
            id={`theme-font-${role}-file`}
            words={words}
            disabled={disabled}
            onSubmit={async (form) => {
              const file = (await onUpload(form.file))?.file
              return file !== undefined && onReplace({ ...family, files: [...family.files, { file, weight: form.weight, style: form.style }] })
            }}
          />
          <button type="button" className="admin-link" disabled={disabled} onClick={() => onReplace(null)}>
            {words.removeFont}
          </button>
        </>
      )}
    </div>
  )
}

/**
 * **[#180]** "Upload a font file…" chosen: the file field, which asks the browser for its file
 * picker at once -- where the choice gave the page the user's activation, the picker opens
 * without a second click -- and stays to be clicked where it did not.
 */
function UploadField({ id, words, disabled, onFile }: { id: string; words: ThemeWords; disabled: boolean; onFile: (file: File | undefined) => void }) {
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => input.current?.click(), [])
  return (
    <div className="admin-field theme-upload">
      <label htmlFor={id}>{words.fontFile}</label>
      <input ref={input} id={id} type="file" accept=".woff2,font/woff2" disabled={disabled} onChange={(event) => onFile(event.currentTarget.files?.[0])} />
    </div>
  )
}

/**
 * **[#180]** What an uploaded family needs before it is written (37.4): its name, proposed from
 * the font's own and changeable, its licence, the file's weight and its style; then `addFont`.
 */
function NewFamily({
  uploaded,
  role,
  other,
  licences,
  words,
  disabled,
  onAdd,
}: {
  uploaded: Uploaded
  role: FontFamily['role']
  other: FontFamily | undefined
  licences: readonly FontLicence[]
  words: ThemeWords
  disabled: boolean
  onAdd: (family: FontFamily) => Promise<boolean>
}) {
  const [name, setName] = useState(uploaded.family)
  const [licence, setLicence] = useState('')
  const [refused, setRefused] = useState<string | null>(null)

  const submitted = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const files: FontFile[] = [{ file: uploaded.file, weight: String(data.get('weight') ?? '').trim(), style: data.get('italic') ? 'italic' : 'normal' }]
    // The form's own `required` holds the name, the licence and the weight; this is the one rule it cannot.
    if (nameTaken(name, files, other)) return setRefused(words.fontNameTaken)
    setRefused(null)
    // Read off the form rather than the state: a free line still being left has not told the state yet.
    const choice = String(data.get('licence-choice') ?? '')
    await onAdd({ family: name.trim(), role, files, licence: (choice === 'other' ? String(data.get('licence') ?? '') : choice).trim() })
  }

  return (
    <form className="theme-font-form" onSubmit={submitted}>
      <code>{uploaded.file}</code>
      <NameInput id={`theme-font-${role}-name`} words={words} value={name} disabled={disabled} onChange={setName} />
      {refused && (
        <p className="admin-error" role="alert">
          {refused}
        </p>
      )}
      <LicencePicker licences={licences} words={words} value={licence} disabled={disabled} onChange={setLicence} />
      <WeightAndStyle id={`theme-font-${role}-weight`} words={words} disabled={disabled} />
      <button type="submit" className="admin-submit" disabled={disabled}>
        {words.addFont}
      </button>
    </form>
  )
}

/**
 * **[#180]** The family-name field (37.4): its typing stops at 64 characters, and a character 13.3
 * refuses is not taken at all -- the field keeps what it held, the caret where it was.
 */
function NameInput({ id, words, value, disabled, onChange, onBlur }: { id: string; words: ThemeWords; value: string; disabled: boolean; onChange: (value: string) => void; onBlur?: () => void }) {
  return (
    <div className="admin-field">
      <label htmlFor={id}>{words.fontFamily}</label>
      <input
        id={id}
        value={value}
        required
        disabled={disabled}
        onChange={(event) => {
          const element = event.currentTarget
          if (!refusedInFamily(element.value)) return onChange(heldToLimit(element, value, element.value, NAME_LIMIT))
          const caret = Math.max(0, (element.selectionEnd ?? element.value.length) - (element.value.length - value.length))
          element.value = value
          element.setSelectionRange(caret, caret)
        }}
        onBlur={onBlur}
      />
    </div>
  )
}

/**
 * The Tree's own family's name, saved when the field is left (33.8); **[#180]** held to 37.4's
 * rules, and refused with `fontNameTaken` where the other role's family has that name over other
 * files, before anything is sent. An emptied field goes back to the name it held.
 */
function FamilyName({ id, words, value, disabled, taken, onSave }: { id: string; words: ThemeWords; value: string; disabled: boolean; taken: (name: string) => boolean; onSave: (name: string) => void }) {
  const [name, setName] = useState(value)
  const [refused, setRefused] = useState(false)
  const left = (): void => {
    const trimmed = name.trim()
    if (trimmed === '' || trimmed === value) return setName(value)
    if (taken(trimmed)) return setRefused(true)
    setRefused(false)
    onSave(trimmed)
  }
  return (
    <>
      <NameInput id={id} words={words} value={name} disabled={disabled} onChange={setName} onBlur={left} />
      {refused && (
        <p className="admin-error" role="alert">
          {words.fontNameTaken}
        </p>
      )}
    </>
  )
}

/**
 * **[#180]** The licence dropdown (37.5): the six licences by name, then "Another licence…" with
 * the free line under it, required and at most 200 characters. It shows the entry whose stored
 * string is `value` exactly, and "Another licence…" with `value` in its line for anything else,
 * so a hand-made line is shown and kept as written. A listed licence is told at once; the free
 * line when it is left.
 */
function LicencePicker({ licences, words, value, disabled, onChange }: { licences: readonly FontLicence[]; words: ThemeWords; value: string; disabled: boolean; onChange: (licence: string) => void }) {
  const listed = licences.some((licence) => licence.stored === value)
  const [other, setOther] = useState(value !== '' && !listed)
  const [line, setLine] = useState(listed ? '' : value)
  // One per role, for its own family or its upload: an id of their own, the same on the server and in the browser.
  const id = `theme-licence${useId()}`
  return (
    <>
      <div className="admin-field">
        <span>
          <label htmlFor={id}>{words.fontLicence}</label>
          <Hint id={`${id}-hint`} text={words.fontLicenceHint} name={words.hint} />
        </span>
        <select
          id={id}
          name="licence-choice"
          className="editor-select panel-select"
          value={other ? 'other' : listed ? value : ''}
          required
          disabled={disabled}
          onChange={(event) => {
            const choice = event.currentTarget.value
            setOther(choice === 'other')
            if (choice !== 'other') onChange(choice)
            else if (line.trim() !== '') onChange(line.trim())
          }}
        >
          {/* An upload's licence starts unchosen: the creator states it, the panel does not guess it. */}
          {value === '' && !other && <option value="" disabled />}
          {licences.map((licence) => (
            <option key={licence.id} value={licence.stored}>
              {licence.name}
            </option>
          ))}
          <option value="other">{words.licenceOther}</option>
        </select>
      </div>
      {other && (
        <div className="admin-field">
          <label htmlFor={`${id}-line`}>{words.licenceOther}</label>
          <input
            id={`${id}-line`}
            name="licence"
            value={line}
            required
            disabled={disabled}
            onChange={(event) => setLine(heldToLimit(event.currentTarget, line, event.currentTarget.value, LICENCE_LIMIT))}
            onBlur={() => line.trim() !== '' && line.trim() !== value && onChange(line.trim())}
          />
        </div>
      )}
    </>
  )
}

/** **[#180]** A font file's weight and style (33.8), with the hint that says what they are. */
function WeightAndStyle({ id, words, disabled }: { id: string; words: ThemeWords; disabled: boolean }) {
  return (
    <div className="panel-actions">
      <div className="admin-field theme-weight">
        <span>
          <label htmlFor={id}>{words.fontWeight}</label>
          <Hint id={`${id}-hint`} text={words.fontFileHint} name={words.hint} />
        </span>
        <input id={id} name="weight" defaultValue="400" required disabled={disabled} />
      </div>
      <label className="theme-italic">
        <input name="italic" type="checkbox" disabled={disabled} /> {words.fontItalic}
      </label>
    </div>
  )
}

/** What the add-a-file form sends: a WOFF2 file with its weight and style. */
interface FontForm {
  file: File | undefined
  weight: string
  style: 'normal' | 'italic'
}

/** One more file for the Tree's own family (33.8); reset when it is saved. */
function FontFileForm({ id, words, disabled, onSubmit }: { id: string; words: ThemeWords; disabled: boolean; onSubmit: (form: FontForm) => Promise<boolean> }) {
  const submitted = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    const element = event.currentTarget
    const data = new FormData(element)
    const file = data.get('file')
    const saved = await onSubmit({
      file: file instanceof File && file.size > 0 ? file : undefined,
      weight: String(data.get('weight') ?? ''),
      style: data.get('italic') ? 'italic' : 'normal',
    })
    if (saved) element.reset()
  }
  return (
    <form className="theme-font-form" onSubmit={submitted}>
      <div className="admin-field">
        <label htmlFor={`${id}-input`}>{words.fontFile}</label>
        <input id={`${id}-input`} name="file" type="file" accept=".woff2,font/woff2" required disabled={disabled} />
      </div>
      <WeightAndStyle id={`${id}-weight`} words={words} disabled={disabled} />
      <button type="submit" className="admin-submit" disabled={disabled}>
        {words.addFontFile}
      </button>
    </form>
  )
}

/** The contrast warning (issue #64): one line per pairing the chosen colours miss, or nothing; **[#180]** with a hint that says what it measures. */
function ContrastWarning({ words, found }: { words: ThemeWords; found: Shortfall[] }) {
  if (found.length === 0) return null
  const name = (role: Shortfall['text']): string => {
    if (role === 'on-accent-secondary') return words.colourAnswerLabel
    return words[ROLES.find(([candidate]) => candidate === role)![1]] as string
  }
  return (
    <div className="theme-contrast" role="status" data-contrast-warning="">
      <p>
        {words.lowContrast}
        <Hint id="theme-contrast-hint" text={words.contrastHint} name={words.hint} />
      </p>
      <ul>
        {found.map((shortfall) => (
          <li key={`${shortfall.text} ${shortfall.on}`}>{`${name(shortfall.text)} ${words.contrastOn} ${name(shortfall.on)}: ${shortfall.ratio.toFixed(2)} : 1, ${words.contrastNeeds} ${shortfall.minimum} : 1`}</li>
        ))}
      </ul>
    </div>
  )
}
