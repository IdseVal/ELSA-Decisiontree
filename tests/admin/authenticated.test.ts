/**
 * The guard of the editor's API (docs/specs/application.md 20.6, 22.1): the CSRF layers on
 * every writing method, and `authenticated` answering 401 and 403 itself -- against the real
 * store, through the real route handlers.
 */
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import { csrfRefusal } from '../../src/admin/authenticated.ts'
import { ADMIN_PASSWORD } from '../store/admin.ts'

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

  beforeAll(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    data = await mkdtemp(path.join(tmpdir(), 'elsa-guard-'))
    seed = await mkdtemp(path.join(tmpdir(), 'elsa-guard-seed-'))
    // The routes read the store the environment names, as a deployment's do.
    process.env.ELSA_DATA_DIR = data
    process.env.ELSA_ADMIN_PASSWORD = ADMIN_PASSWORD
    process.env.ELSA_SEED_DIR = seed
    delete process.env.ELSA_BASE_URL
    login = (await import('../../src/app/[lang]/admin/api/login/route.ts')).POST
    logout = (await import('../../src/app/[lang]/admin/api/logout/route.ts')).POST
    me = (await import('../../src/app/[lang]/admin/api/me/route.ts')).GET
    accounts = (await import('../../src/app/[lang]/admin/api/accounts/route.ts')).POST
  })

  afterAll(async () => {
    vi.restoreAllMocks()
    await rm(data, { recursive: true, force: true })
    await rm(seed, { recursive: true, force: true })
  })

  const HOST = 'http://127.0.0.1:3000'
  const call = (handler: Handler, method: string, route: string, headers: Record<string, string> = {}, body?: unknown): Promise<Response> =>
    handler(
      new Request(`${HOST}${route}`, {
        method,
        headers: { Host: '127.0.0.1:3000', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    )
  const same = { 'Sec-Fetch-Site': 'same-origin' }

  test('without a session every route answers 401, with 20.9 headers', async () => {
    for (const answer of [await call(me, 'GET', '/admin/api/me'), await call(logout, 'POST', '/admin/api/logout', same)]) {
      expect(answer.status).toBe(401)
      expect(answer.headers.get('x-robots-tag')).toBe('noindex, nofollow')
      expect(answer.headers.get('cache-control')).toBe('no-store')
    }
  })

  test('a cross-site write is 403 before the session is looked at; login included', async () => {
    const cross = { 'Sec-Fetch-Site': 'cross-site' }
    expect((await call(login, 'POST', '/admin/api/login', cross, { login: 'admin', password: ADMIN_PASSWORD })).status).toBe(403)
    expect((await call(accounts, 'POST', '/admin/api/accounts', cross, {})).status).toBe(403)
    const form = await login(
      new Request(`${HOST}/admin/api/login`, {
        method: 'POST',
        headers: { Host: '127.0.0.1:3000', ...same, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `login=admin&password=${encodeURIComponent(ADMIN_PASSWORD)}`,
      }),
    )
    expect(form.status).toBe(403)
    expect(form.headers.get('set-cookie')).toBeNull()
  })

  test('a login sets the cookie, the session reaches a route, a non-administrator is 403, logout ends it', async () => {
    const wrong = await call(login, 'POST', '/admin/api/login', same, { login: 'admin', password: 'not the password' })
    expect(wrong.status).toBe(401)
    expect(wrong.headers.get('set-cookie')).toBeNull()

    const right = await call(login, 'POST', '/admin/api/login', same, { login: 'admin', password: ADMIN_PASSWORD })
    expect(right.status).toBe(204)
    const cookie = right.headers.get('set-cookie')!.split(';')[0]!
    expect((await (await call(me, 'GET', '/admin/api/me', { Cookie: cookie })).json()).login).toBe('admin')

    const created = await call(accounts, 'POST', '/admin/api/accounts', { ...same, Cookie: cookie }, { name: 'Cees', login: 'cees', password: 'cees first password' })
    expect(created.status).toBe(201)
    expect(await created.json()).not.toHaveProperty('passwordHash')
    const cees = (await call(login, 'POST', '/admin/api/login', same, { login: 'cees', password: 'cees first password' })).headers.get('set-cookie')!.split(';')[0]!
    const refused = await call(accounts, 'POST', '/admin/api/accounts', { ...same, Cookie: cees }, { name: 'Dirk', login: 'dirk', password: 'dirks first password' })
    expect(refused.status).toBe(403)

    const out = await call(logout, 'POST', '/admin/api/logout', { ...same, Cookie: cookie })
    expect(out.status).toBe(204)
    expect(out.headers.get('set-cookie')).toBe('elsa-admin-session=; HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=0')
    expect((await call(me, 'GET', '/admin/api/me', { Cookie: cookie })).status).toBe(401)
  })

  test('the fifth wrong password locks the name: 429 with Retry-After, the same body as a 401', async () => {
    const attempt = (): Promise<Response> => call(login, 'POST', '/admin/api/login', same, { login: 'cees', password: 'wrong password' })
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
    // Locked even for the right password: the lock is on the name.
    expect((await call(login, 'POST', '/admin/api/login', same, { login: 'cees', password: 'cees first password' })).status).toBe(429)
  })
})
