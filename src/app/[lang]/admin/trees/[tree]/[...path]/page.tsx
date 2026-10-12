import { forbidden, notFound } from 'next/navigation'
import { pageSession } from '../../../../../../admin/authenticated.ts'
import { editorPage } from '../../../../../../admin/editor-page.ts'
import { editMode } from '../../../../../../admin/slots.tsx'
import { loginWords } from '../../../../../../admin/words.ts'
import { chrome, chromeLang, chromeLanguage, type Chrome } from '../../../../../../chrome.ts'
import { BackToOverview } from '../../../../../../components/BackToOverview.tsx'
import { sheetWords } from '../../../../../../components/Bubble.tsx'
import { Disclaimer } from '../../../../../../components/Disclaimer.tsx'
import { LanguageSwitch } from '../../../../../../components/LanguageSwitch.tsx'
import { LoginPage } from '../../../../../../components/LoginPage.tsx'
import { Logo } from '../../../../../../components/Logo.tsx'
import { Sheet } from '../../../../../../components/Sheet.tsx'
import { ThemeStyle } from '../../../../../../components/ThemeStyle.tsx'
import { TreeView } from '../../../../../../components/TreeView.tsx'
import { Uneditable } from '../../../../../../components/Uneditable.tsx'
import { store } from '../../../../../../config.ts'
import { Editor, SaveIndicator } from '../../../../../../editor/Editor.tsx'
import { editorLinks, previewLinks } from '../../../../../../editor/links.ts'
import { LogoutButton } from '../../../../../../editor/LogoutButton.tsx'
import { Panel, PanelButton, type PanelRole, type PanelWords } from '../../../../../../editor/Panel.tsx'
import { PreviewButton } from '../../../../../../editor/PreviewButton.tsx'
import { ThemePanel, type ThemeWords } from '../../../../../../editor/ThemePanel.tsx'
import { FONT_LIBRARY, FONT_LICENCES, libraryEntry } from '../../../../../../fonts.ts'
import { Todo, TodoButton, type TodoWords } from '../../../../../../editor/Todo.tsx'
import type { Account } from '../../../../../../store/accounts.ts'
import type { TreeEntry } from '../../../../../../store/drafts.ts'
import { isStoreError } from '../../../../../../store/errors.ts'
import { DEFAULT_COLOURS } from '../../../../../../theme.ts'
import type { Draft } from '../../../../../../tree/loader.ts'
import { adminHref, adminThemeHref, parseUrl, rootHref, type PageAddress } from '../../../../../../url.ts'

export const dynamic = 'force-dynamic'

