'use client'

/**
 * The editor's provider (docs/specs/application.md 29, 34.4; ADR-133-autosave): wraps the
 * editor page, holds the write queue, the Nodes as the last responses left them, the
 * to-do lists and refusals per field, the indicator's state and the session Sheet, and
 * hands the fields what they need through React context. It is the one place the page
 * decides what the creator sees of a write.
 *
 * `SaveIndicator` is the `role="status"` region of the chrome bar (29.3): saving, saved with
 * the time for five seconds, or not saved with the reason -- a refusal's message, the retry
 * ladder with its button, an uneditable Tree -- and after the state word the message of
 * the field being edited, `publicBehind` on a published Tree whose public copy is behind,
 * and `changedElsewhere` for five seconds after a collaborator's value arrived (29.7).
 *
 * Imports of `src/`: types, and nothing else (34.4).
 */
import { useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { DraftNode, Violation } from '../tree/types.ts'
import { fieldValues, keyOf } from './fields.ts'
import { LoginForm, type LoginWords } from './LoginForm.tsx'
import type { EditorWords } from './mode.ts'
import { WriteQueue, type QueueState, type Write } from './queue.ts'
import { patchNode, type Answer, type Change, type WriteResponse } from './writes.ts'

/** How long the saved time, an accent outline and `changedElsewhere` stay (29.3, 29.7). */
const SHOWN_MS = 5_000

/** What the fields reach through context. */
export interface EditorApi {
  lang: string
  words: EditorWords
  /** After a 403, 404 or 409: every region read-only (29.4). */
  readOnly: boolean
  /** Every Node of the page as the last response left it, by id. */
  nodes: Record<string, DraftNode>
  /** Steps once per response: what a field's repaint effect keys on (29.7). */
  version: number
  /** The violations at one field: the Node's advisory list and the field's refusal, if any (28.4, 29.4). */
  violationsAt(nodeId: string, keyPath: string): Violation[]
  /** Whether a collaborator's value arrived at this field within the last five seconds (29.7). */
  changedAt(nodeId: string, keyPath: string): boolean
  /** The field to focus after an operation created it (28.1): `keyOf(node, path)`. */
  focusKey: string | null
  write(nodeId: string, keyPath: string, value: string): void
  flush(nodeId: string, keyPath: string): void
  /** An operation of 22.2, written at once; `focusKey` names the field to focus once the page has re-rendered. */
  operate(nodeId: string, change: Change, focusKey?: string): void
  hasWrite(nodeId: string, keyPath: string): boolean
  /** The field being edited, whose message the indicator shows (28.4); null clears the focus, not the last edited. */
  setCurrent(field: { nodeId: string; keyPath: string } | null): void
  /** A blocking rule caught before sending -- V-HTML -- shown as a refusal at the field (28.5). */
  refuseLocally(nodeId: string, keyPath: string, violation: Violation): void
}

const EditorContext = createContext<EditorApi | null>(null)

/** The API of the editor around this component; throws outside one, which is a bug. */
export function useEditor(): EditorApi {
  const api = useContext(EditorContext)
  if (!api) throw new Error('outside the Editor')
  return api
}

interface Refused {
  violations: Violation[]
  /** The refusal's code where it carried no violation: a 413, a malformed body. */
  code: string | null
}

export function Editor({
  treeId,
  lang,
  words,
  loginWords,
  adminHref,
  nodes: initialNodes,
  violations: initialViolations,
  published,
  publicCopyCurrent,
  children,
}: {
  treeId: string
  /** The page's language: what every field edits (28.2). */
  lang: string
  words: EditorWords
  loginWords: LoginWords
  /** `/admin` in the chrome language: the link out of the session Sheet (29.6). */
  adminHref: string
  /** The Nodes the page carries, by id: the centre, its chain and its asides. */
  nodes: Record<string, DraftNode>
  /** The draft's advisory violations for those Nodes (19.2). */
  violations: Violation[]
  published: boolean
  publicCopyCurrent: boolean
  children: ReactNode
}) {
  const router = useRouter()
  const [nodes, setNodes] = useState(initialNodes)
  const [advisory, setAdvisory] = useState<Record<string, Violation[]>>(() => byNode(initialViolations))
  const [refusals, setRefusals] = useState<Record<string, Refused>>({})
  const [notEditable, setNotEditable] = useState<string | null>(null)
  const [publicBehind, setPublicBehind] = useState(published && !publicCopyCurrent)
  const [changed, setChanged] = useState<Record<string, number>>({})
  const [changedUntil, setChangedUntil] = useState(0)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [queueState, setQueueState] = useState<QueueState>({ saving: false, savedAt: null, failure: null, paused: false })
  const [focused, setFocused] = useState<{ nodeId: string; keyPath: string } | null>(null)
  const [lastEdited, setLastEdited] = useState<{ nodeId: string; keyPath: string } | null>(null)
  const [focusKey, setFocusKey] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const [, tick] = useState(0)
  // The latest Nodes, for the diff of 29.7 inside the queue's callback.
  const known = useRef(initialNodes)
  known.current = nodes

  const apply = useCallback(
    (write: Write, answer: Answer): void => {
      const { status, body } = answer
      if (status >= 200 && status < 300 && body && 'node' in body) {
        const response = body as WriteResponse
        const arrived = [response, ...(response.also ?? [])].filter((r) => r.node !== null)
        const next = { ...known.current }
        const marks: Record<string, number> = {}
        const now = Date.now()
        for (const r of arrived) {
          const node = r.node!
          const before = next[node.id]
          // Only a field write's response can show another's field write: an operation
          // changes the Node's shape, and every shifted field would read as a collaborator's.
          if (before && write.key !== null) {
            const was = fieldValues(before)
            const is = fieldValues(node)
            for (const [keyPath, value] of Object.entries(is)) {
              const key = keyOf(node.id, keyPath)
              if (was[keyPath] !== value && key !== write.key && !queue.current!.hasWrite(node.id, keyPath)) marks[key] = now + SHOWN_MS
            }
          }
          next[node.id] = node
        }
        setNodes(next)
        setAdvisory((held) => {
          const out = { ...held }
          for (const r of arrived) out[r.node!.id] = r.violations
          return out
        })
        if (Object.keys(marks).length > 0) {
          setChanged((held) => ({ ...held, ...marks }))
          setChangedUntil(now + SHOWN_MS)
        }
        const accepted = write.key
        if (accepted !== null) setRefusals(({ [accepted]: _gone, ...rest }) => rest)
        setPublicBehind(response.tree.published && !response.tree.publicCopyCurrent)
        setVersion((v) => v + 1)
        // The shape changed: the server components draw the new list; the fields keep their state.
        if (write.key === null) router.refresh()
        return
      }
      if (status === 401) {
        setSessionExpired(true)
        return
      }
      if (status === 403 || status === 404 || status === 409) {
        const code = body && 'error' in body ? (body.error ?? null) : null
        setNotEditable(code ?? String(status))
        return
      }
      // 422 and the rest: a refusal, kept at the field until its value changes (29.4).
      const key = write.key ?? keyOf(write.nodeId, '')
      const violations = body && 'violations' in body ? (body.violations ?? []) : []
      setRefusals((held) => ({ ...held, [key]: { violations, code: body && 'error' in body ? (body.error ?? null) : String(status) } }))
    },
    [router],
  )

  const queue = useRef<WriteQueue | null>(null)
  if (queue.current === null) {
    queue.current = new WriteQueue((write) => patchNode(treeId, write.nodeId, write.change), {
      onState: setQueueState,
      onAnswer: (write, answer) => apply(write, answer),
    })
  }

  // The saved time and the accent marks go after five seconds: one re-render when they do.
  useEffect(() => {
    const due = [queueState.savedAt === null ? 0 : queueState.savedAt + SHOWN_MS, changedUntil].filter((at) => at > Date.now())
    if (due.length === 0) return
    const timer = setTimeout(() => tick((n) => n + 1), Math.min(...due) - Date.now() + 10)
    return () => clearTimeout(timer)
  }, [queueState.savedAt, changedUntil])

  // The browser's one confirmation while a write is not accepted (29.5).
  useEffect(() => {
    const ask = (event: BeforeUnloadEvent): void => {
      if (!queue.current?.busy()) return
      event.preventDefault()
    }
    window.addEventListener('beforeunload', ask)
    return () => window.removeEventListener('beforeunload', ask)
  }, [])

  const api = useMemo<EditorApi>(
    () => ({
      lang,
      words,
      readOnly: notEditable !== null,
      nodes,
      version,
      focusKey,
      violationsAt: (nodeId, keyPath) => [
        ...(advisory[nodeId] ?? []).filter((violation) => violation.keyPath === keyPath),
        ...(refusals[keyOf(nodeId, keyPath)]?.violations ?? []),
      ],
      changedAt: (nodeId, keyPath) => (changed[keyOf(nodeId, keyPath)] ?? 0) > Date.now(),
      write: (nodeId, keyPath, value) => {
        if (notEditable !== null) return
        setRefusals(({ [keyOf(nodeId, keyPath)]: _gone, ...rest }) => rest)
        setLastEdited({ nodeId, keyPath })
        queue.current!.field(nodeId, keyPath, value)
      },
      flush: (nodeId, keyPath) => queue.current!.flush(nodeId, keyPath),
      operate: (nodeId, change, focus) => {
        if (notEditable !== null) return
        setFocusKey(focus ?? null)
        queue.current!.operation(nodeId, change)
      },
      hasWrite: (nodeId, keyPath) => queue.current!.hasWrite(nodeId, keyPath),
      setCurrent: setFocused,
      refuseLocally: (nodeId, keyPath, violation) => {
        setLastEdited({ nodeId, keyPath })
        setRefusals((held) => ({ ...held, [keyOf(nodeId, keyPath)]: { violations: [violation], code: 'blocking' } }))
      },
    }),
    [lang, words, notEditable, nodes, version, focusKey, advisory, refusals, changed],
  )

  const current = focused ?? lastEdited
  const indicator: IndicatorState = {
    queue: queueState,
    notEditable,
    publicBehind,
    changedElsewhere: changedUntil > Date.now(),
    message: current ? api.violationsAt(current.nodeId, current.keyPath)[0] ?? null : null,
    refusedCode: current ? (refusals[keyOf(current.nodeId, current.keyPath)]?.code ?? null) : null,
    retry: () => queue.current!.retry(),
  }

  return (
    <EditorContext.Provider value={api}>
      <IndicatorContext.Provider value={indicator}>
        {children}
        {sessionExpired && (
          <div className="editor-session">
            <div className="sheet-backdrop" />
            <div className="sheet-panel editor-session-panel" role="dialog" aria-modal="true" aria-labelledby="session-expired">
              <h2 id="session-expired">{words.sessionExpired}</h2>
              <LoginForm
                words={loginWords}
                onSuccess={() => {
                  setSessionExpired(false)
                  queue.current!.resume()
                }}
              />
              <a className="admin-link" href={adminHref}>
                {words.toOverview}
              </a>
            </div>
          </div>
        )}
      </IndicatorContext.Provider>
    </EditorContext.Provider>
  )
}

interface IndicatorState {
  queue: QueueState
  notEditable: string | null
  publicBehind: boolean
  changedElsewhere: boolean
  /** The first violation at the field being edited, if any (28.4, 29.4). */
  message: Violation | null
  /** The code of a refusal at that field that carried no violation. */
  refusedCode: string | null
  retry: () => void
}

const IndicatorContext = createContext<IndicatorState | null>(null)

/** The `role="status"` region of the chrome bar (29.3). Never a token, an account id or a request body. */
export function SaveIndicator({ words }: { words: EditorWords }) {
  const state = useContext(IndicatorContext)
  if (!state) throw new Error('outside the Editor')
  const { queue, notEditable, publicBehind, changedElsewhere, message, refusedCode } = state
  const refused = message !== null && !(message.advisory ?? true)
  const notSaved = notEditable !== null || queue.failure !== null || refused || refusedCode !== null
  const recent = queue.savedAt !== null && queue.savedAt + SHOWN_MS > Date.now()

  let state1: string
  let tone = ''
  if (notSaved) {
    state1 = words.notSaved
    tone = ' editor-status--danger'
  } else if (queue.saving || queue.paused) state1 = words.saving
  else if (queue.savedAt !== null) state1 = recent ? `${words.saved} ${new Date(queue.savedAt).toLocaleTimeString()}` : words.saved
  else state1 = ''

  const parts: ReactNode[] = []
  if (notEditable !== null) parts.push(`${words.notEditable} (${notEditable})`)
  if (queue.failure !== null) {
    parts.push(
      <>
        {words.retrying}{' '}
        <button type="button" className="admin-link" onClick={state.retry}>
          {words.retry}
        </button>
      </>,
    )
  }
  if (message !== null) {
    parts.push(
      <span className="editor-violation" data-rule={message.rule}>
        <code>{message.rule}</code> {message.keyPath}: {message.message}
      </span>,
    )
  } else if (refusedCode !== null) parts.push(refusedCode)
  if (publicBehind) parts.push(words.publicBehind)
  if (changedElsewhere) parts.push(words.changedElsewhere)

  return (
    <div className={`editor-status${tone}`} role="status" data-saving={queue.saving || undefined} data-clamp="">
      <span className="editor-status-word">{state1}</span>
      {parts.map((part, index) => (
        <span key={index} className="editor-status-part">
          {' · '}
          {part}
        </span>
      ))}
    </div>
  )
}

function byNode(violations: Violation[]): Record<string, Violation[]> {
  const out: Record<string, Violation[]> = {}
  for (const violation of violations) (out[violation.file] ??= []).push(violation)
  return out
}
