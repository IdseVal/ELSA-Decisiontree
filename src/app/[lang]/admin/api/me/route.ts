/** `GET /admin/api/me` (docs/specs/application.md 22.1, 38.2): the caller, with its own address (38.5). */
import { authenticated, json } from '../../../../../admin/authenticated.ts'

export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<Response> {
  const session = await authenticated(request)
  if (session instanceof Response) return session
  const { id, name, email, administrator } = session.account
  return json({ id, name, email, administrator })
}
