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
 * to the Theme's author (4.3.3). Imports of `src/`: types and `contrast.ts` (34.4).
 */
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Chrome } from '../chrome.ts'
import { shortfalls, type Shortfall } from '../contrast.ts'
import type { ColourRole, Colours, FontFamily, Logo, Theme } from '../tree/types.ts'
import { useEditor } from './Editor.tsx'
import { themeCalls, type Refusal, type Typed, type WriteResponse } from './writes.ts'

/** The chrome strings the Theme panel says. */
export type ThemeWords = Pick<
  Chrome,
  | 'theme'
  | 'logo'
  | 'logoAlt'
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
  | 'contrastShort'
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
>

/** How long a colour waits for the next change before it is saved: a picker dragged is one write, not fifty. */
const COLOUR_SETTLE_MS = 400

/** The seven roles in the format's order (4.3.3), each with the word that says what it paints. */
const ROLES: readonly [ColourRole, keyof ThemeWords][] = [
  ['background', 'colourBackground'],
  ['surface', 'colourSurface'],
  ['text', 'colourText'],
  ['text-muted', 'colourTextMuted'],
  ['accent', 'colourAccent'],
  ['accent-secondary', 'colourAccentSecondary'],
  ['danger', 'colourDanger'],
]

export function ThemePanel({
  treeId,
  lang,
  languages,
  words,
  theme: initialTheme,
  defaults,
  filesHref,
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

  /** Writes one part whole, or removes it with null; the page repaints in the draft's new look. */
  const save = async <Part extends keyof Theme>(part: Part, value: Theme[Part] | null): Promise<boolean> => {
    setBusy(true)
    setError(null)
    try {
      const answer = await themeCalls.write(treeId, part, value)
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

  /** Uploads one file into the Tree's theme/ and answers the server's name for it, or null. */
  const upload = async (file: File | null | undefined): Promise<string | null> => {
    if (!file) return null
    setBusy(true)
    setError(null)
    try {
      const answer = await themeCalls.upload(treeId, file)
      if (answer.status === 201 && answer.body && 'file' in answer.body) return answer.body.file
      setError(refusal(answer))
      return null
    } finally {
      setBusy(false)
    }
  }

  const logo = theme.logo
  const uploadLogo = async (file: File | undefined): Promise<void> => {
    const light = await upload(file)
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

  const families = theme.fonts ?? []
  const saveFamilies = (next: FontFamily[]): Promise<boolean> => save('fonts', next.length > 0 ? next : null)

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
              {ROLES.map(([role, word]) => (
                <label key={role} className="theme-colour">
                  <input type="color" data-role={role} value={colours[role]} disabled={readOnly} onChange={(event) => changeColour(role, event.currentTarget.value)} />
                  <span>{words[word] as string}</span>
                </label>
              ))}
            </div>
            <ContrastWarning words={words} found={shortfalls(colours)} />
            <button type="button" className="admin-link" disabled={disabled} onClick={() => save('colours', null)}>
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
          const family = families.find((candidate) => candidate.role === role)
          const others = families.filter((candidate) => candidate.role !== role)
          const replace = (next: FontFamily | null): Promise<boolean> => saveFamilies(next ? [...others, next] : others)
          return (
            <div key={role} className="theme-font" data-font-role={role}>
              <h6>{role === 'body' ? words.fontBody : words.fontHeading}</h6>
              {family ? (
                <>
                  <FamilyText key={`family ${family.family}`} label={words.fontFamily} value={family.family} disabled={disabled} onSave={(value) => replace({ ...family, family: value })} />
                  <FamilyText key={`licence ${family.licence}`} label={words.fontLicence} value={family.licence} disabled={disabled} onSave={(value) => replace({ ...family, licence: value })} />
                  <ul className="theme-font-files">
                    {family.files.map((face, index) => (
                      <li key={face.file}>
                        <code>{face.file}</code> {face.weight} {face.style === 'italic' ? words.fontItalic : ''}
                        <button
                          type="button"
                          className="admin-link"
                          disabled={disabled}
                          onClick={() => replace(family.files.length > 1 ? { ...family, files: family.files.filter((_, at) => at !== index) } : null)}
                        >
                          {words.removeFontFile}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <FontFileForm
                    words={words}
                    disabled={disabled}
                    submit={words.addFontFile}
                    onSubmit={async (form) => {
                      const file = await upload(form.file)
                      return file !== null && replace({ ...family, files: [...family.files, { file, weight: form.weight, style: form.style }] })
                    }}
                  />
                  <button type="button" className="admin-link" disabled={disabled} onClick={() => replace(null)}>
                    {words.removeFont}
                  </button>
                </>
              ) : (
                <FontFileForm
                  words={words}
                  disabled={disabled}
                  submit={words.addFont}
                  family
                  onSubmit={async (form) => {
                    const file = await upload(form.file)
                    return file !== null && replace({ family: form.family, role, files: [{ file, weight: form.weight, style: form.style }], licence: form.licence })
                  }}
                />
              )}
            </div>
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

/** The logo's alternative text in the page's language, saved when the field is left (28.2). */
function AltText({ words, lang, value, disabled, onSave }: { words: ThemeWords; lang: string; value: string; disabled: boolean; onSave: (value: string) => void }) {
  const [text, setText] = useState(value)
  return (
    <label className="admin-field">
      <span>
        {words.logoAlt} <span className="panel-tag">{lang}</span>
      </span>
      <input lang={lang} value={text} disabled={disabled} onChange={(event) => setText(event.currentTarget.value)} onBlur={() => text !== value && onSave(text)} />
    </label>
  )
}

/** A family's name or licence line, saved when the field is left. */
function FamilyText({ label, value, disabled, onSave }: { label: string; value: string; disabled: boolean; onSave: (value: string) => void }) {
  const [text, setText] = useState(value)
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input value={text} disabled={disabled} onChange={(event) => setText(event.currentTarget.value)} onBlur={() => text !== value && onSave(text)} />
    </label>
  )
}

/** What a font form sends: a WOFF2 file with its weight and style, and for a new family its name and licence. */
interface FontForm {
  file: File | undefined
  weight: string
  style: 'normal' | 'italic'
  family: string
  licence: string
}

/** Adds a family (`family`: with its name and licence) or one more file to a family; reset when it is saved. */
function FontFileForm({
  words,
  disabled,
  submit,
  family = false,
  onSubmit,
}: {
  words: ThemeWords
  disabled: boolean
  submit: string
  family?: boolean
  onSubmit: (form: FontForm) => Promise<boolean>
}) {
  const submitted = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    const element = event.currentTarget
    const data = new FormData(element)
    const file = data.get('file')
    const saved = await onSubmit({
      file: file instanceof File && file.size > 0 ? file : undefined,
      weight: String(data.get('weight') ?? ''),
      style: data.get('italic') ? 'italic' : 'normal',
      family: String(data.get('family') ?? ''),
      licence: String(data.get('licence') ?? ''),
    })
    if (saved) element.reset()
  }
  return (
    <form className="theme-font-form" onSubmit={submitted}>
      {family && (
        <>
          <label className="admin-field">
            <span>{words.fontFamily}</span>
            <input name="family" required disabled={disabled} />
          </label>
          <label className="admin-field">
            <span>{words.fontLicence}</span>
            <input name="licence" required disabled={disabled} />
          </label>
        </>
      )}
      <label className="admin-field">
        <span>{words.fontFile}</span>
        <input name="file" type="file" accept=".woff2,font/woff2" required disabled={disabled} />
      </label>
      <div className="panel-actions">
        <label className="admin-field theme-weight">
          <span>{words.fontWeight}</span>
          <input name="weight" defaultValue="400" required disabled={disabled} />
        </label>
        <label className="theme-italic">
          <input name="italic" type="checkbox" disabled={disabled} /> {words.fontItalic}
        </label>
        <button type="submit" className="admin-submit" disabled={disabled}>
          {submit}
        </button>
      </div>
    </form>
  )
}

/** The contrast warning (issue #64): one line per pairing the chosen colours miss, or nothing. */
function ContrastWarning({ words, found }: { words: ThemeWords; found: Shortfall[] }) {
  if (found.length === 0) return null
  const name = (role: Shortfall['text']): string => {
    if (role === 'on-accent-secondary') return words.colourAnswerLabel
    return words[ROLES.find(([candidate]) => candidate === role)![1]] as string
  }
  return (
    <div className="theme-contrast" role="status" data-contrast-warning="">
      <p>{words.lowContrast}</p>
      <ul>
        {found.map((shortfall) => (
          <li key={`${shortfall.text} ${shortfall.on}`}>{words.contrastShort(name(shortfall.text), name(shortfall.on), shortfall.ratio.toFixed(2), String(shortfall.minimum))}</li>
        ))}
      </ul>
    </div>
  )
}
