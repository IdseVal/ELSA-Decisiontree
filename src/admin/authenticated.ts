/**
 * The one door of the editor's API (docs/specs/application.md 20.6, 22.1;
 * ADR-132-accounts-and-sessions, Consequences): every route handler under `/admin/api/`
 * calls `authenticated` first, which resolves the session and, for a writing method, applies
 * the CSRF check -- and answers 401 or 403 itself.
 */
import { baseUrl, store, type Environment } from '../config.ts'
import type { Session } from '../store/sessions.ts'

/** The headers of every response under `/admin` (20.9); the proxy sets them too, for pages. */
export const ADMIN_HEADERS: Readonly<Record<string, string>> = {
  'X-Robots-Tag': 'noindex, nofollow',
  'Cache-Control': 'no-store',
}

/** A JSON answer with 20.9's headers; `body` undefined answers no body (204). */
export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  const all = new Headers({ ...ADMIN_HEADERS, ...headers })
  if (body === undefined) return new Response(null, { status, headers: all })
  all.set('Content-Type', 'application/json; charset=utf-8')
  return new Response(JSON.stringify(body), { status, headers: all })
}

/** The refusal of a request, as a JSON answer the screens read (22.1). */
export function refuse(status: number, error: string, field: string | null = null): Response {
  return json({ error, field }, status)
}

const WRITING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * Why a writing request is refused by layers 1 and 2 of 20.6, or null when it passes. Layer
 * 3 is the cookie's `SameSite=Strict`, which the browser applies.
 *
 * 1. `Sec-Fetch-Site: same-origin`; or, when the browser sent no such header, an `Origin`
 *    equal to the deployment's own.
 * 2. A request that carries a body is `application/json` -- or `multipart/form-data` where
 *    `upload` is set -- which no HTML form can send to a JSON route.
 */
export function csrfRefusal(request: Request, { upload = false } = {}, env: Environment = process.env): string | null {
  if (!WRITING.has(request.method)) return null
  const site = request.headers.get('sec-fetch-site')
  if (site !== null) {
    if (site !== 'same-origin') return `Sec-Fetch-Site is ${site}`
  } else if (request.headers.get('origin') !== baseUrl(request.headers, env).origin) {
    return 'the Origin is not this deployment'
  }
  const type = request.headers.get('content-type')
  const length = request.headers.get('content-length')
  const hasBody = type !== null || (length !== null && length !== '0') || request.headers.has('transfer-encoding')
  if (hasBody) {
    const media = (type ?? '').split(';')[0]!.trim().toLowerCase()
    if (media !== 'application/json' && !(upload && media === 'multipart/form-data')) return `a body of type ${media || 'none'}`
  }
  return null
}

/**
 * The session a request to `/admin/api/` carries, or the answer that refuses it: 403 when a
 * writing method fails the CSRF check (20.6), 401 when there is no live session (22.1).
 */
export async function authenticated(request: Request, { upload = false } = {}): Promise<Session | Response> {
  if (csrfRefusal(request, { upload })) return refuse(403, 'forbidden')
  const session = await (await store()).sessions.resolve(request.headers.get('cookie'))
  return session ?? refuse(401, 'unauthenticated')
}

/** The JSON object a request carries; null for a body that is not one. */
export async function bodyOf(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json()
    return body !== null && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null
  } catch {
    return null
  }
}
