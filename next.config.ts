import type { NextConfig } from 'next'

/**
 * A well-formed language tag (docs/specs/application.md 4.1). Written once and tested twice
 * below: the whitelist is what keeps a path separator, a traversal or markup out of the
 * route, and the two rules can only be exhaustive while they read the same grammar.
 */
const LANGUAGE_TAG = '[a-zA-Z]{2,8}(?:-[a-zA-Z0-9]{1,8})*'

// docs/specs/application.md section 1: a self-contained folder run with `node server.js`,
// no vendor features, no X-Powered-By header.
const config: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,

  /**
   * The two rules of 4.4. Only the root layout can set `<html lang>` and Next.js does not
   * give a layout the query, so `?lang` is restated as a leading path segment inside the
   * server, before the file system. A rewrite is invisible to the browser: the address bar,
   * the share link and the canonical link keep the query, and the public URL scheme of 4.1
   * is unchanged. `missing` holds exactly when `has` does not, so every request is rewritten
   * once (docs/adrs/ADR-19-content-language-in-the-route.md).
   */
  async rewrites() {
    return {
      beforeFiles: [
        // a well-formed ?lang  ->  /<tag>/...
        {
          source: '/:path*',
          has: [{ type: 'query', key: 'lang', value: `(?<lang>${LANGUAGE_TAG})` }],
          destination: '/:lang/:path*',
        },
        // anything else -- no `lang`, an empty one, or a value that is not a tag  ->  /_/...
        {
          source: '/:path*',
          missing: [{ type: 'query', key: 'lang', value: LANGUAGE_TAG }],
          destination: '/_/:path*',
        },
      ],
    }
  },
}

export default config
