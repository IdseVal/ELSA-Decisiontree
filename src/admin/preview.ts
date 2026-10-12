/**
 * **[#205]** The preview of a hidden Tree (docs/specs/application.md 40.2, 40.7;
 * ADR-205-preview-drawing, ADR-205-unfinished-draft): the reuse rule's one setting with no slot,
 * so the public components draw the draft's public markup at the preview's addresses, and the
 * draft as the preview reads it -- a copy with a placeholder wherever it has no text yet in the
 * language on screen, so that no component meets a missing text and nothing about them changes.
 *
 * Server side: the page builds both once and hands them to the tree view and the bar.
 */
import { chrome } from '../chrome.ts'
import type { EditMode } from '../editor/mode.ts'
import { previewLinks } from '../editor/links.ts'
import { centreOf, draftCentre, neighbourhood, type NodePage } from '../neighbourhood.ts'
import type { Readable } from '../tree/loader.ts'
import type { DraftNode, LocalisedText, Manifest } from '../tree/types.ts'
import type { PageAddress } from '../url.ts'
import { editorWords } from './slots.tsx'

/**
 * The preview's `edit` (40.2): its addresses behind `/admin/preview`, its pictures from the admin
 * image route, and no slot -- so no field, no structure control, no step button. The treeId, the
 * languages and the words are the editor's, which no component reads without a slot.
 */
export function previewMode(address: PageAddress, languages: string[]): EditMode {
  return { treeId: address.treeId, links: previewLinks(), languages, words: editorWords(chrome(address.lang)), slots: {} }
}

/**
 * The page the preview's address names (40.2): `centreOf`, the editor's centre rule
 * (`draftCentre`), then the centre's neighbourhood, as a public page reads one -- at most
 * seventeen Nodes (11.2), **[#232]** forty-one (42.5) -- with every address it carries, the chain's, the placements' and the
 * asides', the preview's own, so that a Branch finds the placement it slides to (11.3). Null where
 * `parseUrl` accepted a path the draft has since lost a Node of. `loadPage` is the public page's
 * and stays so.
 */
export async function previewPage(tree: Readable<DraftNode>, address: PageAddress): Promise<NodePage<DraftNode> | null> {
  const read = await centreOf(tree, address)
  if (!read) return null
  const links = previewLinks()
  const centre = draftCentre(read)
  const { placed, asides } = await neighbourhood(tree, centre.address, centre.node, centre.known)
  const here = <T extends { address: PageAddress }>(entry: T): T => ({ ...entry, href: links.node(entry.address) })
  return {
    address,
    centre: { ...centre, chain: centre.chain.map(here) },
    neighbours: { placed: placed.map(here), asides: asides.map(here) },
  }
}

/**
 * The draft as the preview draws it in `lang` (40.7): the same Tree, but that every text it lacks
 * in `lang` -- its key absent, the language absent, or `""` -- reads `[missingText]` in the chrome
 * language, as `text()` draws a missing text on a public page, **[#222]** a next step's words among
 * them; a Terminal's words read `endingText`,
 * which the badge's 19 characters hold, and a credit, one text for every language, reads
 * `[placeholderCredit]`. Copies only: the draft and its Nodes are not changed.
 */
export function previewDraft(draft: Readable<DraftNode>, lang: string): Readable<DraftNode> {
  const filled = filler(lang)
  const { theme } = draft.manifest
  const manifest: Manifest = {
    ...draft.manifest,
    title: filled(draft.manifest.title),
    ...(theme?.logo ? { theme: { ...theme, logo: { ...theme.logo, alt: filled(theme.logo.alt) } } } : {}),
  }

  return {
    id: draft.id,
    manifest,
    getNode: async (id) => {
      const found = await draft.getNode(id)
      return found && previewNode(found, lang)
    },
    getTitle: (id) => {
      const title = draft.getTitle(id)
      return title && filled(title)
    },
  }
}

/**
 * **[#234]** One Node of a draft as the preview draws it in `lang` (40.7), `previewDraft`'s: a copy
 * with the bracketed placeholder wherever it has no text yet. The editor's page draws its
 * neighbour frames from these (42.8).
 */
export function previewNode(n: DraftNode, lang: string): DraftNode {
  const ui = chrome(lang)
  const filled = filler(lang)
  return {
    ...n,
    title: filled(n.title),
    description: filled(n.description),
    sources: n.sources.map((source) => ({ ...source, label: filled(source.label) })),
    images: n.images.map((image) => ({
      ...image,
      description: filled(image.description),
      credit: image.credit ? image.credit : `[${ui.placeholderCredit}]`,
    })),
    options: n.options.map((option) => ({ ...option, title: filled(option.title) })),
    // **[#222]** A next step's empty words are the bracketed placeholder on its button (41.7 item 7).
    ...(n.answers === undefined ? {} : { answers: n.answers.map((answer) => ({ ...answer, label: filled(answer.label) })) }),
    explainers: n.explainers.map((explainer) => ({ ...explainer, term: filled(explainer.term), text: filled(explainer.text) })),
    ...(n.label === undefined ? {} : { label: filled(n.label, ui.endingText) }),
  }
}

/** A text as the preview reads it in `lang`: `placeholder`, the bracketed `missingText` unless named, where it has none. */
function filler(lang: string): (localised: LocalisedText | undefined, placeholder?: string) => LocalisedText {
  const missing = `[${chrome(lang).missingText}]`
  return (localised, placeholder = missing) => ((localised?.[lang] ?? '') === '' ? { ...localised, [lang]: placeholder } : localised!)
}
