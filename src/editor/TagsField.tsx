'use client'

/**
 * **[#273]** A Tree's tags in the top panel's "This Tree" (docs/specs/application.md 33.5;
 * ADR-273-tags): a chip per tag holding its text in the page's language, which is edited in
 * place and saved when it is left, and a cross that removes it; under them a field and `addTag`
 * that add one, while the Tree has fewer than eight (tree-format.md 5.7).
 *
 * One language at a time, as every field (28.2): a tag added here is written in the page's
 * language, and is the to-do in every other (V-L10N) until written there; a chip empty in this
 * language shows its default language's text as its placeholder, so the creator sees which tag
 * to translate. Each change writes the whole list, `PATCH { path: 'tags' }`, as a Theme part is
 * written (33.8), and the panel takes the stored list from the answer. A tag the Tree has
 * already in this language, letter case aside, is refused here before it is sent (V-TAGS).
 *
 * Imports of `src/`: types and the grammar, and nothing else (34.4).
 */
import { useState, type FormEvent } from 'react'
import { tagKey } from '../tree/grammar.ts'
import type { LocalisedText } from '../tree/types.ts'
import { useEditor } from './Editor.tsx'
import { heldToLimit } from './Field.tsx'
import { Hint } from './Hint.tsx'
import type { FieldLimit } from './mode.ts'
import { writeTags, type Refusal } from './writes.ts'

/** The chrome words the field says. */
export interface TagsWords {
  tags: string
  tagsHint: string
  placeholderTag: string
  addTag: string
  removeTag: string
  tagTaken: string
  hint: string
  requestFailed: string
}

/** tree-format.md 5.7: a tag is at most 30 characters, a Tree has at most eight. */
const TAG_LIMIT: FieldLimit = { characters: 30 }
const MAX_TAGS = 8

export function TagsField({
  treeId,
  lang,
  defaultLanguage,
  tags: initialTags,
  words,
}: {
  treeId: string
  /** The page's language: each chip shows and edits its tag in it (28.2). */
  lang: string
  /** The Tree's first language: a chip empty in `lang` shows its text there as a placeholder. */
  defaultLanguage: string
  /** The draft's tags at load. */
  tags: LocalisedText[]
  words: TagsWords
}) {
  const { setTree, readOnly } = useEditor()
  const [tags, setTags] = useState(initialTags)
  const [fresh, setFresh] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const disabled = busy || readOnly

  /** Whether `text` is in this language another tag's than the one at `except`. */
  const taken = (text: string, except: number): boolean => tags.some((tag, i) => i !== except && tagKey(tag[lang] ?? '') === tagKey(text))

  /** Writes `next` whole; the stored list comes back with the answer, or the old one stays with the reason. */
  const save = async (next: LocalisedText[]): Promise<boolean> => {
    setBusy(true)
    setError(null)
    try {
      const answer = await writeTags(treeId, next)
      if (answer.status !== 200 || !answer.body || !('manifest' in answer.body)) {
        const rules = ((answer.body as Refusal | null)?.violations ?? []).map((violation) => violation.rule)
        setError(rules.includes('V-TAGS') ? words.tagTaken : words.requestFailed)
        return false
      }
      setTags(answer.body.manifest?.tags ?? [])
      setTree(answer.body.tree)
      return true
    } finally {
      setBusy(false)
    }
  }

  const add = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    const text = fresh.trim()
    if (text === '') return
    if (taken(text, -1)) {
      setError(words.tagTaken)
      return
    }
    if (await save([...tags, { [lang]: text }])) setFresh('')
  }

  /** A chip left with its text changed: written, and answered whether it was, so a refused text is put back. */
  const reword = async (index: number, text: string): Promise<boolean> => {
    const trimmed = text.trim()
    if (trimmed === (tags[index]?.[lang] ?? '')) return true
    if (trimmed !== '' && taken(trimmed, index)) {
      setError(words.tagTaken)
      return false
    }
    return save(tags.map((tag, i) => (i === index ? { ...tag, [lang]: trimmed } : tag)))
  }

  return (
    <div className="admin-field-group panel-tags" role="group" aria-labelledby="panel-tags-label">
      <span className="new-tree-label">
        <span id="panel-tags-label">
          {words.tags} <span className="panel-tag">{lang}</span>
        </span>
        <Hint id="panel-tags-hint" text={words.tagsHint} name={words.hint} />
      </span>
      {tags.length > 0 && (
        <ul className="new-tree-tags">
          {tags.map((tag, index) => (
            // Keyed by the text the chip shows, so a chip whose tag changes under it -- a removed
            // neighbour, a stored rewording -- is drawn anew rather than keeping another tag's text.
            <li key={`${index} ${tag[lang] ?? ''}`} className="new-tree-tag" data-tag={index}>
              <TagText
                value={tag[lang] ?? ''}
                placeholder={tag[defaultLanguage] || words.placeholderTag}
                label={`${words.tags} ${index + 1}`}
                lang={lang}
                disabled={disabled}
                onLeave={(text) => reword(index, text)}
              />
              <button
                type="button"
                className="new-tree-remove"
                aria-label={`${words.removeTag} ${tag[lang] || tag[defaultLanguage] || ''}`.trim()}
                disabled={disabled}
                onClick={() => void save(tags.filter((_, i) => i !== index))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      {tags.length < MAX_TAGS && (
        <form className="new-tree-add" onSubmit={(event) => void add(event)}>
          <input
            name="tag"
            lang={lang}
            aria-label={words.placeholderTag}
            placeholder={words.placeholderTag}
            value={fresh}
            disabled={disabled}
            onChange={(event) => setFresh(heldToLimit(event.currentTarget, fresh, event.currentTarget.value, TAG_LIMIT))}
          />
          <button type="submit" className="new-tree-button" disabled={disabled || fresh.trim() === ''}>
            {words.addTag}
          </button>
        </form>
      )}
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * One chip's text, held to 30 characters as it is typed and handed on when the field is left or
 * Enter is pressed; emptied, or refused, it shows the stored text again -- the cross removes a tag.
 */
function TagText({
  value,
  placeholder,
  label,
  lang,
  disabled,
  onLeave,
}: {
  value: string
  placeholder: string
  label: string
  lang: string
  disabled: boolean
  onLeave: (text: string) => Promise<boolean>
}) {
  const [text, setText] = useState(value)
  return (
    <input
      className="panel-tag-text"
      lang={lang}
      aria-label={label}
      value={text}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(event) => setText(heldToLimit(event.currentTarget, text, event.currentTarget.value, TAG_LIMIT))}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur()
      }}
      onBlur={() => {
        if (text.trim() === '' && value !== '') setText(value)
        else void onLeave(text).then((stored) => stored || setText(value))
      }}
    />
  )
}
