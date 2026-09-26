/**
 * Sessions (docs/specs/application.md 20.4; ADR-132-accounts-and-sessions decisions 6 and
 * 7): a server-side record in `sessions.json` and the one cookie of this application.
 *
 * The record holds the token's SHA-256, never the token, so a read of the file logs nobody
 * in. Idle and absolute expiry are the server's; the cookie's `Max-Age` is only the
 * absolute one. Expired records are swept whenever the file is written.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Account, Accounts } from './accounts.ts'
import { writeAtomic } from './write.ts'

/** The cookie's name. */
export const COOKIE_NAME = 'elsa-admin-session'

/**
 * Every attribute of the one cookie (20.4), in one constant with one test: `HttpOnly` (no
 * script reads it), `Secure` (HTTPS; `localhost` is a secure context), `SameSite=Strict`
 * (never on a cross-site request), `Path=/admin` (never sent to a public route). No
 * `Domain`, so it is host-only.
 */
export const COOKIE_ATTRIBUTES = 'HttpOnly; Secure; SameSite=Strict; Path=/admin'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
export const IDLE_MS = 12 * HOUR
export const ABSOLUTE_MS = 14 * 24 * HOUR
/** How stale `lastSeen` may be before a request refreshes it: one write per five minutes, not per keystroke. */
export const REFRESH_MS = 5 * MINUTE

/** One record of `sessions.json`. */
interface SessionRecord {
  tokenHash: string
  accountId: string
  createdAt: string
  lastSeen: string
  expiresAt: string
}

/** A live session, resolved: its record and the active account it belongs to. */
export interface Session {
  tokenHash: string
  account: Account
}

/** The sessions of one data directory (20.4's interface, and the two ends the account rules need). */
export interface Sessions {
  /** A new session for `account`, and the `Set-Cookie` value that carries it. */
  start(account: Account): Promise<{ cookie: string; session: Session }>
  /** The live session the `Cookie` header carries; null when absent, unknown, expired or deactivated. */
  resolve(cookieHeader: string | null): Promise<Session | null>
  /** Deletes `session` and answers the clearing `Set-Cookie` value. */
  end(session: Session): Promise<{ cookie: string }>
  /** Deletes every session of `accountId` but `keep`'s: deactivation, a password change (20.4). */
  endAll(accountId: string, keep?: Session): Promise<void>
}

/** The `Set-Cookie` value that ends the session in the browser: the same attributes, `Max-Age=0`. */
export const CLEARING_COOKIE = `${COOKIE_NAME}=; ${COOKIE_ATTRIBUTES}; Max-Age=0`

function sha256(token: string): string {
  return createHash('sha256').update(token).digest('base64url')
}

/** The session token out of a `Cookie` header; null when it carries none. */
export function tokenOf(cookieHeader: string | null): string | null {
  for (const pair of (cookieHeader ?? '').split(';')) {
    const at = pair.indexOf('=')
    if (at > 0 && pair.slice(0, at).trim() === COOKIE_NAME) return pair.slice(at + 1).trim() || null
  }
  return null
}

/**
 * Opens `sessions.json` in the data directory `root`. `now` is the clock, a parameter so the
 * expiry rule can be tested without waiting twelve hours.
 */
export async function openSessions(root: string, accounts: Accounts, now: () => number = Date.now): Promise<Sessions> {
  const file = path.join(/* turbopackIgnore: true */ root, 'sessions.json')
  let records: SessionRecord[] = await readRecords(file)

  const isLive = (record: SessionRecord, at: number): boolean =>
    Date.parse(record.expiresAt) > at && Date.parse(record.lastSeen) + IDLE_MS > at
  const save = (): Promise<void> => {
    const at = now()
    records = records.filter((record) => isLive(record, at))
    return writeAtomic(file, `${JSON.stringify(records, null, 2)}\n`)
  }
  const find = (tokenHash: string): SessionRecord | undefined =>
    records.find((record) => {
      const a = Buffer.from(record.tokenHash)
      const b = Buffer.from(tokenHash)
      return a.length === b.length && timingSafeEqual(a, b)
    })

  return {
    async start(account) {
      const token = randomBytes(32).toString('base64url')
      const at = now()
      const record: SessionRecord = {
        tokenHash: sha256(token),
        accountId: account.id,
        createdAt: new Date(at).toISOString(),
        lastSeen: new Date(at).toISOString(),
        expiresAt: new Date(at + ABSOLUTE_MS).toISOString(),
      }
      records.push(record)
      await save()
      return {
        cookie: `${COOKIE_NAME}=${token}; ${COOKIE_ATTRIBUTES}; Max-Age=${ABSOLUTE_MS / 1000}`,
        session: { tokenHash: record.tokenHash, account },
      }
    },

    async resolve(cookieHeader) {
      const token = tokenOf(cookieHeader)
      if (!token) return null
      const record = find(sha256(token))
      const at = now()
      if (!record || !isLive(record, at)) return null
      const account = accounts.get(record.accountId)
      if (!account?.active) return null
      if (Date.parse(record.lastSeen) + REFRESH_MS < at) {
        record.lastSeen = new Date(at).toISOString()
        await save()
      }
      return { tokenHash: record.tokenHash, account }
    },

    async end(session) {
      records = records.filter((record) => record.tokenHash !== session.tokenHash)
      await save()
      return { cookie: CLEARING_COOKIE }
    },

    async endAll(accountId, keep) {
      records = records.filter((record) => record.accountId !== accountId || record.tokenHash === keep?.tokenHash)
      await save()
    },
  }
}

async function readRecords(file: string): Promise<SessionRecord[]> {
  let text: string
  try {
    text = await readFile(file, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
  const parsed: unknown = JSON.parse(text)
  if (!Array.isArray(parsed)) throw new Error(`${file} is not a list of sessions`)
  return parsed as SessionRecord[]
}
