/**
 * Accounts (docs/specs/application.md 20.1 to 20.3, 20.8): the hash format, verification,
 * the dummy hash on an unknown name, the administrator from `ELSA_ADMIN_PASSWORD`, and the
 * rules of who changes what.
 */
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { buildDataDir } from '../browser/admin.ts'
import { stopServers } from '../browser/serve.ts'
import {
  AccountError,
  DUMMY_HASH,
  hashPassword,
  normaliseLogin,
  openAccounts,
  verifyPassword,
  type Account,
  type Accounts,
} from '../../src/store/accounts.ts'
import { ADMIN, ADMIN_PASSWORD } from './admin.ts'

const made: string[] = []
let logged: string[]

async function folder(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'elsa-accounts-'))
  made.push(dir)
  return dir
}

beforeEach(() => {
  logged = []
  vi.spyOn(console, 'log').mockImplementation((line: string) => void logged.push(line))
})

// Removes the folders buildDataDir made; no server was started.
afterAll(stopServers)

afterEach(async () => {
  vi.restoreAllMocks()
  for (const dir of made.splice(0)) await rm(dir, { recursive: true, force: true })
})

/** A fresh data directory's accounts, the administrator among them. */
async function fresh(): Promise<{ accounts: Accounts; admin: Account; dir: string }> {
  const dir = await folder()
  const accounts = await openAccounts(dir, ADMIN)
  return { accounts, admin: accounts.all().find((account) => account.administrator)!, dir }
}

describe('the password hash (20.2)', () => {
  test('is scrypt with N = 2^16, r = 8, p = 2, a 16-byte salt and a 32-byte key, in one string', async () => {
    const hash = await hashPassword('a password of some length')

    const [scheme, logN, r, p, salt, key] = hash.split('$')
    expect([scheme, logN, r, p]).toEqual(['scrypt', '16', '8', '2'])
    expect(Buffer.from(salt!, 'base64url')).toHaveLength(16)
    expect(Buffer.from(key!, 'base64url')).toHaveLength(32)
    // A fresh salt every time: the same password never hashes to the same string.
    expect(await hashPassword('a password of some length')).not.toBe(hash)
  })

  test('verifies the password it was made from and nothing else, and never throws', async () => {
    const hash = await hashPassword('a password of some length')

    expect(await verifyPassword('a password of some length', hash)).toBe(true)
    expect(await verifyPassword('a password of some lengtH', hash)).toBe(false)
    expect(await verifyPassword('', hash)).toBe(false)
    expect(await verifyPassword('anything', 'not a hash')).toBe(false)
    expect(await verifyPassword('anything', 'scrypt$99$8$2$AAAA$AAAA')).toBe(false)
  })

  test('the dummy hash is well-formed and matches no password anyone could type', async () => {
    expect(DUMMY_HASH.split('$').slice(0, 4)).toEqual(['scrypt', '16', '8', '2'])
    expect(await verifyPassword('', DUMMY_HASH)).toBe(false)
    expect(await verifyPassword(ADMIN_PASSWORD, DUMMY_HASH)).toBe(false)
  })
})

describe('the administrator (20.3)', () => {
  test('a first start creates it from ELSA_ADMIN_PASSWORD, and says so without the password', async () => {
    const { accounts, admin, dir } = await fresh()

    expect(admin).toMatchObject({ login: 'admin', active: true, administrator: true })
    expect(admin.id).toMatch(/^[0-9a-f]{32}$/)
    expect(await accounts.authenticate('admin', ADMIN_PASSWORD)).toBe(admin)
    expect(logged).toContain('administrator password set from ELSA_ADMIN_PASSWORD; remove the variable')
    const file = await readFile(path.join(dir, 'accounts.json'), 'utf8')
    expect(file).not.toContain(ADMIN_PASSWORD)
    expect(logged.join('\n')).not.toContain(ADMIN_PASSWORD)
  })

  test('a start without the variable and without an administrator refuses; one with a short password refuses', async () => {
    await expect(openAccounts(await folder(), {})).rejects.toThrow('ELSA_ADMIN_PASSWORD is not set')
    await expect(openAccounts(await folder(), { ELSA_ADMIN_PASSWORD: 'eleven char' })).rejects.toThrow('12 to 256 characters')
  })

  test('a later start without the variable keeps the password; with it, replaces it -- the recovery path', async () => {
    const { dir, admin } = await fresh()

    const kept = await openAccounts(dir, {})
    expect(await kept.authenticate('admin', ADMIN_PASSWORD)).toMatchObject({ id: admin.id })

    const replaced = await openAccounts(dir, { ELSA_ADMIN_PASSWORD: 'a brand new password' })
    expect(await replaced.authenticate('admin', ADMIN_PASSWORD)).toBeNull()
    expect(await replaced.authenticate('admin', 'a brand new password')).toMatchObject({ id: admin.id })
    // The same account, not a second administrator.
    expect(replaced.all().filter((account) => account.administrator)).toHaveLength(1)
  })

  test('cannot be deactivated by any request', async () => {
    const { accounts, admin } = await fresh()

    await expect(accounts.update(admin, admin.id, { active: false })).rejects.toMatchObject({ status: 403, field: 'active' })
    expect(accounts.get(admin.id)!.active).toBe(true)
  })
})

