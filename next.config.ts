import type { NextConfig } from 'next'

/**
 * A well-formed language tag (docs/specs/application.md 4.1). Written once and tested twice
 * below: the whitelist is what keeps a path separator, a traversal or markup out of the
 * route, and the two rules can only be exhaustive while they read the same grammar.
 */
const LANGUAGE_TAG = '[a-zA-Z]{2,8}(?:-[a-zA-Z0-9]{1,8})*'

/**
 * Every path except Next.js's own, as docs/specs/application.md 4.4 writes it. Next.js does
 * not exclude its own paths from `beforeFiles` rewrites: without this exclusion the second
 * rule sends `/_next/static/<chunk>` to `/_/_next/static/<chunk>`, and every stylesheet and
 * client chunk answers 404 -- pages arrive unstyled and no client component runs. A Tree id
 * cannot begin with `_` (tree-format.md 3.1), so nothing of this application is excluded
 * with it. It is one named path parameter, which is why the destinations below interpolate
 * `:path` and not `:path*`.
 */
const EVERY_PATH_BUT_NEXTS_OWN = '/:path((?!_next/).*)'

// docs/specs/application.md section 1: a self-contained folder run with `node server.js`,
// no vendor features, no X-Powered-By header.
const config: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  // `next dev` otherwise scaffolds AGENTS.md and CLAUDE.md in the repository root when it
  // detects an AI coding agent (#27). The root CLAUDE.md is what the agents in .orca/ read
  // as project instructions, so a generated `@AGENTS.md` would quietly become this
  // project's instructions; the untracked pair also dirties every contributor's tree.
  agentRules: false,

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
          source: EVERY_PATH_BUT_NEXTS_OWN,
          has: [{ type: 'query', key: 'lang', value: `(?<lang>${LANGUAGE_TAG})` }],
          destination: '/:lang/:path',
        },
        // anything else -- no `lang`, an empty one, or a value that is not a tag  ->  /_/...
        {
          source: EVERY_PATH_BUT_NEXTS_OWN,
          missing: [{ type: 'query', key: 'lang', value: LANGUAGE_TAG }],
          destination: '/_/:path',
        },
      ],
    }
  },
}

export default config
