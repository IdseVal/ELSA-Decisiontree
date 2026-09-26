'use client'

/**
 * The top panel (docs/specs/application.md 33; ADR-133-top-panel): the button in the editor's
 * chrome bar that says the Tree's state and its to-do count, and the body of the Sheet it
 * opens down the right edge -- Publish with its to-do list, the collaborators, this Tree, and
 * the administrator's two actions.
 *
 * The page draws both inside a `Sheet` (10.5: Escape, the cross, a click outside, one Sheet
 * at a time); this module draws what is in it. The state comes from the page's load and every
 * write response through the `Editor` (22.3), and the panel's own answers go back there, so
 * the button follows a publish at once. The to-do list and the accounts are re-read when the
 * panel opens (33.3, 33.4); nothing polls.
 *
 * The panel hides what a role may not do (21.2); the server decides (21.3), and a refusal
 * is shown, not routed around. Imports of `src/`: types, and nothing else (34.4).
 */
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Chrome } from '../chrome.ts'
import type { Violation } from '../tree/types.ts'
import { useEditor, type TreeState } from './Editor.tsx'
import { panelCalls, type AccountAnswer, type EntryAnswer } from './writes.ts'

/** The chrome strings the panel says, as strings. */
export type PanelWords = Pick<
  Chrome,
  | 'treeState'
  | 'publish'
  | 'todoCount'
  | 'todoBefore'
  | 'publishedAt'
  | 'publicLink'
  | 'publicBehindBecause'
  | 'notServableBecause'
  | 'confirmUnpublish'
  | 'confirm'
  | 'cancel'
  | 'removeStep'
  | 'collaborators'
  | 'creator'
  | 'invite'
  | 'cannotInvite'
  | 'removeCollaborator'
  | 'chooseAccount'
  | 'thisTree'
  | 'fixed'
  | 'handOver'
  | 'handOverTo'
  | 'deleteTree'
  | 'unpublishFirst'
  | 'confirmDeleteTree'
  | 'published'
  | 'hidden'
  | 'languages'
  | 'treeId'
  | 'administrator'
  | 'requestFailed'
>

/** The caller's role on this Tree (21.1): the administrator's wins over any other it has. */
export type PanelRole = 'creator' | 'collaborator' | 'administrator'

/** The button's four states (33.1), each its dot's colour. */
type Shown = 'hidden' | 'published' | 'notServable' | 'publicBehind'

/** Where the placeholder `nodeHref` holds a Node's id; upper case, so never a Node's own id (tree-format.md 3.1). */
export const NODE_PLACEHOLDER = 'NODE'

function shownOf(tree: TreeState): Shown {
  if (!tree.published) return 'hidden'
  if (!tree.servable) return 'notServable'
  return tree.publicCopyCurrent ? 'published' : 'publicBehind'
}

/** The button's label (33.1): a dot, the state and the to-do count in brackets when it is not zero. */
export function PanelButton({ words }: { words: Pick<PanelWords, 'published' | 'hidden' | 'todoCount'> }) {
  const { tree } = useEditor()
  const shown = shownOf(tree)
  return (
    <span className={`panel-state panel-state--${shown}`} data-state={shown}>
      <span className="panel-state-dot" aria-hidden="true" />
      {tree.published ? words.published : words.hidden}
      {tree.advisory > 0 && <span aria-label={`${tree.advisory} ${words.todoCount}`}>{` (${tree.advisory})`}</span>}
    </span>
  )
}