describe('authenticate (20.2, 20.8)', () => {
  test('runs scrypt against the dummy hash for an unknown name, and logs no name', async () => {
    const { accounts } = await fresh()
    const timed = async (login: string): Promise<number> => {
      const start = performance.now()
      await accounts.authenticate(login, 'whatever password')
      return performance.now() - start
    }
    await timed('admin')

    // The KDF runs for a name that does not exist: an unknown name costs what a known one
    // with a wrong password costs, not the microseconds of a lookup (a loose bound, for CI).
    const known = await timed('admin')
    const unknown = await timed('nobody-here')
    expect(unknown).toBeGreaterThan(known / 3)

    expect(logged).toContain('login failed for an unknown name')
    expect(logged.join('\n')).not.toContain('nobody-here')
    expect(logged.join('\n')).not.toContain('whatever password')
  })

  test('a known name with a wrong password is logged by id, and a deactivated account cannot log in', async () => {
    const { accounts, admin } = await fresh()
    const anna = await accounts.create(admin, 'Anna', 'anna', 'annas first password')

    expect(await accounts.authenticate('anna', 'not her password')).toBeNull()
    expect(logged).toContain(`login failed for account ${anna.id}`)
    // Case-insensitive on entry (20.1).
    expect(await accounts.authenticate(' ANNA ', 'annas first password')).toMatchObject({ id: anna.id })

    await accounts.update(admin, anna.id, { active: false })
    expect(await accounts.authenticate('anna', 'annas first password')).toBeNull()
  })

  test('a hash made with older parameters is replaced at the next successful login', async () => {
    const { accounts, admin, dir } = await fresh()
    const anna = await accounts.create(admin, 'Anna', 'anna', 'annas first password')
    // As a build with N = 2^14 would have written it.
    const salt = Buffer.alloc(16, 1)
    const { scryptSync } = await import('node:crypto')
    const key = scryptSync('annas first password', salt, 32, { N: 2 ** 14, r: 8, p: 2 })
    anna.passwordHash = `scrypt$14$8$2$${salt.toString('base64url')}$${key.toString('base64url')}`

    expect(await accounts.authenticate('anna', 'annas first password')).toMatchObject({ id: anna.id })
    expect(accounts.get(anna.id)!.passwordHash.startsWith('scrypt$16$8$2$')).toBe(true)
    const onDisk = JSON.parse(await readFile(path.join(dir, 'accounts.json'), 'utf8')) as Account[]
    expect(onDisk.find((account) => account.id === anna.id)!.passwordHash.startsWith('scrypt$16$')).toBe(true)
  })
})

