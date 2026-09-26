/**
 * `/admin/api/trees/<t>/nodes/<n>` (docs/specs/application.md 22.1 to 22.4): `GET` the draft
 * Node with its to-do list and the titles its Links need; `PATCH` one field `{ path, value }`
 * or one operation `{ op, ... }`; `DELETE` the Node and every Link to it, never the root.
 */
import { json } from '../../../../../../../../admin/authenticated.ts'
import { answered, caller, limitedBody } from '../../../../../../../../admin/requests.ts'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ tree: string; node: string }> }

export async function GET(request: Request, { params }: Context): Promise<Response> {
  const who = await caller(request)
  if (who instanceof Response) return who
  const { tree, node } = await params
  return answered(async () => json(await who.drafts.node(who.account, tree, node)))
}

export async function PATCH(request: Request, { params }: Context): Promise<Response> {
  const who = await caller(request)
  if (who instanceof Response) return who
  const { tree, node } = await params
  return answered(async () => {
    who.drafts.permitted(who.account, tree, 'edit')
    const body = await limitedBody(request)
    if (body instanceof Response) return body
    const change = typeof body.op === 'string' ? { ...body, op: body.op } : { path: body.path as string, value: body.value }
    return json(await who.drafts.write(who.account, tree, node, change))
  })
}

export async function DELETE(request: Request, { params }: Context): Promise<Response> {
  const who = await caller(request)
  if (who instanceof Response) return who
  const { tree, node } = await params
  return answered(async () => {
    who.drafts.permitted(who.account, tree, 'edit')
    const response = await who.drafts.deleteNode(who.account, tree, node)
    // 22.1: 204 and `also`; a 204 carries no body, so the referrers travel as 200's.
    return json(response, 200)
  })
}
