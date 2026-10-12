import type { Metadata } from 'next'
import { forbidden, notFound, redirect } from 'next/navigation'
import { pageSession } from '../../../../../../admin/authenticated.ts'
import { previewDraft, previewMode, previewPage } from '../../../../../../admin/preview.ts'
import { chrome, chromeLang, chromeLanguage } from '../../../../../../chrome.ts'
import { Disclaimer } from '../../../../../../components/Disclaimer.tsx'
import { LoginPage } from '../../../../../../components/LoginPage.tsx'
import { NodeChrome } from '../../../../../../components/NodeChrome.tsx'
import { ThemeStyle } from '../../../../../../components/ThemeStyle.tsx'
import { TreeView } from '../../../../../../components/TreeView.tsx'
import { Uneditable } from '../../../../../../components/Uneditable.tsx'
import { store } from '../../../../../../config.ts'
import { editorLinks } from '../../../../../../editor/links.ts'
import { authorsOf } from '../../../../../../store/authors.ts'
import { isStoreError } from '../../../../../../store/errors.ts'
import type { Draft } from '../../../../../../tree/loader.ts'
import { adminHref, adminThemeHref, parseUrl } from '../../../../../../url.ts'

export const dynamic = 'force-dynamic'

/**
 * **[#205]** The preview of a hidden Tree, `/admin/preview/<tree-id>/<...trail>/<node-id>`
 * (docs/specs/application.md 40; ADR-205-preview-address, ADR-205-preview-drawing): the draft as
 * its readers will see it once it is published -- the public components with the preview's
 * setting and no slot, the neighbour frames and the slide within seventeen Nodes, the draft's
 * Theme on the whole page, the public Node page's bar without its share button and "Editor", a
 * placeholder wherever the draft has no text yet -- and "Back to the editor" under the bar at the
 * top left, to the editor of the step and the language on screen.
 *
 * `authenticated → permit('read') → store.drafts.draft → parseUrl → 307 if published → centreOf →
 * draftCentre → neighbourhood → TreeView`: the editor's answers without a session, without a role,
 * for an unknown id, a path not in the draft and an uneditable Tree (24.2); a Tree published since
 * is a 307 to its editor at the same path and `?lang`. No public route reads a draft (23.1), and
 * the page needs no script: its markup is the public page's (14).
 */
interface Props {
  params: Promise<{ lang: string; tree: string; path: string[] }>
}

export default async function PreviewPage({ params }: Props) {
  const { lang: segment, tree: treeId, path } = await params
  const session = await pageSession()
  if (!session) return <LoginPage lang={chromeLanguage(segment)} />
  const { drafts, accounts } = await store()
  let draft: Draft
  try {
    drafts.permitted(session.account, treeId, 'read')
    draft = drafts.draft(session.account, treeId)
  } catch (error) {
    if (!isStoreError(error)) throw error
    if (error.status === 403) forbidden()
    if (error.status === 404) notFound()
    return <Uneditable lang={chromeLanguage(segment)} messages={error.violations.map((v) => `${v.file} ${v.keyPath} ${v.rule}: ${v.message}`)} />
  }
  const address = parseUrl(`/${[treeId, ...path].join('/')}`, segment, draft)
  if (!address) notFound()
  const entry = drafts.entry(session.account, treeId)
  // A published Tree's readers' view is its public page; its editor is where its creator was (40.1).
  if (entry.published) redirect(editorLinks().node(address))

  const shown = previewDraft(draft, address.lang)
  const page = await previewPage(shown, address)
  if (!page) notFound()
  const edit = previewMode(address, draft.manifest.languages)
  const ui = chrome(address.lang)

  return (
    <>
      {/* The draft's Theme on the whole page, as a public page has its Tree's; the way back alone keeps the default look (40.3). */}
      <ThemeStyle tree={shown} href={adminThemeHref} editor />
      <NodeChrome
        tree={shown}
        address={address}
        authors={authorsOf(entry.meta, accounts)}
        overview={adminHref('/admin', chromeLanguage(address.lang))}
        shareAndEditor={false}
        edit={edit}
        themeHref={adminThemeHref}
      />
      {/* "In the same place" as the preview button, and first after the bar in the tab order (40.5, 40.6). */}
      <a className="preview-back" href={editorLinks().node(address)} aria-label={ui.backToEditor} title={ui.backToEditor} lang={chromeLang(address.lang)} data-editor-ui="">
        {/* A pencil, from the lower left to the upper right. */}
        <svg className="float-icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M2.5 13.5l.7-3.1 7.6-7.6a1.4 1.4 0 0 1 2 0l.4.4a1.4 1.4 0 0 1 0 2l-7.6 7.6-3.1.7Z" />
          <path d="M9.6 4l2.4 2.4" />
        </svg>
        <span className="float-words">{ui.backToEditor}</span>
      </a>
      <main>
        <TreeView page={page} tree={shown} edit={edit} />
      </main>
      <Disclaimer lang={address.lang} />
    </>
  )
}

/**
 * The head (40.3): the public Node page's `<title>`, the step's title and the Tree's, a
 * placeholder standing in where the draft has none -- and nothing else of that page's head: no
 * crawler reads this page, and its canonical, `hreflang` and dataset links would name public
 * addresses that answer 404 while the Tree is hidden. `noindex` is the admin layout's.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang: segment, tree: treeId, path } = await params
  const session = await pageSession()
  if (!session) return {}
  const { drafts } = await store()
  let draft: Draft
  try {
    drafts.permitted(session.account, treeId, 'read')
    draft = drafts.draft(session.account, treeId)
  } catch {
    // The page answers the refusal itself; the head keeps the admin layout's.
    return {}
  }
  const address = parseUrl(`/${[treeId, ...path].join('/')}`, segment, draft)
  if (!address) return {}
  const shown = previewDraft(draft, address.lang)
  return { title: `${shown.getTitle(address.nodeId)![address.lang]} - ${shown.manifest.title[address.lang]}` }
}
