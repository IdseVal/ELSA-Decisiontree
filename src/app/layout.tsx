import type { ReactNode } from 'react'
import { servedTree } from '../config.ts'
import './globals.css'

/**
 * The html shell. `lang` is the Tree's default language: the content language of a page
 * comes from the query string, which a Next.js layout cannot read, so each page also marks
 * its own content and its chrome with `lang` (docs/specs/application.md 3.1).
 */
export default async function RootLayout({ children }: { children: ReactNode }) {
  const tree = await servedTree()
  return (
    <html lang={tree.manifest.defaultLanguage}>
      <body>{children}</body>
    </html>
  )
}
