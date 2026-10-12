/**
 * The headers of every response under `/admin` (docs/specs/application.md 20.9): no index,
 * no cache. Its own module, because the proxy that sets them on pages is compiled apart from
 * the route handlers and must not pull the store in.
 */
export const ADMIN_HEADERS: Readonly<Record<string, string>> = {
  'X-Robots-Tag': 'noindex, nofollow',
  'Cache-Control': 'no-store',
}
