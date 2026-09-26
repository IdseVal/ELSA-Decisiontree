import { forbidden, notFound } from 'next/navigation'
import { pageSession } from '../../../../../../admin/authenticated.ts'
import { editMode, editorWords } from '../../../../../../admin/slots.tsx'
import { loginWords } from '../../../../../../admin/words.ts'
import { chrome, chromeLang, chromeLanguage } from '../../../../../../chrome.ts'
import { Disclaimer } from '../../../../../../components/Disclaimer.tsx'
import { LanguageSwitch } from '../../../../../../components/LanguageSwitch.tsx'
import { LoginPage } from '../../../../../../components/LoginPage.tsx'
import { Logo } from '../../../../../../components/Logo.tsx'
import { ThemeStyle } from '../../../../../../components/ThemeStyle.tsx'
import { TreeView } from '../../../../../../components/TreeView.tsx'
import { store } from '../../../../../../config.ts'
import { Editor, SaveIndicator } from '../../../../../../editor/Editor.tsx'
import { editorLinks } from '../../../../../../editor/links.ts'
import { LogoutButton } from '../../../../../../editor/LogoutButton.tsx'
import { centreOf, MAX_ASIDES, type Aside, type NodePage } from '../../../../../../neighbourhood.ts'
import { isStoreError } from '../../../../../../store/errors.ts'
import type { Draft } from '../../../../../../tree/loader.ts'
import type { DraftNode } from '../../../../../../tree/types.ts'
import { adminHref, parseUrl } from '../../../../../../url.ts'

export const dynamic = 'force-dynamic'

/**
 * The editor, `/admin/trees/<tree-id>/<...trail>/<node-id>` (docs/specs/application.md 24.1,
 * 28, 34.7): the public grammar of 4.1 behind `/admin/trees`, rendering the draft's Node
 * through the public components in edit mode. `authenticated → permit('read') →
 * store.drafts.draft → parseUrl → centreOf → the asides by id → TreeView`, at most twelve
 * Nodes: the centre and its chain, its Option targets, the titles of its Answer targets from
 * the index. `neighbourhood()` is not called: nothing is placed and nothing slides (34.5).
 *
 * Without a session the login page, at this address (24.2); without a role on the Tree the
 * 403 page; an uneditable Tree (19.5) shows its blocking violations where the Bubble would be.
 */
interface Props {
  params: Promise<{ lang: string; tree: string; path: string[] }>
}

export default async function EditorPage({ params }: Props) {
  const { lang: segment, tree: treeId, path } = await params
  const session = await pageSession()
  if (!session) return <LoginPage lang={chromeLanguage(segment)} />
  const { drafts } = await store()
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
  const centre = await centreOf(draft, address)
  if (!centre) notFound()

  // The centre's Option targets, for their Overlays (10.9): at most eight, read by id.
  const asides: Aside<DraftNode>[] = []
  for (const option of centre.node.options.slice(0, MAX_ASIDES)) {
    const target = await draft.getNode(option.target)
    if (!target) continue
    const ids = [...centre.address.trail, centre.address.nodeId, option.target]
    const at = { ...centre.address, trail: ids.slice(0, -1), nodeId: option.target }
    asides.push({ node: target, href: editorLinks().node(at), address: at })
  }
  const page: NodePage<DraftNode> = { address, centre, neighbours: { placed: [], asides } }
  const edit = editMode(address, draft.manifest.languages)
  const entry = drafts.entry(session.account, treeId)
  const nodes = Object.fromEntries([centre.node, ...centre.chain.map((aside) => aside.node), ...asides.map((aside) => aside.node)].map((node) => [node.id, node]))
  const ui = chrome(address.lang)
  const uiLang = chromeLanguage(address.lang)

  return (
    <Editor
      treeId={treeId}
      lang={address.lang}
      words={editorWords(address.lang)}
      loginWords={loginWords(address.lang)}
      adminHref={adminHref('/admin', uiLang)}
      nodes={nodes}
      violations={draft.advisory.filter((violation) => violation.file in nodes)}
      published={entry.published}
      publicCopyCurrent={entry.publicCopyCurrent}
    >
      {/* The draft's Theme, so a colour changed in the draft is seen before publishing (13.1, ADR-133-admin-routes 6). */}
      <ThemeStyle tree={draft} />
      <header className="page-chrome editor-chrome">
        <Logo treeId={draft.id} theme={draft.manifest.theme} title={draft.manifest.title} lang={address.lang} />
        <div className="page-controls">
          <LanguageSwitch address={address} languages={draft.manifest.languages} edit={edit} />
          <SaveIndicator words={edit.words} />
          <nav className="admin-nav" aria-label={ui.account} lang={chromeLang(address.lang)}>
            <a className="admin-link" href={adminHref('/admin/account', uiLang)} data-clamp="">
              {session.account.name}
            </a>
            <LogoutButton label={ui.logout} to={adminHref('/admin', uiLang)} />
          </nav>
        </div>
      </header>
      <main>
        <noscript>
          <p className="admin-note">{ui.needsJavaScript}</p>
        </noscript>
        <TreeView page={page} tree={draft} edit={edit} />
      </main>
      <Disclaimer lang={address.lang} />
    </Editor>
  )
}

/** An uneditable Tree (19.5): the blocking violations of its hand-edited draft, and the way out. */
function Uneditable({ lang, messages }: { lang: 'en' | 'nl'; messages: string[] }) {
  const ui = chrome(lang)
  return (
    <>
      <ThemeStyle tree={null} />
      <main className="admin-page admin-page--centred" lang={lang}>
        <section className="admin-card" aria-labelledby="uneditable">
          <h1 id="uneditable">{ui.notEditable}</h1>
          <ul className="admin-note">
            {messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
          <a className="admin-submit admin-submit--link" href={adminHref('/admin', lang)}>
            {ui.toOverview}
          </a>
        </section>
      </main>
      <Disclaimer lang={lang} />
    </>
  )
}
