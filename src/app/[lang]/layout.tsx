import { headers } from 'next/headers'
import type { ReactNode } from 'react'
import { chromeLanguage } from '../../chrome.ts'
import { store } from '../../config.ts'
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
 * because every word of it is chrome.
 */
async function htmlLang(path: string, lang: string): Promise<string> {
  const treeId = path.split('/').find((segment) => segment !== '')
  const tree = treeId ? (await store()).published(treeId) : null
  const address = tree && parseUrl(path, lang, tree)
  return address ? address.lang : chromeLanguage(lang)
}
