/**
 * The page's Theme (docs/specs/application.md 13.1, amended by #133; ADR-133-admin-routes
 * decision 6): the one `<style>` element and the tab icon, emitted by the page rather than
 * the root layout, because with many Trees only the page knows which Tree it shows. The
 * only caller of `themeStyle`.
 *
 * `precedence` is what makes React hoist the element into `<head>` from wherever the page
 * renders it, and what keeps it to one element per document.
 */
import { themeStyle } from '../theme.ts'
import type { Tree } from '../tree/loader.ts'
import { themeHref } from '../url.ts'

/** `tree` is the Tree the page shows; null on a page that shows none, which takes the default (13.4). */
export function ThemeStyle({ tree }: { tree: Tree | null }) {
  // The default names no font file, so it needs no Tree id to address one.
  const theme = tree ? themeStyle(tree.manifest.theme, tree.id) : themeStyle(undefined, '')
  return (
    <>
      {/*
        The one string in this application written as raw HTML, and the reason src/theme.ts
        holds every escape of 13.3: it has already checked its own output for `</style`.
        React would otherwise entity-escape the CSS, which a `<style>` element does not
        decode.
      */}
      <style precedence="high" href="elsa-theme" dangerouslySetInnerHTML={{ __html: theme.css }} />
      {tree && theme.icon && <link rel="icon" href={themeHref(tree.id, theme.icon)} />}
    </>
  )
}
