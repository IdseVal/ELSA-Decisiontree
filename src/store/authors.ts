/**
 * **[#197]** Who a Tree names as its Authors (docs/specs/application.md 39.1, 39.3;
 * ADR-195-authors, ADR-195-order-of-joining): the whole rule, as one pure function. The store's
 * `authors(id)` reads it for the public routes, and the creators' overview for the Trees the
 * caller has a role on; nothing else decides who is named.
 */
import type { Accounts } from './accounts.ts'
import type { TreeMeta } from './permissions.ts'

/**
 * The names of the Tree's Authors, in `joined`'s order: of its ids, those that are the creator
 * or a collaborator now, whose account exists and is not the administrator (39.3). A
 * deactivated account is named while it holds its role; a removed collaborator is not, and
 * invited again it stands where it first joined (39.1). An id written into `joined` twice by hand
 * is named once, at its first place.
 */
export function authorsOf(meta: Pick<TreeMeta, 'creator' | 'collaborators' | 'joined'>, accounts: Pick<Accounts, 'get'>): string[] {
  const names: string[] = []
  for (const id of new Set(meta.joined)) {
    if (id !== meta.creator && !meta.collaborators.includes(id)) continue
    const account = accounts.get(id)
    if (account && !account.administrator) names.push(account.name)
  }
  return names
}
