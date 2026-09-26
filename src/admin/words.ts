/**
 * The chrome words the admin screens' client components take, as plain strings
 * (docs/specs/application.md 3.2: a client component never imports `chrome`).
 */
import { chrome } from '../chrome.ts'
import type { AccountWords } from '../editor/account-words.ts'
import type { LoginWords } from '../editor/LoginForm.tsx'

export function loginWords(lang: string): LoginWords {
  const { login, password, signIn, loginFailed, loginLocked, requestFailed } = chrome(lang)
  return { login, password, signIn, loginFailed, loginLocked, requestFailed }
}

export function accountWords(lang: string): AccountWords {
  const ui = chrome(lang)
  return {
    yourName: ui.yourName,
    changePassword: ui.changePassword,
    currentPassword: ui.currentPassword,
    newPassword: ui.newPassword,
    repeatPassword: ui.repeatPassword,
    passwordsDiffer: ui.passwordsDiffer,
    wrongPassword: ui.wrongPassword,
    sessionsEnded: ui.sessionsEnded,
    newAccount: ui.newAccount,
    create: ui.create,
    deactivate: ui.deactivate,
    reactivate: ui.reactivate,
    active: ui.active,
    deactivated: ui.deactivated,
    administrator: ui.administrator,
    setPassword: ui.setPassword,
    save: ui.save,
    login: ui.login,
    password: ui.password,
    nameLength: ui.nameLength,
    loginInvalid: ui.loginInvalid,
    loginTaken: ui.loginTaken,
    passwordLength: ui.passwordLength,
    requestFailed: ui.requestFailed,
    close: ui.close,
    previous: ui.previous,
    next: ui.next,
    opensInNewTab: ui.opensInNewTab,
  }
}
