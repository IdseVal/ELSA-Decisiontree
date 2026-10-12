/**
 * `PUT /admin/api/trees/<t>/published { published }` (docs/specs/application.md 19.3, 22.1):
 * `true` publishes a draft that validates in full and answers 409 with every violation
 * otherwise; `false` hides the Tree from every public route at once.
 */
import { json, refuse } from '../../../../../../../admin/authenticated.ts'
import { answered, caller, limitedBody } from '../../../../../../../admin/requests.ts'

export const dynamic = 'force-dynamic'

export async function PUT(request: Request, { params }: { params: Promise<{ tree: string }> }): Promise<Response> {
  const who = await caller(request)
  if (who instanceof Response) return who
  const { tree } = await params
  return answered(async () => {
    who.drafts.permitted(who.account, tree, 'publish')
    const body = await limitedBody(request)
    if (body instanceof Response) return body
    if (typeof body.published !== 'boolean') return refuse(422, 'malformed', 'published')
    const entry = await who.drafts.publish(who.account, tree, body.published)
    return json({ published: entry.published, publishedAt: entry.meta.publishedAt ?? null })
  })
}
