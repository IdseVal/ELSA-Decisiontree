/**
 * The page's Theme (docs/specs/application.md 13.1, amended by #133; ADR-133-admin-routes
 * decision 6): the one `<style>` element and the tab icon, emitted by the page rather than
 * the root layout, because with many Trees only the page knows which Tree it shows. The
 * only caller of `themeStyle`.
 *
 * `precedence` is what makes React hoist the element into `<head>` from wherever the page
 * renders it, and what keeps it to one element per document.
 */
import { createHash } from 'node:crypto'
import { themeStyle, type ThemeHref } from '../theme.ts'
import type { Tree } from '../tree/loader.ts'
import { themeHref } from '../url.ts'

/**
 * `tree` is the Tree the page shows -- **[#138]** or the editor's draft; null on a page that
 * shows none, which takes the default (13.4). **[#144]** `href` addresses its files: the
 * editor passes the admin route's, which serves the draft's.
 */
export function ThemeStyle({ tree, href = themeHref }: { tree: Pick<Tree, 'id' | 'manifest'> | null; href?: ThemeHref }) {
  // The default names no font file, so it needs no Tree id to address one.
  const theme = tree ? themeStyle(tree.manifest.theme, tree.id, href) : themeStyle(undefined, '')
  return (
    <>
      {/*
        The one string in this application written as raw HTML, and the reason src/theme.ts
        holds every escape of 13.3: it has already checked its own output for `</style`.
        React would otherwise entity-escape the CSS, which a `<style>` element does not
        decode.
      */}
      {/*
        **[#144]** The `href` names the content, not the element: React keeps a hoisted style by
        its `href` and never rewrites one it has placed, so in the editor a changed Theme would
        stay unpainted until a reload. A new string is a new element after the old one, whose
        every declaration it overrides; a page that never changes its Theme still has one.
      */}
      <style precedence="high" href={`elsa-theme-${createHash('sha256').update(theme.css).digest('hex').slice(0, 12)}`} dangerouslySetInnerHTML={{ __html: theme.css }} />
      {tree && theme.icon && <link rel="icon" href={href(tree.id, theme.icon)} />}
    </>
  )
}
