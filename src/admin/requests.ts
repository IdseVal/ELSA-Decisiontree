/**
 * What every Tree route under `/admin/api/trees` shares (docs/specs/application.md 22.1 to
 * 22.3, 22.6): the session and the store, the limits on a request body, and one answer for
 * every refusal the store throws.
 */
import { store } from '../config.ts'
import type { Drafts } from '../store/drafts.ts'
import { isStoreError } from '../store/errors.ts'
import type { Account } from '../store/accounts.ts'
import { authenticated, json, refuse } from './authenticated.ts'

/** 22.2: a JSON body of at most 64 kB. */
export const MAX_BODY_BYTES = 64 * 1024

/** 22.2: any string in a body of at most 2,000 code points; the largest limit of 5.7 is 600. */
export const MAX_STRING = 2000

/** The acting account and the drafts, or the 401 or 403 that refuses the request (20.6, 22.1). */
export async function caller(request: Request, { upload = false } = {}): Promise<{ account: Account; drafts: Drafts } | Response> {
  const session = await authenticated(request, { upload })
  if (session instanceof Response) return session
  return { account: session.account, drafts: (await store()).drafts }
}

/**
 * Runs `work` and answers what it answers; a refusal of the store becomes its status, with
 * the violations the editor shows at the fields they name (22.3). Anything else is a bug and
 * is thrown on, to the framework's 500.
 */
export async function answered(work: () => Promise<Response> | Response): Promise<Response> {
  try {
    return await work()
  } catch (error) {
    if (isStoreError(error)) return json({ error: error.message, violations: error.violations }, error.status)
    throw error
  }
}

/**
 * The body's bytes, read no further than `max`: null when the body is larger, so a client
 * cannot make the server hold more than the limit (22.2, 22.6). A declared length over the
 * limit is refused before a byte is read.
 */
export async function readCapped(request: Request, max: number): Promise<Uint8Array | null> {
  if (Number(request.headers.get('content-length') ?? 0) > max) return null
  if (!request.body) return new Uint8Array()
  const chunks: Uint8Array[] = []
  let total = 0
  const reader = request.body.getReader()
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.length
      if (total > max) {
        await reader.cancel()
        return null
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  return Buffer.concat(chunks)
}

/**
 * The JSON object a write carries, or its refusal: 413 above 64 kB, 422 for a body that is
 * not one JSON object or that holds a string of more than 2,000 code points (22.2).
 */
export async function limitedBody(request: Request): Promise<Record<string, unknown> | Response> {
  const bytes = await readCapped(request, MAX_BODY_BYTES)
  if (bytes === null) return refuse(413, 'too-large')
  let body: unknown
  try {
    body = JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return refuse(422, 'malformed')
  }
  if (body === null || typeof body !== 'object' || Array.isArray(body)) return refuse(422, 'malformed')
  if (longestString(body) > MAX_STRING) return refuse(422, 'string-too-long')
  return body as Record<string, unknown>
}

/** The most code points of any string in `value`, keys included. */
function longestString(value: unknown): number {
  if (typeof value === 'string') return [...value].length
  if (Array.isArray(value)) return Math.max(0, ...value.map(longestString))
  if (value !== null && typeof value === 'object') {
    return Math.max(0, ...Object.entries(value).flatMap(([key, entry]) => [[...key].length, longestString(entry)]))
  }
  return 0
}
