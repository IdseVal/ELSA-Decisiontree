/**
 * The words of the account page and the accounts page (docs/specs/application.md 25.2,
 * 25.3), and how a refusal of the accounts API becomes one of them at its field.
 */
import type { Answer } from './request.ts'

/** Strings, because a client component takes no module. */
export interface AccountWords {
  yourName: string
  changePassword: string
  currentPassword: string
  newPassword: string
  repeatPassword: string
  passwordsDiffer: string
  wrongPassword: string
  sessionsEnded: string
  newAccount: string
  create: string
  deactivate: string
  reactivate: string
  active: string
  deactivated: string
  administrator: string
  setPassword: string
  save: string
  login: string
  password: string
  displayName: string
  nameLength: string
  loginInvalid: string
  loginTaken: string
  passwordLength: string
  requestFailed: string
  close: string
  previous: string
  next: string
  opensInNewTab: string
}

/** Where a refusal is shown, and what it says; null for a success. */
export interface Refusal {
  field: string | null
  text: string
}

/** The refusal's text when it is shown at `field`; one without a field is the password's. */
export function refusalAt(refusal: Refusal | null, field: string): string | undefined {
  return refusal && (refusal.field ?? 'password') === field ? refusal.text : undefined
}

/** The refusal an answer carries, mapped to the chrome by the API's code (`AccountError`). */
export function refusalOf(answer: Answer | null, words: AccountWords): Refusal | null {
  if (answer && answer.status >= 200 && answer.status < 300) return null
  const code = answer?.body?.error
  const field = answer?.body?.field ?? null
  const text =
    code === 'name-length'
      ? words.nameLength
      : code === 'login-invalid'
        ? words.loginInvalid
        : code === 'login-taken'
          ? words.loginTaken
          : code === 'password-length'
            ? words.passwordLength
            : code === 'wrong-password'
              ? words.wrongPassword
              : words.requestFailed
  return { field, text }
}
