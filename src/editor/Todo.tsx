'use client'

/**
 * **[#176]** The to-do bubble (docs/specs/application.md 33.3, amended 2026-10-02;
 * ADR-176-floating-settings-and-to-do): the floating control at the top right that says how
 * many things are left to do before publishing, and the list it opens -- one line per advisory
 * violation of the draft, the Node's title as a link to its editor page, then the message, and
 * `remove` beside an unreachable step's line.
 *
 * The page draws both inside a `Sheet` (10.5: Escape, the cross, a click outside, one Sheet at
 * a time); this module draws what is in it. The count is the `Editor`'s, from the page's load
 * and every write response (22.3); the list is re-read when the bubble opens -- nothing polls --
 * except when a refused publish in the panel opens it on the list that refusal answered.
 * Imports of `src/`: types, and nothing else (34.4).
 */
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { Chrome } from '../chrome.ts'
import type { Violation } from '../tree/types.ts'
import { useEditor } from './Editor.tsx'
import { shownOf } from './Panel.tsx'
import { panelCalls } from './writes.ts'

/** The chrome strings the control and its bubble say, as strings. */
export type TodoWords = Pick<
  Chrome,
  'todoCount' | 'todoCountOne' | 'todoNone' | 'todoBefore' | 'publicBehindBecause' | 'notServableBecause' | 'thisTree' | 'removeStep' | 'requestFailed'
>

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
  const { tree, setTree, todoAsked } = useEditor()
  const [todo, setTodo] = useState(advisory)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const body = useRef<HTMLDivElement>(null)
  // Set while the panel opens the bubble on the list a refused publish answered: that opening re-reads nothing.
  const kept = useRef(false)

  // The list is re-read each time the Sheet around it opens (33.3).
  useEffect(() => {
    const sheet = body.current?.closest('details')
    if (!sheet) return
    const reread = async (): Promise<void> => {
      if (!sheet.open) return
      setError(null)
      if (kept.current) {
        kept.current = false
        return
      }
      const entry = await panelCalls.entry(treeId)
      if (entry.status === 200 && entry.body && 'advisory' in entry.body) {
        const read = entry.body
        setTodo(read.advisory)
        setTree({ advisory: read.advisory.length, published: read.published, publicCopyCurrent: read.publicCopyCurrent, servable: read.servable })
      }
    }
    sheet.addEventListener('toggle', reread)
    return () => sheet.removeEventListener('toggle', reread)
  }, [treeId, setTree])

  // A refused publish (33.3): the bubble opens on what it answered, which closes the panel -- one Sheet at a time.
  useEffect(() => {
    const sheet = body.current?.closest('details')
    if (!todoAsked || !sheet) return
    setTodo(todoAsked.list)
    if (sheet.open) return
    kept.current = true
    sheet.open = true
  }, [todoAsked])

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

  const shown = shownOf(tree)
  const heading = shown === 'notServable' ? words.notServableBecause : shown === 'publicBehind' ? words.publicBehindBecause : words.todoBefore

  return (
    <div className="panel-body" ref={body} data-scroll-box="" tabIndex={0} aria-labelledby="todo-heading">
      <h2 id="todo-heading" className="panel-heading">
        {heading}
      </h2>
      {todo.length === 0 ? (
        <p>{words.todoNone}</p>
      ) : (
        <ul className="todo-list">
          {todo.map((violation, index) => (
            <li key={`${violation.file} ${violation.keyPath} ${violation.rule} ${index}`} data-rule={violation.rule}>
              {violation.file === 'manifest' || violation.file === 'tree.json' ? (
                <span className="todo-where">{words.thisTree}</span>
              ) : (
                <a className="todo-where" href={`${nodeHref.before}${encodeURIComponent(violation.file)}${nodeHref.after}`}>
                  {titles[violation.file] || violation.file}
                </a>
              )}
              {`: ${violation.message}`}
              {violation.rule === 'V-REACH' && manages && (
                <button type="button" className="admin-link todo-remove" disabled={busy} onClick={() => removeNode(violation.file)}>
                  {words.removeStep}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {error !== null && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
