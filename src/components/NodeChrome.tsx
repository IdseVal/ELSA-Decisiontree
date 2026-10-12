/**
 * **[#205]** The chrome bar of a Node page (docs/specs/application.md 10.1, 24.3, 40.4;
 * ADR-205-preview-bar), one component for the two pages that draw it: the public Node page and
 * the preview of a hidden Tree. At its left #163's arrow to an overview and the Tree's mark,
 * between them and the controls the mention of its Authors (39.4), and at its right the language
 * switch -- then, on the public page alone, the share button and #204's "Editor".
 *
 * The bar sits in the page rather than in the root layout, for the reason the Disclaimer does:
 * the layout is given its own `[lang]` segment and nothing else, and a link to this page in
 * another language is built from the whole address -- this Trail, this Node.
 */
import { chrome, chromeLang } from '../chrome.ts'
import type { EditMode } from '../editor/mode.ts'
import type { ThemeHref } from '../theme.ts'
import type { Readable } from '../tree/loader.ts'
import type { PageAddress } from '../url.ts'
import { Authors } from './Authors.tsx'
import { BackToOverview } from './BackToOverview.tsx'
import { LanguageSwitch } from './LanguageSwitch.tsx'
import { Logo } from './Logo.tsx'
import { ShareButton, type ShareWords } from './ShareButton.tsx'
import { ToEditor } from './ToEditor.tsx'

export function NodeChrome({
  tree,
  address,
  authors,
  overview,
  shareAndEditor,
  edit,
  themeHref,
}: {
  tree: Pick<Readable, 'id' | 'manifest'>
  address: PageAddress
  /** The Authors' names in the order they joined the Tree (39.3); none draws no mention. */
  authors: string[]
  /** Where the arrow leads: the public overview, or from the preview the creators' at `/admin` (40.4). */
  overview: string
  /**
   * Whether the share button and "Editor" stand at the right. Not in the preview: the share
   * button would copy an admin address, and "Editor" leads to `/admin`, where the arrow leads (40.4).
   */
  shareAndEditor: boolean
  /** The preview's setting (40.2): the language switch links through its `links`. */
  edit?: EditMode
  /** How the logo's file is addressed: the preview's draft through the admin route (40.3). */
  themeHref?: ThemeHref
}) {
  const lang = address.lang
  return (
    <header className="page-chrome node-chrome">
      <div className="page-brand">
        <BackToOverview href={overview} lang={lang} />
        <Logo treeId={tree.id} theme={tree.manifest.theme} title={tree.manifest.title} lang={lang} href={themeHref} />
      </div>
      <Authors names={authors} lang={lang} />
      <div className="page-controls">
        <LanguageSwitch address={address} languages={tree.manifest.languages} edit={edit} />
        {shareAndEditor && (
          <>
            <ShareButton ui={shareWords(lang)} uiLang={chromeLang(lang)} />
            <ToEditor lang={lang} />
          </>
        )}
      </div>
    </header>
  )
}

/** What the share button says, in the chrome language of the page. */
function shareWords(lang: string): ShareWords {
  const { share, copied, copyFailed } = chrome(lang)
  return { share, copied, copyFailed }
}
