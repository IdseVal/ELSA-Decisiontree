import { forbidden, notFound } from 'next/navigation'
import { pageSession } from '../../../../../../admin/authenticated.ts'
import { editMode } from '../../../../../../admin/slots.tsx'
import { loginWords } from '../../../../../../admin/words.ts'
import { chrome, chromeLang, chromeLanguage, type Chrome } from '../../../../../../chrome.ts'
import { sheetWords } from '../../../../../../components/Bubble.tsx'
import { Disclaimer } from '../../../../../../components/Disclaimer.tsx'
import { LanguageSwitch } from '../../../../../../components/LanguageSwitch.tsx'
import { LoginPage } from '../../../../../../components/LoginPage.tsx'
import { Logo } from '../../../../../../components/Logo.tsx'
import { Sheet } from '../../../../../../components/Sheet.tsx'
import { ThemeStyle } from '../../../../../../components/ThemeStyle.tsx'
import { TreeView } from '../../../../../../components/TreeView.tsx'
import { store } from '../../../../../../config.ts'
import { Editor, SaveIndicator } from '../../../../../../editor/Editor.tsx'
import { editorLinks } from '../../../../../../editor/links.ts'
import { LogoutButton } from '../../../../../../editor/LogoutButton.tsx'
import { Panel, PanelButton, type PanelRole, type PanelWords } from '../../../../../../editor/Panel.tsx'
import { centreOf, MAX_ASIDES, type Aside, type NodePage } from '../../../../../../neighbourhood.ts'
import type { Account } from '../../../../../../store/accounts.ts'
import type { TreeEntry } from '../../../../../../store/drafts.ts'
import { isStoreError } from '../../../../../../store/errors.ts'
import type { Draft } from '../../../../../../tree/loader.ts'
import type { DraftNode } from '../../../../../../tree/types.ts'
import { adminHref, parseUrl, rootHref, type PageAddress } from '../../../../../../url.ts'

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
      words={edit.words}
      loginWords={loginWords(address.lang)}
      adminHref={adminHref('/admin', uiLang)}
      nodes={nodes}
      violations={draft.advisory.filter((violation) => violation.file in nodes)}
      tree={{ advisory: entry.advisory.length, published: entry.published, publicCopyCurrent: entry.publicCopyCurrent, servable: entry.servable }}
    >
      {/* The draft's Theme, so a colour changed in the draft is seen before publishing (13.1, ADR-133-admin-routes 6). */}
      <ThemeStyle tree={draft} />
      {/* An admin bar too: below 480 pixels it gives up the title and the current language, as #135 decided (10.6). */}
      <header className="page-chrome admin-chrome editor-chrome">
        <Logo treeId={draft.id} theme={draft.manifest.theme} title={draft.manifest.title} lang={address.lang} />
        <div className="page-controls">
          <LanguageSwitch address={address} languages={draft.manifest.languages} edit={edit} />
          <SaveIndicator words={edit.words} />
          <TopPanel entry={entry} draft={draft} address={address} caller={session.account} accounts={accounts} ui={ui} />
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

/**
 * The top panel (33): the button in the chrome bar and the Sheet it opens down the right
 * edge, drawn by `Panel` from what the page read -- the entry, the accounts, the titles the
 * to-do lines name -- and one Sheet among the page's others, so opening it closes an open
 * Overlay (10.5).
 */
function TopPanel({
  entry,
  draft,
  address,
  caller,
  accounts,
  ui,
}: {
  entry: TreeEntry
  draft: Draft
  address: PageAddress
  caller: Account
  accounts: { get(id: string): Account | null; all(): Account[]; listActive(): Pick<Account, 'id' | 'name' | 'login'>[] }
  ui: Chrome
}) {
  const role: PanelRole = caller.administrator ? 'administrator' : entry.meta.creator === caller.id ? 'creator' : 'collaborator'
  const people = [entry.meta.creator, ...entry.meta.collaborators]
  const names = Object.fromEntries(people.map((id) => [id, accounts.get(id)?.name ?? id]))
  const titles = Object.fromEntries(entry.advisory.map((violation) => [violation.file, draft.getTitle(violation.file)?.[address.lang] ?? '']))
  const words = panelWords(ui)
  // Upper case is never a Node id (tree-format.md 3.1): the one place the id goes in the address.
  const [before, after] = editorLinks().node({ ...address, trail: [], nodeId: 'NODE' }).split('NODE') as [string, string]
  const uiLang = chromeLang(address.lang)
  return (
    <Sheet
      className="panel-sheet"
      summary={
        <span lang={uiLang}>
          <PanelButton words={words} />
        </span>
      }
      pages={[
        <div key="panel" lang={uiLang}>
          <Panel
            treeId={draft.id}
            words={words}
            role={role}
            administratorId={accounts.all().find((account) => account.administrator)?.id ?? ''}
            meta={{ creator: entry.meta.creator, collaborators: entry.meta.collaborators, publishedAt: entry.meta.publishedAt }}
            publishedAt={entry.meta.publishedAt ?? null}
            advisory={entry.advisory}
            accounts={accounts.listActive()}
            names={names}
            titles={titles}
            nodeHref={{ before, after }}
            publicHref={rootHref(draft, address.lang)}
            languages={draft.manifest.languages}
            overviewHref={adminHref('/admin', chromeLanguage(address.lang))}
          />
        </div>,
      ]}
      words={sheetWords(ui)}
      uiLang={uiLang}
      cross
    />
  )
}

/** The chrome strings the panel says (33, the keys of ADR-133-top-panel's consequences). */
function panelWords(ui: Chrome): PanelWords {
  return {
    treeState: ui.treeState,
    publish: ui.publish,
    todoCount: ui.todoCount,
    todoBefore: ui.todoBefore,
    publishedAt: ui.publishedAt,
    publicLink: ui.publicLink,
    publicBehindBecause: ui.publicBehindBecause,
    notServableBecause: ui.notServableBecause,
    confirmUnpublish: ui.confirmUnpublish,
    confirm: ui.confirm,
    cancel: ui.cancel,
    removeStep: ui.removeStep,
    collaborators: ui.collaborators,
    creator: ui.creator,
    invite: ui.invite,
    cannotInvite: ui.cannotInvite,
    removeCollaborator: ui.removeCollaborator,
    chooseAccount: ui.chooseAccount,
    thisTree: ui.thisTree,
    fixed: ui.fixed,
    handOver: ui.handOver,
    handOverTo: ui.handOverTo,
    deleteTree: ui.deleteTree,
    unpublishFirst: ui.unpublishFirst,
    confirmDeleteTree: ui.confirmDeleteTree,
    published: ui.published,
    hidden: ui.hidden,
    languages: ui.languages,
    treeId: ui.treeId,
    administrator: ui.administrator,
    requestFailed: ui.requestFailed,
  }
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
