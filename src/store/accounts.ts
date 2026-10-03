/**
 * Accounts (docs/specs/application.md 20.1 to 20.3, 20.8, 38; ADR-132-accounts-and-sessions
 * decisions 1 to 5 and 11; ADR-195-login-by-email-address, ADR-195-administrator-address,
 * ADR-195-accounts-without-an-address, ADR-195-who-sees-and-changes-an-address): who may enter
 * the admin area, by which e-mail address, the password hash, and the one administrator whose
 * address is `ELSA_ADMIN_EMAIL` and whose password is `ELSA_ADMIN_PASSWORD`.
 *
 * `accounts.json` in the data directory is the whole record, read once at start and
 * rewritten whole through the store's one writer on every change. Nothing here returns a
 * password hash past this module but `Account` itself, which the routes strip (`publicOf`).
 */
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Environment } from '../config.ts'
import { writeAtomic } from './write.ts'

/** One account (20.1, 38.2). */
export interface Account {
  /** 16 random bytes as hex; never reused; what `meta.json` names. */
  id: string
  /** Display name, plain text, 1 to 80 characters; no other account's (38.6). */
  name: string
  /**
   * **[#196]** The address the account logs in with, in the form `normaliseEmail` gives it
   * (38.1); null only on an account a converted store of user names left without one, until
   * the administrator gives it one (38.4).
   */
  email: string | null
  /** `scrypt$16$8$2$<salt>$<key>` (20.2). */
  passwordHash: string
  /** False: deactivated -- cannot log in, sessions ended, Trees kept. */
  active: boolean
  /** True on exactly one account, set by the server alone (20.3). */
  administrator: boolean
  /** ISO 8601. */
  createdAt: string
}

/** What a route may answer about an account: everything but the hash (25.3). */
export type PublicAccount = Omit<Account, 'passwordHash'>

/** The change `update` applies (22.1, 38.2, `PATCH /admin/api/accounts/<id>`). */
export interface AccountChange {
  name?: string
  email?: string
  active?: boolean
  password?: string
  currentPassword?: string
}

/**
 * A request the account rules refuse, with the status the route answers and the field the
 * screen shows it at (22.1, 25.2, 25.3, 38.2). The message is a code the screen maps to a
 * chrome string -- `name-length`, `name-taken`, `email-invalid`, `email-taken`,
 * `password-length`, `wrong-password`, `forbidden`, `not-found`, `malformed` -- never a
 * sentence of its own.
 */
export class AccountError extends Error {
  readonly status: 403 | 404 | 422
  readonly field: 'name' | 'email' | 'password' | 'currentPassword' | 'active' | null

  constructor(status: AccountError['status'], field: AccountError['field'], code: string) {
    super(code)
    this.name = 'AccountError'
    this.status = status
    this.field = field
  }
}

/**
 * Whether `error` is an `AccountError`. By name, not `instanceof`: Next.js bundles the
 * startup hook and each route apart, so the store's copy of this class -- the one that
 * throws -- is not the route's copy (the reason `config.ts` holds the store on `globalThis`).
 */
export function isAccountError(error: unknown): error is AccountError {
  return error instanceof Error && error.name === 'AccountError'
}

/** The accounts of one data directory (20.4's interface as 38.2 leaves it, and the two members the screens need). */
export interface Accounts {
  /**
   * The active account `email` names when `password` is its password; scrypt runs either way
   * (20.2), and an account without an address is never answered (38.4).
   */
  authenticate(email: string, password: string): Promise<Account | null>
  get(id: string): Account | null
  /** The account a typed address names, active or not; for the log line of a lock (38.8). */
  byEmail(email: string): Account | null
  /** Every account, deactivated ones too, in creation order: the administrator's accounts page (25.3). */
  all(): Account[]
  /** Active accounts for an invitation, by name and nothing else (21.4, 38.5). */
  listActive(): Pick<Account, 'id' | 'name'>[]
  create(by: Account, name: string, email: string, password: string): Promise<Account>
  update(by: Account, id: string, change: AccountChange): Promise<Account>
  /**
   * Whether this start gave the administrator a password other than the one it had, from
   * `ELSA_ADMIN_PASSWORD`: the recovery of a leaked credential, whose sessions must end (20.4).
   */
  readonly adminPasswordReplaced: boolean
}

/** scrypt's cost (20.2): N = 2^16, r = 8, p = 2 -- about 64 MiB and 100 ms per hash. */
const LOG2_N = 16
const R = 8
const P = 2
const KEY_BYTES = 32
const SALT_BYTES = 16
const SCRYPT: ScryptOptions = { N: 2 ** LOG2_N, r: R, p: P, maxmem: 128 * 1024 * 1024 }

