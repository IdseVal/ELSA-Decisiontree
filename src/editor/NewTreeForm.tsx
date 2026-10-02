'use client'

/**
 * The new-Tree form behind the + tile (docs/specs/application.md 27; ADR-133-new-tree-form,
 * **[#168]** as the owner simplified it): one title, the languages, the first of them the
 * default, and `create`. The creator is never asked for an address: it is derived from the
 * title, and an address the route refuses -- taken, or a reserved word -- is followed by the
 * next (`treeIdOf`). It posts to `/admin/api/trees`, shows any other refusal with every value
 * kept, and on 201 goes to the editor of the new Tree's root Node.
 *
 * Disabled until the script runs, as every admin form (`useHydrated`).
 */
import { useState, type FormEvent } from 'react'
import { countedLength } from '../tree/grammar.ts'
import { useHydrated } from './hydrated.ts'
import { LanguageTags } from './LanguageTags.tsx'
import { send, type Answer } from './request.ts'
import { treeIdOf } from './slug.ts'

/** The chrome words the form says; strings, because a client component takes no module. */
export interface NewTreeWords {
  newTree: string
  languages: string
  addLanguage: string
  makeDefault: string
  default: string
  removeLanguage: string
  languageHint: string
  title: string
  create: string
  requestFailed: string
}

/** The title's limit (tree-format.md 5.7): a counter, not a wall -- past it is a to-do (19.2). */
const TITLE_MAX = 80

/** Every Tree the route creates starts at this one empty Node (19.2, 27.2). */
const ROOT = 'start'

/** How many addresses are tried before the form gives up: far more than a name ever needs. */
const ATTEMPTS = 20

/** Where a refusal is shown: at the languages, or under the button. */
interface Refusal {
  field: 'languages' | 'form'
  text: string
}

/** What `POST /admin/api/trees` takes (22.1). */
type Creation = { id: string; languages: string[]; title: Record<string, string> }

/**
 * The editor of the new Tree's root Node (27.2): in the page's language when the Tree
 * declares it, else in its default -- which, as on every address, the query leaves out (4.1).
 */
export function editorHref(id: string, languages: string[], pageLanguage: string): string {
  const shown = languages.includes(pageLanguage) ? pageLanguage : languages[0]!
  const path = `/admin/trees/${id}/${ROOT}`
  return shown === languages[0] ? path : `${path}?lang=${encodeURIComponent(shown)}`
}

/** Whether the route refused the address itself: taken (409) or a reserved word (422 at `id`). */
function addressRefused(answer: Answer | null): boolean {
  return answer?.status === 409 || (answer?.status === 422 && answer.body?.violations?.[0]?.keyPath === 'id')
}

/**
 * Creates the Tree titled `title` (27.2): the title is the default language's, the other
 * languages' titles start empty -- the to-do V-L10N reports (19.2) -- and the address is the
 * title's, followed by the next while the route refuses it. Resolves with the last address
 * tried and the route's answer to it; `post` is the request, a parameter so a test can answer.
 */
export async function createTree(
  title: string,
  languages: string[],
  post: (creation: Creation) => Promise<Answer | null> = (creation) => send('POST', '/admin/api/trees', creation),
): Promise<{ id: string; answer: Answer | null }> {
  const titles = Object.fromEntries(languages.map((language, index) => [language, index === 0 ? title : '']))
  const refused: string[] = []
  for (;;) {
    const id = treeIdOf(title, refused)
    const answer = await post({ id, languages, title: titles })
    refused.push(id)
    if (!addressRefused(answer) || refused.length === ATTEMPTS) return { id, answer }
  }
}

/** The refusal the route's answer means (27.2); null for the 201. */
export function refusalOf(answer: Answer | null, words: NewTreeWords): Refusal | null {
  if (answer?.status === 201) return null
  const at = answer?.status === 422 ? answer.body?.violations?.[0]?.keyPath : undefined
  // The route's own check names `languages`; the schema's, a pointer such as `/languages/1`.
  if (at !== undefined && /^\/?languages\b/.test(at)) return { field: 'languages', text: words.languageHint }
  return { field: 'form', text: words.requestFailed }
}

export function NewTreeForm({ lang, words }: { lang: string; words: NewTreeWords }) {
  const enhanced = useHydrated()
  const [title, setTitle] = useState('')
  const [languages, setLanguages] = useState([lang])
  const [refusal, setRefusal] = useState<Refusal | null>(null)
  const [busy, setBusy] = useState(false)

  const addLanguage = (added: string): void => {
    setLanguages([...languages, added])
    if (refusal?.field === 'languages') setRefusal(null)
  }

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setBusy(true)
    const { id, answer } = await createTree(title, languages)
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
        <div className="new-tree-title">
          <label className="new-tree-label" htmlFor="new-tree-title">
            {words.title}
          </label>
          <span className="new-tree-count" id="new-tree-title-count">
            {countedLength(title)} / {TITLE_MAX}
          </span>
          <input
            id="new-tree-title"
            name="title"
            lang={languages[0]}
            required
            aria-describedby="new-tree-title-count"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <LanguageTags
          id="new-tree-languages"
          languages={languages}
          words={words}
          removable={() => languages.length > 1}
          onAdd={addLanguage}
          onRemove={(language) => setLanguages(languages.filter((other) => other !== language))}
          onMakeDefault={(language) => setLanguages([language, ...languages.filter((other) => other !== language)])}
          error={at('languages')}
        />

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
