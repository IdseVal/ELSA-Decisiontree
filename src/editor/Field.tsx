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
 * kind. **[#179]** A Terminal's words are a plain field drawn as the badge, its region the
 * badge's own box: blurred it is the badge as the public page draws it, focused it shows the
 * words as typed (36.3).
 *
 * While the field has the focus the right rim shows the counter pill -- `n / max`, counted
 * by the validator's own functions, and `lines / 2` for the description -- and under it one
 * tag per other declared language that has no text for this field, a link to the page in
 * that language (28.3). The rim is drawn from the page's body, fixed, beside the Bubble or
 * the Overlay the field is in, so it takes no pixel from the text area and nothing on the
 * page grows (28.6). **[#172]** Typing stops at the maximum: a key past it does nothing and a
 * paste is cut there (28.4, amended 2026-10-02); a text stored over it is shown whole, its pill
 * and outline `danger`, and may shrink but not grow. An empty field names what belongs in it
 * (28.2, amended). A refused write keeps the value on screen, and no response repaints it until
 * it changes (29.4); a value a collaborator changed under the field is outlined `accent` for
 * five seconds (29.7).
 *
 * **[#141]** The description's rim shows, under the pill, the `mark` button while a selection
 * lies in the source (32.1): pressing it adds the explainer, writes the mark and opens the
 * explainer Sheet. Its rendered state is the public `Explainer` on the same markup, so a
 * marked term opens its panel on hover and focus, and a click or Enter on it opens the Sheet
 * (32.3).
 *
 * Imports of `src/`: `tree/measure.ts`, `tree/grammar.ts`, `markdown.ts` and
 * `components/Explainer.tsx`, and types (34.4).
 */
import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Explainer as ExplainerText } from '../components/Explainer.tsx'
import { richTextToHtml } from '../markdown.ts'
import { isUrl } from '../tree/grammar.ts'
import { countedLength, estimatedLines } from '../tree/measure.ts'
import type { Explainer, Source, Violation } from '../tree/types.ts'
import { useEditor } from './Editor.tsx'
import { capped, cutTo, keyOf, plainLine, RAW_HTML, valueAt } from './fields.ts'
import { marked, Marker, markRefusal, trimmedSelection, type MarkerWords } from './Marker.tsx'
import type { FieldLimit } from './mode.ts'
import { explainerId } from './slug.ts'
import type { Change } from './writes.ts'

/** The rim is 60 pixels wide, the outline included (10.1); the pill and the tags fit in it. */
const RIM_WIDTH = 60

/** The chrome words a field says; strings, because a client component takes no module. */
export interface FieldWords {
  characters: string
  lines: string
}

/**
 * **[#172]** The text an input or a textarea holds after an input event, held to `limit`
 * (28.4, amended): `proposed` -- the element's value, a plain field's line breaks already
 * spaces -- where it fits, else cut by `capped`, and the element's value and caret set to the
 * cut text so that a refused key leaves the caret where it was. No limit, no cut.
 */
export function heldToLimit(element: HTMLInputElement | HTMLTextAreaElement, previous: string, proposed: string, limit: FieldLimit | null): string {
  const caret = element.selectionEnd ?? proposed.length
  const held = limit === null ? { text: proposed, caret } : capped(previous, proposed, caret, limit)
  if (held.text !== element.value) {
    element.value = held.text
    element.setSelectionRange(held.caret, held.caret)
  }
  return held.text
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
  others = [],
  select,
  label,
  className = '',
  termEvent,
  markerWords,
  placeholder = '',
  follower,
  words,
}: {
  nodeId: string
  /** The key path of 22.2 without its language: `title`, `sources[1].label`, `terminal.label`. */
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
  /** The other declared languages, for the rim's tags (28.3). */
  others?: OtherLanguage[]
  /** A select's choices: the field is a `<select>` of them. */
  select?: Array<{ value: string; label: string }>
  /** The accessible name of a select. */
  label?: string
  /** **[#179]** Extra classes on the region: `outcome`, which draws a Terminal's words as its badge (36.3). */
  className?: string
  /** The description: the event a marked term dispatches when clicked, which opens its Sheet (32.3). */
  termEvent?: string
  /** The description: the `mark` button's words; without them the rim has no button (32.1). */
  markerWords?: MarkerWords
  /** **[#172]** What belongs in the field, shown while it is empty (28.2): "Title", "Text". */
  placeholder?: string
  /**
   * **[#177]** A field of another Node whose text follows this one's, in the same language
   * (30.5, amended): an aside's title leads its Option button's on the centre, which takes each
   * new title cut to its own limit as long as, when the editing began, it was empty or this
   * title cut so, and no write of it was waiting. A title edited on the button itself stops
   * following.
   */
  follower?: { nodeId: string; path: string; limit: FieldLimit }
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
  // **[#177]** Decided when the editing begins: one field has the focus at a time, so nothing on
  // this page writes the follower while this one is being typed in.
  const following = useRef(false)
  const followerPath = follower && lang !== null ? `${follower.path}.${lang}` : null
  const [selection, setSelection] = useState<[number, number]>([0, 0])

  const violations = api.violationsAt(nodeId, keyPath)
  const refused = violations.some((violation) => !(violation.advisory ?? true))

  // The repaint rule of 29.7: a response's value replaces the screen's unless the field is
  // being edited, holds a value not yet accepted, or holds a refused one -- that stays until
  // it changes, whatever another field's response brought (29.4).
  const server = valueAt(api.nodes[nodeId], path, lang)
  useEffect(() => {
    if (server === undefined || focused || refused || api.hasWrite(nodeId, keyPath) || server === text) return
    setText(server)
    setDirty(true)
    // The screen follows the store; the text it shows is the store's, not this render's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [server, api.version])

  // A marked term asks for its Sheet with a DOM event from inside the rendered text (32.3).
  const { openExplainer } = api
  useEffect(() => {
    const element = root.current
    if (!termEvent || !element) return
    const onTerm = (event: Event): void => {
      const id = (event as CustomEvent<{ id: string }>).detail.id
      if (id) openExplainer(nodeId, id)
    }
    element.addEventListener(termEvent, onTerm)
    return () => element.removeEventListener(termEvent, onTerm)
  }, [termEvent, nodeId, openExplainer])

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
    className,
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
    // The follower first, so the field the indicator names as last edited is this one (28.4).
    if (following.current && follower && followerPath) api.write(follower.nodeId, followerPath, cutTo(next, follower.limit))
    api.write(nodeId, keyPath, next)
  }

  const onFocus = (): void => {
    setFocused(true)
    api.setCurrent({ nodeId, keyPath })
    if (follower && followerPath) {
      // `api.nodes` is the last response's: a write of the follower still waiting may be the
      // creator's own words on the button, which this title must not overwrite (30.5).
      const theirs = valueAt(api.nodes[follower.nodeId], follower.path, lang) ?? ''
      following.current = !api.hasWrite(follower.nodeId, followerPath) && (theirs === '' || theirs === cutTo(text, follower.limit))
    }
  }
  const onBlur = (): void => {
    setFocused(false)
    api.setCurrent(null)
    api.flush(nodeId, keyPath)
    // With it: a structure write sent next -- the side bubble's delete -- must not overtake it (29.2).
    if (follower && followerPath) api.flush(follower.nodeId, followerPath)
  }
  // A click inside a summary would toggle the Overlay the button opens, and **[#177]** one inside
  // a link -- the Overlay's heading, which links to the aside's address (10.9) -- would follow
  // it and reload the page under the creator; the field takes it.
  const onClick = (event: MouseEvent): void => {
    if (root.current?.closest('summary, a')) event.preventDefault()
  }

  if (select) {
    return (
      <span ref={root} className={state} data-field={key} onClick={onClick}>
        <select
          className="editor-select"
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

  // The Node's explainers as the last response left them: a term marked a moment ago has its
  // panel before the server's render of the page catches up.
  const nodeExplainers = api.nodes[nodeId]?.explainers ?? explainers
  const [from, to] = trimmedSelection(text, selection[0], selection[1])
  const newId = explainerId(text.slice(from, to), nodeExplainers.map((explainer) => explainer.id))
  const refusal = markRefusal(text, from, to, nodeExplainers.length, newId)
  // 32.1: add the explainer, then the description with its mark, in that order in the queue.
  const onMark = (): void => {
    if (lang === null) return
    const focusKey = keyOf(nodeId, `explainers[${nodeExplainers.length}].text.${lang}`)
    api.operate(nodeId, { op: 'add-explainer', id: newId, term: { [lang]: text.slice(from, to) }, text: { [lang]: '' } }, focusKey)
    commit(marked(text, from, to, newId))
    api.flush(nodeId, keyPath)
    setSelection([0, 0])
    api.openExplainer(nodeId, newId)
  }

  const editing = !rich || focused
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (!rich && event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }
  // **[#172]** A summary opens its details on the keyup of a space typed anywhere inside it:
  // an Option's title is typed inside its button's summary, and its first space opened the
  // Overlay and took the focus. The space is already in the text by then.
  const onKeyUp = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === ' ' && root.current?.closest('summary')) event.preventDefault()
  }

  return (
    <>
      <span ref={root} className={state} data-field={key} data-over={over || undefined} onClick={onClick}>
        {editing ? (
          // The grid and the mirror in `data-value` make the box taller than its lines (28.4) for a
          // text that needs more, as one stored over its limit; both take the same font, so they
          // break lines alike. **[#179]** An empty field's mirror holds its placeholder, so a box
          // sized by its text -- the badge's (36.3) -- is as wide as what it shows.
          <span className="editor-text" data-value={`${text === '' ? placeholder : text} `}>
            <textarea
              ref={area}
              className="editor-input"
              value={text}
              rows={1}
              placeholder={placeholder}
              disabled={api.readOnly}
              autoFocus={rich}
              spellCheck
              lang={lang ?? undefined}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              onKeyUp={onKeyUp}
              onSelect={(event) => setSelection([event.currentTarget.selectionStart, event.currentTarget.selectionEnd])}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                const next = heldToLimit(event.target, text, rich ? event.target.value : plainLine(event.target.value), limit)
                if (next !== text) commit(next)
              }}
            />
          </span>
        ) : (
          <span
            className="editor-rendered"
            tabIndex={api.readOnly ? -1 : 0}
            // A term inside takes the focus for its panel (10.8); only the region itself opens the source.
            onFocus={(event) => {
              if (event.target === event.currentTarget) setFocused(true)
            }}
            onClick={(event) => {
              // A marked term keeps its own click (#141); anywhere else opens the source.
              if (!(event.target instanceof Element && event.target.closest('.term'))) setFocused(true)
            }}
          >
            {text.trim() === '' ? (
              <span className="prose editor-placeholder">{placeholder}</span>
            ) : dirty || rendered === undefined ? (
              <ExplainerText html={richTextToHtml(text, { explainers: nodeExplainers, lang: lang ?? '', idPrefix: '' })} termEvent={termEvent} />
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
            {markerWords !== undefined && from < to && <Marker refusal={refusal} onMark={onMark} words={markerWords} />}
          </span>,
          document.body,
        )}
    </>
  )
}

/**
 * The element whose right rim the counter stands on: the Overlay's panel, else the frame's
 * Bubble, else the Sheet panel. **[#172]** The Overlay's panel, not its Interior: the Interior
 * is the text area, and a pill on its right edge stood on the text's last words.
 */
function hostOf(element: HTMLElement): Element | null {
  return (
    element.closest('.overlay-interior')?.closest('.sheet-panel') ??
    element.closest('.tree-frame')?.querySelector('.bubble') ??
    element.closest('.sheet-panel') ??
    element.closest('.bubble') ??
    element
  )
}

/** The chrome words the add-Source Sheet says (28.1); strings, because a client component takes no module. */
export interface AddSourceWords {
  addSource: string
  sourceKind: string
  sourceUrl: string
}

/**
 * The page of the `+ addSource` Sheet (28.1): the kind of the Source to add and its URL.
 * `add-source` goes only once a URL in the schema's grammar is typed, because the schema
 * requires one and a made-up address would be silent content on a published page; it goes
 * with an empty label and the kind chosen, the Sheet closes, and the new label takes the
 * focus once the page has re-rendered (`focusPath`, on this Node). Enter in the URL sends
 * it; the button stays disabled, and the input is marked invalid, while the URL is not one.
 */
export function AddSourceForm({
  nodeId,
  focusPath,
  kinds,
  words,
}: {
  nodeId: string
  /** The new Source's label in the page's language: `sources[n].label.<lang>`. */
  focusPath: string
  kinds: { value: Source['kind']; label: string }[]
  words: AddSourceWords
}) {
  const api = useEditor()
  const form = useRef<HTMLFormElement>(null)
  const urlInput = useRef<HTMLInputElement>(null)
  const [kind, setKind] = useState<Source['kind']>(kinds[0]?.value ?? 'legal')
  const [url, setUrl] = useState('')
  const valid = isUrl(url.trim())

  // The URL takes the focus when the Sheet opens: it is the one thing the Source needs.
  useEffect(() => {
    const details = form.current?.closest('details')
    if (!details) return
    const onToggle = (): void => {
      if (details.open) urlInput.current?.focus()
    }
    details.addEventListener('toggle', onToggle)
    return () => details.removeEventListener('toggle', onToggle)
  }, [])

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (!valid || api.readOnly) return
    api.operate(nodeId, { op: 'add-source', kind, label: {}, url: url.trim() }, keyOf(nodeId, focusPath))
    const details = event.currentTarget.closest('details')
    if (details) details.open = false
    setUrl('')
  }

  return (
    <form ref={form} className="source-editor source-editor--add" noValidate onSubmit={onSubmit}>
      <h2>{words.addSource}</h2>
      <label className="editor-row">
        <span>{words.sourceKind}</span>
        <select
          className="editor-select"
          value={kind}
          disabled={api.readOnly}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => setKind(kinds.find((choice) => choice.value === event.target.value)?.value ?? kind)}
        >
          {kinds.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
      </label>
      <label className="editor-row">
        <span>{words.sourceUrl}</span>
        <input
          ref={urlInput}
          className="editor-url"
          type="url"
          inputMode="url"
          value={url}
          disabled={api.readOnly}
          aria-invalid={url !== '' && !valid ? true : undefined}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setUrl(event.target.value)}
        />
      </label>
      <button type="submit" className="admin-submit" disabled={!valid || api.readOnly}>
        {words.addSource}
      </button>
    </form>
  )
}

/**
 * A button that sends one operation of 22.2 at once (29.1): `removeSource`. `focusPath`
 * names the field, on the same Node, that takes the focus once the page has re-rendered
 * with the result.
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
