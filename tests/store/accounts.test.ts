/**
 * Accounts (docs/specs/application.md 20.1 to 20.3, 20.8, 38): the hash format, verification,
 * the dummy hash on an unknown address, the rules of who changes what -- and **[#196]** the
 * address: `normaliseEmail` on 38.1's table, the administrator from `ELSA_ADMIN_EMAIL` and
 * `ELSA_ADMIN_PASSWORD` by 38.3's table, a store of user names converted (38.4), who changes an
 * address (38.5), and one account per address and per name (38.1, 38.6).
 */
import { createHash, randomBytes } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { buildDataDir } from '../browser/admin.ts'
import { stopServers } from '../browser/serve.ts'
import {
  AccountError,
  DUMMY_HASH,
  hashPassword,
  normaliseEmail,
  openAccounts,
  verifyPassword,
  type Account,
  type Accounts,
} from '../../src/store/accounts.ts'
import { openSessions } from '../../src/store/sessions.ts'
import { ADMIN, ADMIN_EMAIL, ADMIN_PASSWORD } from './admin.ts'

// A hash costs about 150 ms of scrypt (20.2), and a row of 38.3's table or the conversion runs a dozen.
vi.setConfig({ testTimeout: 30_000 })

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

/** How long `authenticate` took, in milliseconds, and what it answered. */
async function timed(accounts: Accounts, email: string, password: string): Promise<{ ms: number; answer: Account | null }> {
  const start = performance.now()
  const answer = await accounts.authenticate(email, password)
  return { ms: performance.now() - start, answer }
}

/** One record of `accounts.json` as `dev` wrote it before #196: a user name and no address (38.4). */
interface UserNameRecord {
  id: string
  name: string
  login: string
  passwordHash: string
  active: boolean
  administrator: boolean
  createdAt: string
}

/**
 * A data directory written as `dev` writes it before #196 -- the administrator `admin` and two
 * accounts with user names whose names are one by 38.6's key, the second deactivated -- in its
 * byte form, `JSON.stringify(accounts, null, 2)` and a line feed.
 */
