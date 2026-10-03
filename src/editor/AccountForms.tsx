'use client'

/**
 * The account page's two cards (docs/specs/application.md 25.2; ADR-133-login-and-account-pages
 * decision 4): the caller's name, with a live counter to 80, and the password, changed with
 * the current one. Both `PATCH /admin/api/accounts/<own id>`, and both disabled until the
 * script runs (`useHydrated`).
 *
 * **[#196]** The password card also says which address the account signs in with, read-only
 * (38.5, ADR-195-who-sees-and-changes-an-address decision 5): one line cut with an ellipsis, the
 * whole address its title -- or `noEmail` for an account a converted store left without one --
 * and under it, on every page but the administrator's, `emailHelp`. Only the administrator
 * changes an address, its own with its row's `setEmail` on the accounts page.
 */
import { useState, type FormEvent, type ReactNode } from 'react'
import { refusalAt, refusalOf, type AccountWords, type Refusal } from './account-words.ts'
import { useHydrated } from './hydrated.ts'
import { send } from './request.ts'

const NAME_MAX = 80

export function AccountForms({
  id,
  name,
  email,
  emailLine,
  administrator,
  words,
}: {
  id: string
  name: string
  email: string | null
  /** `signedInWith(email)` in the chrome language, or `noEmail`: a function of the address, so the page says it. */
  emailLine: string
  administrator: boolean
  words: AccountWords
}) {
  const url = `/admin/api/accounts/${encodeURIComponent(id)}`
  const enhanced = useHydrated()
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

  return (
    <div className="admin-cards">
      <form className="admin-card admin-form" method="post" onSubmit={saveName} aria-labelledby="your-name">
        <h1 id="your-name">{words.yourName}</h1>
        <fieldset disabled={!enhanced}>
          <Field label={words.yourName} error={refusalAt(nameRefusal, 'name')} hint={`${[...newName].length} / ${NAME_MAX}`}>
            <input name="name" required maxLength={NAME_MAX} value={newName} onChange={(event) => setNewName(event.target.value)} />
          </Field>
          <button type="submit" className="admin-submit">
            {words.save}
          </button>
        </fieldset>
      </form>
      <form className="admin-card admin-form" method="post" onSubmit={savePassword} aria-labelledby="change-password">
        <h2 id="change-password">{words.changePassword}</h2>
        <p className="admin-note account-email" data-clamp="" title={email ?? undefined}>
          {emailLine}
        </p>
        {!administrator && <p className="admin-note">{words.emailHelp}</p>}
        <fieldset disabled={!enhanced}>
          {/* For the browser's password manager: which account this password belongs to. */}
          <input type="text" name="username" autoComplete="username" value={email ?? ''} readOnly hidden />
          <Field label={words.currentPassword} error={refusalAt(passwordRefusal, 'currentPassword')}>
            <input name="currentPassword" type="password" autoComplete="current-password" required value={current} onChange={(event) => setCurrent(event.target.value)} />
          </Field>
          <Field label={words.newPassword} error={refusalAt(passwordRefusal, 'password')}>
            <input name="newPassword" type="password" autoComplete="new-password" required maxLength={256} value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          <Field label={words.repeatPassword} error={refusalAt(passwordRefusal, 'repeatPassword')}>
            <input name="repeatPassword" type="password" autoComplete="new-password" required value={repeat} onChange={(event) => setRepeat(event.target.value)} />
          </Field>
          <button type="submit" className="admin-submit">
            {words.save}
          </button>
        </fieldset>
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
