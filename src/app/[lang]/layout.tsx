import { headers } from 'next/headers'
import type { ReactNode } from 'react'
import { pageSession } from '../../admin/authenticated.ts'
import { chromeLanguage } from '../../chrome.ts'
import { store } from '../../config.ts'
import { isStoreError } from '../../store/errors.ts'
import { parseUrl, REQUEST_PATH_HEADER, requested } from '../../url.ts'
import './globals.css'

/**
 * The html shell, and the ROOT layout: there is no `src/app/layout.tsx`. `lang` reaches
 * this layout as the `[lang]` segment a rewrite fills from `?lang` -- a Next.js layout is
 * not given `searchParams`, so the query is restated as a path segment before the file
 * system (docs/adrs/ADR-19-content-language-in-the-route.md, docs/specs/application.md 4.4).
 *
 * **[#134]** Every page emits its own Theme through `ThemeStyle` (13.1, amended by #133):
 * with many Trees this layout cannot know which Tree a page shows. It learns the one thing
 * it still needs -- whether the page is a Node page -- from the path `src/proxy.ts` hands it.
 */
export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ lang: string }>
}) {
  const [{ lang }, request] = await Promise.all([params, headers()])
  return (
    <html lang={await htmlLang(requested(request.get(REQUEST_PATH_HEADER)).path, lang)}>
      <body>{children}</body>
    </html>
  )
}

/**
 * `<html lang>` (4.4, 24.3): on a Node page of a served Tree the content language, the
 * one the page shows; on every other page -- the overview, a 404 -- the chrome language,
 * because every word of it is chrome. **[#205]** And on an editor or a preview address the
 * content language too, read from the draft (40.3).
 */
async function htmlLang(path: string, lang: string): Promise<string> {
  const [first, second, ...rest] = path.split('/').filter((segment) => segment !== '')
  if (first === 'admin' && (second === 'trees' || second === 'preview')) return draftLang(`/${rest.join('/')}`, lang)
  const treeId = path.split('/').find((segment) => segment !== '')
  const tree = treeId ? (await store()).published(treeId) : null
  const address = tree && parseUrl(path, lang, tree)
  return address ? address.lang : chromeLanguage(lang)
}

/**
 * **[#205]** `<html lang>` at `/admin/trees/<path>` and `/admin/preview/<path>` (40.3): the
 * content language of the draft's page, for a caller with a role on its Tree -- the page's own
 * session, `permitted('read')`, the draft, `parseUrl` -- and the chrome language of the segment
 * for anyone else, so that no one without a role learns which languages a hidden Tree declares
 * or, through `parseUrl`, which paths are its Nodes; the chrome language too for a path that is
 * not a Node of the draft (the 404 page) and a draft that cannot be opened (19.5).
 */
async function draftLang(path: string, lang: string): Promise<string> {
  const treeId = path.split('/').find((segment) => segment !== '')
  const session = treeId ? await pageSession() : null
  if (!treeId || !session) return chromeLanguage(lang)
  const { drafts } = await store()
  try {
    drafts.permitted(session.account, treeId, 'read')
    const address = parseUrl(path, lang, drafts.draft(session.account, treeId))
    return address ? address.lang : chromeLanguage(lang)
  } catch (error) {
    if (!isStoreError(error)) throw error
    return chromeLanguage(lang)
  }
}
