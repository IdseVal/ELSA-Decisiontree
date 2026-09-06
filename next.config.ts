import type { NextConfig } from 'next'

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
}

export default config
