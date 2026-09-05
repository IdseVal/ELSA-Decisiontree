/**
 * Next.js's startup hook (docs/specs/application.md section 5.4): open and validate the
 * configured Tree before the first request. The work is in config.ts, imported only on the
 * Node.js runtime, so that nothing Node-only is compiled into the Edge bundle.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { startServedTree } = await import('./config.ts')
  await startServedTree()
}
