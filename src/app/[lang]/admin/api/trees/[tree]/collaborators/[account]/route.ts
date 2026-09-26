/**
 * `PUT` / `DELETE /admin/api/trees/<t>/collaborators/<accountId>` (docs/specs/application.md
 * 21.4, 22.1): invites an active account picked from the accounts list, or removes one.
 */
import { json } from '../../../../../../../../admin/authenticated.ts'
import { answered, caller } from '../../../../../../../../admin/requests.ts'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ tree: string; account: string }> }

export async function PUT(request: Request, { params }: Context): Promise<Response> {
  const who = await caller(request)
  if (who instanceof Response) return who
  const { tree, account } = await params
  return answered(async () => {
    who.drafts.permitted(who.account, tree, 'invite')
    return json((await who.drafts.addCollaborator(who.account, tree, account)).meta)
  })
}

export async function DELETE(request: Request, { params }: Context): Promise<Response> {
  const who = await caller(request)
  if (who instanceof Response) return who
  const { tree, account } = await params
  return answered(async () => {
    who.drafts.permitted(who.account, tree, 'invite')
    return json((await who.drafts.removeCollaborator(who.account, tree, account)).meta)
  })
}
