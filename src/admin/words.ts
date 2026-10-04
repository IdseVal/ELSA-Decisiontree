/**
 * The chrome words the admin screens' client components take, as plain strings
 * (docs/specs/application.md 3.2: a client component never imports `chrome`).
 */
import { chrome } from '../chrome.ts'
import type { AccountWords } from '../editor/account-words.ts'
import type { LoginWords } from '../editor/LoginForm.tsx'
import type { NewTreeWords } from '../editor/NewTreeForm.tsx'

export function loginWords(lang: string): LoginWords {
  const { email, password, signIn, loginFailed, loginLocked, requestFailed, sessionNotKept } = chrome(lang)
  return { email, password, signIn, loginFailed, loginLocked, requestFailed, sessionNotKept }
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
    email: ui.email,
    password: ui.password,
    displayName: ui.displayName,
    nameLength: ui.nameLength,
    nameTaken: ui.nameTaken,
    emailInvalid: ui.emailInvalid,
    emailTaken: ui.emailTaken,
    passwordLength: ui.passwordLength,
    setEmail: ui.setEmail,
    noEmail: ui.noEmail,
    emailHelp: ui.emailHelp,
    nameShownPublicly: ui.nameShownPublicly,
    requestFailed: ui.requestFailed,
    close: ui.close,
    previous: ui.previous,
    next: ui.next,
    opensInNewTab: ui.opensInNewTab,
  }
}

/** **[#137]** The new-Tree form's words (27.1, 27.2). */
export function newTreeWords(lang: string): NewTreeWords {
  const ui = chrome(lang)
  return {
    newTree: ui.newTree,
    languages: ui.languages,
    addLanguage: ui.addLanguage,
    makeDefault: ui.makeDefault,
    default: ui.default,
    removeLanguage: ui.removeLanguage,
    languageHint: ui.languageHint,
    languageTag: ui.languageTag,
    title: ui.title,
    create: ui.create,
    requestFailed: ui.requestFailed,
  }
}
