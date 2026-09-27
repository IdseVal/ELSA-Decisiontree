'use client'

/**
 * A Tree's languages as a row of tags with a field to add one (docs/specs/application.md
 * 27.1, 33.5; ADR-133-new-tree-form decision 1): the new-Tree form's, and **[#147]** the top
 * panel's "This Tree" section, which is "the same control". The first tag is the default
 * language (tree-format.md 3.3), marked `default`; every other tag offers `makeDefault`; a
 * cross removes a tag where the caller allows it. The tag grammar is checked here before a
 * tag is handed on; `en` and `nl`, the chrome's, are offered with one click.
 *
 * The caller holds the list and decides what a click does: the form changes its own state,
 * the panel sends a write.
 */
import { useState, type KeyboardEvent } from 'react'
import { isLanguageTag } from '../tree/grammar.ts'

/** The chrome words the control says. */
export interface LanguageTagWords {
  languages: string
  addLanguage: string
  makeDefault: string
  default: string
  removeLanguage: string
  languageHint: string
}

/** The two languages offered with one click: the chrome's (ADR-133-new-tree-form decision 1). */
const OFFERED = ['en', 'nl']

export function LanguageTags({
  id,
  languages,
  words,
  removable,
  onAdd,
  onRemove,
  onMakeDefault,
  note,
  error,
  disabled = false,
}: {
  /** The id of the group's label. */
  id: string
  languages: string[]
  words: LanguageTagWords
  /** Whether the tag at `index` has a remove cross. */
  removable: (index: number) => boolean
  /** Called with a tag of the grammar that is not declared yet. */
  onAdd: (tag: string) => void
  onRemove: (tag: string) => void
  onMakeDefault: (tag: string) => void
  /** The sentence under the control while nothing is refused. */
  note?: string
  /** A refusal from the caller's request, shown in the note's place. */
  error?: string
  disabled?: boolean
}) {
  const [tag, setTag] = useState('')
  const [malformed, setMalformed] = useState(false)

  const add = (candidate: string): void => {
    const added = candidate.trim().toLowerCase()
    if (!isLanguageTag(added)) {
      setMalformed(true)
      return
    }
    setMalformed(false)
    setTag('')
    if (!languages.includes(added)) onAdd(added)
  }

  const addOnEnter = (event: KeyboardEvent<HTMLInputElement>): void => {
    // Enter in the tag field adds the tag; it does not submit the form around it.
    if (event.key !== 'Enter') return
    event.preventDefault()
    add(tag)
  }

  const refusal = malformed ? words.languageHint : error

  return (
    <div className="admin-field-group" role="group" aria-labelledby={id}>
      <span className="new-tree-label" id={id}>
        {words.languages}
      </span>
      <ul className="new-tree-tags">
        {languages.map((language, index) => (
          <li key={language} className="new-tree-tag" data-language={language}>
            <span className="new-tree-tag-name">{language}</span>
            {index === 0 ? (
              <span className="new-tree-default">{words.default}</span>
            ) : (
              <button type="button" className="admin-link" disabled={disabled} onClick={() => onMakeDefault(language)}>
                {words.makeDefault}
              </button>
            )}
            {removable(index) && (
              <button
                type="button"
                className="new-tree-remove"
                aria-label={`${words.removeLanguage} ${language}`}
                disabled={disabled}
                onClick={() => onRemove(language)}
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="new-tree-add">
        <input
          name="language"
          aria-label={words.addLanguage}
          autoCapitalize="none"
          spellCheck={false}
          value={tag}
          disabled={disabled}
          onChange={(event) => setTag(event.target.value)}
          onKeyDown={addOnEnter}
        />
        <button type="button" className="new-tree-button" disabled={disabled} onClick={() => add(tag)}>
          {words.addLanguage}
        </button>
        {OFFERED.filter((offered) => !languages.includes(offered)).map((offered) => (
          <button key={offered} type="button" className="new-tree-button" disabled={disabled} onClick={() => add(offered)}>
            {offered}
          </button>
        ))}
      </div>
      {(refusal ?? note) && (
        <p className={refusal ? 'admin-error' : 'admin-note'} role={refusal ? 'alert' : undefined}>
          {refusal ?? note}
        </p>
      )}
    </div>
  )
}
