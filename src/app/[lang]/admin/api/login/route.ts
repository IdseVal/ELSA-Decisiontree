/**
 * `POST /admin/api/login` (docs/specs/application.md 20.4, 20.6, 20.7, 22.1): `{ login,
 * password }` answers 204 and the session cookie, 401 for a wrong name or password, 429
 * while locked -- 401 and 429 with the same body, so the answer never says whether a name
 * exists. The CSRF check applies here too, against login CSRF.
 */
import { bodyOf, csrfRefusal, json, refuse } from '../../../../../admin/authenticated.ts'
import { store } from '../../../../../config.ts'

export const dynamic = 'force-dynamic'

/** What a refused login answers, whichever the reason (20.7). */
const REFUSED = { error: 'refused', field: null }

export async function POST(request: Request): Promise<Response> {
  if (csrfRefusal(request)) return refuse(403, 'forbidden')
  const body = await bodyOf(request)
  const login = typeof body?.login === 'string' ? body.login : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const { accounts, sessions, loginLimit } = await store()

  const key = login.trim().toLowerCase()
  // Counted from here, so simultaneous guesses cannot all pass before the first one fails (20.7).
  const verdict = loginLimit.begin(key)
  if (verdict.locked) return json(REFUSED, 429, { 'Retry-After': String(verdict.retryAfter) })

  let account
  try {
    account = await accounts.authenticate(login, password)
  } catch (error) {
    loginLimit.fail(key)
    throw error
  }
  if (!account) {
    const lock = loginLimit.fail(key)
    if (lock === 'route') console.log('login route locked for one minute: more than 60 failures in a minute')
    else if (lock === 'name') {
      const named = accounts.byLogin(login)
      console.log(`login locked for 15 minutes for ${named ? `account ${named.id}` : 'an unknown name'}`)
    }
    return json(REFUSED, 401)
  }
  loginLimit.succeed(key)
  // A login never keeps a token it was sent: a live session is replaced (20.4).
  const previous = await sessions.resolve(request.headers.get('cookie'))
  if (previous) await sessions.end(previous)
  const { cookie } = await sessions.start(account)
  console.log(`account ${account.id} logged in`)
  return json(undefined, 204, { 'Set-Cookie': cookie })
}
