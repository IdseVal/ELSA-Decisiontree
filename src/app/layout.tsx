import type { ReactNode } from 'react'
import { servedTree } from '../config.ts'
import './globals.css'

/**
 * The html shell. `lang` is the Tree's *default* language, not the language of the page: the
 * content language comes from the query string and a Next.js layout is not given
 * `searchParams`, so nothing here can know it. Every element that carries text therefore
 * marks its own language -- the Node view its content, the disclaimer its chrome -- and
 * issue #19 asks the Architect to decide what `docs/specs/application.md` 3.1 should say
 * about `<html lang>` itself.
 */
export default async function RootLayout({ children }: { children: ReactNode }) {
  const tree = await servedTree()
  return (
    <html lang={tree.manifest.defaultLanguage}>
      <body>{children}</body>
    </html>
  )
}
