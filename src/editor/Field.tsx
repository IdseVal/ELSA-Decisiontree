'use client'

/**
 * One editable region (docs/specs/application.md 28; ADR-133-bubble-edited-in-place),
 * rendered by the `field` slot where the public component renders a text. It is the box the
 * public text takes, outlined 1 pixel inside on hover and focus only, and it edits one
 * string: the field's text in the page's language, saved under `<path>.<lang>` through the
 * editor's queue 600 ms after the last keystroke and on blur.
 *
 * Three shapes. A **plain** field is one line: Enter blurs it and a line break becomes a
 * space (28.1). The **rich** description shows the rendered text while it is not being
 * edited -- the public element it was given, or its own render of the source after an edit
 * -- and the source, the Markdown subset of 3.4 as written, while it is; `<` followed by a
 * letter, `/` or `!` is refused at the field before sending (28.5). A **select** is a Source's
 * kind or a Terminal's outcome, drawn as the badge.
 *
 * While the field has the focus the right rim shows the counter pill -- `n / max`, counted
 * by the validator's own functions, and `lines / 2` for the description -- and under it one
 * tag per other declared language that has no text for this field, a link to the page in
 * that language (28.3). The rim is drawn from the page's body, fixed, beside the Bubble or
 * the Overlay the field is in, so it takes no pixel from the text area and nothing on the
 * page grows (28.6). Over the maximum the pill and the outline turn `danger`; typing never
 * stops (28.4). A refused write keeps the value on screen (29.4); a value a collaborator
 * changed under the field is outlined `accent` for five seconds (29.7).
 *
 * Imports of `src/`: `tree/measure.ts` and `markdown.ts`, and types (34.4).
 */
import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { richTextToHtml } from '../markdown.ts'
import { countedLength, estimatedLines } from '../tree/measure.ts'
import type { Explainer, Violation } from '../tree/types.ts'
import { useEditor } from './Editor.tsx'
import { keyOf, plainLine, RAW_HTML, valueAt } from './fields.ts'
import type { FieldLimit } from './mode.ts'
import type { Change } from './writes.ts'

/** The rim is 60 pixels wide, the outline included (10.1); the pill and the tags fit in it. */
const RIM_WIDTH = 60

/** The chrome words a field says; strings, because a client component takes no module. */
export interface FieldWords {
  missingText: string
  characters: string
  lines: string
}

/** Another declared language: the tag's text and where it leads (28.3). */
export interface OtherLanguage {
  lang: string
  href: string
}

