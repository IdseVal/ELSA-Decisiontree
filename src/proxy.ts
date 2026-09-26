/**
 * Next.js's proxy (its middleware): hands the page the path the reader asked for
 * (docs/specs/application.md 4.4, 24.3; ADR-133-admin-routes decision 6, amended by #134).
 *
 * With many Trees the root layout cannot tell which page it wraps: it is given the `[lang]`
 * segment and nothing else, yet `<html lang>` is the content language on a Node page and
 * the chrome language everywhere else. The proxy runs before the `?lang` rewrite of
 * next.config.ts, sees the public path, and restates it as a request header the layout and
 * the 404 page read with `headers()`. It is set on every request, over whatever the client
 * sent under that name, so the header is always the server's and never the reader's.
 *
 * **[#135]** It also gives every response under `/admin` the two headers of 20.9 -- a page,
 * a 403, a 404 or an API answer alike -- so that no admin address is indexed or cached.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_HEADERS } from './admin/headers.ts'
import { REQUEST_PATH_HEADER } from './url.ts'

export function proxy(request: NextRequest): NextResponse {
  const headers = new Headers(request.headers)
  const { pathname, search } = request.nextUrl
  headers.set(REQUEST_PATH_HEADER, pathname + search)
  const response = NextResponse.next({ request: { headers } })
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    for (const [name, value] of Object.entries(ADMIN_HEADERS)) response.headers.set(name, value)
  }
  return response
}

/** Every path but Next.js's own files, which render no page (as the rewrites of next.config.ts). */
export const config = {
  matcher: '/((?!_next/).*)',
}
