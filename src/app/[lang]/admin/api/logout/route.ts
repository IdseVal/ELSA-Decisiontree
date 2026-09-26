/**
 * `POST /admin/api/logout` (docs/specs/application.md 20.4, 22.1): deletes the session and
 * answers the clearing cookie. No body; `authenticated` applies the CSRF check.
 */
import { authenticated, json } from '../../../../../admin/authenticated.ts'
import { store } from '../../../../../config.ts'

export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<Response> {
  const session = await authenticated(request)
  if (session instanceof Response) return session
  const { cookie } = await (await store()).sessions.end(session)
  console.log(`account ${session.account.id} logged out`)
  return json(undefined, 204, { 'Set-Cookie': cookie })
}