async function storeOfUserNames(): Promise<{ dir: string; admin: UserNameRecord; jan: UserNameRecord; jdv: UserNameRecord }> {
  const dir = await folder()
  const record = async (login: string, name: string, password: string, active: boolean, administrator: boolean): Promise<UserNameRecord> => ({
    id: randomBytes(16).toString('hex'),
    name,
    login,
    passwordHash: await hashPassword(password),
    active,
    administrator,
    createdAt: '2026-10-01T12:00:00.000Z',
  })
  const admin = await record('admin', 'Administrator', ADMIN_PASSWORD, true, true)
  const jan = await record('jan', 'Jan de Vries', 'jans first password', true, false)
  const jdv = await record('jdv', 'jan  de vries', 'jdvs first password', false, false)
  await writeFile(path.join(dir, 'accounts.json'), `${JSON.stringify([admin, jan, jdv], null, 2)}\n`)
  return { dir, admin, jan, jdv }
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

describe('**[#196]** normaliseEmail (38.1)', () => {
  // 38.1's table, row by row. Its first two rows hold the owner's address; an address in a
  // domain RFC 2606 reserves stands in for it, of the same form: no address in the
  // repository's tests is a real one (38.3, 35.3).
  const lf = String.fromCharCode(10)
  const cr = String.fromCharCode(13)
  test.for([
    ['anna.de.vries@example.org', 'anna.de.vries@example.org'],
    [' Anna.De.Vries@EXAMPLE.org ', 'anna.de.vries@example.org'],
    [`anna.de.${lf}vries@example.org`, 'anna.de.vries@example.org'],
    [`anna.de.vries@exam${cr}${lf}ple.org`, 'anna.de.vries@example.org'],
    ['anna+trees@example.org', 'anna+trees@example.org'],
    ["o'brien@example.org", "o'brien@example.org"],
    ['bram@localhost', 'bram@localhost'],
    [`${'A'.repeat(242)}@Example.org`, `${'a'.repeat(242)}@example.org`],
  ] as const)('%j is the address %j', ([given, address]) => {
    expect(normaliseEmail(given)).toBe(address)
  })

  test('an address of 254 characters is one, and of 255 is none', () => {
    expect(`${'A'.repeat(242)}@Example.org`).toHaveLength(254)
    expect(normaliseEmail(`${'a'.repeat(243)}@example.org`)).toBeNull()
  })

  test.for([
    'admin',
    '',
    'anna@',
    '@example.org',
    'anna@@example.org',
    'anna b@example.org',
    '"anna b"@example.org',
    'anna@-example.org',
    'anna@exa_mple.org',
    'anna@example..org',
    'jürgen@example.de',
    'anna@exämple.org',
  ])('%j is no address', (given) => {
    expect(normaliseEmail(given)).toBeNull()
  })

  test('a number and null are no address', () => {
    expect(normaliseEmail(42)).toBeNull()
    expect(normaliseEmail(null)).toBeNull()
  })

  test('only ASCII white space is stripped, and the check runs before lower-casing', () => {
    expect(normaliseEmail(`${String.fromCharCode(9)}anna@example.org${String.fromCharCode(12)}`)).toBe('anna@example.org')
    // A no-break space is not ASCII white space, so the browser keeps it and so does this check.
    expect(normaliseEmail(`${String.fromCharCode(0xa0)}anna@example.org`)).toBeNull()
    // The Kelvin sign lower-cases to the ASCII `k`: lowered first, it would pass as an address.
    const kelvin = `${String.fromCodePoint(0x212a)}ees@example.org`
    expect(kelvin.toLowerCase()).toBe('kees@example.org')
    expect(normaliseEmail(kelvin)).toBeNull()
  })
})

describe('the administrator (20.3, **[#196]** 38.3)', () => {
  test('a first start creates it from both variables, the address lower-cased, and says so without either value', async () => {
    const dir = await folder()
    const accounts = await openAccounts(dir, { ELSA_ADMIN_EMAIL: ' Admin@Example.ORG ', ELSA_ADMIN_PASSWORD: ADMIN_PASSWORD })
    const admin = accounts.all().find((account) => account.administrator)!

    expect(admin).toMatchObject({ name: 'Administrator', email: ADMIN_EMAIL, active: true, administrator: true })
    expect(admin.id).toMatch(/^[0-9a-f]{32}$/)
    expect(await accounts.authenticate(ADMIN_EMAIL, ADMIN_PASSWORD)).toBe(admin)
    expect(logged).toContain('administrator password set from ELSA_ADMIN_PASSWORD; remove the variable')
    expect(logged).toContain('administrator e-mail address set from ELSA_ADMIN_EMAIL; remove the variable')
    const file = await readFile(path.join(dir, 'accounts.json'), 'utf8')
    expect(file).not.toContain(ADMIN_PASSWORD)
    expect(logged.join('\n')).not.toContain(ADMIN_PASSWORD)
    expect(logged.join('\n').toLowerCase()).not.toContain(ADMIN_EMAIL)
  })

  // Each row that reads the variable absent, again with it set to the empty string (38.3).
  const absent = [{}, { ELSA_ADMIN_EMAIL: '' }]

  test('no administrator and a variable absent: refuses, naming each one that is missing, and writes nothing', async () => {
    for (const email of absent) {
      const dir = await folder()
      await expect(openAccounts(dir, { ...email, ELSA_ADMIN_PASSWORD: ADMIN_PASSWORD })).rejects.toThrow(
        new Error('ELSA_ADMIN_EMAIL is not set and there is no administrator: set it for the first start (docs/deployment.md)'),
      )
      await expect(openAccounts(dir, email)).rejects.toThrow(
        new Error('ELSA_ADMIN_EMAIL and ELSA_ADMIN_PASSWORD are not set and there is no administrator: set them for the first start (docs/deployment.md)'),
      )
      await expect(readFile(path.join(dir, 'accounts.json'))).rejects.toMatchObject({ code: 'ENOENT' })
    }
    await expect(openAccounts(await folder(), { ELSA_ADMIN_EMAIL: ADMIN_EMAIL })).rejects.toThrow(
      new Error('ELSA_ADMIN_PASSWORD is not set and there is no administrator: set it for the first start (docs/deployment.md)'),
    )
    await expect(openAccounts(await folder(), { ...ADMIN, ELSA_ADMIN_PASSWORD: 'eleven char' })).rejects.toThrow('12 to 256 characters')
  })

  test('an administrator without an address and the variable set: given that address', async () => {
    const { dir, admin } = await storeOfUserNames()

    const accounts = await openAccounts(dir, { ELSA_ADMIN_EMAIL: 'Admin@Example.org' })

    expect(accounts.get(admin.id)).toMatchObject({ email: ADMIN_EMAIL, administrator: true })
    expect(await accounts.authenticate(ADMIN_EMAIL, ADMIN_PASSWORD)).toMatchObject({ id: admin.id })
    expect(logged).toContain('administrator e-mail address set from ELSA_ADMIN_EMAIL; remove the variable')
  })

  test('an administrator without an address and the variable absent: refuses with the sentence of 38.3, and writes nothing', async () => {
    for (const email of absent) {
      const { dir } = await storeOfUserNames()
      const before = await readFile(path.join(dir, 'accounts.json'), 'utf8')

      await expect(openAccounts(dir, { ...email, ELSA_ADMIN_PASSWORD: ADMIN_PASSWORD })).rejects.toThrow(
        new Error(
          'ELSA_ADMIN_EMAIL is not set and the administrator has no e-mail address: set it to the address the administrator will log in with (docs/deployment.md)',
        ),
      )
      expect(await readFile(path.join(dir, 'accounts.json'), 'utf8')).toBe(before)
    }
  })

  test('an administrator with an address and the variable set to another: replaced -- the recovery of a forgotten address', async () => {
    const { dir, admin } = await fresh()
    logged = []

    const replaced = await openAccounts(dir, { ELSA_ADMIN_EMAIL: 'Root@Example.org' })

    expect(replaced.get(admin.id)!.email).toBe('root@example.org')
    expect(await replaced.authenticate(ADMIN_EMAIL, ADMIN_PASSWORD)).toBeNull()
    expect(await replaced.authenticate('root@example.org', ADMIN_PASSWORD)).toMatchObject({ id: admin.id })
    // The same account, not a second administrator.
    expect(replaced.all().filter((account) => account.administrator)).toHaveLength(1)
    expect(logged).toContain('administrator e-mail address set from ELSA_ADMIN_EMAIL; remove the variable')
    expect(logged.join('\n')).not.toContain('root@example.org')
  })

  test('an administrator with an address and the variable set to the same, or absent: changes nothing, not a byte', async () => {
    const { dir, admin } = await fresh()
    const before = await readFile(path.join(dir, 'accounts.json'), 'utf8')

    for (const email of [{ ELSA_ADMIN_EMAIL: ' ADMIN@example.org' }, ...absent]) {
      logged = []
      const kept = await openAccounts(dir, email)
      expect(kept.get(admin.id)!.email).toBe(ADMIN_EMAIL)
      expect(logged).not.toContain('administrator e-mail address set from ELSA_ADMIN_EMAIL; remove the variable')
      expect(await readFile(path.join(dir, 'accounts.json'), 'utf8')).toBe(before)
    }
  })

  test("set to a value that is no address, or to another account's address: refuses, saying which, without the value", async () => {
    // White space alone is set, not absent, and is no address. The message is the whole of it: no value.
    for (const value of ['admin', '   ', 'anna@', 'anna b@example.org']) {
      for (const dir of [await folder(), (await fresh()).dir]) {
        const refusal = openAccounts(dir, { ELSA_ADMIN_EMAIL: value, ELSA_ADMIN_PASSWORD: ADMIN_PASSWORD })
        await expect(refusal).rejects.toThrow(
          new Error('ELSA_ADMIN_EMAIL is not an e-mail address: set it to the address the administrator will log in with (docs/deployment.md)'),
        )
      }
    }
    const { accounts, admin, dir } = await fresh()
    await accounts.create(admin, 'Anna', 'anna@example.org', 'annas first password')
    const refusal = openAccounts(dir, { ELSA_ADMIN_EMAIL: 'Anna@Example.org' })
    await expect(refusal).rejects.toThrow(
      new Error('ELSA_ADMIN_EMAIL is the e-mail address of another account: set it to an address no other account has (docs/deployment.md)'),
    )
    // And at a first start, on a directory whose other accounts were written before it.
    const built = await buildDataDir({ trees: [], accounts: [{ email: 'anna@example.org', name: 'Anna', password: 'annas first password' }] })
    await expect(openAccounts(built, { ...ADMIN, ELSA_ADMIN_EMAIL: 'anna@example.org' })).rejects.toThrow(
      new Error('ELSA_ADMIN_EMAIL is the e-mail address of another account: set it to an address no other account has (docs/deployment.md)'),
    )
  })

  test('a later start without the password keeps it; with it, replaces it -- the recovery path', async () => {
    const { dir, admin } = await fresh()

    const kept = await openAccounts(dir, {})
    expect(await kept.authenticate(ADMIN_EMAIL, ADMIN_PASSWORD)).toMatchObject({ id: admin.id })

    const replaced = await openAccounts(dir, { ELSA_ADMIN_PASSWORD: 'a brand new password' })
    expect(await replaced.authenticate(ADMIN_EMAIL, ADMIN_PASSWORD)).toBeNull()
    expect(await replaced.authenticate(ADMIN_EMAIL, 'a brand new password')).toMatchObject({ id: admin.id })
    expect(replaced.all().filter((account) => account.administrator)).toHaveLength(1)
  })

  test('cannot be deactivated by any request', async () => {
    const { accounts, admin } = await fresh()

    await expect(accounts.update(admin, admin.id, { active: false })).rejects.toMatchObject({ status: 403, field: 'active' })
    expect(accounts.get(admin.id)!.active).toBe(true)
  })
})

describe('**[#196]** a store of user names (38.4, 38.6)', () => {
  test('the first start converts it: the administrator gets ELSA_ADMIN_EMAIL, every other account none, every user name goes', async () => {
    const { dir, admin, jan, jdv } = await storeOfUserNames()

    const accounts = await openAccounts(dir, { ELSA_ADMIN_EMAIL: ADMIN_EMAIL })

    const onDisk = JSON.parse(await readFile(path.join(dir, 'accounts.json'), 'utf8')) as Record<string, unknown>[]
    expect(onDisk).toHaveLength(3)
    for (const [record, email] of [[admin, ADMIN_EMAIL], [jan, null], [jdv, null]] as const) {
      const { login: _login, ...kept } = record
      expect(onDisk.find((account) => account.id === record.id)).toEqual({ ...kept, email })
    }
    expect(onDisk.some((account) => 'login' in account)).toBe(false)
    expect(logged).toEqual([
      'accounts.json converted from user names to e-mail addresses: 3 accounts, 2 without an address',
      'administrator e-mail address set from ELSA_ADMIN_EMAIL; remove the variable',
      `account ${jan.id} has no e-mail address: give it one at /admin/accounts`,
      `account ${jdv.id} has no e-mail address: give it one at /admin/accounts`,
      `accounts ${jan.id} and ${jdv.id} share a name: give one of them another`,
    ])
    // The administrator logs in with the address and the password it had; no user name does.
    expect(await accounts.authenticate(ADMIN_EMAIL, ADMIN_PASSWORD)).toMatchObject({ id: admin.id })
    expect(await accounts.authenticate('admin', ADMIN_PASSWORD)).toBeNull()
    expect(await accounts.authenticate('jan', 'jans first password')).toBeNull()
    // An account without an address is otherwise whole: active, and invited by name.
    expect(accounts.listActive()).toContainEqual({ id: jan.id, name: 'Jan de Vries' })
  })

  test('a second start converts nothing and leaves the bytes as they were, and still names what is left to do', async () => {
    const { dir, jan, jdv } = await storeOfUserNames()
    await openAccounts(dir, { ELSA_ADMIN_EMAIL: ADMIN_EMAIL, ELSA_ADMIN_PASSWORD: ADMIN_PASSWORD })
    const converted = await readFile(path.join(dir, 'accounts.json'), 'utf8')

    for (const env of [{ ELSA_ADMIN_EMAIL: ADMIN_EMAIL, ELSA_ADMIN_PASSWORD: ADMIN_PASSWORD }, {}]) {
      logged = []
      await openAccounts(dir, env)
      expect(await readFile(path.join(dir, 'accounts.json'), 'utf8')).toBe(converted)
      expect(logged.filter((line) => !line.startsWith('administrator password set'))).toEqual([
        `account ${jan.id} has no e-mail address: give it one at /admin/accounts`,
        `account ${jdv.id} has no e-mail address: give it one at /admin/accounts`,
        `accounts ${jan.id} and ${jdv.id} share a name: give one of them another`,
      ])
    }
  })

  test('the way back: given an address by the administrator, the account logs in with the password it had, and is said no more', async () => {
    const { dir, jan, jdv } = await storeOfUserNames()
    const accounts = await openAccounts(dir, { ELSA_ADMIN_EMAIL: ADMIN_EMAIL })
    const admin = accounts.get(accounts.all().find((account) => account.administrator)!.id)!

    await accounts.update(admin, jan.id, { email: 'Jan@Example.org' })

    expect(await accounts.authenticate('jan@example.org', 'jans first password')).toMatchObject({ id: jan.id })
    logged = []
    await openAccounts(dir, {})
    expect(logged).not.toContain(`account ${jan.id} has no e-mail address: give it one at /admin/accounts`)
    expect(logged).toContain(`account ${jdv.id} has no e-mail address: give it one at /admin/accounts`)
  })

  test('a session an account held before the first start stays valid: it names the account, not its user name', async () => {
    const { dir, jan } = await storeOfUserNames()
    // sessions.json as `dev` wrote it for a login of `jan` (20.4): the token's hash and the account's id.
    const token = randomBytes(32).toString('base64url')
    const now = Date.now()
    const record = {
      tokenHash: createHash('sha256').update(token).digest('base64url'),
      accountId: jan.id,
      createdAt: new Date(now).toISOString(),
      lastSeen: new Date(now).toISOString(),
      expiresAt: new Date(now + 60_000).toISOString(),
    }
    await writeFile(path.join(dir, 'sessions.json'), `${JSON.stringify([record], null, 2)}\n`)

    const accounts = await openAccounts(dir, { ELSA_ADMIN_EMAIL: ADMIN_EMAIL })
    const sessions = await openSessions(dir, accounts)

    expect((await sessions.resolve(`elsa-admin-session=${token}`))?.account).toMatchObject({ id: jan.id, email: null })
  })

  test('the two of one name keep it; renaming either to its own name is no refusal, to another taken name is', async () => {
    const { dir, jan, jdv } = await storeOfUserNames()
    const accounts = await openAccounts(dir, { ELSA_ADMIN_EMAIL: ADMIN_EMAIL })
    const admin = accounts.all().find((account) => account.administrator)!

    expect(accounts.get(jan.id)!.name).toBe('Jan de Vries')
    expect(accounts.get(jdv.id)!.name).toBe('jan  de vries')
    // One name by its key: what the account already has, which a save of the account page sends.
    await accounts.update(admin, jdv.id, { name: 'Jan de Vries' })
    expect(accounts.get(jdv.id)!.name).toBe('Jan de Vries')
    await accounts.update(admin, jdv.id, { name: 'Johan de Vries' })
    await expect(accounts.update(admin, jan.id, { name: 'johan DE vries' })).rejects.toMatchObject({ status: 422, field: 'name', message: 'name-taken' })
    logged = []
    await openAccounts(dir, {})
    expect(logged.some((line) => line.includes('share a name'))).toBe(false)
  })
})

describe('authenticate (20.2, 20.8, **[#196]** 38.1, 38.8)', () => {
  test('logs in by address, in any case, with white space around it or a line break in it', async () => {
    const { accounts, admin } = await fresh()
    const anna = await accounts.create(admin, 'Anna', 'anna@example.org', 'annas first password')

    expect(await accounts.authenticate(' ANNA@Example.ORG ', 'annas first password')).toMatchObject({ id: anna.id })
    expect(await accounts.authenticate(`anna@exam${String.fromCharCode(10)}ple.org`, 'annas first password')).toMatchObject({ id: anna.id })
  })

  test('refuses a user name, `admin` and an account without an address, running scrypt each time, and logs no address', async () => {
    const { dir, jan } = await storeOfUserNames()
    const accounts = await openAccounts(dir, { ELSA_ADMIN_EMAIL: ADMIN_EMAIL })
    await timed(accounts, ADMIN_EMAIL, 'whatever password')
    // A known address with a wrong password costs a hash; each refusal below costs as much, not
    // the microseconds of a lookup (a loose bound, for CI).
    const known = await timed(accounts, ADMIN_EMAIL, 'whatever password')
    expect(known.answer).toBeNull()
    logged = []

    for (const [typed, password] of [
      ['admin', ADMIN_PASSWORD],
      ['jan', 'jans first password'],
      ['nobody@example.org', 'whatever password'],
      ['', 'whatever password'],
    ] as const) {
      const { ms, answer } = await timed(accounts, typed, password)
      expect(answer, typed).toBeNull()
      expect(ms, typed).toBeGreaterThan(known.ms / 3)
    }
    // The account without an address cannot be named at all: its old user name is no address.
    expect(accounts.get(jan.id)!.email).toBeNull()
    expect(logged).toEqual(Array(4).fill('login failed for an unknown address'))
    expect(logged.join('\n')).not.toContain('nobody@example.org')
  })

  test('a known address with a wrong password is logged by id, and a deactivated account cannot log in', async () => {
    const { accounts, admin } = await fresh()
    const anna = await accounts.create(admin, 'Anna', 'anna@example.org', 'annas first password')

    expect(await accounts.authenticate('anna@example.org', 'not her password')).toBeNull()
    expect(logged).toContain(`login failed for account ${anna.id}`)
    expect(logged.join('\n')).not.toContain('anna@example.org')

    await accounts.update(admin, anna.id, { active: false })
    expect(await accounts.authenticate('anna@example.org', 'annas first password')).toBeNull()
  })

  test('byEmail names the account a typed address names, active or not, and none for a string that is no address', async () => {
    const { accounts, admin } = await fresh()
    const anna = await accounts.create(admin, 'Anna', 'anna@example.org', 'annas first password')
    await accounts.update(admin, anna.id, { active: false })

    expect(accounts.byEmail(' Anna@Example.org')).toMatchObject({ id: anna.id })
    expect(accounts.byEmail('anna')).toBeNull()
    expect(accounts.byEmail('')).toBeNull()
  })

  test('a hash made with older parameters is replaced at the next successful login', async () => {
    const { accounts, admin, dir } = await fresh()
    const anna = await accounts.create(admin, 'Anna', 'anna@example.org', 'annas first password')
    // As a build with N = 2^14 would have written it.
    const salt = Buffer.alloc(16, 1)
    const { scryptSync } = await import('node:crypto')
    const key = scryptSync('annas first password', salt, 32, { N: 2 ** 14, r: 8, p: 2 })
    anna.passwordHash = `scrypt$14$8$2$${salt.toString('base64url')}$${key.toString('base64url')}`

    expect(await accounts.authenticate('anna@example.org', 'annas first password')).toMatchObject({ id: anna.id })
    expect(accounts.get(anna.id)!.passwordHash.startsWith('scrypt$16$8$2$')).toBe(true)
    const onDisk = JSON.parse(await readFile(path.join(dir, 'accounts.json'), 'utf8')) as Account[]
    expect(onDisk.find((account) => account.id === anna.id)!.passwordHash.startsWith('scrypt$16$')).toBe(true)
  })
})

describe('create and update (20.1, 22.1, **[#196]** 38.1, 38.5, 38.6)', () => {
  test('the administrator creates an account with its address lower-cased; nobody else can', async () => {
    const { accounts, admin } = await fresh()

    const anna = await accounts.create(admin, '  Anna de Vries ', ' Anna@Example.org ', 'annas first password')
    expect(anna).toMatchObject({ name: 'Anna de Vries', email: 'anna@example.org', active: true, administrator: false })
    expect(logged).toContain(`account ${anna.id} created by account ${admin.id} at ${anna.createdAt}`)
    await expect(accounts.create(anna, 'Bram', 'bram@example.org', 'brams first password')).rejects.toMatchObject({ status: 403 })
  })

  test.for([
    ['', 'bram@example.org', 'brams first password', 'name', 'name-length'],
    ['x'.repeat(81), 'bram@example.org', 'brams first password', 'name', 'name-length'],
    ['Bram', 'bram', 'brams first password', 'email', 'email-invalid'],
    ['Bram', 'bram@', 'brams first password', 'email', 'email-invalid'],
    ['Bram', '', 'brams first password', 'email', 'email-invalid'],
    ['Bram', 'Admin@Example.org', 'brams first password', 'email', 'email-taken'],
    ['administrator', 'bram@example.org', 'brams first password', 'name', 'name-taken'],
    ['Bram', 'bram@example.org', 'eleven char', 'password', 'password-length'],
    ['Bram', 'bram@example.org', 'x'.repeat(257), 'password', 'password-length'],
  ] as const)('refuses %j / %j / its password with 422 at %s (%s)', async ([name, email, password, field, code]) => {
    const { accounts, admin } = await fresh()

    const refusal = accounts.create(admin, name, email, password)

    await expect(refusal).rejects.toBeInstanceOf(AccountError)
    await expect(refusal).rejects.toMatchObject({ status: 422, field, message: code })
    expect(accounts.all()).toHaveLength(1)
  })

  test('an address a deactivated account holds is taken: the account may be reactivated with it (38.1)', async () => {
    const { accounts, admin } = await fresh()
    const anna = await accounts.create(admin, 'Anna', 'anna@example.org', 'annas first password')
    await accounts.update(admin, anna.id, { active: false })

    await expect(accounts.create(admin, 'Another Anna', 'ANNA@example.org', 'a first password')).rejects.toMatchObject({ status: 422, field: 'email', message: 'email-taken' })
    await expect(accounts.update(admin, admin.id, { email: 'anna@example.org' })).rejects.toMatchObject({ status: 422, field: 'email', message: 'email-taken' })
  })

  test("a name is one account's, deactivated or not, compared by 38.6's key: case, NFC and white space", async () => {
    const { accounts, admin } = await fresh()
    const decomposed = 'José Martí'.normalize('NFD')
    expect(decomposed).not.toBe('José Martí')
    await accounts.create(admin, 'Anna de Vries', 'anna@example.org', 'annas first password')
    const jose = await accounts.create(admin, 'José Martí', 'jose@example.org', 'joses first password')
    await accounts.update(admin, jose.id, { active: false })

    for (const name of ['anna de vries', '  ANNA   DE\tVRIES ', decomposed, 'josé martí']) {
      await expect(accounts.create(admin, name, 'other@example.org', 'a first password'), name).rejects.toMatchObject({ status: 422, field: 'name', message: 'name-taken' })
    }
    // A name stays as it was given, trimmed: the key is only what names are compared by.
    expect((await accounts.create(admin, ' Anna de Vries-Smit ', 'other@example.org', 'a first password')).name).toBe('Anna de Vries-Smit')
  })

  test('two creations sent at once with one address or one name make one account', async () => {
    const { accounts, admin } = await fresh()

    const both = await Promise.allSettled([
      accounts.create(admin, 'Anna', 'anna@example.org', 'annas first password'),
      accounts.create(admin, 'Anna V.', 'anna@example.org', 'annas first password'),
      accounts.create(admin, 'Bram', 'bram@example.org', 'brams first password'),
      accounts.create(admin, 'bram', 'bram.v@example.org', 'brams first password'),
    ])

    // Whichever scrypt ends first creates the account; the other is refused after its own.
    const statuses = both.map((result) => result.status)
    expect([statuses.slice(0, 2).sort(), statuses.slice(2).sort()]).toEqual([['fulfilled', 'rejected'], ['fulfilled', 'rejected']])
    const reasons = both.flatMap((result) => (result.status === 'rejected' ? [result.reason as AccountError] : []))
    expect(reasons.map(({ field, message }) => `${field} ${message}`).sort()).toEqual(['email email-taken', 'name name-taken'])
    expect(accounts.all()).toHaveLength(3)
  })

  test("the administrator changes an account's address, its own included; the holder cannot, 403 at email (38.5)", async () => {
    const { accounts, admin } = await fresh()
    const anna = await accounts.create(admin, 'Anna', 'anna@example.org', 'annas first password')

    await accounts.update(admin, anna.id, { email: ' Anna.V@Example.org ' })
    expect(accounts.get(anna.id)!.email).toBe('anna.v@example.org')
    expect(await accounts.authenticate('anna@example.org', 'annas first password')).toBeNull()
    expect(await accounts.authenticate('anna.v@example.org', 'annas first password')).toMatchObject({ id: anna.id })
    expect(logged.find((line) => line.startsWith(`account ${anna.id} changed`))).toMatch(new RegExp(`^account ${anna.id} changed \\(email\\) by account ${admin.id} at `))
    expect(logged.join('\n')).not.toMatch(/anna(\.v)?@example\.org/i)
    // Its own address again, in another case, is no refusal.
    await accounts.update(admin, anna.id, { email: 'ANNA.V@example.org' })

    await accounts.update(admin, admin.id, { email: 'root@example.org' })
    expect(accounts.get(admin.id)!.email).toBe('root@example.org')

    for (const email of ['anna.w@example.org', 'anna.v@example.org']) {
      await expect(accounts.update(anna, anna.id, { email })).rejects.toMatchObject({ status: 403, field: 'email', message: 'forbidden' })
    }
    await expect(accounts.update(admin, anna.id, { email: 'not an address' })).rejects.toMatchObject({ status: 422, field: 'email', message: 'email-invalid' })
    await expect(accounts.update(admin, anna.id, { email: null } as never)).rejects.toMatchObject({ status: 422, field: 'email', message: 'email-invalid' })
    expect(accounts.get(anna.id)!.email).toBe('anna.v@example.org')
  })

  test('a change of address ends no session of the account (38.5)', async () => {
    const { accounts, admin, dir } = await fresh()
    const anna = await accounts.create(admin, 'Anna', 'anna@example.org', 'annas first password')
    const sessions = await openSessions(dir, accounts)
    const { cookie } = await sessions.start(anna, true)

    await accounts.update(admin, anna.id, { email: 'anna.v@example.org' })

    expect((await sessions.resolve(cookie.split(';')[0]!))?.account.id).toBe(anna.id)
  })

  test("an account changes its own name, but not to another's, and its password only with the current one", async () => {
    const { accounts, admin } = await fresh()
    const anna = await accounts.create(admin, 'Anna', 'anna@example.org', 'annas first password')
    await accounts.create(admin, 'Bram', 'bram@example.org', 'brams first password')

    await accounts.update(anna, anna.id, { name: 'Anna V.' })
    expect(accounts.get(anna.id)!.name).toBe('Anna V.')
    await accounts.update(anna, anna.id, { name: 'ANNA v.' })
    await expect(accounts.update(anna, anna.id, { name: ' bram ' })).rejects.toMatchObject({ status: 422, field: 'name', message: 'name-taken' })
    expect(accounts.get(anna.id)!.name).toBe('ANNA v.')
    await expect(accounts.update(anna, anna.id, { password: 'annas second password', currentPassword: 'wrong' })).rejects.toMatchObject({
      status: 403,
      field: 'currentPassword',
      message: 'wrong-password',
    })
    await accounts.update(anna, anna.id, { password: 'annas second password', currentPassword: 'annas first password' })
    expect(await accounts.authenticate('anna@example.org', 'annas second password')).toMatchObject({ id: anna.id })
    // The log names the change, never the value.
    expect(logged.join('\n')).not.toContain('annas second password')
  })

  test('an account cannot change another, nor deactivate itself', async () => {
    const { accounts, admin } = await fresh()
    const anna = await accounts.create(admin, 'Anna', 'anna@example.org', 'annas first password')
    const bram = await accounts.create(admin, 'Bram', 'bram@example.org', 'brams first password')

    await expect(accounts.update(anna, bram.id, { name: 'Not Bram' })).rejects.toMatchObject({ status: 403 })
    await expect(accounts.update(anna, anna.id, { active: false })).rejects.toMatchObject({ status: 403 })
    expect(accounts.get(bram.id)!.name).toBe('Bram')
  })

  test('the administrator sets another account password without the current one, and deactivates and reactivates it', async () => {
    const { accounts, admin } = await fresh()
    const anna = await accounts.create(admin, 'Anna', 'anna@example.org', 'annas first password')

    await accounts.update(admin, anna.id, { password: 'a reset password' })
    expect(await accounts.authenticate('anna@example.org', 'a reset password')).toMatchObject({ id: anna.id })
    await accounts.update(admin, anna.id, { active: false })
    expect(accounts.listActive()).toEqual([{ id: admin.id, name: 'Administrator' }])
    await accounts.update(admin, anna.id, { active: true })
    expect(accounts.listActive()).toEqual([
      { id: admin.id, name: 'Administrator' },
      { id: anna.id, name: 'Anna' },
    ])
    // Deactivated, never deleted (20.1).
    expect(accounts.all()).toHaveLength(2)
  })

  test('listActive answers id and name and nothing else: no address reaches the invitation list (21.4, 38.5)', async () => {
    const { accounts, admin } = await fresh()
    await accounts.create(admin, 'Anna', 'anna@example.org', 'annas first password')

    for (const entry of accounts.listActive()) expect(Object.keys(entry)).toEqual(['id', 'name'])
    expect(JSON.stringify(accounts.listActive())).not.toContain('@')
  })

  test('a refused field changes nothing, not even the fields before it', async () => {
    const { accounts, admin } = await fresh()
    const anna = await accounts.create(admin, 'Anna', 'anna@example.org', 'annas first password')

    await expect(accounts.update(admin, anna.id, { name: 'Anna V.', password: 'short' })).rejects.toMatchObject({ status: 422 })
    await expect(accounts.update(admin, anna.id, { name: 'Anna V.', email: 'not an address' })).rejects.toMatchObject({ status: 422 })
    expect(accounts.get(anna.id)).toMatchObject({ name: 'Anna', email: 'anna@example.org' })
  })

  test('a deactivation that lands while a password change runs scrypt stays: the change writes back only its own field', async () => {
    const { accounts, admin } = await fresh()
    const anna = await accounts.create(admin, 'Anna', 'anna@example.org', 'annas first password')

    const change = accounts.update(anna, anna.id, { password: 'annas second password', currentPassword: 'annas first password' })
    await accounts.update(admin, anna.id, { active: false })
    await change

    expect(accounts.get(anna.id)).toMatchObject({ active: false })
    expect(await verifyPassword('annas second password', accounts.get(anna.id)!.passwordHash)).toBe(true)
  })

  test("a reset that lands while a login re-hashes wins over the re-hash", async () => {
    const { accounts, admin } = await fresh()
    const anna = await accounts.create(admin, 'Anna', 'anna@example.org', 'annas first password')
    // An older hash, whose verification alone takes half of a current hash's time: the
    // reset's one scrypt ends while the login's second is still running.
    const salt = Buffer.alloc(16, 1)
    const { scryptSync } = await import('node:crypto')
    const key = scryptSync('annas first password', salt, 32, { N: 2 ** 15, r: 8, p: 2, maxmem: 128 * 1024 * 1024 })
    anna.passwordHash = `scrypt$15$8$2$${salt.toString('base64url')}$${key.toString('base64url')}`

    const login = accounts.authenticate('anna@example.org', 'annas first password')
    await accounts.update(admin, anna.id, { password: 'a reset password' })
    await login

    expect(await accounts.authenticate('anna@example.org', 'annas first password')).toBeNull()
    expect(await accounts.authenticate('anna@example.org', 'a reset password')).toMatchObject({ id: anna.id })
  })

  test("the log line names the fields changed in fixed words, never the caller's keys", async () => {
    const { accounts, admin } = await fresh()
    const anna = await accounts.create(admin, 'Anna', 'anna@example.org', 'annas first password')

    await accounts.update(admin, anna.id, { name: 'Anna V.', 'forged\nline': 1 } as never)

    const line = logged.find((entry) => entry.startsWith(`account ${anna.id} changed`))!
    expect(line).toMatch(new RegExp(`^account ${anna.id} changed \\(name\\) by account ${admin.id} at `))
    expect(logged.join('\n')).not.toContain('forged')
  })
})

describe("the tests' data directory (35.1)", () => {
  test('buildDataDir writes accounts the store authenticates by address', async () => {
    const dir = await buildDataDir({ trees: [], accounts: [{ email: 'anna@example.org', name: 'Anna', password: 'annas first password' }] })

    const accounts = await openAccounts(dir, ADMIN)

    expect(await accounts.authenticate('anna@example.org', 'annas first password')).toMatchObject({ email: 'anna@example.org', administrator: false })
  })
})
