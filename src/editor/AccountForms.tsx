'use client'

/**
 * The account page's two cards (docs/specs/application.md 25.2; ADR-133-login-and-account-pages
 * decision 4): the caller's name, with a live counter to 80, and the password, changed with
 * the current one. Both `PATCH /admin/api/accounts/<own id>`.
 */
import { useState, type FormEvent, type ReactNode } from 'react'
import { refusalOf, type AccountWords, type Refusal } from './account-words.ts'
import { send } from './request.ts'

const NAME_MAX = 80

export function AccountForms({ id, name, login, words }: { id: string; name: string; login: string; words: AccountWords }) {
  const url = `/admin/api/accounts/${encodeURIComponent(id)}`
  const [newName, setNewName] = useState(name)
  const [nameRefusal, setNameRefusal] = useState<Refusal | null>(null)
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [passwordRefusal, setPasswordRefusal] = useState<Refusal | null>(null)

  const saveName = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    const refusal = refusalOf(await send('PATCH', url, { name: newName }), words)
    setNameRefusal(refusal)
    // The chrome bar shows the name, so the page is drawn again with the new one.
    if (!refusal) window.location.reload()
  }

  const savePassword = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (password !== repeat) {
      setPasswordRefusal({ field: 'repeatPassword', text: words.passwordsDiffer })
      return
    }
    const refusal = refusalOf(await send('PATCH', url, { password, currentPassword: current }), words)
    setPasswordRefusal(refusal)
    if (!refusal) {
      setCurrent('')
      setPassword('')
      setRepeat('')
    }
  }

  const errorAt = (refusal: Refusal | null, field: string): string | undefined =>
    refusal && (refusal.field ?? 'password') === field ? refusal.text : undefined

  return (
    <div className="admin-cards">
      <form className="admin-card admin-form" onSubmit={saveName} aria-labelledby="your-name">
        <h1 id="your-name">{words.yourName}</h1>
        <Field label={words.yourName} error={errorAt(nameRefusal, 'name')} hint={`${[...newName].length} / ${NAME_MAX}`}>
          <input name="name" required maxLength={NAME_MAX} value={newName} onChange={(event) => setNewName(event.target.value)} />
        </Field>
        <button type="submit" className="admin-submit">
          {words.save}
        </button>
      </form>
      <form className="admin-card admin-form" onSubmit={savePassword} aria-labelledby="change-password">
        <h2 id="change-password">{words.changePassword}</h2>
        {/* For the browser's password manager: which account this password belongs to. */}
        <input type="text" name="username" autoComplete="username" value={login} readOnly hidden />
        <Field label={words.currentPassword} error={errorAt(passwordRefusal, 'currentPassword')}>
          <input name="currentPassword" type="password" autoComplete="current-password" required value={current} onChange={(event) => setCurrent(event.target.value)} />
        </Field>
        <Field label={words.newPassword} error={errorAt(passwordRefusal, 'password')}>
          <input name="newPassword" type="password" autoComplete="new-password" required maxLength={256} value={password} onChange={(event) => setPassword(event.target.value)} />
        </Field>
        <Field label={words.repeatPassword} error={errorAt(passwordRefusal, 'repeatPassword')}>
          <input name="repeatPassword" type="password" autoComplete="new-password" required value={repeat} onChange={(event) => setRepeat(event.target.value)} />
        </Field>
        <button type="submit" className="admin-submit">
          {words.save}
        </button>
        <p className="admin-note">{words.sessionsEnded}</p>
      </form>
    </div>
  )
}

/** One labelled field, with the refusal shown at it (25.2) and an optional hint such as the counter. */
export function Field({ label, error, hint, children }: { label: string; error?: string | undefined; hint?: string; children: ReactNode }) {
  return (
    <div className="admin-field-group">
      <label className="admin-field">
        <span>{label}</span>
        {children}
      </label>
      {(error || hint) && (
        <p className={error ? 'admin-error' : 'admin-hint'} role={error ? 'alert' : undefined}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
