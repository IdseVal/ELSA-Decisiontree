'use client'

/**
 * The administrator's accounts page (docs/specs/application.md 25.3;
 * ADR-133-login-and-account-pages decision 5): `newAccount` opens a Sheet with the three
 * fields of a new account; below it one row per account in a scroll box, each but the
 * administrator's with `deactivate` / `reactivate` and `setPassword`. Nothing is deleted,
 * and no hash or session is shown, because no route answers one.
 */
import { useState, type FormEvent } from 'react'
import { Sheet } from '../components/Sheet.tsx'
import { refusalOf, type AccountWords, type Refusal } from './account-words.ts'
import { Field } from './AccountForms.tsx'
import { send } from './request.ts'

/** One row: what the page may show of an account. */
export interface AccountRow {
  id: string
  name: string
  login: string
  active: boolean
  administrator: boolean
}

export function AccountsList({ accounts, words, nameLabel }: { accounts: AccountRow[]; words: AccountWords; nameLabel: string }) {
  const sheetWords = { close: words.close, previous: words.previous, next: words.next, opensInNewTab: words.opensInNewTab }
  return (
    <>
      <div className="admin-toolbar">
        <Sheet summary={words.newAccount} pages={[<NewAccount key="new" words={words} nameLabel={nameLabel} />]} words={sheetWords} uiLang={undefined} className="account-sheet" />
      </div>
      <div className="admin-list" data-scroll-box="" tabIndex={0}>
        <ul>
          {accounts.map((account) => (
            <li key={account.id} className="admin-row" data-login={account.login}>
              <span className="admin-row-name">{account.name}</span>
              <span className="admin-row-login">{account.login}</span>
              <span className="admin-row-state">
                {account.administrator ? words.administrator : account.active ? words.active : words.deactivated}
              </span>
              {!account.administrator && (
                <span className="admin-row-actions">
                  <ActiveToggle account={account} words={words} />
                  <Sheet
                    summary={words.setPassword}
                    pages={[<SetPassword key="password" account={account} words={words} />]}
                    words={sheetWords}
                    uiLang={undefined}
                    className="account-sheet"
                    idPrefix={`${account.id}-`}
                  />
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

function ActiveToggle({ account, words }: { account: AccountRow; words: AccountWords }) {
  const [failed, setFailed] = useState(false)
  const toggle = async (): Promise<void> => {
    const answer = await send('PATCH', `/admin/api/accounts/${encodeURIComponent(account.id)}`, { active: !account.active })
    if (refusalOf(answer, words)) setFailed(true)
    else window.location.reload()
  }
  return (
    <button type="button" className="admin-link" onClick={toggle} title={failed ? words.requestFailed : undefined}>
      {account.active ? words.deactivate : words.reactivate}
    </button>
  )
}

function NewAccount({ words, nameLabel }: { words: AccountWords; nameLabel: string }) {
  const [name, setName] = useState('')
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [refusal, setRefusal] = useState<Refusal | null>(null)
  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    const refused = refusalOf(await send('POST', '/admin/api/accounts', { name, login, password }), words)
    setRefusal(refused)
    if (!refused) window.location.reload()
  }
  const at = (field: string): string | undefined => (refusal && (refusal.field ?? 'password') === field ? refusal.text : undefined)
  return (
    <form className="admin-form" onSubmit={submit}>
      <Field label={nameLabel} error={at('name')}>
        <input name="name" required maxLength={80} autoComplete="off" value={name} onChange={(event) => setName(event.target.value)} />
      </Field>
      <Field label={words.login} error={at('login')}>
        <input name="login" required autoComplete="off" autoCapitalize="none" spellCheck={false} value={login} onChange={(event) => setLogin(event.target.value)} />
      </Field>
      <Field label={words.password} error={at('password')}>
        <input name="password" type="text" required autoComplete="off" maxLength={256} value={password} onChange={(event) => setPassword(event.target.value)} />
      </Field>
      <button type="submit" className="admin-submit">
        {words.create}
      </button>
    </form>
  )
}

function SetPassword({ account, words }: { account: AccountRow; words: AccountWords }) {
  const [password, setPassword] = useState('')
  const [refusal, setRefusal] = useState<Refusal | null>(null)
  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    const refused = refusalOf(await send('PATCH', `/admin/api/accounts/${encodeURIComponent(account.id)}`, { password }), words)
    setRefusal(refused)
    if (!refused) window.location.reload()
  }
  return (
    <form className="admin-form" onSubmit={submit}>
      <Field label={`${words.password} (${account.login})`} error={refusal?.text}>
        <input name="password" type="text" required autoComplete="off" maxLength={256} value={password} onChange={(event) => setPassword(event.target.value)} />
      </Field>
      <button type="submit" className="admin-submit">
        {words.setPassword}
      </button>
    </form>
  )
}
