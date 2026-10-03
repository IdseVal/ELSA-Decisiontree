/**
 * `PATCH /admin/api/accounts/<id>` (docs/specs/application.md 20.1, 20.4, 22.1, 38.2, 38.5):
 * the administrator changes `name`, `email`, `active` or `password`; an account changes its own
 * `name`, or its `password` with `currentPassword`, and never its `email` (403). Deactivating an
 * account ends its sessions; a password change ends every session of the account but the
 * caller's own; a change of address ends none.
 */
import { authenticated, bodyOf, json, refuse } from '../../../../../../admin/authenticated.ts'
import { store } from '../../../../../../config.ts'
import { isAccountError, publicOf, type AccountChange } from '../../../../../../store/accounts.ts'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await authenticated(request)
  if (session instanceof Response) return session
  const body = await bodyOf(request)
  if (!body) return refuse(422, 'malformed')
  const { id } = await params
  const { accounts, sessions } = await store()
  // The five fields of 22.1 and 38.2 and nothing else of the body goes on.
  const change: AccountChange = {
    name: body.name,
    email: body.email,
    active: body.active,
    password: body.password,
    currentPassword: body.currentPassword,
  } as AccountChange
  try {
    const account = await accounts.update(session.account, id, change)
    if (change.active === false || change.password !== undefined) await sessions.endAll(account.id, session)
    return json(publicOf(account))
  } catch (error) {
    if (isAccountError(error)) return refuse(error.status, error.message, error.field)
    throw error
  }
}
