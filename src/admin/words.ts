/**
 * The chrome words the admin screens' client components take, as plain strings
 * (docs/specs/application.md 3.2: a client component never imports `chrome`).
 */
import { chrome } from '../chrome.ts'
import type { AccountWords } from '../editor/account-words.ts'
import type { LoginWords } from '../editor/LoginForm.tsx'
import type { NewTreeWords } from '../editor/NewTreeForm.tsx'

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
    displayName: ui.displayName,
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

/** **[#137]** The new-Tree form's words (27.1, 27.2). */
export function newTreeWords(lang: string): NewTreeWords {
  const ui = chrome(lang)
  return {
    newTree: ui.newTree,
    treeId: ui.treeId,
    treeIdHint: ui.treeIdHint,
    treeIdFixed: ui.treeIdFixed,
    treeIdTaken: ui.treeIdTaken,
    treeIdReserved: ui.treeIdReserved,
    languages: ui.languages,
    addLanguage: ui.addLanguage,
    makeDefault: ui.makeDefault,
    default: ui.default,
    removeLanguage: ui.removeLanguage,
    languageHint: ui.languageHint,
    languagesLater: ui.languagesLater,
    title: ui.title,
    create: ui.create,
    requestFailed: ui.requestFailed,
  }
}
