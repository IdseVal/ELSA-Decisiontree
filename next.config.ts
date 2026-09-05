import type { NextConfig } from 'next'

// docs/specs/application.md section 1: a self-contained folder run with `node server.js`,
// no vendor features, no X-Powered-By header.
const config: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
}

export default config
