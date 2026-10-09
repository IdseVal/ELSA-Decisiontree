import { pageSession } from '../../../admin/authenticated.ts'
import { chrome, chromeLanguage } from '../../../chrome.ts'
import { AdminChrome } from '../../../components/AdminChrome.tsx'
import { Disclaimer } from '../../../components/Disclaimer.tsx'
import { LoginPage } from '../../../components/LoginPage.tsx'
import { Overview } from '../../../components/Overview.tsx'
import type { TileState } from '../../../components/Tile.tsx'
import { ThemeStyle } from '../../../components/ThemeStyle.tsx'
import { store } from '../../../config.ts'
import { authorsOf } from '../../../store/authors.ts'
import type { TreeEntry } from '../../../store/drafts.ts'
import { adminHref, editorRootHref } from '../../../url.ts'

export const dynamic = 'force-dynamic'

/**
 * `/admin` (docs/specs/application.md 24.1, 26.4): the login page without a session, the
 * creators' overview with one. **[#137]** The + tile first; then the Trees the caller has a
 * role on -- every Tree for the administrator -- published or hidden, each leading to its
 * editor; then every other published Tree, leading to its public page. Each group in `id`
 * order, each tile with its state mark. **[#197]** And with its Tree's Authors (39.5): from the
 * roles of a Tree the caller has one on, a hidden one's included, and otherwise as `/` has them
 * (39.3). **[#204]** In both states the bar carries `website`, back to the public overview (24.3).
 */
export default async function AdminHome({ params }: { params: Promise<{ lang: string }> }) {
  const lang = chromeLanguage((await params).lang)
  const session = await pageSession()
  if (!session) return <LoginPage lang={lang} website />
  const served = await store()
  const own = served.drafts.list(session.account).sort((a, b) => (a.id < b.id ? -1 : 1))
  const ownIds = new Set(own.map((entry) => entry.id))
  const others = served.publishedIds().filter((id) => !ownIds.has(id))
  const tiles = [
    ...own.map((entry) => ({
      tree: entry,
      // An uneditable draft has no manifest to name its root: the Tree's address redirects there (24.1).
      href: entry.manifest ? editorRootHref({ id: entry.id, manifest: entry.manifest }, lang) : `/admin/trees/${entry.id}`,
      state: stateOf(entry),
      authors: authorsOf(entry.meta, served.accounts),
    })),
    ...others.map((id) => ({ tree: served.published(id)!, state: 'published' as const, authors: served.authors(id) })),
  ]
  return (
    <>
      <ThemeStyle tree={null} />
      <AdminChrome lang={lang} account={session.account} website />
      <main className="overview-page">
        {/* **[#213]** The logout button above is a request the script makes (24.2). */}
        <noscript>
          <p className="admin-note">{chrome(lang).needsJavaScript}</p>
        </noscript>
        {/* The grid's box is labelled by the page's heading, as on the public overview. */}
        <h1 hidden id="site-title">
          {chrome(lang).siteTitle}
        </h1>
        <Overview tiles={tiles} lang={lang} newTreeHref={adminHref('/admin/new', lang)} />
      </main>
      <Disclaimer lang={lang} />
    </>
  )
}

/** 26.4's mark: a published Tree the public routes do not serve is `notServable` (18.3). */
function stateOf(entry: TreeEntry): TileState {
  if (!entry.published) return 'hidden'
  return entry.servable ? 'published' : 'notServable'
}
