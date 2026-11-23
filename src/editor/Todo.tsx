'use client'

/**
 * **[#176]** The to-do bubble (docs/specs/application.md 33.3, amended 2026-10-02;
 * ADR-176-floating-settings-and-to-do): the floating control at the top right that says how
 * many things are left to do -- **[#279]** support only, nothing waits for them (19.3, 19.4) --
 * and the list it opens -- one line per advisory
 * violation of the draft, the Node's title as a link to its editor page, then the message, and
 * `remove` beside an unreachable step's line. **[#271]** Between the two, the field the line is
 * about, by its placeholder (28.2), its place in its list and its language, so two empty fields
 * of one Node never read alike; and `remove` beside an explainer that no description marks any
 * more, which is otherwise out of reach: its Sheet opens only from a marked term (32.3, 32.4).
 *
 * The page draws both inside a `Sheet` (10.5: Escape, the cross, a click outside, one Sheet at
 * a time); this module draws what is in it. The count is the `Editor`'s, from the page's load
 * and every write response (22.3); the list is re-read when the bubble opens -- nothing polls.
 * Imports of `src/`: types, and nothing else (34.4).
 */
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Chrome } from '../chrome.ts'
import type { Violation } from '../tree/types.ts'
import { useEditor } from './Editor.tsx'
import { shownOf } from './Panel.tsx'
import { fieldOf, type PlaceholderWords } from './placeholders.ts'
import { panelCalls } from './writes.ts'

/** The chrome strings the control and its bubble say, as strings; **[#271]** and the fields' names. */
export type TodoWords = Pick<
  Chrome,
  'todoCount' | 'todoCountOne' | 'todoNone' | 'todoStill' | 'notServableBecause' | 'thisTree' | 'removeStep' | 'requestFailed'
> &
  PlaceholderWords

/**
 * **[#271]** The explainer a V-EXPLAINER line says no description marks in one language: its id,
 * which `remove-explainer` names (32.4). The validator's `checkMarks` writes it first in the
 * message, quoted, and that is the only place the line carries it; null for any other line.
 */
function unmarkedExplainer(violation: Violation): string | null {
  if (violation.rule !== 'V-EXPLAINER') return null
  return /^"([^"]+)" is not marked in /.exec(violation.message)?.[1] ?? null
}

/**
 * The control (33.3): the count in a small round bubble and the words after it, or a quiet tick
 * when there is nothing to do. Its name is the same at every width, because below 1000 pixels
 * the words give way and the bubble stands alone (33.1).
 */
export function TodoButton({ words }: { words: Pick<TodoWords, 'todoCount' | 'todoCountOne' | 'todoNone'> }) {
  const { tree } = useEditor()
  const count = tree.advisory
  const things = count === 1 ? words.todoCountOne : words.todoCount
  return (
    <span className="float-control" role="img" aria-label={count > 0 ? `${count} ${things}` : words.todoNone}>
      <span className="todo-count" data-count={count}>
        {count > 0 ? (
          count
        ) : (
          <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 8.5l3.5 3.5L13 4.5" />
          </svg>
        )}
      </span>
      {count > 0 && <span className="float-words">{things}</span>}
    </span>
  )
}

