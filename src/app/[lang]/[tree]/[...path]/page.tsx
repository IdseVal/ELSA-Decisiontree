import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Disclaimer } from '../../../../components/Disclaimer.tsx'
import { LanguageSwitch } from '../../../../components/LanguageSwitch.tsx'
import { Logo } from '../../../../components/Logo.tsx'
import { NodeView, text } from '../../../../components/NodeView.tsx'
import { publicBaseUrl, servedTree } from '../../../../config.ts'
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
 *
 * `metadataBase` is the deployment's own address (`ELSA_BASE_URL`, docs/deployment.md):
 * with it the canonical link is the absolute URL of this Node, without it the path 4.1
 * gives. It is read here, per request, rather than baked into the build, because where the
 * app is reached is a run-time setting like the Tree it serves.
 */
export async function generateMetadata(props: Props): Promise<Metadata> {
  const found = await addressOf(props)
  if (!found) return {}
  const { tree, address } = found
  const title = tree.getTitle(address.nodeId)
  return {
    metadataBase: publicBaseUrl(),
    title: title
      ? `${text(title, address.lang, `${address.nodeId}.title`)} - ${text(tree.manifest.title, address.lang, 'tree.title')}`
      : undefined,
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
