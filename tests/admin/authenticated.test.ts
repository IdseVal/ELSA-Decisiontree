/**
 * The guard of the editor's API (docs/specs/application.md 20.6, 22.1): the CSRF layers on
 * every writing method, and `authenticated` answering 401 and 403 itself -- against the real
 * store, through the real route handlers. **[#196]** And the login by e-mail address through
 * them (38.2, 38.5, 38.7, 38.8): one 401 body for every refusal, the lock per address typed,
 * and the address changed by the administrator alone, ending no session.
 */
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import { csrfRefusal } from '../../src/admin/authenticated.ts'
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../store/admin.ts'

const ORIGIN = 'https://elsa.example.org'

function request(method: string, headers: Record<string, string> = {}, body?: string): Request {
  return new Request(`${ORIGIN}/admin/api/logout`, { method, headers, body })
}

describe('csrfRefusal (20.6, layers 1 and 2)', () => {
  const env = { ELSA_BASE_URL: ORIGIN }

  test('GET and HEAD are never refused: they change nothing', () => {
    expect(csrfRefusal(request('GET', { 'Sec-Fetch-Site': 'cross-site' }), {}, env)).toBeNull()
    expect(csrfRefusal(request('HEAD', { 'Sec-Fetch-Site': 'cross-site' }), {}, env)).toBeNull()
  })

  test.for(['POST', 'PUT', 'PATCH', 'DELETE'])('%s from this origin passes; from another site is refused', (method) => {
    expect(csrfRefusal(request(method, { 'Sec-Fetch-Site': 'same-origin' }), {}, env)).toBeNull()
    for (const site of ['cross-site', 'same-site', 'none']) {
      expect(csrfRefusal(request(method, { 'Sec-Fetch-Site': site, Origin: ORIGIN }), {}, env), site).not.toBeNull()
    }
  })

  test('without Sec-Fetch-Site, the Origin must be the deployment own', () => {
    expect(csrfRefusal(request('POST', { Origin: ORIGIN }), {}, env)).toBeNull()
    expect(csrfRefusal(request('POST', { Origin: 'https://evil.example' }), {}, env)).not.toBeNull()
    expect(csrfRefusal(request('POST', {}), {}, env)).not.toBeNull()
    // With no ELSA_BASE_URL the request's own host is the origin, as config.ts resolves it.
    const local = new Request('http://127.0.0.1:3000/admin/api/logout', { method: 'POST', headers: { Host: '127.0.0.1:3000', Origin: 'http://127.0.0.1:3000' } })
    expect(csrfRefusal(local, {}, {})).toBeNull()
  })

  test('a body is JSON, or multipart on the upload route; the three form types are refused', () => {
    const same = { 'Sec-Fetch-Site': 'same-origin' }
    expect(csrfRefusal(request('POST', { ...same, 'Content-Type': 'application/json' }, '{}'), {}, env)).toBeNull()
    expect(csrfRefusal(request('POST', { ...same, 'Content-Type': 'application/json; charset=utf-8' }, '{}'), {}, env)).toBeNull()
    for (const type of ['application/x-www-form-urlencoded', 'multipart/form-data; boundary=x', 'text/plain']) {
      expect(csrfRefusal(request('POST', { ...same, 'Content-Type': type }, 'a=b'), {}, env), type).not.toBeNull()
    }
    expect(csrfRefusal(request('POST', { ...same, 'Content-Type': 'multipart/form-data; boundary=x' }, 'a'), { upload: true }, env)).toBeNull()
    expect(csrfRefusal(request('POST', { ...same, 'Content-Type': 'text/plain' }, 'a'), { upload: true }, env)).not.toBeNull()
  })

  test('a request with no type and no body passes layer 2: logout', () => {
    expect(csrfRefusal(request('POST', { 'Sec-Fetch-Site': 'same-origin' }), {}, env)).toBeNull()
  })
})