export function Todo({
  treeId,
  words,
  advisory,
  titles,
  nodeHref,
  manages,
}: {
  treeId: string
  words: TodoWords
  /** The draft's advisory violations at load: the list until the bubble re-reads it (19.2). */
  advisory: Violation[]
  /** The Nodes' titles in the page's language, by id, for the lines. */
  titles: Record<string, string>
  /** A Node's editor page: what goes before its id and what after (the language's query). */
  nodeHref: { before: string; after: string }
  /** Whether the caller may delete a step: the creator and the administrator (21.2). */
  manages: boolean
}) {
  const router = useRouter()
  const { tree, setTree, operate, readOnly } = useEditor()
  const [todo, setTodo] = useState(advisory)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const body = useRef<HTMLDivElement>(null)

  /** The draft's list and state as the store holds them now (22.1). */
  const reread = useCallback(async (): Promise<void> => {
    const entry = await panelCalls.entry(treeId)
    if (entry.status === 200 && entry.body && 'advisory' in entry.body) {
      const read = entry.body
      setTodo(read.advisory)
      setTree({ advisory: read.advisory.length, published: read.published, servable: read.servable })
    }
  }, [treeId, setTree])

  // The list is re-read each time the Sheet around it opens (33.3).
  useEffect(() => {
    const sheet = body.current?.closest('details')
    if (!sheet) return
    const onToggle = async (): Promise<void> => {
      if (!sheet.open) return
      setError(null)
      await reread()
    }
    sheet.addEventListener('toggle', onToggle)
    return () => sheet.removeEventListener('toggle', onToggle)
  }, [reread])

  const removeNode = async (nodeId: string): Promise<void> => {
    setBusy(true)
    setError(null)
    try {
      const answer = await panelCalls.deleteNode(treeId, nodeId)
      if (answer.status >= 200 && answer.status < 300) {
        setTodo((held) => held.filter((violation) => violation.file !== nodeId))
        setTree({ advisory: Math.max(0, tree.advisory - todo.filter((violation) => violation.file === nodeId).length) })
        router.refresh()
      } else setError(words.requestFailed)
    } finally {
      setBusy(false)
    }
  }

  // **[#271]** Through the editor's queue, as the Sheet's own `unmark` sends it (32.4): a description
  // write still on its way is sent first. The removal takes every line of that explainer with it,
  // so the list is read again rather than filtered here.
  const removeExplainer = (nodeId: string, id: string): void => {
    setBusy(true)
    setError(null)
    operate(nodeId, { op: 'remove-explainer', id }, undefined, async (answer) => {
      try {
        if (answer.status >= 200 && answer.status < 300) await reread()
        else setError(words.requestFailed)
      } finally {
        setBusy(false)
      }
    })
  }

  const heading = shownOf(tree) === 'notServable' ? words.notServableBecause : words.todoStill

  // **[#181]** The heading above the scroll box, as the panel's: it takes two or three lines in some
  // states, languages and widths, and nothing the focus scrolls to passes under it (33.2, amended).
  return (
    <>
      <h2 id="todo-heading" className="panel-heading">
        {heading}
      </h2>
      <div className="panel-body" ref={body} data-scroll-box="" tabIndex={0} aria-labelledby="todo-heading">
        {todo.length === 0 ? (
          <p>{words.todoNone}</p>
        ) : (
          <ul className="todo-list">
            {todo.map((violation, index) => {
              const field = fieldOf(violation.keyPath, words)
              const explainer = unmarkedExplainer(violation)
              return (
                <li key={`${violation.file} ${violation.keyPath} ${violation.rule} ${index}`} data-rule={violation.rule}>
                  {violation.file === 'manifest' || violation.file === 'tree.json' ? (
                    <span className="todo-where">{words.thisTree}</span>
                  ) : (
                    <a className="todo-where" href={`${nodeHref.before}${encodeURIComponent(violation.file)}${nodeHref.after}`}>
                      {titles[violation.file] || violation.file}
                    </a>
                  )}
                  {': '}
                  {field !== null && <span className="todo-field">{`${field}: `}</span>}
                  {violation.message}
                  {violation.rule === 'V-REACH' && manages && (
                    <button type="button" className="admin-link todo-remove" disabled={busy} onClick={() => removeNode(violation.file)}>
                      {words.removeStep}
                    </button>
                  )}
                  {explainer !== null && (
                    <button type="button" className="admin-link todo-remove" disabled={busy || readOnly} onClick={() => removeExplainer(violation.file, explainer)}>
                      {words.removeStep}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        {error !== null && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </>
  )
}
