import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { chrome, chromeLanguage } from '../../chrome.ts'
import { Disclaimer } from '../../components/Disclaimer.tsx'
import { ChromeLanguageSwitch } from '../../components/LanguageSwitch.tsx'
import { Overview } from '../../components/Overview.tsx'
import { ThemeStyle } from '../../components/ThemeStyle.tsx'
import { baseUrl, store } from '../../config.ts'
import { overviewAddressSet, overviewHref } from '../../url.ts'

/**
 * Rendered per request: which Trees are published is the store's, and changes without a
 * build (docs/specs/application.md 18.2).
 */
export const dynamic = 'force-dynamic'

/**
 * **[#134]** The overview, `/` (docs/specs/application.md 23.2, 26.1 to 26.3): one tile per
 * served Tree in id order, in the chrome language the page asks for, in the default Theme.
 * It no longer redirects to a Tree (18.1).
 */
export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const lang = chromeLanguage((await params).lang)
  const served = await store()
  const trees = served.publishedIds().map((id) => served.published(id)!)
  return (
    <>
      <ThemeStyle tree={null} />
      <header className="page-chrome">
        <h1 className="tree-title site-title" id="site-title">
          {chrome(lang).siteTitle}
        </h1>
        <div className="page-controls">
          <ChromeLanguageSwitch lang={lang} href={overviewHref} />
        </div>
      </header>
      <main className="overview-page">
        <Overview trees={trees} lang={lang} />
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
