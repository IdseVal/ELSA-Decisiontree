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
import { ThemePanel, type ThemeWords } from '../../../../../../editor/ThemePanel.tsx'
import { Todo, TodoButton, type TodoWords } from '../../../../../../editor/Todo.tsx'
import { centreOf, MAX_ASIDES, type Aside, type NodePage } from '../../../../../../neighbourhood.ts'
import type { Account } from '../../../../../../store/accounts.ts'
import type { TreeEntry } from '../../../../../../store/drafts.ts'
import { isStoreError } from '../../../../../../store/errors.ts'
import { DEFAULT_COLOURS } from '../../../../../../theme.ts'
import type { Draft } from '../../../../../../tree/loader.ts'
import type { DraftNode } from '../../../../../../tree/types.ts'
import { adminHref, adminThemeHref, parseUrl, rootHref, type PageAddress } from '../../../../../../url.ts'

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
  let centre = await centreOf(draft, address)
  if (!centre) notFound()
  // **[#139]** A fresh Answer target is an explanation Node by its draft kind until it gets
  // Answers or an end (19.2), and `centreOf` would show it as an Overlay over its parent. In
  // the editor an entry is an aside only where the entry before names it as an Option; any
  // other explanation Node at the end of the path is the centre, with its up arrow (30.2).
  for (let first = centre.chain[0]; first && !centre.node.options.some((option) => option.target === first!.node.id); first = centre.chain[0]) {
    centre = { address: first.address, node: first.node, chain: centre.chain.slice(1), known: centre.known }
  }
  // The chain's addresses are the editor's, as the asides' below are: the tree view tells the
  // Overlay a URL opened by its href (10.9), and the two must agree.
  centre = { ...centre, chain: centre.chain.map((aside) => ({ ...aside, href: editorLinks().node(aside.address) })) }

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
  // **[#139]** The structure slots' needs (30): the picker's index from the title index, never
  // a Node read (30.6), and the address of every Node the page carries.
  const index = draft.nodeIds().map((id) => ({ id, title: draft.getTitle(id)?.[address.lang] ?? '' }))
  const addresses = Object.fromEntries([centre, ...centre.chain, ...asides].map((entry) => [entry.node.id, entry.address]))
  // **[#177]** Which asides another Node leads to as well, from the index's ids, never a Node read (30.7, 34.7).
  const centreId = centre.node.id
  const options = centre.node.options.map((option) => option.target)
  const shared = options.filter((target) => draft.referrers(target).some((id) => id !== centreId))
  const edit = editMode(address, draft.manifest.languages, { index, addresses, root: draft.manifest.root, centre: centreId, options, shared })
  const entry = drafts.entry(session.account, treeId)
  const nodes = Object.fromEntries([centre.node, ...centre.chain.map((aside) => aside.node), ...asides.map((aside) => aside.node)].map((node) => [node.id, node]))
  const ui = chrome(address.lang)
  const uiLang = chromeLanguage(address.lang)
  const role: PanelRole = session.account.administrator ? 'administrator' : entry.meta.creator === session.account.id ? 'creator' : 'collaborator'

  return (
    <Editor
      treeId={treeId}
      lang={address.lang}
      languages={draft.manifest.languages}
      words={edit.words}
      loginWords={loginWords(address.lang)}
      adminHref={adminHref('/admin', uiLang)}
      nodes={nodes}
      violations={draft.advisory.filter((violation) => violation.file in nodes)}
      tree={{ advisory: entry.advisory.length, published: entry.published, publicCopyCurrent: entry.publicCopyCurrent, servable: entry.servable }}
    >
      {/* The draft's Theme, so a colour changed in the draft is seen before publishing (13.1, ADR-133-admin-routes 6). */}
      <ThemeStyle tree={draft} href={adminThemeHref} revision={entry.meta.revision} />
      {/* An admin bar too: below 480 pixels it gives up the title and the current language, as #135 decided (10.6). */}
      <header className="page-chrome admin-chrome editor-chrome">
        <Logo treeId={draft.id} theme={draft.manifest.theme} title={draft.manifest.title} lang={address.lang} href={adminThemeHref} />
        <div className="page-controls">
          <LanguageSwitch address={address} languages={draft.manifest.languages} edit={edit} />
          <SaveIndicator words={edit.words} />
          <nav className="admin-nav" aria-label={ui.account} lang={chromeLang(address.lang)}>
            {/* **[#176]** The link says what it is; whose account, its description and tooltip (24.3). */}
            <a className="admin-link" href={adminHref('/admin/account', uiLang)} title={session.account.name}>
              {ui.account}
            </a>
            <LogoutButton label={ui.logout} to={adminHref('/admin', uiLang)} />
          </nav>
        </div>
      </header>
      {/* **[#176]** Out of the bar, over the page under its top right corner, and next after it in the tab order (33.1). */}
      <div className="editor-float">
        <TodoSheet entry={entry} draft={draft} address={address} role={role} ui={ui} />
        <TopPanel entry={entry} draft={draft} address={address} role={role} accounts={accounts} ui={ui} />
      </div>
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
 * The top panel (33): the button and the Sheet it opens down the right edge, drawn by `Panel`
 * from what the page read -- the entry, the accounts -- and one Sheet among the page's others,
 * so opening it closes an open Overlay (10.5). **[#176]** The button floats at the top right,
 * beside the to-do bubble's, out of the chrome bar (33.1).
 */
function TopPanel({
  entry,
  draft,
  address,
  role,
  accounts,
  ui,
}: {
  entry: TreeEntry
  draft: Draft
  address: PageAddress
  role: PanelRole
  accounts: { get(id: string): Account | null; all(): Account[]; listActive(): Pick<Account, 'id' | 'name' | 'login'>[] }
  ui: Chrome
}) {
  const people = [entry.meta.creator, ...entry.meta.collaborators]
  const names = Object.fromEntries(people.map((id) => [id, accounts.get(id)?.name ?? id]))
  const words = panelWords(ui)
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
            accounts={accounts.listActive()}
            names={names}
            publicHref={rootHref(draft, address.lang)}
            languages={draft.manifest.languages}
            lang={address.lang}
            written={entry.written}
            overviewHref={adminHref('/admin', chromeLanguage(address.lang))}
            theme={
              <ThemePanel
                treeId={draft.id}
                lang={address.lang}
                languages={draft.manifest.languages}
                words={themeWords(ui)}
                theme={draft.manifest.theme}
                defaults={DEFAULT_COLOURS}
                filesHref={adminThemeHref(draft.id, '')}
              />
            }
          />
        </div>,
      ]}
      words={sheetWords(ui)}
      uiLang={uiLang}
      cross
    />
  )
}

