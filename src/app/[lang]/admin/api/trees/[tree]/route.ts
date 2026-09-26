/**
 * `/admin/api/trees/<t>` (docs/specs/application.md 22.1): `GET` the Tree's entry -- meta,
 * manifest, state and violations; `PATCH { path, value }` one manifest field; `DELETE` a
 * hidden Tree, which its creator or the administrator may.
 */
import { json } from '../../../../../../admin/authenticated.ts'
import { answered, caller, limitedBody } from '../../../../../../admin/requests.ts'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ tree: string }> }

export async function GET(request: Request, { params }: Context): Promise<Response> {
  const who = await caller(request)
  if (who instanceof Response) return who
  const { tree } = await params
  return answered(() => json(who.drafts.entry(who.account, tree)))
}

export async function PATCH(request: Request, { params }: Context): Promise<Response> {
  const who = await caller(request)
  if (who instanceof Response) return who
  const { tree } = await params
  return answered(async () => {
    who.drafts.permitted(who.account, tree, 'edit')
    const body = await limitedBody(request)
    if (body instanceof Response) return body
    return json(await who.drafts.write(who.account, tree, null, { path: body.path as string, value: body.value }))
  })
}

export async function DELETE(request: Request, { params }: Context): Promise<Response> {
  const who = await caller(request)
  if (who instanceof Response) return who
  const { tree } = await params
  return answered(async () => {
    who.drafts.permitted(who.account, tree, 'delete')
    await who.drafts.delete(who.account, tree)
    return json(undefined, 204)
  })
}
