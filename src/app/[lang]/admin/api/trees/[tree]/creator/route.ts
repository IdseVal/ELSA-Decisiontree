/**
 * `PUT /admin/api/trees/<t>/creator { accountId }` (docs/specs/application.md 21.4, 22.1):
 * hands the Tree over; the old creator stays on as a collaborator.
 */
import { json, refuse } from '../../../../../../../admin/authenticated.ts'
import { answered, caller, limitedBody } from '../../../../../../../admin/requests.ts'

export const dynamic = 'force-dynamic'

export async function PUT(request: Request, { params }: { params: Promise<{ tree: string }> }): Promise<Response> {
  const who = await caller(request)
  if (who instanceof Response) return who
  const { tree } = await params
  return answered(async () => {
    who.drafts.permitted(who.account, tree, 'hand-over')
    const body = await limitedBody(request)
    if (body instanceof Response) return body
    if (typeof body.accountId !== 'string') return refuse(422, 'malformed', 'accountId')
    return json((await who.drafts.handOver(who.account, tree, body.accountId)).meta)
  })
}
