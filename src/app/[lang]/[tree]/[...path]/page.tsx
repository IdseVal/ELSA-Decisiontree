import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { chrome, chromeLang, text } from '../../../../chrome.ts'
import { Disclaimer } from '../../../../components/Disclaimer.tsx'
import { LanguageSwitch } from '../../../../components/LanguageSwitch.tsx'
import { Logo } from '../../../../components/Logo.tsx'
import { ShareButton, type ShareWords } from '../../../../components/ShareButton.tsx'
import { TreeView } from '../../../../components/TreeView.tsx'
import { baseUrl, servedTree } from '../../../../config.ts'
import { plainDescription } from '../../../../markdown.ts'
import { loadPage } from '../../../../neighbourhood.ts'
import type { Tree } from '../../../../tree/loader.ts'
import { addressSet, parseUrl, type PageAddress } from '../../../../url.ts'

/**
 * The Node page, `/<tree-id>/<...trail>/<node-id>` (docs/specs/application.md 4.1). The
 * route parses the address, reads the centre the path names with its aside chain and its
 * neighbourhood -- at most seventeen Nodes (10.9, 11.2) -- and hands them to the tree view
 * with the Tree's index; everything else about how a Node looks is in `src/components/`.
 */
interface Props {
  params: Promise<{ lang: string; tree: string; path: string[] }>
}

export default async function NodePage(props: Props) {
  const found = await addressOf(props)
  if (!found) notFound()
  const page = await loadPage(found.tree, found.address)
  if (!page) notFound()

  return (
    <>
      {/*
        The page chrome. It sits in the page rather than in the root layout, where
        docs/specs/application.md section 6 sketches it, for the reason the Disclaimer does:
        the layout is given its own `[lang]` segment and nothing else, and a link to this
        page in another language is built from the whole address -- this Trail, this Node.
      */}
      <header className="page-chrome">
        <Logo
          theme={found.tree.manifest.theme}
          title={found.tree.manifest.title}
          lang={found.address.lang}
        />
        <div className="page-controls">
          <LanguageSwitch address={found.address} languages={found.tree.manifest.languages} />
          <ShareButton ui={shareWords(found.address.lang)} uiLang={chromeLang(found.address.lang)} />
        </div>
      </header>
      <main>
        <TreeView page={page} tree={found.tree} />
      </main>
      <Disclaimer lang={found.address.lang} />
    </>
  )
}

/** What the share button says, in the chrome language of the page. */
function shareWords(lang: string): ShareWords {
  const { share, copied, copyFailed } = chrome(lang)
  return { share, copied, copyFailed }
}

/**
 * The head of a Node page: the title, the canonical link (4.1), the `hreflang` links and
 * the description meta tag (**[#118]** 16.3). The Node's title comes from the loader's
 * in-memory index and its description from the Node itself, so describing the page reads
 * no file.
 *
 * All four addresses come from one call to `addressSet`, which is the decision of 16.3:
 * the sitemap renders the same call, and a page's `hreflang` set and the sitemap's entries
 * are read as one graph that a search engine drops entirely when the two disagree.
 *
 * The base is read here, per request, rather than baked into the build, because where the
 * app is reached is a run-time setting like the Tree it serves: `ELSA_BASE_URL` when the
 * deployment names one, and otherwise this request's own origin (16).
 */
export async function generateMetadata(props: Props): Promise<Metadata> {
  const found = await addressOf(props)
  if (!found) return {}
  const { tree, address } = found
  const base = baseUrl(await headers())
  const { addresses, alternates } = addressSet(tree, address.nodeId, base)
  const title = tree.getTitle(address.nodeId)
  const node = await tree.getNode(address.nodeId)
  const description = node?.description[address.lang]
  return {
    metadataBase: base,
    title: title
      ? `${text(title, address.lang, `${address.nodeId}.title`)} - ${text(tree.manifest.title, address.lang, 'tree.title')}`
      : undefined,
    description: description ? plainDescription(description).cut : undefined,
    alternates: {
      canonical: addresses.find((entry) => entry.lang === address.lang)?.url,
      languages: Object.fromEntries(alternates.map(({ hreflang, url }) => [hreflang, url])),
    },
  }
}

/**
 * The served Tree and the address the request names, or null for every 404 case of 4.3.
 * The language is the `[lang]` segment, the one place it is read from (4.4, section 6).
 */
async function addressOf(props: Props): Promise<{ tree: Tree; address: PageAddress } | null> {
  const { lang, tree: treeId, path } = await props.params
  const tree = await servedTree()
  const address = parseUrl(`/${[treeId, ...path].join('/')}`, lang, tree)
  return address && { tree, address }
}
