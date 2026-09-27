'use client'

/**
 * The new-Tree form behind the + tile (docs/specs/application.md 27; ADR-133-new-tree-form):
 * the id, proposed from the first title typed until the creator edits it; the languages,
 * the first of them the default; a title per language; and `create`. It checks the id and
 * the tag grammars before it sends, posts to `/admin/api/trees`, shows a refusal at its
 * field with every value kept, and on 201 goes to the editor of the new Tree's root Node.
 *
 * Disabled until the script runs, as every admin form (`useHydrated`).
 */
import { useState, type FormEvent } from 'react'
import { countedLength, isId } from '../tree/grammar.ts'
import { Field } from './AccountForms.tsx'
import { useHydrated } from './hydrated.ts'
import { LanguageTags } from './LanguageTags.tsx'
import { send, type Answer } from './request.ts'
import { proposedId } from './slug.ts'

/** The chrome words the form says; strings, because a client component takes no module. */
export interface NewTreeWords {
  newTree: string
  treeId: string
  treeIdHint: string
  treeIdFixed: string
  treeIdTaken: string
  treeIdReserved: string
  languages: string
  addLanguage: string
  makeDefault: string
  default: string
  removeLanguage: string
  languageHint: string
  languagesLater: string
  title: string
  create: string
  requestFailed: string
}

/** The title's limit (tree-format.md 5.7): a counter, not a wall -- past it is a to-do (19.2). */
const TITLE_MAX = 80

/** Every Tree the route creates starts at this one empty Node (19.2, 27.2). */
const ROOT = 'start'

/** Where a refusal is shown: at the id, at the languages, or under the button. */
interface Refusal {
  field: 'id' | 'languages' | 'form'
  text: string
}

/**
 * The editor of the new Tree's root Node (27.2): in the page's language when the Tree
 * declares it, else in its default -- which, as on every address, the query leaves out (4.1).
 */
export function editorHref(id: string, languages: string[], pageLanguage: string): string {
  const shown = languages.includes(pageLanguage) ? pageLanguage : languages[0]!
  const path = `/admin/trees/${id}/${ROOT}`
  return shown === languages[0] ? path : `${path}?lang=${encodeURIComponent(shown)}`
}

/** The refusal the route's answer means (27.2); null for the 201. */
export function refusalOf(answer: Answer | null, words: NewTreeWords): Refusal | null {
  if (answer?.status === 201) return null
  if (answer?.status === 409) return { field: 'id', text: words.treeIdTaken }
  const at = answer?.status === 422 ? answer.body?.violations?.[0]?.keyPath : undefined
  // The script sent an id of the right grammar, so an id the route refuses is a reserved word.
  if (at === 'id') return { field: 'id', text: words.treeIdReserved }
  // The route's own check names `languages`; the schema's, a pointer such as `/languages/1`.
  if (at !== undefined && /^\/?languages\b/.test(at)) return { field: 'languages', text: words.languageHint }
  return { field: 'form', text: words.requestFailed }
}

export function NewTreeForm({ lang, words }: { lang: string; words: NewTreeWords }) {
  const enhanced = useHydrated()
  const [id, setId] = useState('')
  // The proposal follows the first title typed until the creator writes the id themselves.
  const [idEdited, setIdEdited] = useState(false)
  const [proposedFrom, setProposedFrom] = useState<string | null>(null)
  const [languages, setLanguages] = useState([lang])
  const [titles, setTitles] = useState<Record<string, string>>({})
  const [refusal, setRefusal] = useState<Refusal | null>(null)
  const [busy, setBusy] = useState(false)

  const setTitle = (language: string, value: string): void => {
    setTitles({ ...titles, [language]: value })
    if (!idEdited && (proposedFrom === null || proposedFrom === language)) {
      setProposedFrom(language)
      setId(proposedId(value))
    }
  }

  const addLanguage = (added: string): void => {
    setLanguages([...languages, added])
    if (refusal?.field === 'languages') setRefusal(null)
  }

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (!isId(id)) {
      setRefusal({ field: 'id', text: words.treeIdHint })
      return
    }
    setBusy(true)
    const title = Object.fromEntries(languages.map((language) => [language, titles[language] ?? '']))
    const answer = await send('POST', '/admin/api/trees', { id, languages, title })
    const refused = refusalOf(answer, words)
    if (!refused) {
      window.location.assign(editorHref(id, languages, lang))
      return
    }
    setBusy(false)
    setRefusal(refused)
  }

  const at = (field: Refusal['field']): string | undefined => (refusal?.field === field ? refusal.text : undefined)

  return (
    <form className="admin-card admin-form new-tree" method="post" onSubmit={submit} aria-labelledby="new-tree">
      <h1 id="new-tree">{words.newTree}</h1>
      <fieldset disabled={!enhanced || busy}>
        <Field label={words.treeId} error={at('id')} hint={words.treeIdHint}>
          <input
            name="id"
            autoCapitalize="none"
            spellCheck={false}
            required
            maxLength={64}
            value={id}
            onChange={(event) => {
              setIdEdited(true)
              setId(event.target.value)
            }}
          />
        </Field>
        <p className="admin-hint new-tree-address" data-address="">
          /{id || '…'}/{ROOT}
        </p>
        <p className="admin-note">{words.treeIdFixed}</p>

        <LanguageTags
          id="new-tree-languages"
          languages={languages}
          words={words}
          removable={() => languages.length > 1}
          onAdd={addLanguage}
          onRemove={(language) => setLanguages(languages.filter((other) => other !== language))}
          onMakeDefault={(language) => setLanguages([language, ...languages.filter((other) => other !== language)])}
          note={words.languagesLater}
          error={at('languages')}
        />

        {languages.map((language) => {
          const value = titles[language] ?? ''
          return (
            <Field key={language} label={`${words.title} (${language})`} hint={`${countedLength(value)} / ${TITLE_MAX}`}>
              <input name={`title-${language}`} lang={language} value={value} onChange={(event) => setTitle(language, event.target.value)} />
            </Field>
          )
        })}

        <button type="submit" className="admin-submit">
          {words.create}
        </button>
        {at('form') && (
          <p className="admin-error" role="alert">
            {at('form')}
          </p>
        )}
      </fieldset>
    </form>
  )
}