export function Field({
  nodeId,
  path,
  lang,
  value,
  limit,
  rich = false,
  rendered,
  explainers = [],
  idPrefix = '',
  others = [],
  select,
  label,
  className = '',
  classByValue = false,
  words,
}: {
  nodeId: string
  /** The key path of 22.2 without its language: `title`, `sources[1].label`, `terminal.outcome`. */
  path: string
  /** The page's language for a localised text (28.2); null for a text that is not localised. */
  lang: string | null
  /** The text as the page rendered it. */
  value: string
  /** The maximum of 5.7; null for a select and a URL, which show no pill. */
  limit: FieldLimit | null
  /** The description: source text while focused, rendered text otherwise (28.5). */
  rich?: boolean
  /** The public element shown while a rich field is not being edited, until its text changes. */
  rendered?: ReactNode
  /** The Node's explainers, for the rich field's own render after an edit. */
  explainers?: Explainer[]
  idPrefix?: string
  /** The other declared languages, for the rim's tags (28.3). */
  others?: OtherLanguage[]
  /** A select's choices: the field is a `<select>` of them. */
  select?: Array<{ value: string; label: string }>
  /** The accessible name of a select. */
  label?: string
  /** Extra classes on a select: the outcome badge's. */
  className?: string
  /** Whether `<className>--<value>` is added too: the badge's colour follows its outcome. */
  classByValue?: boolean
  words: FieldWords
}) {
  const api = useEditor()
  const keyPath = lang === null ? path : `${path}.${lang}`
  const key = keyOf(nodeId, keyPath)
  const [text, setText] = useState(value)
  const [focused, setFocused] = useState(false)
  const [dirty, setDirty] = useState(false)
  const root = useRef<HTMLSpanElement>(null)
  const area = useRef<HTMLTextAreaElement>(null)
  const [rim, setRim] = useState<{ top: number; left: number } | null>(null)

  // The repaint rule of 29.7: a response's value replaces the screen's unless the field is
  // being edited or holds a value not yet accepted.
  const server = valueAt(api.nodes[nodeId], path, lang)
  useEffect(() => {
    if (server === undefined || focused || api.hasWrite(nodeId, keyPath) || server === text) return
    setText(server)
    setDirty(true)
    // The screen follows the store; the text it shows is the store's, not this render's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [server, api.version])

  // The field an operation created takes the focus once the page has re-rendered (28.1).
  useEffect(() => {
    if (api.focusKey === key) area.current?.focus()
  }, [api.focusKey, key])

  // The rim follows the field: on focus, on every keystroke (a wrapped title grows) and on resize.
  useLayoutEffect(() => {
    if (!focused || limit === null) {
      setRim(null)
      return
    }
    const place = (): void => {
      const box = (area.current ?? root.current)?.getBoundingClientRect()
      const host = root.current ? hostOf(root.current) : null
      if (!box || !host) return
      const edge = host.getBoundingClientRect().right
      setRim({ top: Math.round(box.top), left: Math.round(edge - RIM_WIDTH + 4) })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [focused, text, limit])

  const violations = api.violationsAt(nodeId, keyPath)
  const refused = violations.some((violation) => !(violation.advisory ?? true))
  const length = countedLength(text)
  const lines = limit?.lines !== undefined ? estimatedLines(text) : null
  const over = limit !== null && (length > limit.characters || (lines !== null && lines > limit.lines!))
  const changed = api.changedAt(nodeId, keyPath)
  const state = [
    'editor-field',
    focused ? 'editor-field--focused' : '',
    over ? 'editor-field--over' : '',
    refused ? 'editor-field--refused' : '',
    changed ? 'editor-field--changed' : '',
    rich ? 'editor-field--rich' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const commit = (next: string): void => {
    setText(next)
    setDirty(true)
    if (rich && RAW_HTML.test(next)) {
      const violation: Violation = { file: nodeId, keyPath, rule: 'V-HTML', message: 'raw HTML is not allowed in rich text', advisory: false }
      api.refuseLocally(nodeId, keyPath, violation)
      return
    }
    api.write(nodeId, keyPath, next)
  }

  const onFocus = (): void => {
    setFocused(true)
    api.setCurrent({ nodeId, keyPath })
  }
  const onBlur = (): void => {
    setFocused(false)
    api.setCurrent(null)
    api.flush(nodeId, keyPath)
  }
  // A click inside a summary would toggle the Overlay the button opens; the field takes it.
  const onClick = (event: MouseEvent): void => {
    if (root.current?.closest('summary')) event.preventDefault()
  }

  if (select) {
    const classes = ['editor-select', className, classByValue && className ? `${className}--${text}` : ''].filter(Boolean).join(' ')
    return (
      <span ref={root} className={state} data-field={key} onClick={onClick}>
        <select
          className={classes}
          value={text}
          aria-label={label}
          disabled={api.readOnly}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => {
            commit(event.target.value)
            api.flush(nodeId, keyPath)
          }}
        >
          {select.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
      </span>
    )
  }

  const editing = !rich || focused
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (!rich && event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

  return (
    <>
      <span ref={root} className={state} data-field={key} data-over={over || undefined} onClick={onClick}>
        {editing ? (
          // The grid and the mirror in `data-value` size the box to its text where the browser
          // has no `field-sizing`; both take the same font, so they break lines alike.
          <span className="editor-text" data-value={`${text} `}>
            <textarea
              ref={area}
              className="editor-input"
              value={text}
              rows={1}
              placeholder={words.missingText}
              disabled={api.readOnly}
              autoFocus={rich}
              spellCheck
              lang={lang ?? undefined}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => commit(rich ? event.target.value : plainLine(event.target.value))}
            />
          </span>
        ) : (
          <span
            className="editor-rendered"
            tabIndex={api.readOnly ? -1 : 0}
            onFocus={() => setFocused(true)}
            onClick={(event) => {
              // A marked term keeps its own click (#141); anywhere else opens the source.
              if (!(event.target instanceof Element && event.target.closest('.term'))) setFocused(true)
            }}
          >
            {dirty || rendered === undefined ? (
              text.trim() === '' ? (
                <span className="prose editor-placeholder">{words.missingText}</span>
              ) : (
                <div className="prose" dangerouslySetInnerHTML={{ __html: richTextToHtml(text, { explainers, lang: lang ?? '', idPrefix }) }} />
              )
            ) : (
              rendered
            )}
          </span>
        )}
      </span>
      {rim !== null &&
        limit !== null &&
        createPortal(
          <span className="editor-rim" style={{ top: rim.top, left: rim.left }} onMouseDown={(event) => event.preventDefault()}>
            <span className={`editor-pill${over ? ' editor-pill--over' : ''}`}>
              <span aria-label={words.characters}>
                {length} / {limit.characters}
              </span>
              {lines !== null && (
                <span aria-label={words.lines}>
                  {lines} / {limit.lines}
                </span>
              )}
            </span>
            {lang !== null &&
              others
                .filter((other) => (valueAt(api.nodes[nodeId], path, other.lang) ?? '').trim() === '')
                .map((other) => (
                  <a key={other.lang} className="editor-tag" href={other.href} lang={other.lang}>
                    {other.lang}
                  </a>
                ))}
          </span>,
          document.body,
        )}
    </>
  )
}

/** The element whose right rim the counter stands on: the Overlay's Interior, else the frame's Bubble, else the Sheet panel. */
function hostOf(element: HTMLElement): Element | null {
  return (
    element.closest('.overlay-interior') ??
    element.closest('.tree-frame')?.querySelector('.bubble') ??
    element.closest('.sheet-panel') ??
    element.closest('.bubble') ??
    element
  )
}

/**
 * A button that sends one operation of 22.2 at once (29.1): `+ addSource`, `removeSource`.
 * `focusPath` names the field, on the same Node, that takes the focus once the page has
 * re-rendered with the result.
 */
export function Operation({
  nodeId,
  change,
  label,
  className = 'editor-operation',
  focusPath,
}: {
  nodeId: string
  change: Change
  label: string
  className?: string
  focusPath?: string
}) {
  const api = useEditor()
  return (
    <button
      type="button"
      className={className}
      disabled={api.readOnly}
      onClick={() => api.operate(nodeId, change, focusPath === undefined ? undefined : keyOf(nodeId, focusPath))}
    >
      {label}
    </button>
  )
}
