/**
 * The one stand-in the unit suite needs. A client component that follows a link asks the
 * App Router for itself (`useRouter`), and outside a running Next.js app there is no router
 * to ask. The unit tests render markup and never click, so a router that is never called is
 * enough; what a click does is the browser tests' (`tests/browser/transition.spec.ts`).
 */
import { vi } from 'vitest'

vi.mock('next/navigation', async (actual) => ({
  ...(await actual<typeof import('next/navigation')>()),
  useRouter: () => ({ push: () => {}, refresh: () => {} }),
}))
