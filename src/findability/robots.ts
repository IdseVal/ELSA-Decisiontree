/**
 * `robots.txt` (docs/specs/application.md 16.1, ADR-118-crawler-access): the wildcard that
 * allows everything, one block per named agent, and the `Sitemap:` line -- the one
 * discovery mechanism every search engine reads without being told a URL, which is why the
 * file is generated rather than absent.
 *
 * Nothing is disallowed, here or anywhere: an agent whose token is misspelt below, or
 * renamed by its operator tomorrow, matches `User-agent: *` and is allowed. That is what
 * makes naming agents safe -- this list can go stale without ever becoming a refusal.
 */

/**
 * The twenty tokens of 16.1's table, in its order: each operator's crawler, its search or
 * answer index, and, where it has one, its AI-training control token and its
 * user-initiated fetcher. The table and this array are one list said twice, and
 * `tests/findability/robots.test.ts` fails when they differ.
 *
 * The list is data, not architecture: adding or removing a token changes that table and
 * this array, and needs no `architecture` issue, because nothing depends on which tokens
 * are in it (ADR-118-crawler-access decision 6).
 */
export const CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'Claude-Web',
  'PerplexityBot',
  'Perplexity-User',
  'Googlebot',
  'Google-Extended',
  'Bingbot',
  'Applebot',
  'Applebot-Extended',
  'meta-externalagent',
  'meta-externalfetcher',
  'CCBot',
  'Amazonbot',
  'Bytespider',
  'DuckDuckBot',
]

/**
 * The file, built against the base the route was given (`ELSA_BASE_URL`, or the request's
 * own origin -- application.md 16). The `Sitemap:` line is absolute because it is read by
 * a crawler that has only this file in hand.
 */
export function robotsTxt(base: URL): string {
  const blocks = ['*', ...CRAWLERS].map((agent) => `User-agent: ${agent}\nAllow: /\n`)
  return `${blocks.join('\n')}\nSitemap: ${new URL('/sitemap.xml', base).href}\n`
}
