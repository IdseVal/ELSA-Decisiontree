import type { ReactNode } from 'react'
import { servedTree } from '../../config.ts'
import { contentLanguage } from '../../url.ts'
import './globals.css'

/**
 * The html shell, and the ROOT layout: there is no `src/app/layout.tsx`. `lang` is the
 * content language of the page below it, which reaches this layout as the `[lang]` segment
 * a rewrite fills from `?lang` -- a Next.js layout is not given `searchParams`, so the
 * query is restated as a path segment before the file system
 * (docs/adrs/ADR-19-content-language-in-the-route.md, docs/specs/application.md 4.4).
 */
export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ lang: string }>
}) {
  const [tree, { lang }] = await Promise.all([servedTree(), params])
  return (
    <html lang={contentLanguage(tree, lang)}>
      <body>{children}</body>
    </html>
  )
}
