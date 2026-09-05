import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Disclaimer } from '../../../../components/Disclaimer.tsx'
import { NodeView, text } from '../../../../components/NodeView.tsx'
import { servedTree } from '../../../../config.ts'
import type { Tree } from '../../../../tree/loader.ts'
import { canonicalHref, parseUrl, type PageAddress } from '../../../../url.ts'

/**
 * The Node page, `/<tree-id>/<...trail>/<node-id>` (docs/specs/application.md 4.1). The
 * route parses the address, reads exactly one Node file and hands both to the view;
 * everything else about how a Node looks is in `src/components/`.
 */
interface Props {
  params: Promise<{ lang: string; tree: string; path: string[] }>
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
