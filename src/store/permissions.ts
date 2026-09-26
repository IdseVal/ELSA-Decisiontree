/**
 * Who may do what to a Tree (docs/specs/application.md 21; ADR-132-roles-and-permissions):
 * the table of 21.2 as one pure function. Every route under `/admin/api` asks it after the
 * session and before the store, and every writing member of the store asks it again, so a
 * route that forgot is caught at the seam.
 */
import type { Account } from './accounts.ts'

/** A Tree's store record, `meta.json` (17.2): the roles, the times and the counters. */
export interface TreeMeta {
  /** The account id of the creator: who created the Tree, or was handed it (21.1). */
  creator: string
  /** Account ids of the collaborators, in the order they were invited. */
  collaborators: string[]
  createdAt: string
  updatedAt: string
  /** The account id of the last write's author. */
  updatedBy: string
  /** When the Tree was last published; absent until the first publish (17.2). */
  publishedAt?: string
  /** How many times it was published: the manifest's `metadata.version` (19.3). */
  publishCount: number
  /** Monotonic per Tree, one step per write of the draft (22.3). */
  revision: number
}

/** Every action on one Tree of 21.2's table. Creating a Tree is `mayCreate`'s: there is no Tree yet. */
export type Action = 'read' | 'edit' | 'upload' | 'invite' | 'publish' | 'hand-over' | 'delete'

/**
 * Whether `account` may take `action` on the Tree `meta` describes (21.3). The administrator
 * may do everything on every Tree without being named in it (20.3); a deactivated account
 * nothing. The `switch` has no default branch, so a new action fails the type check until
 * the table has a row for it.
 */
export function permit(account: Account, meta: TreeMeta, action: Action): boolean {
  if (!account.active) return false
  if (account.administrator) return true
  const creator = meta.creator === account.id
  const collaborator = meta.collaborators.includes(account.id)
  switch (action) {
    case 'read':
    case 'edit':
    case 'upload':
      return creator || collaborator
    case 'invite':
    case 'publish':
    case 'hand-over':
    case 'delete':
      return creator
  }
}

/** 21.2's first row: every active account may create a Tree, and becomes its creator. */
export function mayCreate(account: Account): boolean {
  return account.active
}
