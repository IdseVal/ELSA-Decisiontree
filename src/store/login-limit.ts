/**
 * The rate limit on login (docs/specs/application.md 20.7; ADR-132-accounts-and-sessions
 * decision 10): two counters, in memory, and neither keyed by a client address.
 *
 * Per login name: 5 consecutive failures lock the name for 15 minutes; a success resets it.
 * Per deployment: more than 60 failures in one minute, across all names, lock the route for
 * one minute -- each attempt costs 64 MiB of scrypt, so this is also what keeps the box up.
 */

const MINUTE = 60_000
export const NAME_FAILURES = 5
export const NAME_LOCK_MS = 15 * MINUTE
export const ROUTE_FAILURES = 60
export const ROUTE_WINDOW_MS = MINUTE

/** What `check` answers: go ahead, or the seconds until the lock lifts. */
export type LimitVerdict = { locked: false } | { locked: true; retryAfter: number }

export interface LoginLimit {
  /** Whether an attempt on `name` may run now. */
  check(name: string): LimitVerdict
  /** Counts a failure on `name`; which lock this failure started, if one did, for the log (20.8). */
  fail(name: string): 'name' | 'route' | null
  /** A success on `name`: its count starts again. */
  succeed(name: string): void
}

/** A fresh pair of counters. `now` is the clock, a parameter so the locks can be tested without waiting. */
export function loginLimit(now: () => number = Date.now): LoginLimit {
  const names = new Map<string, { failures: number; lockedUntil: number; last: number }>()
  let failures: number[] = []
  let routeLockedUntil = 0

  const seconds = (until: number): number => Math.max(1, Math.ceil((until - now()) / 1000))

  return {
    check(name) {
      const at = now()
      if (routeLockedUntil > at) return { locked: true, retryAfter: seconds(routeLockedUntil) }
      const entry = names.get(name)
      if (entry && entry.lockedUntil > at) return { locked: true, retryAfter: seconds(entry.lockedUntil) }
      return { locked: false }
    },

    fail(name) {
      const at = now()
      failures = failures.filter((time) => time > at - ROUTE_WINDOW_MS)
      failures.push(at)
      let started: 'name' | 'route' | null = null
      if (failures.length > ROUTE_FAILURES && routeLockedUntil <= at) {
        routeLockedUntil = at + ROUTE_WINDOW_MS
        started = 'route'
      }
      // A name spray adds a name per attempt; a name untouched for a lock's length is forgotten.
      if (names.size > 1000) for (const [key, old] of names) if (old.last < at - NAME_LOCK_MS) names.delete(key)
      const entry = names.get(name) ?? { failures: 0, lockedUntil: 0, last: at }
      entry.last = at
      // A lock that has run out starts the count again.
      if (entry.lockedUntil !== 0 && entry.lockedUntil <= at) Object.assign(entry, { failures: 0, lockedUntil: 0 })
      entry.failures += 1
      names.set(name, entry)
      if (entry.failures >= NAME_FAILURES && entry.lockedUntil === 0) {
        entry.lockedUntil = at + NAME_LOCK_MS
        started ??= 'name'
      }
      return started
    },

    succeed(name) {
      names.delete(name)
    },
  }
}
