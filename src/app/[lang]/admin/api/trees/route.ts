/**
 * `/admin/api/trees` (docs/specs/application.md 22.1, 27.2): `GET` the caller's Trees -- every
 * Tree for the administrator -- and `POST { id, languages, title }` to create one, hidden, with
 * the caller as its creator and one empty root Node `start`.
 */
import { json } from '../../../../../admin/authenticated.ts'
import { answered, caller, limitedBody } from '../../../../../admin/requests.ts'

export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<Response> {
  const who = await caller(request)
  if (who instanceof Response) return who
  return json(who.drafts.list(who.account))
}

export async function POST(request: Request): Promise<Response> {
  const who = await caller(request)
  if (who instanceof Response) return who
  const body = await limitedBody(request)
  if (body instanceof Response) return body
  return answered(async () => json(await who.drafts.create(who.account, body.id, body.languages, body.title), 201))
}
