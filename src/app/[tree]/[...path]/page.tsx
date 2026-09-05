import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Disclaimer } from '../../../components/Disclaimer.tsx'
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
      <main>
        <NodeView node={node} address={found.address} rootId={found.tree.manifest.root} />
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
    title: title ? `${text(title, address.lang)} - ${text(tree.manifest.title, address.lang)}` : undefined,
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
