import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { chrome, chromeLanguage } from '../../chrome.ts'
import { Disclaimer } from '../../components/Disclaimer.tsx'
import { ChromeLanguageSwitch } from '../../components/LanguageSwitch.tsx'
import { Overview } from '../../components/Overview.tsx'
import { ThemeStyle } from '../../components/ThemeStyle.tsx'
import { ToEditor } from '../../components/ToEditor.tsx'
import { baseUrl, store } from '../../config.ts'
import { chosenTags, TAG_PARAMETER, tagOptions, treeTagKeys } from '../../tags.ts'
import { contentLanguage, overviewAddressSet, overviewHref } from '../../url.ts'

/**
 * Rendered per request: which Trees are published is the store's, and changes without a
 * build (docs/specs/application.md 18.2).
 */
export const dynamic = 'force-dynamic'

/**
 * **[#134]** The overview, `/` (docs/specs/application.md 23.2, 26.1 to 26.3): one tile per
 * served Tree in id order, in the chrome language the page asks for, in the default Theme.
 * It no longer redirects to a Tree (18.1). **[#197]** Each tile names its Tree's Authors (39.5).
 * **[#204]** "Editor" at the right end of the bar leads to `/admin` (24.3).
 * **[#272]** A search bar above the tiles narrows them; `?q` is its text, sent by the field's form
 * when the page runs without its script (26.5).
 * **[#273]** The search bar's `tags` pill lists every tag of the served Trees -- a hidden Tree's are
 * in no list, since it serves nothing -- and a choice in the query's `tag` narrows the tiles too (26.6).
 */
export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const lang = chromeLanguage((await params).lang)
  const { q, [TAG_PARAMETER]: requested = [] } = await searchParams
  const served = await store()
  const trees = served.publishedIds().map((id) => served.published(id)!)
  const tagged = trees.map((tree) => ({ tree, tags: tree.manifest.tags, shown: contentLanguage(tree, lang) }))
  const options = tagOptions(tagged, lang)
  return (
    <>
      <ThemeStyle tree={null} />
      <header className="page-chrome">
        <h1 className="tree-title site-title" id="site-title">
          {chrome(lang).siteTitle}
        </h1>
        <div className="page-controls">
          <ChromeLanguageSwitch lang={lang} href={overviewHref} />
          <ToEditor lang={lang} />
        </div>
      </header>
      <main className="overview-page">
        <Overview
          tiles={tagged.map(({ tree, tags, shown }) => ({ tree, authors: served.authors(tree.id), tags: treeTagKeys(tags, shown) }))}
          lang={lang}
          query={typeof q === 'string' ? q : ''}
          tags={{ options, chosen: chosenTags(typeof requested === 'string' ? [requested] : requested, options) }}
        />
      </main>
      <Disclaimer lang={lang} />
    </>
  )
}

/**
 * The overview's head (23.2): its title and description are chrome, its canonical link is
 * its own address in the page's chrome language, and its `hreflang` set relates the two
 * chrome languages. No Tree content but the titles on the tiles; no JSON-LD this round.
 */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = chromeLanguage((await params).lang)
  const ui = chrome(lang)
  const base = baseUrl(await headers())
  const { addresses, alternates } = overviewAddressSet(base)
  return {
    metadataBase: base,
    title: ui.siteTitle,
    description: ui.siteDescription,
    alternates: {
      canonical: addresses.find((address) => address.lang === lang)?.url,
      languages: Object.fromEntries(alternates.map(({ hreflang, url }) => [hreflang, url])),
    },
  }
}
