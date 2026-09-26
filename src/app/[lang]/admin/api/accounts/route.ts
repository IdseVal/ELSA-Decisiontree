/**
 * `/admin/api/accounts` (docs/specs/application.md 20.1, 21.4, 22.1): `GET` the active
 * accounts, for an invitation; `POST` a new account, the administrator only.
 */
import { authenticated, bodyOf, json, refuse } from '../../../../../admin/authenticated.ts'
import { store } from '../../../../../config.ts'
import { isAccountError, publicOf } from '../../../../../store/accounts.ts'

export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<Response> {
  const session = await authenticated(request)
  if (session instanceof Response) return session
  return json((await store()).accounts.listActive())
}

export async function POST(request: Request): Promise<Response> {
  const session = await authenticated(request)
  if (session instanceof Response) return session
  const body = await bodyOf(request)
  if (!body) return refuse(422, 'malformed')
  try {
    const account = await (await store()).accounts.create(
      session.account,
      body.name as string,
      body.login as string,
      body.password as string,
    )
    return json(publicOf(account), 201)
  } catch (error) {
    if (isAccountError(error)) return refuse(error.status, error.message, error.field)
    throw error
  }
}
