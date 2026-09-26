'use client'

/**
 * The logout button of the admin chrome bar (docs/specs/application.md 24.1): it posts to
 * `/admin/api/logout` and then goes to `/admin`, which shows the login page. A button and not
 * a link, because a `GET` changes nothing (20.6).
 */
import { send } from './request.ts'

export function LogoutButton({ label, to }: { label: string; /** `/admin` in the page's language. */ to: string }) {
  const logout = async (): Promise<void> => {
    await send('POST', '/admin/api/logout')
    // Whatever the answer: a session that is already gone is as logged out as this one.
    window.location.assign(to)
  }
  return (
    <button type="button" className="admin-link" onClick={logout}>
      {label}
    </button>
  )
}
