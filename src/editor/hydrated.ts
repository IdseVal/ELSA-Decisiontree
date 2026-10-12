/**
 * Whether the admin screens' script has run (docs/specs/application.md 20.8, 24.2). Every
 * admin form keeps its fields disabled until it has: before that, a submit would be the
 * browser's own, which puts the fields -- a password among them -- in the address.
 */
import { useEffect, useState } from 'react'

/** False on the server and at the first render in the browser, true once the component has mounted. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  return hydrated
}
