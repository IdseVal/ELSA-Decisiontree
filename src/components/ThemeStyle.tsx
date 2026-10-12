/**
 * The page's Theme (docs/specs/application.md 13.1, amended by #133; ADR-133-admin-routes
 * decision 6): the one `<style>` element and the tab icon, emitted by the page rather than
 * the root layout, because with many Trees only the page knows which Tree it shows. The
 * only caller of `themeStyle`.
 *
 * `precedence` is what makes React hoist the element into `<head>` from wherever the page
 * renders it, and what keeps it to one element per `href`.
 */
import { createHash } from 'node:crypto'
import { themeStyle, type ThemeHref } from '../theme.ts'
import type { Tree } from '../tree/loader.ts'
import { themeHref } from '../url.ts'

/**
 * `tree` is the Tree the page shows -- **[#138]** or the editor's draft; null on a page that
 * shows none, which takes the default (13.4). **[#144]** `href` addresses its files: the
 * editor passes the admin route's, which serves the draft's. `revision` is the editor's draft
 * revision (22.3), which every write raises. **[#180]** `editor` keeps the editor's own
 * interface -- whatever carries `data-editor-ui` -- in the default look (13.1, 24.3).
 */
export function ThemeStyle({ tree, href = themeHref, revision, editor = false }: { tree: Pick<Tree, 'id' | 'manifest'> | null; href?: ThemeHref; revision?: number; editor?: boolean }) {
  // The default names no font file, so it needs no Tree id to address one.
  const theme = tree ? themeStyle(tree.manifest.theme, tree.id, href, { editor }) : themeStyle(undefined, '')
  return (
    <>
      {/*
        The one string in this application written as raw HTML, and the reason src/theme.ts
        holds every escape of 13.3: it has already checked its own output for `</style`.
        React would otherwise entity-escape the CSS, which a `<style>` element does not
        decode.
      */}
      {/*
        **[#144]** React keeps a hoisted style by its `href`, never rewrites one it has placed,
        never moves it and never removes it. So the `href` names the content and, in the editor,
        the draft revision: every write is a new element after all the old ones, whose every
        declaration it overrides. A hash alone would not do: a Theme going A, B, A again would
        find A's element still in place before B's, and B would stay on screen. A page that never
        changes its Theme still has one element; the editor gets one more per write.
      */}
      <style precedence="high" href={`elsa-theme-${createHash('sha256').update(theme.css).digest('hex').slice(0, 12)}${revision === undefined ? '' : `-${revision}`}`} dangerouslySetInnerHTML={{ __html: theme.css }} />
      {tree && theme.icon && <link rel="icon" href={href(tree.id, theme.icon)} />}
    </>
  )
}