/**
 * The editor, `/admin/trees/<tree-id>/<...trail>/<node-id>` (docs/specs/application.md 24.1,
 * 28, 34.7): the public grammar of 4.1 behind `/admin/trees`, rendering the draft's Node
 * through the public components in edit mode. `authenticated → permit('read') →
 * store.drafts.draft → parseUrl → centreOf → the asides by id → TreeView`, at most twelve
 * Nodes: the centre and its chain, its Option targets, the titles of its Answer targets from
 * the index. `neighbourhood()` is not called: nothing is placed and nothing slides (34.5).
 * **[#234]** It places the parent and the centre's next steps through `editorNeighbours`, and a
 * next step's button and the up arrow slide, within eighteen Nodes (`editorPage`, 42.8).
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
  // **[#234]** The centre, its chain, its asides and the frames of its parent and next steps (42.8).
  const page = await editorPage(draft, address)
  if (!page) notFound()
  const { centre } = page
  const { asides } = page.neighbours
  // **[#139]** The structure slots' needs (30): the address of every Node the page carries.
  const addresses = Object.fromEntries([centre, ...centre.chain, ...asides].map((entry) => [entry.node.id, entry.address]))
  // **[#177]** Which asides another Node leads to as well, from the index's ids, never a Node read (30.7, 34.7).
  const centreId = centre.node.id
  const options = centre.node.options.map((option) => option.target)
  const shared = options.filter((target) => draft.referrers(target).some((id) => id !== centreId))
  // **[#178]** The asides' titles, which their delete names, from the Nodes read above: the
  // picker's index of every Node of the draft is gone with the picker (30.6, amended).
  const titles = Object.fromEntries(asides.map((aside) => [aside.node.id, aside.node.title[address.lang] ?? '']))
  const edit = editMode(address, draft.manifest.languages, { addresses, root: draft.manifest.root, centre: centreId, options, shared, titles })
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
      revision={entry.meta.revision}
      violations={draft.advisory.filter((violation) => violation.file in nodes)}
      tree={{ advisory: entry.advisory.length, published: entry.published, publicCopyCurrent: entry.publicCopyCurrent, servable: entry.servable }}
    >
      {/*
        The draft's Theme, so a colour changed in the draft is seen before publishing (13.1,
        ADR-133-admin-routes 6); **[#180]** on the Tree, while the bar, the floating controls and
        every editor Sheet -- what carries `data-editor-ui` -- keep the default look (24.3).
      */}
      <ThemeStyle tree={draft} href={adminThemeHref} revision={entry.meta.revision} editor />
      {/* An admin bar too: below 480 pixels it gives up the title and the current language, as #135 decided (10.6). */}
      <header className="page-chrome admin-chrome editor-chrome" data-editor-ui="">
        {/* **[#203]** The way out, as on the Node page: here to the creators' overview, where the Trees a creator edits are. */}
        <div className="page-brand">
          <BackToOverview href={adminHref('/admin', uiLang)} lang={address.lang} />
          {/* **[#180]** The Tree's logo on the default's bar: the variant for that bar's background, not the draft's (13.1). */}
          <Logo treeId={draft.id} theme={draft.manifest.theme && { ...draft.manifest.theme, colours: undefined }} title={draft.manifest.title} lang={address.lang} href={adminThemeHref} />
        </div>
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
      {/* **[#205]** On a hidden Tree, under the bar at its top left and first after it in the tab order (40.5). */}
      <PreviewButton href={previewLinks().node(address)} word={ui.preview} uiLang={chromeLang(address.lang)} />
      {/* **[#176]** Out of the bar, over the page under its top right corner, and next after it in the tab order (33.1). */}
      <div className="editor-float" data-editor-ui="">
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
  accounts: { get(id: string): Account | null; all(): Account[]; listActive(): Pick<Account, 'id' | 'name'>[] }
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
                library={FONT_LIBRARY.map((family) => ({ id: family.id, entry: libraryEntry(family, 'body') }))}
                licences={FONT_LICENCES}
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
    languageTag: ui.languageTag,
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

/** **[#144]** The chrome strings the Theme panel says (33.8); **[#180]** the dropdowns' and the hints' too (37). */
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
    hint: ui.hint,
    fontDefault: ui.fontDefault,
    fontSameAsBody: ui.fontSameAsBody,
    fontLibraryGroup: ui.fontLibraryGroup,
    fontOwnGroup: ui.fontOwnGroup,
    fontUpload: ui.fontUpload,
    fontNameTaken: ui.fontNameTaken,
    licenceOther: ui.licenceOther,
    placeholderFontFamily: ui.placeholderFontFamily,
    colourBackgroundHint: ui.colourBackgroundHint,
    colourSurfaceHint: ui.colourSurfaceHint,
    colourTextHint: ui.colourTextHint,
    colourTextMutedHint: ui.colourTextMutedHint,
    colourAccentHint: ui.colourAccentHint,
    colourAccentSecondaryHint: ui.colourAccentSecondaryHint,
    colourDangerHint: ui.colourDangerHint,
    contrastHint: ui.contrastHint,
    logoAltHint: ui.logoAltHint,
    fontBodyHint: ui.fontBodyHint,
    fontHeadingHint: ui.fontHeadingHint,
    fontLicenceHint: ui.fontLicenceHint,
    licenceOtherHint: ui.licenceOtherHint,
    fontFileHint: ui.fontFileHint,
  }
}