/**
 * What a login that names no account is checked against, so that it costs what a real one
 * costs and the response time does not say whether the address exists (20.2). Its password is
 * not known to anyone: the key is random bytes, not a hash of anything.
 */
export const DUMMY_HASH = `scrypt$${LOG2_N}$${R}$${P}$AAAAAAAAAAAAAAAAAAAAAA$${Buffer.alloc(KEY_BYTES, 7).toString('base64url')}`

export const PASSWORD_MIN = 12
export const PASSWORD_MAX = 256
export const NAME_MAX = 80
/** **[#196]** The longest address a 256-octet SMTP path carries (38.1; RFC 5321 4.5.3.1.3, as RFC 3696 erratum 1690 states it). */
export const EMAIL_MAX = 254

/** **[#196]** The HTML Standard's *valid e-mail address*: the browser's own check of `<input type="email">` (38.1). */
const EMAIL = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

function derive(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize('NFC'), salt, KEY_BYTES, options, (error, key) => (error ? reject(error) : resolve(key)))
  })
}

/** `password` hashed in the stored format of 20.2, with a fresh salt. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES)
  const key = await derive(password, salt, SCRYPT)
  return `scrypt$${LOG2_N}$${R}$${P}$${salt.toString('base64url')}$${key.toString('base64url')}`
}

/**
 * Whether `password` is the one `stored` was made from, by the parameters the string itself
 * carries, compared in constant time. False, never a throw, for a malformed string.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, logN, r, p, salt, key] = stored.split('$')
  if (scheme !== 'scrypt' || !salt || !key) return false
  const expected = Buffer.from(key, 'base64url')
  const options = { N: 2 ** Number(logN), r: Number(r), p: Number(p), maxmem: SCRYPT.maxmem }
  try {
    const actual = await derive(password, Buffer.from(salt, 'base64url'), options)
    return actual.length === expected.length && timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

/** Whether `stored` was made with the parameters this build hashes with; if not, the next login re-hashes (20.2). */
function isCurrent(stored: string): boolean {
  return stored.startsWith(`scrypt$${LOG2_N}$${R}$${P}$`)
}

/** Refuses a password outside 12 to 256 characters; nothing else is required of it (20.2). */
export function checkPassword(password: unknown): string {
  if (typeof password !== 'string' || [...password].length < PASSWORD_MIN || [...password].length > PASSWORD_MAX) {
    throw new AccountError(422, 'password', 'password-length')
  }
  return password
}

function checkName(name: unknown): string {
  const trimmed = typeof name === 'string' ? name.trim() : ''
  if (trimmed.length < 1 || [...trimmed].length > NAME_MAX) {
    throw new AccountError(422, 'name', 'name-length')
  }
  return trimmed
}

/** **[#196]** What two names are compared by (38.6): "Anna de Vries" and "anna  de vries" are one name. */
function nameKey(name: string): string {
  return name.normalize('NFC').trim().replace(/\s+/gu, ' ').toLowerCase()
}

/**
 * **[#196]** An address as given, in the one form it is stored and compared in (38.1); null for
 * anything that is not one, which names no account. The value sanitisation of
 * `<input type="email">` -- every line feed and carriage return removed, leading and trailing
 * ASCII white space stripped -- then the browser's check and at most 254 characters, then every
 * upper-case letter lowered. Checked before it is lowered: `toLowerCase` maps letters outside
 * ASCII into it (the Kelvin sign to `k`), and those are no address.
 */
export function normaliseEmail(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const value = input.replace(/[\n\r]/g, '').replace(/^[\t\n\f\r ]+|[\t\n\f\r ]+$/g, '')
  return value.length <= EMAIL_MAX && EMAIL.test(value) ? value.toLowerCase() : null
}

/**
 * Opens `accounts.json` in the data directory `root` and makes sure the administrator exists
 * with the address `ELSA_ADMIN_EMAIL` and the password `ELSA_ADMIN_PASSWORD` give it, by 38.3's
 * table: created when there is none, given or replaced when the variable is set to another
 * value, kept when it is absent. **[#196]** A store of user names is converted first (38.4).
 * Rejects -- the server does not start -- when a variable is not usable, or absent where the
 * store needs it. Neither value is ever printed.
 */