describe('create and update (20.1, 22.1)', () => {
  test('the administrator creates an account; nobody else can', async () => {
    const { accounts, admin } = await fresh()

    const anna = await accounts.create(admin, '  Anna de Vries ', 'Anna', 'annas first password')
    expect(anna).toMatchObject({ name: 'Anna de Vries', login: 'anna', active: true, administrator: false })
    expect(logged).toContain(`account ${anna.id} created by account ${admin.id} at ${anna.createdAt}`)
    await expect(accounts.create(anna, 'Bram', 'bram', 'brams first password')).rejects.toMatchObject({ status: 403 })
  })

  test.for([
    ['', 'bram', 'brams first password', 'name', 'name-length'],
    ['x'.repeat(81), 'bram', 'brams first password', 'name', 'name-length'],
    ['Bram', 'b', 'brams first password', 'login', 'login-invalid'],
    ['Bram', 'bram@example.org', 'brams first password', 'login', 'login-invalid'],
    ['Bram', 'bram--x', 'brams first password', 'login', 'login-invalid'],
    ['Bram', 'admin', 'brams first password', 'login', 'login-taken'],
    ['Bram', 'bram', 'eleven char', 'password', 'password-length'],
    ['Bram', 'bram', 'x'.repeat(257), 'password', 'password-length'],
  ] as const)('refuses %j / %j / its password with 422 at %s (%s)', async ([name, login, password, field, code]) => {
    const { accounts, admin } = await fresh()

    const refusal = accounts.create(admin, name, login, password)

    await expect(refusal).rejects.toBeInstanceOf(AccountError)
    await expect(refusal).rejects.toMatchObject({ status: 422, field, message: code })
    expect(accounts.all()).toHaveLength(1)
  })

  test('an account changes its own name, and its password only with the current one', async () => {
    const { accounts, admin } = await fresh()
    const anna = await accounts.create(admin, 'Anna', 'anna', 'annas first password')

    await accounts.update(anna, anna.id, { name: 'Anna V.' })
    expect(accounts.get(anna.id)!.name).toBe('Anna V.')
    await expect(accounts.update(anna, anna.id, { password: 'annas second password', currentPassword: 'wrong' })).rejects.toMatchObject({
      status: 403,
      field: 'currentPassword',
      message: 'wrong-password',
    })
    await accounts.update(anna, anna.id, { password: 'annas second password', currentPassword: 'annas first password' })
    expect(await accounts.authenticate('anna', 'annas second password')).toMatchObject({ id: anna.id })
    // The log names the change, never the value.
    expect(logged.join('\n')).not.toContain('annas second password')
  })

  test('an account cannot change another, nor deactivate itself', async () => {
    const { accounts, admin } = await fresh()
    const anna = await accounts.create(admin, 'Anna', 'anna', 'annas first password')
    const bram = await accounts.create(admin, 'Bram', 'bram', 'brams first password')

    await expect(accounts.update(anna, bram.id, { name: 'Not Bram' })).rejects.toMatchObject({ status: 403 })
    await expect(accounts.update(anna, anna.id, { active: false })).rejects.toMatchObject({ status: 403 })
    expect(accounts.get(bram.id)!.name).toBe('Bram')
  })

  test('the administrator sets another account password without the current one, and deactivates and reactivates it', async () => {
    const { accounts, admin } = await fresh()
    const anna = await accounts.create(admin, 'Anna', 'anna', 'annas first password')

    await accounts.update(admin, anna.id, { password: 'a reset password' })
    expect(await accounts.authenticate('anna', 'a reset password')).toMatchObject({ id: anna.id })
    await accounts.update(admin, anna.id, { active: false })
    expect(accounts.listActive().map((account) => account.login)).toEqual(['admin'])
    await accounts.update(admin, anna.id, { active: true })
    expect(accounts.listActive().map((account) => account.login)).toEqual(['admin', 'anna'])
    // Deactivated, never deleted (20.1).
    expect(accounts.all()).toHaveLength(2)
  })

  test('a refused field changes nothing, not even the fields before it', async () => {
    const { accounts, admin } = await fresh()
    const anna = await accounts.create(admin, 'Anna', 'anna', 'annas first password')

    await expect(accounts.update(admin, anna.id, { name: 'Anna V.', password: 'short' })).rejects.toMatchObject({ status: 422 })
    expect(accounts.get(anna.id)!.name).toBe('Anna')
  })

  test('a deactivation that lands while a password change runs scrypt stays: the change writes back only its own field', async () => {
    const { accounts, admin } = await fresh()
    const anna = await accounts.create(admin, 'Anna', 'anna', 'annas first password')

    const change = accounts.update(anna, anna.id, { password: 'annas second password', currentPassword: 'annas first password' })
    await accounts.update(admin, anna.id, { active: false })
    await change

    expect(accounts.get(anna.id)).toMatchObject({ active: false })
    expect(await verifyPassword('annas second password', accounts.get(anna.id)!.passwordHash)).toBe(true)
  })

  test("a reset that lands while a login re-hashes wins over the re-hash", async () => {
    const { accounts, admin } = await fresh()
    const anna = await accounts.create(admin, 'Anna', 'anna', 'annas first password')
    // An older hash, whose verification alone takes half of a current hash's time: the
    // reset's one scrypt ends while the login's second is still running.
    const salt = Buffer.alloc(16, 1)
    const { scryptSync } = await import('node:crypto')
    const key = scryptSync('annas first password', salt, 32, { N: 2 ** 15, r: 8, p: 2, maxmem: 128 * 1024 * 1024 })
    anna.passwordHash = `scrypt$15$8$2$${salt.toString('base64url')}$${key.toString('base64url')}`

    const login = accounts.authenticate('anna', 'annas first password')
    await accounts.update(admin, anna.id, { password: 'a reset password' })
    await login

    expect(await accounts.authenticate('anna', 'annas first password')).toBeNull()
    expect(await accounts.authenticate('anna', 'a reset password')).toMatchObject({ id: anna.id })
  })

  test("the log line names the fields changed in fixed words, never the caller's keys", async () => {
    const { accounts, admin } = await fresh()
    const anna = await accounts.create(admin, 'Anna', 'anna', 'annas first password')

    await accounts.update(admin, anna.id, { name: 'Anna V.', 'forged\nline': 1 } as never)

    const line = logged.find((entry) => entry.startsWith(`account ${anna.id} changed`))!
    expect(line).toMatch(new RegExp(`^account ${anna.id} changed \\(name\\) by account ${admin.id} at `))
    expect(logged.join('\n')).not.toContain('forged')
  })

  test('normaliseLogin lower-cases and trims, and refuses what is not in the id grammar', () => {
    expect(normaliseLogin(' Anna-B ')).toBe('anna-b')
    expect(normaliseLogin('-anna')).toBeNull()
    expect(normaliseLogin('a')).toBeNull()
    expect(normaliseLogin('x'.repeat(65))).toBeNull()
    expect(normaliseLogin(42)).toBeNull()
  })
})

describe("the tests' data directory (35.1)", () => {
  test('buildDataDir writes accounts the store authenticates', async () => {
    const dir = await buildDataDir({ trees: [], accounts: [{ login: 'anna', name: 'Anna', password: 'annas first password' }] })

    const accounts = await openAccounts(dir, ADMIN)

    expect(await accounts.authenticate('anna', 'annas first password')).toMatchObject({ login: 'anna', administrator: false })
  })
})