/**
 * **[#176]** The to-do bubble (33.3): the floating control that counts what is left to do and
 * the Sheet it opens under it, drawn by `Todo` from what the page read -- the draft's advisory
 * list and the titles its lines name.
 */
function TodoSheet({ entry, draft, address, role, ui }: { entry: TreeEntry; draft: Draft; address: PageAddress; role: PanelRole; ui: Chrome }) {
  const titles = Object.fromEntries(entry.advisory.map((violation) => [violation.file, draft.getTitle(violation.file)?.[address.lang] ?? '']))
  // Upper case is never a Node id (tree-format.md 3.1): the one place the id goes in the address.
  const [before, after] = editorLinks().node({ ...address, trail: [], nodeId: 'NODE' }).split('NODE') as [string, string]
  const words: TodoWords = {
    todoCount: ui.todoCount,
    todoCountOne: ui.todoCountOne,
    todoNone: ui.todoNone,
    todoBefore: ui.todoBefore,
    publicBehindBecause: ui.publicBehindBecause,
    notServableBecause: ui.notServableBecause,
    thisTree: ui.thisTree,
    removeStep: ui.removeStep,
    requestFailed: ui.requestFailed,
  }
  const uiLang = chromeLang(address.lang)
  return (
    <Sheet
      className="todo-sheet"
      summary={
        <span lang={uiLang}>
          <TodoButton words={words} />
        </span>
      }
      pages={[
        <div key="todo" lang={uiLang}>
          <Todo treeId={draft.id} words={words} advisory={entry.advisory} titles={titles} nodeHref={{ before, after }} manages={role !== 'collaborator'} />
        </div>,
      ]}
      words={sheetWords(ui)}
      uiLang={uiLang}
      cross
    />
  )
}

