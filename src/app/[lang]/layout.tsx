import type { ReactNode } from 'react'
import { servedTree } from '../../config.ts'
import { themeStyle } from '../../theme.ts'
import { contentLanguage, themeHref } from '../../url.ts'
import './globals.css'

/**
 * The html shell, and the ROOT layout: there is no `src/app/layout.tsx`. `lang` is the
 * content language of the page below it, which reaches this layout as the `[lang]` segment
 * a rewrite fills from `?lang` -- a Next.js layout is not given `searchParams`, so the
 * query is restated as a path segment before the file system
 * (docs/adrs/ADR-19-content-language-in-the-route.md, docs/specs/application.md 4.4).
 *
 * It also emits the Theme (13.1): one `<style>` element on every page, built by
 * `src/theme.ts` and by nothing else, holding the `@font-face` rules and the `:root` block
 * of custom properties the stylesheet reads. It is written into the document rather than
 * fetched, so a themed page never flashes the default palette first.
 */
export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ lang: string }>
}) {
  const [tree, { lang }] = await Promise.all([servedTree(), params])
  const theme = themeStyle(tree.manifest.theme)
  return (
    <html lang={contentLanguage(tree, lang)}>
      {/*
        The one string in this application written as raw HTML, and the reason src/theme.ts
        holds every escape of 13.3: it has already checked its own output for `</style`.
        React would otherwise entity-escape the CSS, which a `<style>` element does not
        decode. `precedence` is what makes React hoist the element into `<head>`.
      */}
      <style precedence="high" href="elsa-theme" dangerouslySetInnerHTML={{ __html: theme.css }} />
      {theme.icon && <link rel="icon" href={themeHref(theme.icon)} />}
      <body>{children}</body>
    </html>
  )
}
