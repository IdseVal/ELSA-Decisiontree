/**
 * Accounts (docs/specs/application.md 20.1 to 20.3, 20.8; ADR-132-accounts-and-sessions
 * decisions 1 to 5 and 11): who may enter the admin area, the password hash, and the one
 * administrator whose password is `ELSA_ADMIN_PASSWORD`.
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

/** One account (20.1). */
export interface Account {
  /** 16 random bytes as hex; never reused; what `meta.json` names. */
  id: string
  /** Display name, plain text, 1 to 80 characters. */
  name: string
  /** A user name in the id grammar of tree-format.md 3.1, lower-cased on entry. */
  login: string
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

/** The change `update` applies (22.1, `PATCH /admin/api/accounts/<id>`). */
export interface AccountChange {
  name?: string
  active?: boolean
  password?: string
  currentPassword?: string
}

/**
 * A request the account rules refuse, with the status the route answers and the field the
 * screen shows it at (22.1, 25.2, 25.3). The message is a code the screen maps to a chrome
 * string -- `name-length`, `login-invalid`, `login-taken`, `password-length`,
 * `wrong-password`, `forbidden`, `not-found`, `malformed` -- never a sentence of its own.
 */
export class AccountError extends Error {
  readonly status: 403 | 404 | 422
  readonly field: 'name' | 'login' | 'password' | 'currentPassword' | 'active' | null

  constructor(status: AccountError['status'], field: AccountError['field'], code: string) {
    super(code)
    this.status = status
    this.field = field
  }
}

/** The accounts of one data directory (20.4's interface, and the two members the screens need). */
export interface Accounts {
  /** The active account `login` names when `password` is its password; scrypt runs either way (20.2). */
  authenticate(login: string, password: string): Promise<Account | null>
  get(id: string): Account | null
  /** The account a typed login names, active or not; for the log line of a lock (20.8). */
  byLogin(login: string): Account | null
  /** Every account, deactivated ones too, in creation order: the administrator's accounts page (25.3). */
  all(): Account[]
  /** Active accounts for an invitation (21.4). */
  listActive(): Pick<Account, 'id' | 'name' | 'login'>[]
  create(by: Account, name: string, login: string, password: string): Promise<Account>
  update(by: Account, id: string, change: AccountChange): Promise<Account>
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
 * costs and the response time does not say whether the name exists (20.2). Its password is
 * not known to anyone: the key is random bytes, not a hash of anything.
 */
export const DUMMY_HASH = `scrypt$${LOG2_N}$${R}$${P}$AAAAAAAAAAAAAAAAAAAAAA$${Buffer.alloc(KEY_BYTES, 7).toString('base64url')}`

export const PASSWORD_MIN = 12
export const PASSWORD_MAX = 256
export const NAME_MAX = 80

/** The id grammar of tree-format.md 3.1, which a login follows (20.1). */
const LOGIN = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** The administrator's login (20.3). */
export const ADMIN_LOGIN = 'admin'

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
export function checkPassword(password: unknown, field: 'password' = 'password'): string {
  if (typeof password !== 'string' || [...password].length < PASSWORD_MIN || [...password].length > PASSWORD_MAX) {
    throw new AccountError(422, field, 'password-length')
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

/** A login as entered, lower-cased (20.1); null when it is not in the grammar. */
export function normaliseLogin(login: unknown): string | null {
  if (typeof login !== 'string') return null
  const lower = login.trim().toLowerCase()
  return lower.length >= 2 && lower.length <= 64 && LOGIN.test(lower) ? lower : null
}

/**
 * Opens `accounts.json` in the data directory `root` and makes sure the administrator
 * exists with the password `ELSA_ADMIN_PASSWORD` gives it (20.3): created when there is none,
 * replaced when there is one and the variable is set. Rejects -- the server does not start
 * -- when the variable is shorter than 12 characters, or absent while there is no
 * administrator. The variable's value is never printed.
 */
export async function openAccounts(root: string, env: Environment): Promise<Accounts> {
  const file = path.join(/* turbopackIgnore: true */ root, 'accounts.json')
  const accounts: Account[] = await readAccounts(file)
  const save = (): Promise<void> => writeAtomic(file, `${JSON.stringify(accounts, null, 2)}\n`)

  const password = env.ELSA_ADMIN_PASSWORD
  let admin = accounts.find((account) => account.administrator)
  if (password) {
    if ([...password].length < PASSWORD_MIN || [...password].length > PASSWORD_MAX) {
      throw new Error(`ELSA_ADMIN_PASSWORD must be ${PASSWORD_MIN} to ${PASSWORD_MAX} characters`)
    }
    const passwordHash = await hashPassword(password)
    if (admin) admin.passwordHash = passwordHash
    else {
      admin = { id: newId(), name: 'Administrator', login: ADMIN_LOGIN, passwordHash, active: true, administrator: true, createdAt: new Date().toISOString() }
      accounts.push(admin)
    }
    await save()
    console.log('administrator password set from ELSA_ADMIN_PASSWORD; remove the variable')
  } else if (!admin) {
    throw new Error('ELSA_ADMIN_PASSWORD is not set and there is no administrator: set it for the first start (docs/deployment.md)')
  }

  const byId = (id: string): Account | undefined => accounts.find((account) => account.id === id)
  const byLogin = (login: string): Account | undefined => accounts.find((account) => account.login === login)

  return {
    async authenticate(login, password) {
      const account = byLogin(normaliseLogin(login) ?? '')
      const matches = await verifyPassword(password, account?.passwordHash ?? DUMMY_HASH)
      if (!account) {
        console.log('login failed for an unknown name')
        return null
      }
      if (!matches || !account.active) {
        console.log(`login failed for account ${account.id}`)
        return null
      }
      if (!isCurrent(account.passwordHash)) {
        account.passwordHash = await hashPassword(password)
        await save()
      }
      return account
    },

    get: (id) => byId(id) ?? null,
    byLogin: (login) => byLogin(normaliseLogin(login) ?? '') ?? null,
    all: () => [...accounts],
    listActive: () => accounts.filter((account) => account.active).map(({ id, name, login }) => ({ id, name, login })),

    async create(by, name, login, password) {
      if (!by.administrator) throw new AccountError(403, null, 'forbidden')
      const checkedName = checkName(name)
      const checkedLogin = normaliseLogin(login)
      if (!checkedLogin) throw new AccountError(422, 'login', 'login-invalid')
      if (byLogin(checkedLogin)) throw new AccountError(422, 'login', 'login-taken')
      const account: Account = {
        id: newId(),
        name: checkedName,
        login: checkedLogin,
        passwordHash: await hashPassword(checkPassword(password)),
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
      // Built on a copy and applied at the end, so a refused field changes nothing.
      const next: Account = { ...account }
      if (change.name !== undefined) next.name = checkName(change.name)
      if (change.active !== undefined) {
        if (typeof change.active !== 'boolean') throw new AccountError(422, 'active', 'malformed')
        if (!by.administrator) throw new AccountError(403, 'active', 'forbidden')
        if (account.administrator) throw new AccountError(403, 'active', 'forbidden')
        next.active = change.active
      }
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
        next.passwordHash = await hashPassword(password)
      }
      Object.assign(account, next)
      await save()
      const what = Object.keys(change).filter((key) => key !== 'currentPassword' && key !== 'password')
      if (change.password !== undefined) what.push('password')
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