describe('the routes, through authenticated (22.1)', () => {
  let data: string
  let seed: string
  type Handler = (request: Request, context?: unknown) => Promise<Response>
  let login: Handler
  let logout: Handler
  let me: Handler
  let accounts: Handler
  let account: Handler

  beforeAll(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    data = await mkdtemp(path.join(tmpdir(), 'elsa-guard-'))
    seed = await mkdtemp(path.join(tmpdir(), 'elsa-guard-seed-'))
    // The routes read the store the environment names, as a deployment's do.
    process.env.ELSA_DATA_DIR = data
    process.env.ELSA_ADMIN_EMAIL = ADMIN_EMAIL
    process.env.ELSA_ADMIN_PASSWORD = ADMIN_PASSWORD
    process.env.ELSA_SEED_DIR = seed
    delete process.env.ELSA_BASE_URL
    login = (await import('../../src/app/[lang]/admin/api/login/route.ts')).POST
    logout = (await import('../../src/app/[lang]/admin/api/logout/route.ts')).POST
    me = (await import('../../src/app/[lang]/admin/api/me/route.ts')).GET
    accounts = (await import('../../src/app/[lang]/admin/api/accounts/route.ts')).POST
    account = (await import('../../src/app/[lang]/admin/api/accounts/[id]/route.ts')).PATCH as Handler
  })

  afterAll(async () => {
    vi.restoreAllMocks()
    await rm(data, { recursive: true, force: true })
    await rm(seed, { recursive: true, force: true })
  })

  const HOST = 'http://127.0.0.1:3000'
  const call = (handler: Handler, method: string, route: string, headers: Record<string, string> = {}, body?: unknown, context?: unknown): Promise<Response> =>
    handler(
      new Request(`${HOST}${route}`, {
        method,
        headers: { Host: '127.0.0.1:3000', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      context,
    )
  const same = { 'Sec-Fetch-Site': 'same-origin' }
  /** **[#196]** The session cookie of a login by `email`, as the browser sends it back. */
  const cookieOf = async (email: string, password: string): Promise<string> =>
    (await call(login, 'POST', '/admin/api/login', same, { email, password })).headers.get('set-cookie')!.split(';')[0]!
  /** **[#196]** `PATCH /admin/api/accounts/<id>` as `cookie`. */
  const patch = (id: string, cookie: string, body: unknown): Promise<Response> =>
    call(account, 'PATCH', `/admin/api/accounts/${id}`, { ...same, Cookie: cookie }, body, { params: Promise.resolve({ id }) })
  /** **[#196]** Every line the routes and the store logged so far. */
  const logged = (): string[] => vi.mocked(console.log).mock.calls.map(([line]) => String(line))

  test('without a session every route answers 401, with 20.9 headers', async () => {
    for (const answer of [await call(me, 'GET', '/admin/api/me'), await call(logout, 'POST', '/admin/api/logout', same)]) {
      expect(answer.status).toBe(401)
      expect(answer.headers.get('x-robots-tag')).toBe('noindex, nofollow')
      expect(answer.headers.get('cache-control')).toBe('no-store')
    }
  })

  test('a cross-site write is 403 before the session is looked at; login included', async () => {
    const cross = { 'Sec-Fetch-Site': 'cross-site' }
    expect((await call(login, 'POST', '/admin/api/login', cross, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })).status).toBe(403)
    expect((await call(accounts, 'POST', '/admin/api/accounts', cross, {})).status).toBe(403)
    const form = await login(
      new Request(`${HOST}/admin/api/login`, {
        method: 'POST',
        headers: { Host: '127.0.0.1:3000', ...same, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `email=${encodeURIComponent(ADMIN_EMAIL)}&password=${encodeURIComponent(ADMIN_PASSWORD)}`,
      }),
    )
    expect(form.status).toBe(403)
    expect(form.headers.get('set-cookie')).toBeNull()
  })

  test('a login sets the cookie, the session reaches a route, a non-administrator is 403, logout ends it', async () => {
    const wrong = await call(login, 'POST', '/admin/api/login', same, { email: ADMIN_EMAIL, password: 'not the password' })
    expect(wrong.status).toBe(401)
    expect(wrong.headers.get('set-cookie')).toBeNull()

    const right = await call(login, 'POST', '/admin/api/login', same, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    expect(right.status).toBe(204)
    const cookie = right.headers.get('set-cookie')!.split(';')[0]!
    expect(await (await call(me, 'GET', '/admin/api/me', { Cookie: cookie })).json()).toEqual({
      id: expect.stringMatching(/^[0-9a-f]{32}$/),
      name: 'Administrator',
      email: ADMIN_EMAIL,
      administrator: true,
    })

    const created = await call(accounts, 'POST', '/admin/api/accounts', { ...same, Cookie: cookie }, { name: 'Cees', email: 'Cees@Example.org', password: 'cees first password' })
    expect(created.status).toBe(201)
    const answer = await created.json()
    expect(answer).toMatchObject({ name: 'Cees', email: 'cees@example.org' })
    expect(answer).not.toHaveProperty('passwordHash')
    const cees = await cookieOf('cees@example.org', 'cees first password')
    const refused = await call(accounts, 'POST', '/admin/api/accounts', { ...same, Cookie: cees }, { name: 'Dirk', email: 'dirk@example.org', password: 'dirks first password' })
    expect(refused.status).toBe(403)

    const out = await call(logout, 'POST', '/admin/api/logout', { ...same, Cookie: cookie })
    expect(out.status).toBe(204)
    // No ELSA_BASE_URL and no proxy: a plain-HTTP deployment, so no Secure (#162).
    expect(out.headers.get('set-cookie')).toBe('elsa-admin-session=; HttpOnly; SameSite=Strict; Path=/admin; Max-Age=0')
    expect((await call(me, 'GET', '/admin/api/me', { Cookie: cookie })).status).toBe(401)
  })

  test('[#162] behind an HTTPS proxy the login and the logout cookie are Secure; over plain HTTP neither is', async () => {
    for (const [headers, flag] of [[{ 'x-forwarded-proto': 'https' }, 'Secure; '], [{}, '']] as const) {
      const right = await call(login, 'POST', '/admin/api/login', { ...same, ...headers }, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      const setCookie = right.headers.get('set-cookie')!
      expect(setCookie).toMatch(new RegExp(`^elsa-admin-session=[A-Za-z0-9_-]{43}; HttpOnly; ${flag}SameSite=Strict; Path=/admin; Max-Age=1209600$`))
      const cookie = setCookie.split(';')[0]!
      expect((await call(me, 'GET', '/admin/api/me', { Cookie: cookie })).status).toBe(200)

      const out = await call(logout, 'POST', '/admin/api/logout', { ...same, ...headers, Cookie: cookie })
      expect(out.headers.get('set-cookie')).toBe(`elsa-admin-session=; HttpOnly; ${flag}SameSite=Strict; Path=/admin; Max-Age=0`)
    }
  })

  test('**[#196]** a login by address is 204 in any case; a wrong password, an unknown address, a user name -- `admin` included -- and a body with `login` are one 401', async () => {
    const bodies = new Set<string>()
    for (const body of [
      { email: ADMIN_EMAIL, password: 'not the password' },
      { email: 'nobody@example.org', password: ADMIN_PASSWORD },
      { email: 'admin', password: ADMIN_PASSWORD },
      { email: 'cees', password: 'cees first password' },
      { login: 'admin', password: ADMIN_PASSWORD },
      { login: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    ]) {
      const answer = await call(login, 'POST', '/admin/api/login', same, body)
      expect(answer.status, JSON.stringify(body)).toBe(401)
      expect(answer.headers.get('set-cookie')).toBeNull()
      bodies.add(await answer.text())
    }
    expect([...bodies]).toEqual(['{"error":"refused","field":null}'])
    expect((await call(login, 'POST', '/admin/api/login', same, { email: ' Admin@Example.ORG ', password: ADMIN_PASSWORD })).status).toBe(204)
    // The log names no address and no string typed at the field (38.8).
    expect(logged()).toContain('login failed for an unknown address')
    expect(logged().join('\n').toLowerCase()).not.toMatch(/nobody@|admin@example\.org|cees@example\.org/)
  }, 30_000)

  test('**[#196]** five failures lock one address however it is spelled, and one no account holds alike: 429, the same body, logged without it', async () => {
    const admin = await cookieOf(ADMIN_EMAIL, ADMIN_PASSWORD)
    const dora = (await (await call(accounts, 'POST', '/admin/api/accounts', { ...same, Cookie: admin }, { name: 'Dora', email: 'dora@example.org', password: 'doras first password' })).json()) as { id: string }
    const lf = String.fromCharCode(10)
    for (const [address, spellings, password] of [
      ['dora@example.org', ['Dora@Example.org', ' dora@example.org ', `do${lf}ra@example.org`, `dora@exam${lf}ple.org`, `dora@example.org${lf}`], 'doras first password'],
      ['no-account@example.org', ['no-account@example.org', 'NO-ACCOUNT@example.org', `no-${lf}account@example.org`, ' no-account@example.org', `no-account@example.or${lf}g`], 'wrong password'],
    ] as const) {
      let refusal = ''
      for (const spelling of spellings) {
        const answer = await call(login, 'POST', '/admin/api/login', same, { email: spelling, password: 'wrong password' })
        expect(answer.status, JSON.stringify(spelling)).toBe(401)
        refusal = await answer.text()
      }
      // Locked even for the right password: the lock is on the address.
      const locked = await call(login, 'POST', '/admin/api/login', same, { email: address, password })
      expect(locked.status, address).toBe(429)
      expect(await locked.text()).toBe(refusal)
    }
    expect(logged()).toContain(`login locked for 15 minutes for account ${dora.id}`)
    expect(logged()).toContain('login locked for 15 minutes for an unknown address')
    expect(logged().join('\n').toLowerCase()).not.toMatch(/dora@|no-account@/)
  }, 30_000)

  test("**[#196]** the administrator changes an account's address, and its session goes on; the holder may not change its own, 403 at email", async () => {
    const admin = await cookieOf(ADMIN_EMAIL, ADMIN_PASSWORD)
    const eva = (await (await call(accounts, 'POST', '/admin/api/accounts', { ...same, Cookie: admin }, { name: 'Eva', email: 'eva@example.org', password: 'evas first password' })).json()) as { id: string }
    const session = await cookieOf('eva@example.org', 'evas first password')

    const own = await patch(eva.id, session, { email: 'eva.v@example.org' })
    expect(own.status).toBe(403)
    expect(await own.json()).toEqual({ error: 'forbidden', field: 'email' })

    const changed = await patch(eva.id, admin, { email: 'Eva.V@Example.org' })
    expect(changed.status).toBe(200)
    expect(await changed.json()).toMatchObject({ id: eva.id, email: 'eva.v@example.org' })
    const caller = await call(me, 'GET', '/admin/api/me', { Cookie: session })
    expect(caller.status).toBe(200)
    expect(await caller.json()).toMatchObject({ id: eva.id, email: 'eva.v@example.org' })
    expect(logged()).toContainEqual(expect.stringMatching(new RegExp(`^account ${eva.id} changed \\(email\\) by account [0-9a-f]{32} at `)))
    // A password set by the administrator does end it (20.4): the contrast that shows the rule.
    expect((await patch(eva.id, admin, { password: 'evas second password' })).status).toBe(200)
    expect((await call(me, 'GET', '/admin/api/me', { Cookie: session })).status).toBe(401)
  }, 30_000)

  test('the fifth wrong password locks the address: 429 with Retry-After, the same body as a 401', async () => {
    const attempt = (): Promise<Response> => call(login, 'POST', '/admin/api/login', same, { email: 'cees@example.org', password: 'wrong password' })
    const bodies: string[] = []
    for (let failure = 1; failure <= 5; failure += 1) {
      const answer = await attempt()
      expect(answer.status).toBe(401)
      bodies.push(await answer.text())
    }
    const locked = await attempt()
    expect(locked.status).toBe(429)
    expect(Number(locked.headers.get('retry-after'))).toBeGreaterThan(800)
    expect(await locked.text()).toBe(bodies[0])
    // Locked even for the right password: the lock is on the address.
    expect((await call(login, 'POST', '/admin/api/login', same, { email: 'cees@example.org', password: 'cees first password' })).status).toBe(429)
  })
})
