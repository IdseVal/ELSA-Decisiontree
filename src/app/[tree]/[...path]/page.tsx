import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Disclaimer } from '../../../components/Disclaimer.tsx'
import { LanguageSwitch } from '../../../components/LanguageSwitch.tsx'
import { NodeView, text } from '../../../components/NodeView.tsx'
import { servedTree } from '../../../config.ts'
import type { Tree } from '../../../tree/loader.ts'
import { canonicalHref, parseUrl, type PageAddress } from '../../../url.ts'

/**
 * The Node page, `/<tree-id>/<...trail>/<node-id>` (docs/specs/application.md 4.1). The
 * route parses the address, reads exactly one Node file and hands both to the view;
 * everything else about how a Node looks is in `src/components/`.
 */
interface Props {
  params: Promise<{ tree: string; path: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function NodePage(props: Props) {
  const found = await addressOf(props)
  if (!found) notFound()
  const node = await found.tree.getNode(found.address.nodeId)
  if (!node) notFound()

  return (
    <>
      {/*
        The page chrome. It sits in the page rather than in `src/app/layout.tsx`, where
        docs/specs/application.md section 6 sketches it, for the reason the Disclaimer does:
        the content language is in the query string and a Next.js layout is not given
        `searchParams`. The `[lang]` route segment of ADR-19 that settles this is issue #20.
      */}
      <header className="page-chrome">
        <LanguageSwitch address={found.address} languages={found.tree.manifest.languages} />
      </header>
      <main>
        <NodeView
          node={node}
          address={found.address}
          rootId={found.tree.manifest.root}
          // From the in-memory index, so the Trail costs no second file read (5.1). Every
          // id is there: `parseUrl` accepted the address only because the index knew them.
          trailTitles={found.address.trail.map((id) => found.tree.getTitle(id)!)}
        />
      </main>
      <Disclaimer lang={found.address.lang} />
    </>
  )
}

/**
 * The page title and the canonical link (4.1). The Node's title comes from the loader's
 * in-memory index, so describing the page costs no second read of the Node file.
 */
export async function generateMetadata(props: Props): Promise<Metadata> {
  const found = await addressOf(props)
  if (!found) return {}
  const { tree, address } = found
  const title = tree.getTitle(address.nodeId)
  return {
    title: title
      ? `${text(title, address.lang, `${address.nodeId}.title`)} - ${text(tree.manifest.title, address.lang, 'tree.title')}`
      : undefined,
    alternates: { canonical: canonicalHref(address) },
  }
}

/** The served Tree and the address the request names, or null for every 404 case of 4.3. */
async function addressOf(props: Props): Promise<{ tree: Tree; address: PageAddress } | null> {
  const [{ tree: treeId, path }, searchParams] = await Promise.all([props.params, props.searchParams])
  const tree = await servedTree()
  const address = parseUrl(`/${[treeId, ...path].join('/')}`, query(searchParams), tree)
  return address && { tree, address }
}

/** The request's query as the standard type `parseUrl` reads; a repeated key keeps its first value. */
function query(searchParams: Record<string, string | string[] | undefined>): URLSearchParams {
  const parameters = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    const first = Array.isArray(value) ? value[0] : value
    if (first !== undefined) parameters.set(key, first)
  }
  return parameters
}
