/**
 * Sessions (docs/specs/application.md 20.4): the cookie constant, the token only as a hash
 * on disk, idle and absolute expiry on a clock the test moves, the sweep, and the ends.
 */
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { openAccounts, type Account, type Accounts } from '../../src/store/accounts.ts'
import {
  ABSOLUTE_MS,
  CLEARING_COOKIE,
  COOKIE_ATTRIBUTES,
  COOKIE_NAME,
  IDLE_MS,
  openSessions,
  REFRESH_MS,
  tokenOf,
  type Sessions,
} from '../../src/store/sessions.ts'
import { ADMIN } from './admin.ts'

const made: string[] = []
let clock: number
let dir: string
let accounts: Accounts
let admin: Account
let anna: Account
let sessions: Sessions

beforeEach(async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  dir = await mkdtemp(path.join(tmpdir(), 'elsa-sessions-'))
  made.push(dir)
  accounts = await openAccounts(dir, ADMIN)
  admin = accounts.all()[0]!
  anna = await accounts.create(admin, 'Anna', 'anna', 'annas first password')
  clock = Date.parse('2026-09-26T12:00:00Z')
  sessions = await openSessions(dir, accounts, () => clock)
})

afterEach(async () => {
  vi.restoreAllMocks()
  for (const folder of made.splice(0)) await rm(folder, { recursive: true, force: true })
})

/** The `Cookie` header a browser sends back for a `Set-Cookie` value. */
function cookieFor(setCookie: string): string {
  return setCookie.split(';')[0]!
}

describe('the cookie (20.4)', () => {
  test('carries every attribute ADR-132 decided, by name, and no Domain', () => {
    const attributes = COOKIE_ATTRIBUTES.split('; ')
    expect(attributes).toEqual(['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/admin'])
    expect(COOKIE_ATTRIBUTES).not.toMatch(/domain/i)
    expect(COOKIE_NAME).toBe('elsa-admin-session')
  })

  test('start answers the token with Max-Age of the absolute expiry; the clearing value has Max-Age=0', async () => {
    const { cookie } = await sessions.start(anna)

    expect(cookie).toMatch(new RegExp(`^elsa-admin-session=[A-Za-z0-9_-]{43}; ${COOKIE_ATTRIBUTES}; Max-Age=${ABSOLUTE_MS / 1000}$`))
    expect(CLEARING_COOKIE).toBe(`elsa-admin-session=; ${COOKIE_ATTRIBUTES}; Max-Age=0`)
  })

  test('tokenOf finds the session among other cookies and nothing in a header without it', () => {
    expect(tokenOf('a=1; elsa-admin-session=abc; b=2')).toBe('abc')
    expect(tokenOf('elsa-admin-sessionx=abc')).toBeNull()
    expect(tokenOf(null)).toBeNull()
    expect(tokenOf('elsa-admin-session=')).toBeNull()
  })
})

describe('the record (20.4)', () => {
  test('holds the hash of the token, never the token', async () => {
    const { cookie } = await sessions.start(anna)
    const token = tokenOf(cookieFor(cookie))!

    const file = await readFile(path.join(dir, 'sessions.json'), 'utf8')
    expect(file).not.toContain(token)
    expect(JSON.parse(file)).toEqual([
      expect.objectContaining({ accountId: anna.id, createdAt: '2026-09-26T12:00:00.000Z', expiresAt: '2026-10-10T12:00:00.000Z' }),
    ])
  })

  test('two logins are two tokens: a login never reuses one', async () => {
    const first = await sessions.start(anna)
    const second = await sessions.start(anna)

    expect(cookieFor(first.cookie)).not.toBe(cookieFor(second.cookie))
    expect(await sessions.resolve(cookieFor(first.cookie))).toMatchObject({ account: { id: anna.id } })
    expect(await sessions.resolve(cookieFor(second.cookie))).toMatchObject({ account: { id: anna.id } })
  })

  test('an unknown or absent token resolves to nothing', async () => {
    await sessions.start(anna)

    expect(await sessions.resolve(null)).toBeNull()
    expect(await sessions.resolve('elsa-admin-session=not-a-token')).toBeNull()
  })

  test('survives a restart: a second process on the same folder resolves it', async () => {
    const { cookie } = await sessions.start(anna)

    const again = await openSessions(dir, accounts, () => clock)

    expect(await again.resolve(cookieFor(cookie))).toMatchObject({ account: { id: anna.id } })
  })
})

describe('expiry (20.4)', () => {
  test('12 hours idle ends it', async () => {
    const { cookie } = await sessions.start(anna)

    clock += IDLE_MS - 1000
    expect(await sessions.resolve(cookieFor(cookie))).not.toBeNull()
    // That request was seen, so the idle clock starts again from it.
    clock += IDLE_MS - 1000
    expect(await sessions.resolve(cookieFor(cookie))).not.toBeNull()
    clock += IDLE_MS + 1000
    expect(await sessions.resolve(cookieFor(cookie))).toBeNull()
  })

  test('14 days ends it however active it was', async () => {
    const { cookie } = await sessions.start(anna)

    for (let hour = 1; hour < 14 * 24; hour += 1) {
      clock += 60 * 60 * 1000
      expect(await sessions.resolve(cookieFor(cookie)), `hour ${hour}`).not.toBeNull()
    }
    clock += 60 * 60 * 1000
    expect(await sessions.resolve(cookieFor(cookie))).toBeNull()
  })

  test('lastSeen is written at most once per five minutes', async () => {
    const { cookie } = await sessions.start(anna)
    const lastSeen = async (): Promise<string> => JSON.parse(await readFile(path.join(dir, 'sessions.json'), 'utf8'))[0].lastSeen

    clock += REFRESH_MS - 1000
    await sessions.resolve(cookieFor(cookie))
    expect(await lastSeen()).toBe('2026-09-26T12:00:00.000Z')
    clock += 2000
    await sessions.resolve(cookieFor(cookie))
    expect(await lastSeen()).toBe('2026-09-26T12:05:01.000Z')
  })

  test('expired records are swept at the next write', async () => {
    await sessions.start(anna)
    clock += IDLE_MS + 1000

    await sessions.start(admin)

    const records = JSON.parse(await readFile(path.join(dir, 'sessions.json'), 'utf8'))
    expect(records.map((record: { accountId: string }) => record.accountId)).toEqual([admin.id])
  })
})

describe('ending sessions (20.4)', () => {
  test('end deletes the record', async () => {
    const { cookie, session } = await sessions.start(anna)

    expect(await sessions.end(session)).toEqual({ cookie: CLEARING_COOKIE })
    expect(await sessions.resolve(cookieFor(cookie))).toBeNull()
  })

  test("endAll ends every session of the account but the one kept, and no one else's", async () => {
    const kept = await sessions.start(anna)
    const other = await sessions.start(anna)
    const admins = await sessions.start(admin)

    await sessions.endAll(anna.id, kept.session)

    expect(await sessions.resolve(cookieFor(kept.cookie))).not.toBeNull()
    expect(await sessions.resolve(cookieFor(other.cookie))).toBeNull()
    expect(await sessions.resolve(cookieFor(admins.cookie))).not.toBeNull()
  })

  test('a deactivated account resolves to nothing even before its records are removed', async () => {
    const { cookie } = await sessions.start(anna)

    await accounts.update(admin, anna.id, { active: false })

    expect(await sessions.resolve(cookieFor(cookie))).toBeNull()
  })
})
