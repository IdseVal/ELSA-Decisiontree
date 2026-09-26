/**
 * The rate limit on login (docs/specs/application.md 20.7; ADR-132-accounts-and-sessions
 * decision 10): two counters, in memory, and neither keyed by a client address.
 *
 * Per login name: 5 consecutive failures lock the name for 15 minutes; a success resets it.
 * Per deployment: more than 60 failures in one minute, across all names, lock the route for
 * one minute -- each attempt costs 64 MiB of scrypt, so this is also what keeps the box up.
 *
 * An attempt counts from the moment it begins, not when its scrypt ends: otherwise any
 * number of simultaneous guesses would all pass the check before the first one failed.
 */

const MINUTE = 60_000
export const NAME_FAILURES = 5
export const NAME_LOCK_MS = 15 * MINUTE
export const ROUTE_FAILURES = 60
export const ROUTE_WINDOW_MS = MINUTE

/** What `check` answers: go ahead, or the seconds until the lock lifts. */
export type LimitVerdict = { locked: false } | { locked: true; retryAfter: number }

export interface LoginLimit {
  /** Whether an attempt on `name` may run now, counting those still running as failures. */
  check(name: string): LimitVerdict
  /** `check`, and when it may run, counts the attempt as running until `fail` or `succeed` ends it. */
  begin(name: string): LimitVerdict
  /** Counts a failure on `name`; which lock this failure started, if one did, for the log (20.8). */
  fail(name: string): 'name' | 'route' | null
  /** A success on `name`: its count starts again. */
  succeed(name: string): void
}

/** A fresh pair of counters. `now` is the clock, a parameter so the locks can be tested without waiting. */
export function loginLimit(now: () => number = Date.now): LoginLimit {
  const names = new Map<string, { failures: number; lockedUntil: number; last: number; running: number }>()
  let failures: number[] = []
  let routeLockedUntil = 0
  let running = 0

  const seconds = (until: number): number => Math.max(1, Math.ceil((until - now()) / 1000))
  // An attempt ends once, by `fail` or `succeed`; one that never began ends nothing.
  const end = (name: string): void => {
    const entry = names.get(name)
    if (entry && entry.running > 0) {
      entry.running -= 1
      running -= 1
    }
  }

  const check = (name: string): LimitVerdict => {
    const at = now()
    if (routeLockedUntil > at) return { locked: true, retryAfter: seconds(routeLockedUntil) }
    const entry = names.get(name)
    if (entry && entry.lockedUntil > at) return { locked: true, retryAfter: seconds(entry.lockedUntil) }
    // The attempts still running, were they all to fail, would start a lock: wait for them.
    const recent = failures.filter((time) => time > at - ROUTE_WINDOW_MS).length
    if (recent + running > ROUTE_FAILURES) return { locked: true, retryAfter: 1 }
    // A lock that has run out counts nothing: the next failure starts the count again.
    const counted = entry?.lockedUntil === 0 ? entry.failures : 0
    if (entry && counted + entry.running >= NAME_FAILURES) return { locked: true, retryAfter: 1 }
    return { locked: false }
  }

  return {
    check,

    begin(name) {
      const verdict = check(name)
      if (verdict.locked) return verdict
      const entry = names.get(name) ?? { failures: 0, lockedUntil: 0, last: now(), running: 0 }
      entry.last = now()
      entry.running += 1
      running += 1
      names.set(name, entry)
      return verdict
    },

    fail(name) {
      end(name)
      const at = now()
      failures = failures.filter((time) => time > at - ROUTE_WINDOW_MS)
      failures.push(at)
      let started: 'name' | 'route' | null = null
      if (failures.length > ROUTE_FAILURES && routeLockedUntil <= at) {
        routeLockedUntil = at + ROUTE_WINDOW_MS
        started = 'route'
      }
      // A name spray adds a name per attempt; a name untouched for a lock's length is forgotten.
      if (names.size > 1000) for (const [key, old] of names) if (old.last < at - NAME_LOCK_MS && old.running === 0) names.delete(key)
      const entry = names.get(name) ?? { failures: 0, lockedUntil: 0, last: at, running: 0 }
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
      end(name)
      const entry = names.get(name)
      // Attempts on the name still running keep their entry; the count starts again either way.
      if (entry?.running) Object.assign(entry, { failures: 0, lockedUntil: 0 })
      else names.delete(name)
    },
  }
}
