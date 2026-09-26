'use client'

/**
 * The explainer Sheet (docs/specs/application.md 32.2, 32.4; ADR-133-explainers-in-the-editor
 * decisions 2 and 4): where one explainer's term and text are written, in every declared
 * language at once, because an explainer is one thing in every language. Titled by the term in
 * the page's language, or by the id while that is empty. One section per language in the
 * manifest's order, the page's first and open, each saying whether that language's description
 * marks the explainer (V-EXPLAINER); under them `unmark`.
 *
 * `unmark` takes the marks of this explainer out of the page's language's description and,
 * when no other language's description marks it either, removes the explainer and closes.
 *
 * Imports of `src/`: types, and nothing else (34.4).
 */
import { useEffect, useRef } from 'react'
import { useEditor } from './Editor.tsx'
import { Field, type FieldWords } from './Field.tsx'
import { marks, unmarked } from './Marker.tsx'
import type { FieldLimit } from './mode.ts'

/** The maxima of an explainer's two texts (tree-format.md 5.7, 5.9). */
const TERM_LIMIT: FieldLimit = { characters: 40 }
const TEXT_LIMIT: FieldLimit = { characters: 200 }

export function ExplainerSheet({
  nodeId,
  id,
  languages,
  onClose,
}: {
  nodeId: string
  /** The explainer's id: stable, so it names the explainer while its term changes (decision 5). */
  id: string
  /** The draft's declared languages, in the manifest's order. */
  languages: string[]
  onClose: () => void
}) {
  const api = useEditor()
  const { lang, words } = api
  const panel = useRef<HTMLDivElement>(null)
  const close = useRef<HTMLButtonElement>(null)
  const node = api.nodes[nodeId]
  const index = node?.explainers.findIndex((explainer) => explainer.id === id) ?? -1
  const explainer = index >= 0 ? node!.explainers[index] : undefined
  const order = languages.includes(lang) ? [lang, ...languages.filter((other) => other !== lang)] : languages
  const fieldWords: FieldWords = { missingText: words.missingText, characters: words.characters, lines: words.lines }
  const descriptionPath = `description.${lang}`

  // The focus comes into the Sheet: to a field an operation named (the `text` of a term just
  // marked, 32.1), else to the close button, so Escape and Tab start here.
  useEffect(() => {
    if (!panel.current?.contains(document.activeElement)) close.current?.focus()
  }, [])

  // Escape closes the Sheet; an open explainer panel hears it first and takes the first one (10.8).
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const unmark = (): void => {
    if (!node) return
    const description = node.description[lang] ?? ''
    const next = unmarked(description, id)
    if (next !== description) {
      api.write(nodeId, descriptionPath, next)
      api.flush(nodeId, descriptionPath)
    }
    if (!languages.some((other) => other !== lang && marks(node.description[other], id))) {
      api.operate(nodeId, { op: 'remove-explainer', id })
      onClose()
    }
  }

  return (
    <div className="editor-explainer">
      <div className="sheet-backdrop" onClick={onClose} />
      <div ref={panel} className="sheet-panel explainer-sheet" role="dialog" aria-modal="true" aria-labelledby="explainer-sheet-title">
        <h2 id="explainer-sheet-title" lang={lang}>
          {explainer?.term[lang]?.trim() || id}
        </h2>
        {explainer &&
          order.map((language) => {
            const marked = marks(node!.description[language], id)
            return (
              <details key={language} className="explainer-language" open={language === lang || undefined} data-lang={language}>
                <summary>
                  <span className="editor-tag">{language}</span>
                  <span className={marked ? 'explainer-marked' : 'explainer-marked explainer-marked--not'}>{marked ? words.markedIn : words.notMarkedIn}</span>
                </summary>
                <label className="editor-row">
                  <span>{words.term}</span>
                  <Field nodeId={nodeId} path={`explainers[${index}].term`} lang={language} value={explainer.term[language] ?? ''} limit={TERM_LIMIT} words={fieldWords} />
                </label>
                <label className="editor-row">
                  <span>{words.explanation}</span>
                  <Field nodeId={nodeId} path={`explainers[${index}].text`} lang={language} value={explainer.text[language] ?? ''} limit={TEXT_LIMIT} words={fieldWords} />
                </label>
              </details>
            )
          })}
        <div className="sheet-controls explainer-controls">
          {/* A description write still on its way would be overwritten by an unmark read from the older text. */}
          <button type="button" disabled={!explainer || api.readOnly || api.hasWrite(nodeId, descriptionPath)} onClick={unmark}>
            {words.unmark}
          </button>
          <button ref={close} type="button" className="sheet-close" onClick={onClose}>
            {words.close}
          </button>
        </div>
      </div>
    </div>
  )
}
