/**
 * **[#136]** The table of docs/specs/application.md 21.2 as `permit` has it, cell by cell:
 * three roles and an account with none, each action, and a deactivated account that may do
 * nothing. The same table through the routes, with no session as a fifth row, is
 * `tests/admin/trees.test.ts`.
 */
import { describe, expect, test } from 'vitest'
import type { Account } from '../../src/store/accounts.ts'
import { mayCreate, permit, type Action, type TreeMeta } from '../../src/store/permissions.ts'

const account = (id: string, administrator = false, active = true): Account => ({
  id,
  name: id,
  login: id,
  passwordHash: '',
  active,
  administrator,
  createdAt: '2026-09-26T00:00:00.000Z',
})

const meta: TreeMeta = {
  creator: 'creator',
  collaborators: ['collaborator'],
  createdAt: '2026-09-26T00:00:00.000Z',
  updatedAt: '2026-09-26T00:00:00.000Z',
  updatedBy: 'creator',
  publishCount: 0,
  revision: 0,
}

const ROLES = {
  creator: account('creator'),
  collaborator: account('collaborator'),
  'another account': account('another'),
  administrator: account('admin', true),
}

/** 21.2, one row per action: creator, collaborator, another account, administrator. */
const TABLE: Record<Action, [boolean, boolean, boolean, boolean]> = {
  read: [true, true, false, true],
  edit: [true, true, false, true],
  upload: [true, true, false, true],
  invite: [true, false, false, true],
  publish: [true, false, false, true],
  'hand-over': [true, false, false, true],
  delete: [true, false, false, true],
}

describe('permit (21.2, 21.3)', () => {
  test.for(Object.entries(TABLE))('%s', ([action, row]) => {
    expect(Object.values(ROLES).map((role) => permit(role, meta, action as Action))).toEqual(row)
  })

  test('a deactivated account may do nothing, not even on its own Tree', () => {
    for (const action of Object.keys(TABLE) as Action[]) {
      expect(permit(account('creator', false, false), meta, action)).toBe(false)
      expect(permit(account('admin', true, false), meta, action)).toBe(false)
    }
    expect(mayCreate(account('creator', false, false))).toBe(false)
  })

  test('every active account may create a Tree', () => {
    for (const role of Object.values(ROLES)) expect(mayCreate(role)).toBe(true)
  })
})