export function Panel({
  treeId,
  words,
  role: initialRole,
  administratorId,
  meta: initialMeta,
  publishedAt: initialPublishedAt,
  advisory,
  accounts: initialAccounts,
  names,
  titles,
  nodeHref,
  publicHref,
  languages,
  overviewHref,
}: {
  treeId: string
  words: PanelWords
  role: PanelRole
  /** Never offered for an invitation: the administrator has every right already (21.4). */
  administratorId: string
  meta: EntryAnswer['meta']
  publishedAt: string | null
  /** The draft's advisory violations at load: the to-do list (19.2). */
  advisory: Violation[]
  /** Every active account (21.4): what the selects offer. */
  accounts: AccountAnswer[]
  /** The names of the Tree's people at load, by id, a deactivated one's included: the list shows no one by id. */
  names: Record<string, string>
  /** The Nodes' titles in the page's language, by id, for the to-do lines. */
  titles: Record<string, string>
  /** A Node's editor page, with `NODE_PLACEHOLDER` where its id goes. */
  nodeHref: string
  /** The Tree's root URL on the public site (4.1). */
  publicHref: string
  languages: string[]
  /** `/admin` in the chrome language: where a deleted Tree's editor goes. */
  overviewHref: string
}) {
  const router = useRouter()
  const { tree, setTree } = useEditor()
  const [role, setRole] = useState(initialRole)
  const [meta, setMeta] = useState(initialMeta)
  const [publishedAt, setPublishedAt] = useState(initialPublishedAt)
  const [todo, setTodo] = useState(advisory)
  const [accounts, setAccounts] = useState(initialAccounts)
  const [asking, setAsking] = useState<'unpublish' | 'delete' | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<{ where: 'publish' | 'invite' | 'handOver' | 'admin'; text: string } | null>(null)
  const body = useRef<HTMLDivElement>(null)
  const manages = role !== 'collaborator'

  // The to-do list and the accounts are re-read each time the Sheet around the panel opens (33.3, 33.4).
  useEffect(() => {
    const sheet = body.current?.closest('details')
    if (!sheet) return
    const reread = async (): Promise<void> => {
      if (!sheet.open) return
      setAsking(null)
      setError(null)
      const [entry, listed] = await Promise.all([panelCalls.entry(treeId), panelCalls.accounts()])
      if (entry.status === 200 && entry.body && 'meta' in entry.body) {
        const read = entry.body
        setMeta(read.meta)
        setPublishedAt(read.meta.publishedAt ?? null)
        setTodo(read.advisory)
        setTree({ advisory: read.advisory.length, published: read.published, publicCopyCurrent: read.publicCopyCurrent, servable: read.servable })
      }
      if (listed.status === 200 && Array.isArray(listed.body)) setAccounts(listed.body)
    }
    sheet.addEventListener('toggle', reread)
    return () => sheet.removeEventListener('toggle', reread)
  }, [treeId, setTree])

  const nameOf = (id: string): string => accounts.find((account) => account.id === id)?.name ?? names[id] ?? id
  const invitable = accounts.filter((account) => account.id !== meta.creator && account.id !== administratorId && !meta.collaborators.includes(account.id))
  const heirs = accounts.filter((account) => account.id !== meta.creator)

  /** Runs one request with the controls disabled, clearing the last error first. */
  const run = async (work: () => Promise<void>): Promise<void> => {
    setBusy(true)
    setError(null)
    try {
      await work()
    } finally {
      setBusy(false)
    }
  }

  const publish = (): Promise<void> =>
    run(async () => {
      const answer = await panelCalls.publish(treeId, true)
      if (answer.status === 200 && answer.body && 'published' in answer.body) {
        setPublishedAt(answer.body.publishedAt)
        setTodo([])
        setTree({ published: true, publicCopyCurrent: true, servable: true, advisory: 0 })
      } else if (answer.status === 409 && answer.body && 'violations' in answer.body) {
        // Refused: the switch stays off and the full validation's list is the to-do list (19.3).
        setTodo(answer.body.violations ?? [])
      } else setError({ where: 'publish', text: words.requestFailed })
    })

  const unpublish = (): Promise<void> =>
    run(async () => {
      setAsking(null)
      const answer = await panelCalls.publish(treeId, false)
      if (answer.status === 200) setTree({ published: false, publicCopyCurrent: true, servable: false })
      else setError({ where: 'publish', text: words.requestFailed })
    })

  const changeMeta = (where: 'invite' | 'handOver' | 'admin', request: () => ReturnType<typeof panelCalls.invite>, refused: string) =>
    run(async () => {
      const answer = await request()
      if (answer.status === 200 && answer.body && 'creator' in answer.body) {
        const next = answer.body
        setMeta(next)
        // A creator who handed the Tree over is a collaborator of it now (21.4).
        if (role === 'creator' && next.creator !== meta.creator) setRole('collaborator')
      } else setError({ where, text: answer.status === 422 ? refused : words.requestFailed })
    })

  const removeNode = (nodeId: string): Promise<void> =>
    run(async () => {
      const answer = await panelCalls.deleteNode(treeId, nodeId)
      if (answer.status >= 200 && answer.status < 300) {
        setTodo((held) => held.filter((violation) => violation.file !== nodeId))
        setTree({ advisory: Math.max(0, tree.advisory - todo.filter((violation) => violation.file === nodeId).length) })
        router.refresh()
      } else setError({ where: 'publish', text: words.requestFailed })
    })

  const deleteTree = (): Promise<void> =>
    run(async () => {
      const answer = await panelCalls.deleteTree(treeId)
      if (answer.status === 204) window.location.assign(overviewHref)
      else setError({ where: 'admin', text: words.requestFailed })
    })

  const submitted = (event: FormEvent<HTMLFormElement>, act: (accountId: string) => Promise<void>): void => {
    event.preventDefault()
    const form = event.currentTarget
    const accountId = new FormData(form).get('account')
    // Back to the placeholder: the account just chosen has left the list, or holds the Tree now.
    if (typeof accountId === 'string' && accountId !== '') void act(accountId).then(() => form.reset())
  }

  const errorAt = (where: NonNullable<typeof error>['where']) =>
    error?.where === where ? (
      <p className="admin-error" role="alert">
        {error.text}
      </p>
    ) : null

  const shown = shownOf(tree)
  const todoHeading = shown === 'notServable' ? words.notServableBecause : shown === 'publicBehind' ? words.publicBehindBecause : words.todoBefore

  return (
    <div className="panel-body" ref={body} data-scroll-box="" tabIndex={0} aria-labelledby="panel-heading">
      <h2 id="panel-heading" className="panel-heading">
        {`${words.treeState}: `}
        <PanelButton words={words} />
      </h2>

      <section className="panel-section" aria-labelledby="panel-publish">
        <h3 id="panel-publish">{words.publish}</h3>
        {asking === 'unpublish' ? (
          <div className="panel-ask">
            <p>{words.confirmUnpublish}</p>
            <div className="panel-actions">
              <button type="button" className="admin-submit" disabled={busy} onClick={unpublish}>
                {words.confirm}
              </button>
              <button type="button" className="admin-link" onClick={() => setAsking(null)}>
                {words.cancel}
              </button>
            </div>
          </div>
        ) : (
          <div className="panel-switch-row">
            <button
              type="button"
              role="switch"
              className="panel-switch"
              aria-checked={tree.published}
              aria-label={words.publish}
              disabled={!manages || busy}
              onClick={() => (tree.published ? setAsking('unpublish') : void publish())}
            >
              <span className="panel-switch-knob" aria-hidden="true" />
            </button>
            <span>{tree.published ? words.published : words.hidden}</span>
          </div>
        )}
        {errorAt('publish')}
        {tree.published && (
          <dl className="panel-facts">
            {publishedAt && (
              <>
                <dt>{words.publishedAt}</dt>
                <dd>
                  <time dateTime={publishedAt}>{new Date(publishedAt).toLocaleString()}</time>
                </dd>
              </>
            )}
            <dt>{words.publicLink}</dt>
            <dd>
              <a href={publicHref} target="_blank" rel="noopener noreferrer" data-public-link="">
                {publicHref}
              </a>
            </dd>
          </dl>
        )}
        {todo.length > 0 && (
          <>
            <p className="panel-todo-heading">{todoHeading}</p>
            <ul className="panel-todo">
              {todo.map((violation, index) => (
                <li key={`${violation.file} ${violation.keyPath} ${violation.rule} ${index}`} data-rule={violation.rule}>
                  {violation.file === 'manifest' || violation.file === 'tree.json' ? (
                    <span className="panel-todo-where">{words.thisTree}</span>
                  ) : (
                    <a className="panel-todo-where" href={nodeHref.replace(NODE_PLACEHOLDER, encodeURIComponent(violation.file))}>
                      {titles[violation.file] || violation.file}
                    </a>
                  )}
                  {`: ${violation.message}`}
                  {violation.rule === 'V-REACH' && manages && (
                    <button type="button" className="admin-link panel-todo-remove" disabled={busy} onClick={() => removeNode(violation.file)}>
                      {words.removeStep}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="panel-section" aria-labelledby="panel-collaborators">
        <h3 id="panel-collaborators">{words.collaborators}</h3>
        <ul className="panel-people">
          <li data-account={meta.creator}>
            <span className="panel-name">{nameOf(meta.creator)}</span> <span className="admin-row-login">({words.creator})</span>
          </li>
          {meta.collaborators.map((id) => (
            <li key={id} data-account={id}>
              <span className="panel-name">{nameOf(id)}</span>
              {manages && (
                <button
                  type="button"
                  className="panel-remove"
                  aria-label={`${words.removeCollaborator} ${nameOf(id)}`}
                  disabled={busy}
                  onClick={() => changeMeta('invite', () => panelCalls.remove(treeId, id), words.requestFailed)}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M3 3l10 10M13 3L3 13" />
                  </svg>
                </button>
              )}
            </li>
          ))}
        </ul>
        {manages && (
          <form className="panel-form" onSubmit={(event) => submitted(event, (id) => changeMeta('invite', () => panelCalls.invite(treeId, id), words.cannotInvite))}>
            <AccountSelect name="invite" label={words.chooseAccount} accounts={invitable} disabled={busy} />
            <button type="submit" className="admin-submit" disabled={busy || invitable.length === 0}>
              {words.invite}
            </button>
          </form>
        )}
        {errorAt('invite')}
        {role === 'creator' && (
          <HandOver words={words} accounts={heirs} disabled={busy} onSubmit={(event) => submitted(event, (id) => changeMeta('handOver', () => panelCalls.handOver(treeId, id), words.cannotInvite))} />
        )}
        {errorAt('handOver')}
      </section>

      <section className="panel-section" aria-labelledby="panel-tree">
        <h3 id="panel-tree">{words.thisTree}</h3>
        <dl className="panel-facts">
          <dt>{words.languages}</dt>
          <dd>
            {languages.map((language) => (
              <span key={language} className="panel-tag">
                {language}
              </span>
            ))}{' '}
            <span className="admin-row-login">({words.fixed})</span>
          </dd>
          <dt>{words.treeId}</dt>
          <dd>
            <code>{treeId}</code>
          </dd>
          {tree.published && (
            <>
              <dt>{words.publicLink}</dt>
              <dd>
                <a href={publicHref} target="_blank" rel="noopener noreferrer">
                  {publicHref}
                </a>
              </dd>
            </>
          )}
        </dl>
      </section>

      {role === 'administrator' && (
        <section className="panel-section" aria-labelledby="panel-administrator">
          <h3 id="panel-administrator">{words.administrator}</h3>
          <HandOver words={words} accounts={heirs} disabled={busy} onSubmit={(event) => submitted(event, (id) => changeMeta('admin', () => panelCalls.handOver(treeId, id), words.cannotInvite))} />
          {asking === 'delete' ? (
            <div className="panel-ask">
              <p>{words.confirmDeleteTree}</p>
              <div className="panel-actions">
                <button type="button" className="admin-submit panel-danger" disabled={busy} onClick={deleteTree}>
                  {words.confirm}
                </button>
                <button type="button" className="admin-link" onClick={() => setAsking(null)}>
                  {words.cancel}
                </button>
              </div>
            </div>
          ) : (
            <div className="panel-actions">
              <button
                type="button"
                className="admin-submit panel-danger"
                disabled={busy || tree.published}
                aria-describedby={tree.published ? 'panel-unpublish-first' : undefined}
                onClick={() => setAsking('delete')}
              >
                {words.deleteTree}
              </button>
              {tree.published && (
                <span id="panel-unpublish-first" className="admin-row-login">
                  {words.unpublishFirst}
                </span>
              )}
            </div>
          )}
          {errorAt('admin')}
        </section>
      )}
    </div>
  )
}

/** A `<select>` of accounts by name, the login after it to tell two of one name apart (33.4). */
function AccountSelect({ name, label, accounts, disabled }: { name: string; label: string; accounts: AccountAnswer[]; disabled: boolean }) {
  return (
    <select name="account" className="editor-select panel-select" aria-label={label} data-select={name} defaultValue="" disabled={disabled}>
      <option value="" disabled>
        {label}
      </option>
      {accounts.map((account) => (
        <option key={account.id} value={account.id}>
          {`${account.name} · ${account.login}`}
        </option>
      ))}
    </select>
  )
}

/** `handOver` with its select and button (33.4, 33.6): the creator's, and the administrator's. */
function HandOver({
  words,
  accounts,
  disabled,
  onSubmit,
}: {
  words: Pick<PanelWords, 'handOver' | 'handOverTo'>
  accounts: AccountAnswer[]
  disabled: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <form className="panel-form" onSubmit={onSubmit}>
      <AccountSelect name="hand-over" label={words.handOverTo} accounts={accounts} disabled={disabled} />
      <button type="submit" className="admin-submit" disabled={disabled || accounts.length === 0}>
        {words.handOver}
      </button>
    </form>
  )
}
