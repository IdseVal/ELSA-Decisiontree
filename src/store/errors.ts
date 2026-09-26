/**
 * A request the store refuses, with the status the route answers (docs/specs/application.md
 * 22.1, 22.3): 403 no role, 404 unknown, 409 a state conflict, 413 too large, 415 wrong type,
 * 422 a blocking violation or a malformed request. `violations` carries the rules broken, in
 * the shape of 5.1, when there are any; `code` is a short word a screen maps to its text.
 */
import type { Violation } from '../tree/types.ts'

export class StoreError extends Error {
  readonly status: 403 | 404 | 409 | 413 | 415 | 422
  readonly violations: Violation[]

  constructor(status: StoreError['status'], code: string, violations: Violation[] = []) {
    super(code)
    this.name = 'StoreError'
    this.status = status
    this.violations = violations
  }
}

/**
 * Whether `error` is a `StoreError`. By name, not `instanceof`: Next.js bundles each route
 * apart, so the store's copy of this class is not the route's (as `isAccountError`).
 */
export function isStoreError(error: unknown): error is StoreError {
  return error instanceof Error && error.name === 'StoreError'
}

/** A 422 for one malformed part of a request, in the violation shape the editor shows at a field. */
export function malformed(where: string, keyPath: string, rule: string, message: string): StoreError {
  return new StoreError(422, 'malformed', [{ file: where, keyPath, rule, message, advisory: false }])
}
