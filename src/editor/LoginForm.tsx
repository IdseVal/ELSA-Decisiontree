'use client'

/**
 * The login form (docs/specs/application.md 25.1; ADR-133-login-and-account-pages
 * decisions 1 to 3): a name, a password, one button, and one error line. It posts JSON to
 * `/admin/api/login` and, on 204, reloads the address the reader asked for (24.2) -- no
 * redirect and no return address to validate.
 *
 * Its fields stay disabled until the script runs: without it, a submit would send the
 * password as a form the server refuses (20.6), and the page says why in a `<noscript>`.
 */
import { useState, type FormEvent } from 'react'
import { useHydrated } from './hydrated.ts'
import { send } from './request.ts'

/** The chrome words the form says; strings, because a client component takes no module. */
export interface LoginWords {
  login: string
  password: string
  signIn: string
  loginFailed: string
  loginLocked: string
  requestFailed: string
}

export function LoginForm({ words }: { words: LoginWords }) {
  const enhanced = useHydrated()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setBusy(true)
    const answer = await send('POST', '/admin/api/login', { login, password })
    if (answer?.status === 204) {
      window.location.reload()
      return
    }
    setBusy(false)
    // The name is kept and the password cleared, whatever the refusal (25.1).
    setPassword('')
    setError(answer?.status === 401 ? words.loginFailed : answer?.status === 429 ? words.loginLocked : words.requestFailed)
  }

  return (
    <form className="admin-form" method="post" onSubmit={submit}>
      <fieldset disabled={!enhanced || busy}>
        <label className="admin-field">
          <span>{words.login}</span>
          <input
            name="login"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            value={login}
            onChange={(event) => setLogin(event.target.value)}
          />
        </label>
        <label className="admin-field">
          <span>{words.password}</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button type="submit" className="admin-submit">
          {words.signIn}
        </button>
      </fieldset>
      <p className="admin-error" role="alert">
        {error}
      </p>
    </form>
  )
}