/** The chrome strings the panel says (33, the keys of ADR-133-top-panel's consequences; **[#176]** `settings` and the refusal's two). */
function panelWords(ui: Chrome): PanelWords {
  return {
    settings: ui.settings,
    publish: ui.publish,
    publishRefused: ui.publishRefused,
    showTodo: ui.showTodo,
    publishedAt: ui.publishedAt,
    publicLink: ui.publicLink,
    confirmUnpublish: ui.confirmUnpublish,
    confirm: ui.confirm,
    cancel: ui.cancel,
    collaborators: ui.collaborators,
    creator: ui.creator,
    invite: ui.invite,
    cannotInvite: ui.cannotInvite,
    removeCollaborator: ui.removeCollaborator,
    chooseAccount: ui.chooseAccount,
    thisTree: ui.thisTree,
    confirmRemoveLanguage: ui.confirmRemoveLanguage,
    addLanguage: ui.addLanguage,
    makeDefault: ui.makeDefault,
    default: ui.default,
    removeLanguage: ui.removeLanguage,
    languageHint: ui.languageHint,
    handOver: ui.handOver,
    handOverTo: ui.handOverTo,
    deleteTree: ui.deleteTree,
    unpublishFirst: ui.unpublishFirst,
    confirmDeleteTree: ui.confirmDeleteTree,
    published: ui.published,
    hidden: ui.hidden,
    notServable: ui.notServable,
    publicBehind: ui.publicBehind,
    languages: ui.languages,
    treeId: ui.treeId,
    administrator: ui.administrator,
    requestFailed: ui.requestFailed,
  }
}

/** **[#144]** The chrome strings the Theme panel says (33.8). */
function themeWords(ui: Chrome): ThemeWords {
  return {
    theme: ui.theme,
    logo: ui.logo,
    logoAlt: ui.logoAlt,
    placeholderLogoAlt: ui.placeholderLogoAlt,
    uploadLogo: ui.uploadLogo,
    replaceLogo: ui.replaceLogo,
    removeLogo: ui.removeLogo,
    colours: ui.colours,
    chooseColours: ui.chooseColours,
    defaultColours: ui.defaultColours,
    colourBackground: ui.colourBackground,
    colourSurface: ui.colourSurface,
    colourText: ui.colourText,
    colourTextMuted: ui.colourTextMuted,
    colourAccent: ui.colourAccent,
    colourAccentSecondary: ui.colourAccentSecondary,
    colourDanger: ui.colourDanger,
    colourAnswerLabel: ui.colourAnswerLabel,
    lowContrast: ui.lowContrast,
    contrastOn: ui.contrastOn,
    contrastNeeds: ui.contrastNeeds,
    fonts: ui.fonts,
    fontBody: ui.fontBody,
    fontHeading: ui.fontHeading,
    fontFamily: ui.fontFamily,
    fontLicence: ui.fontLicence,
    fontFile: ui.fontFile,
    fontWeight: ui.fontWeight,
    fontItalic: ui.fontItalic,
    addFont: ui.addFont,
    addFontFile: ui.addFontFile,
    removeFont: ui.removeFont,
    removeFontFile: ui.removeFontFile,
    fileTooLarge: ui.fileTooLarge,
    themeFileRefused: ui.themeFileRefused,
    notSaved: ui.notSaved,
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
