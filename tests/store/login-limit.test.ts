/**
 * The rate limit on login (docs/specs/application.md 20.7): five failures lock a name for
 * fifteen minutes, a success resets it, and more than sixty failures in a minute lock the
 * route for one -- on a clock the test moves.
 */
import { beforeEach, describe, expect, test } from 'vitest'
import { loginLimit, NAME_LOCK_MS, ROUTE_FAILURES, ROUTE_WINDOW_MS, type LoginLimit } from '../../src/store/login-limit.ts'

let clock: number
let limit: LoginLimit

beforeEach(() => {
  clock = 0
  limit = loginLimit(() => clock)
})

describe('per login name', () => {
  test('the fifth consecutive failure locks the name for 15 minutes, with Retry-After in seconds', () => {
    for (let failure = 1; failure <= 4; failure += 1) {
      expect(limit.fail('anna')).toBeNull()
      expect(limit.check('anna')).toEqual({ locked: false })
    }
    expect(limit.fail('anna')).toBe('name')

    expect(limit.check('anna')).toEqual({ locked: true, retryAfter: NAME_LOCK_MS / 1000 })
    // Another name is not locked with it.
    expect(limit.check('bram')).toEqual({ locked: false })
    clock += NAME_LOCK_MS - 1000
    expect(limit.check('anna')).toEqual({ locked: true, retryAfter: 1 })
    clock += 1000
    expect(limit.check('anna')).toEqual({ locked: false })
  })

  test('a success resets the count', () => {
    for (let failure = 1; failure <= 4; failure += 1) limit.fail('anna')
    limit.succeed('anna')

    for (let failure = 1; failure <= 4; failure += 1) expect(limit.fail('anna')).toBeNull()
    expect(limit.check('anna')).toEqual({ locked: false })
  })

  test('a lock that ran out starts the count again from zero', () => {
    for (let failure = 1; failure <= 5; failure += 1) limit.fail('anna')
    clock += NAME_LOCK_MS

    expect(limit.fail('anna')).toBeNull()
    expect(limit.check('anna')).toEqual({ locked: false })
  })
})

describe('per deployment', () => {
  test('more than 60 failures in one minute, across names, lock the route for one minute', () => {
    for (let failure = 1; failure <= ROUTE_FAILURES; failure += 1) {
      expect(limit.fail(`name-${failure}`)).toBeNull()
      clock += 500
    }
    expect(limit.check('anna')).toEqual({ locked: false })

    expect(limit.fail('name-61')).toBe('route')

    expect(limit.check('anna')).toEqual({ locked: true, retryAfter: ROUTE_WINDOW_MS / 1000 })
    clock += ROUTE_WINDOW_MS
    expect(limit.check('anna')).toEqual({ locked: false })
  })

  test('failures spread over more than a minute never lock the route', () => {
    for (let failure = 1; failure <= 3 * ROUTE_FAILURES; failure += 1) {
      limit.fail(`name-${failure}`)
      clock += 1100
    }

    expect(limit.check('anna')).toEqual({ locked: false })
  })
})

describe('simultaneous attempts', () => {
  test('count from when they begin: five running guesses on a name hold back the sixth', () => {
    for (let attempt = 1; attempt <= 5; attempt += 1) expect(limit.begin('anna')).toEqual({ locked: false })

    expect(limit.begin('anna')).toEqual({ locked: true, retryAfter: 1 })
    // Another name is not held back with it.
    expect(limit.begin('bram')).toEqual({ locked: false })
    for (let attempt = 1; attempt <= 4; attempt += 1) expect(limit.fail('anna')).toBeNull()
    expect(limit.fail('anna')).toBe('name')
    expect(limit.begin('anna')).toEqual({ locked: true, retryAfter: NAME_LOCK_MS / 1000 })
  })

  test('a success ends its attempt and the count; a guess still running keeps its place', () => {
    for (let attempt = 1; attempt <= 5; attempt += 1) limit.begin('anna')
    limit.succeed('anna')

    // Four still running, and nothing failed yet: one more may begin, not two.
    expect(limit.begin('anna')).toEqual({ locked: false })
    expect(limit.begin('anna')).toEqual({ locked: true, retryAfter: 1 })
    for (let attempt = 1; attempt <= 5; attempt += 1) limit.succeed('anna')
    expect(limit.check('anna')).toEqual({ locked: false })
  })

  test('across names, no more attempts run at once than the route lock allows to fail', () => {
    let begun = 0
    for (let attempt = 1; attempt <= 3 * ROUTE_FAILURES; attempt += 1) if (!limit.begin(`name-${attempt}`).locked) begun += 1

    expect(begun).toBe(ROUTE_FAILURES + 1)
    for (let attempt = 1; attempt <= ROUTE_FAILURES + 1; attempt += 1) limit.fail(`name-${attempt}`)
    expect(limit.check('anna')).toEqual({ locked: true, retryAfter: ROUTE_WINDOW_MS / 1000 })
  })
})
