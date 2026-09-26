/**
 * `POST /admin/api/trees/<t>/nodes { from: { node, link }, title? }` (docs/specs/application.md
 * 22.1, 22.4): creates a Node and the Link to it in one write -- an Answer or an Option -- or,
 * with `link: 'end'` and an `outcome`, makes `from.node` a Terminal.
 */
import { json, refuse } from '../../../../../../../admin/authenticated.ts'
import { answered, caller, limitedBody } from '../../../../../../../admin/requests.ts'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ tree: string }> }): Promise<Response> {
  const who = await caller(request)
  if (who instanceof Response) return who
  const { tree } = await params
  return answered(async () => {
    who.drafts.permitted(who.account, tree, 'edit')
    const body = await limitedBody(request)
    if (body instanceof Response) return body
    const from = body.from
    if (from === null || typeof from !== 'object' || Array.isArray(from)) return refuse(422, 'malformed', 'from')
    const response = await who.drafts.createNode(who.account, tree, from as { node: unknown; link: unknown; outcome?: unknown }, body.title, body.id)
    return json(response, 201)
  })
}
