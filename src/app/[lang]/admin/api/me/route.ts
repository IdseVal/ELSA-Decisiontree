/** `GET /admin/api/me` (docs/specs/application.md 22.1): the caller. */
import { authenticated, json } from '../../../../../admin/authenticated.ts'

export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<Response> {
  const session = await authenticated(request)
  if (session instanceof Response) return session
  const { id, name, login, administrator } = session.account
  return json({ id, name, login, administrator })
}