export async function openAccounts(root: string, env: Environment): Promise<Accounts> {
  const file = path.join(/* turbopackIgnore: true */ root, 'accounts.json')
  const accounts: Account[] = await readAccounts(file)
  const save = (): Promise<void> => writeAtomic(file, `${JSON.stringify(accounts, null, 2)}\n`)
  let changed = false

  const password = env.ELSA_ADMIN_PASSWORD
  // Absent includes empty, as for the password: the line the example file ships (38.3).
  const adminEmail = env.ELSA_ADMIN_EMAIL ? normaliseEmail(env.ELSA_ADMIN_EMAIL) : undefined
  if (adminEmail === null) {
    throw new Error('ELSA_ADMIN_EMAIL is not an e-mail address: set it to the address the administrator will log in with (docs/deployment.md)')
  }
  if (password && ([...password].length < PASSWORD_MIN || [...password].length > PASSWORD_MAX)) {
    throw new Error(`ELSA_ADMIN_PASSWORD must be ${PASSWORD_MIN} to ${PASSWORD_MAX} characters`)
  }
  let admin = accounts.find((account) => account.administrator)
  if (!admin) {
    const missing = [adminEmail ? '' : 'ELSA_ADMIN_EMAIL', password ? '' : 'ELSA_ADMIN_PASSWORD'].filter(Boolean)
    if (missing.length === 1) throw new Error(`${missing[0]} is not set and there is no administrator: set it for the first start (docs/deployment.md)`)
    if (missing.length === 2) throw new Error(`${missing.join(' and ')} are not set and there is no administrator: set them for the first start (docs/deployment.md)`)
  } else if (!admin.email && !adminEmail) {
    throw new Error('ELSA_ADMIN_EMAIL is not set and the administrator has no e-mail address: set it to the address the administrator will log in with (docs/deployment.md)')
  }
  if (adminEmail && accounts.some((account) => account !== admin && account.email === adminEmail)) {
    throw new Error('ELSA_ADMIN_EMAIL is the e-mail address of another account: set it to an address no other account has (docs/deployment.md)')
  }

  // **[#196]** A store written before #196 (38.4): every user name goes and no address is
  // invented. The administrator's comes from ELSA_ADMIN_EMAIL below, required above.
  const converted = accounts.filter((account) => 'login' in account)
  for (const account of converted) {
    delete (account as Account & { login?: unknown }).login
    account.email ??= null
  }
  if (converted.length > 0) {
    changed = true
    const without = converted.filter((account) => !account.administrator && account.email === null).length
    console.log(`accounts.json converted from user names to e-mail addresses: ${converted.length} accounts, ${without} without an address`)
  }

  let adminPasswordReplaced = false
  if (password) {
    // The same password again is no reset: every restart with the variable left set would
    // otherwise log the administrator out.
    const unchanged = admin !== undefined && isCurrent(admin.passwordHash) && (await verifyPassword(password, admin.passwordHash))
    if (!unchanged) {
      const passwordHash = await hashPassword(password)
      if (admin) {
        admin.passwordHash = passwordHash
        adminPasswordReplaced = true
      } else {
        // Its address is given below: a first start without ELSA_ADMIN_EMAIL was refused above.
        admin = { id: newId(), name: 'Administrator', email: null, passwordHash, active: true, administrator: true, createdAt: new Date().toISOString() }
        accounts.push(admin)
      }
      changed = true
    }
    console.log('administrator password set from ELSA_ADMIN_PASSWORD; remove the variable')
  }
  // Given at a first start and to a converted administrator; replaced when it is another --
  // the recovery of a forgotten address (38.3).
  if (admin && adminEmail && admin.email !== adminEmail) {
    admin.email = adminEmail
    changed = true
    console.log('administrator e-mail address set from ELSA_ADMIN_EMAIL; remove the variable')
  }
  if (changed) await save()

  // Said at every start until the administrator ends it, by id and never by name (38.4, 38.6).
  for (const account of accounts) {
    if (!account.email) console.log(`account ${account.id} has no e-mail address: give it one at /admin/accounts`)
  }
  for (const [index, account] of accounts.entries()) {
    for (const other of accounts.slice(index + 1)) {
      if (nameKey(other.name) === nameKey(account.name)) console.log(`accounts ${account.id} and ${other.id} share a name: give one of them another`)
    }
  }

  const byId = (id: string): Account | undefined => accounts.find((account) => account.id === id)
  const byEmail = (email: unknown): Account | undefined => {
    const address = normaliseEmail(email)
    return address === null ? undefined : accounts.find((account) => account.email === address)
  }
  /**
   * Refuses a name or an address that an account other than `self` has (38.1, 38.6). A name
   * that is `self`'s own by its key is kept, never refused, even where a converted store left
   * another account with it.
   */
  const refuseTaken = (self: Account | undefined, name: string | undefined, email: string | undefined): void => {
    if (name !== undefined && (!self || nameKey(name) !== nameKey(self.name)) && accounts.some((other) => nameKey(other.name) === nameKey(name))) {
      throw new AccountError(422, 'name', 'name-taken')
    }
    if (email !== undefined && accounts.some((other) => other !== self && other.email === email)) {
      throw new AccountError(422, 'email', 'email-taken')
    }
  }

  return {
    adminPasswordReplaced,

    async authenticate(email, password) {
      const account = byEmail(email)
      const matches = await verifyPassword(password, account?.passwordHash ?? DUMMY_HASH)
      if (!account) {
        console.log('login failed for an unknown address')
        return null
      }
      if (!matches || !account.active) {
        console.log(`login failed for account ${account.id}`)
        return null
      }
      const verified = account.passwordHash
      if (!isCurrent(verified)) {
        const rehashed = await hashPassword(password)
        // A change that landed while scrypt ran -- a reset, a deactivation -- wins over this rehash.
        if (account.passwordHash !== verified) return null
        account.passwordHash = rehashed
        await save()
      }
      return account.active ? account : null
    },

    get: (id) => byId(id) ?? null,
    byEmail: (email) => byEmail(email) ?? null,
    all: () => [...accounts],
    listActive: () => accounts.filter((account) => account.active).map(({ id, name }) => ({ id, name })),

    async create(by, name, email, password) {
      if (!by.administrator) throw new AccountError(403, null, 'forbidden')
      const checkedName = checkName(name)
      const address = normaliseEmail(email)
      if (!address) throw new AccountError(422, 'email', 'email-invalid')
      const passwordHash = await hashPassword(checkPassword(password))
      // After scrypt, not before: a second creation sent at once is refused here, by the first.
      refuseTaken(undefined, checkedName, address)
      const account: Account = {
        id: newId(),
        name: checkedName,
        email: address,
        passwordHash,
        active: true,
        administrator: false,
        createdAt: new Date().toISOString(),
      }
      accounts.push(account)
      await save()
      console.log(`account ${account.id} created by account ${by.id} at ${account.createdAt}`)
      return account
    },

    async update(by, id, change) {
      const account = byId(id)
      const self = by.id === id
      if (!by.administrator && !self) throw new AccountError(403, null, 'forbidden')
      if (!account) throw new AccountError(404, null, 'not-found')
      // Every field is checked before any is applied, so a refused field changes nothing.
      const name = change.name === undefined ? undefined : checkName(change.name)
      let email: string | undefined
      if (change.email !== undefined) {
        // The administrator alone changes an address, the holder's own included (38.5).
        if (!by.administrator) throw new AccountError(403, 'email', 'forbidden')
        const address = normaliseEmail(change.email)
        if (!address) throw new AccountError(422, 'email', 'email-invalid')
        email = address
      }
      if (change.active !== undefined) {
        if (typeof change.active !== 'boolean') throw new AccountError(422, 'active', 'malformed')
        if (!by.administrator) throw new AccountError(403, 'active', 'forbidden')
        if (account.administrator) throw new AccountError(403, 'active', 'forbidden')
      }
      let passwordHash: string | undefined
      if (change.password !== undefined) {
        const password = checkPassword(change.password)
        // Changing one's own asks for the current one; the administrator sets another's
        // without it, which is the reset of 25.3.
        if (self) {
          const current = typeof change.currentPassword === 'string' ? change.currentPassword : ''
          if (!(await verifyPassword(current, account.passwordHash))) {
            throw new AccountError(403, 'currentPassword', 'wrong-password')
          }
        }
        passwordHash = await hashPassword(password)
      }
      // After scrypt, not before: another change may have taken the name or the address meanwhile.
      refuseTaken(account, name, email)
      // Only the fields this change names, and only after the awaits: a copy taken before
      // scrypt ran would write back what another request changed meanwhile, a deactivation too.
      if (name !== undefined) account.name = name
      if (email !== undefined) account.email = email
      if (change.active !== undefined) account.active = change.active
      if (passwordHash !== undefined) account.passwordHash = passwordHash
      await save()
      // Fixed words, never the caller's keys or values: a request's text does not reach the log (20.8, 38.8).
      const what = (['name', 'email', 'active', 'password'] as const).filter((key) => change[key] !== undefined)
      console.log(`account ${account.id} changed (${what.join(', ')}) by account ${by.id} at ${new Date().toISOString()}`)
      return account
    },
  }
}

/** An account as a route may answer it: without the hash (25.3). */
export function publicOf({ passwordHash: _hash, ...rest }: Account): PublicAccount {
  return rest
}

function newId(): string {
  return randomBytes(16).toString('hex')
}

async function readAccounts(file: string): Promise<Account[]> {
  let text: string
  try {
    text = await readFile(file, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
  const parsed: unknown = JSON.parse(text)
  if (!Array.isArray(parsed)) throw new Error(`${file} is not a list of accounts`)
  return parsed as Account[]
}
