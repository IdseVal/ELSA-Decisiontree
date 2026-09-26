/**
 * The admin area's test helpers (docs/specs/application.md 35.1, 35.2): a data directory
 * with accounts in it, and logging in and out through the API.
 *
 * Not a spec file: the admin specs import it.
 */
import { randomBytes } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { APIResponse, Page } from '@playwright/test'
import { hashPassword, type Account } from '../../src/store/accounts.ts'
import { ADMIN_PASSWORD } from '../store/admin.ts'
import { dataDir, type StoreTree } from './serve.ts'

export { ADMIN_PASSWORD }

/** One account of a test data directory, besides the administrator the server creates. */
export interface TestAccount {
  login: string
  name: string
  password: string
  active?: boolean
}

/**
 * A fresh data directory holding `trees` and `accounts` (35.1): `accounts.json` with hashes
 * in the format of 20.2, so the store authenticates them as it would any. The administrator
 * is not in it: the server creates it from `ELSA_ADMIN_PASSWORD` at start, as a deployment's.
 */
export async function buildDataDir({ trees, accounts }: { trees: StoreTree[]; accounts: TestAccount[] }): Promise<string> {
  const dir = await dataDir(trees)
  const records: Account[] = []
  for (const { login, name, password, active = true } of accounts) {
    records.push({
      id: randomBytes(16).toString('hex'),
      name,
      login,
      passwordHash: await hashPassword(password),
      active,
      administrator: false,
      createdAt: new Date().toISOString(),
    })
  }
  await writeFile(path.join(dir, 'accounts.json'), `${JSON.stringify(records, null, 2)}\n`)
  return dir
}

/** The server's environment for a data directory built above (35.2). */
export const ADMIN_ENV = { ELSA_ADMIN_PASSWORD: ADMIN_PASSWORD }

/**
 * Logs `login` in through `page.request`, so the cookie lands in the page's context (35.2).
 * The request comes from no page, so it carries the `Origin` the CSRF check wants from a
 * client that sends no `Sec-Fetch-Site` (20.6) -- as `curl` must.
 */
export function login(page: Page, origin: string, name: string, password: string): Promise<APIResponse> {
  return page.request.post(`${origin}/admin/api/login`, {
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    data: { login: name, password },
  })
}

/** Ends the page's session through the API. */
export function logout(page: Page, origin: string): Promise<APIResponse> {
  return page.request.post(`${origin}/admin/api/logout`, { headers: { Origin: origin } })
}
