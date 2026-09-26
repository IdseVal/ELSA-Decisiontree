/**
 * Next.js's startup hook (docs/specs/application.md sections 5.4 and 18.3): open the store
 * and every published Tree before the first request. The work is in config.ts, imported
 * only on the Node.js runtime, so that nothing Node-only is compiled into the Edge bundle.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { startStore } = await import('./config.ts')
  await startStore()
}
