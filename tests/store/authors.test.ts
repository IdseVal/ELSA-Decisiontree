/**
 * **[#197]** Who a Tree names as its Authors (docs/specs/application.md 39.1, 39.3;
 * ADR-195-authors): `authorsOf`, the whole rule, over a `meta.json`'s roles and a table of
 * accounts that answers `get` as the store's does -- the account, or null for an id it has
 * not got.
 */
import { describe, expect, test } from 'vitest'
import type { Account } from '../../src/store/accounts.ts'
import { authorsOf } from '../../src/store/authors.ts'

/** An account of the table below: active, no administrator, unless `change` says otherwise. */
function account(id: string, name: string, change: Partial<Account> = {}): Account {
  return { id, name, email: `${id}@example.org`, passwordHash: '', active: true, administrator: false, createdAt: '2026-10-04T00:00:00.000Z', ...change }
}

const ACCOUNTS = [
  account('admin', 'Administrator', { administrator: true }),
  account('anna', 'Anna de Vries'),
  account('bram', 'Bram Jansen'),
  account('cees', 'Cees Bakker'),
  account('dirk', 'Dirk Visser', { active: false }),
]

const accounts = { get: (id: string): Account | null => ACCOUNTS.find((entry) => entry.id === id) ?? null }

describe('authorsOf (39.3)', () => {
  test("names the creator and the collaborators in joined's order, not in the order of the roles", () => {
    // Bram made the Tree and invited Anna and Cees, then handed it to Cees (21.4).
    const meta = { creator: 'cees', collaborators: ['anna', 'bram'], joined: ['bram', 'anna', 'cees'] }
    expect(authorsOf(meta, accounts)).toEqual(['Bram Jansen', 'Anna de Vries', 'Cees Bakker'])
  })

  test('a collaborator removed is not named; invited again, it is named in the place it first joined (39.1)', () => {
    const removed = { creator: 'anna', collaborators: ['cees'], joined: ['anna', 'bram', 'cees'] }
    expect(authorsOf(removed, accounts)).toEqual(['Anna de Vries', 'Cees Bakker'])
    const again = { creator: 'anna', collaborators: ['cees', 'bram'], joined: ['anna', 'bram', 'cees'] }
    expect(authorsOf(again, accounts)).toEqual(['Anna de Vries', 'Bram Jansen', 'Cees Bakker'])
  })

  test('a deactivated account is named while it holds its role', () => {
    const meta = { creator: 'anna', collaborators: ['dirk'], joined: ['anna', 'dirk'] }
    expect(authorsOf(meta, accounts)).toEqual(['Anna de Vries', 'Dirk Visser'])
  })

  test('the administrator is never named: not as the creator, not as a collaborator', () => {
    expect(authorsOf({ creator: 'admin', collaborators: ['anna'], joined: ['admin', 'anna'] }, accounts)).toEqual(['Anna de Vries'])
    // After the administrator hands a Tree it made over, it is a collaborator (21.4).
    expect(authorsOf({ creator: 'anna', collaborators: ['admin'], joined: ['admin', 'anna'] }, accounts)).toEqual(['Anna de Vries'])
  })

  test('a Tree whose only role holder is the administrator names nobody', () => {
    expect(authorsOf({ creator: 'admin', collaborators: [], joined: ['admin'] }, accounts)).toEqual([])
  })

  test('an id of joined that holds no role now is not named, and an id no account has is skipped', () => {
    expect(authorsOf({ creator: 'anna', collaborators: [], joined: ['bram', 'anna', 'cees'] }, accounts)).toEqual(['Anna de Vries'])
    expect(authorsOf({ creator: 'anna', collaborators: ['gone', 'bram'], joined: ['anna', 'gone', 'bram'] }, accounts)).toEqual([
      'Anna de Vries',
      'Bram Jansen',
    ])
  })

  test('an id written twice into joined by hand is named once, in its first place', () => {
    expect(authorsOf({ creator: 'anna', collaborators: ['bram'], joined: ['bram', 'anna', 'bram'] }, accounts)).toEqual(['Bram Jansen', 'Anna de Vries'])
  })
})
