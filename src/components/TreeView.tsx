/**
 * The tree view (docs/specs/application.md section 10): one screen with the current Node as
 * a round Bubble in the centre, the up arrow above its top outline, the Answers as buttons
 * below it and the Options as buttons fanned out beside it. Direction carries meaning: above
 * is where the reader came from, below is where an answer takes them, beside is an aside
 * they read and come back from -- by closing it (10.3, 10.9, core document 10.23).
 *
 * Everything between the chrome bar and the disclaimer is one element, the tree layer, so
 * that the slide of section 11 moves the whole tree with one transform (`Slider`). The
 * placed neighbours of the Node (11.2) are drawn as frames of the same layout, one layer
 * away in the direction of the Branch that leads to them, and carry no image URL at all
 * (11.4). The asides -- the Option targets -- are not placed: each is carried closed in the
 * Overlay its button opens (10.9). The Carousel's band (section 12) is present on every
 * Node, so the Bubble sits in the same place.
 *
 * Below the guaranteed viewport the layout gives things up in the order of 10.5, and each
 * thing it gives up stays reachable behind one control that opens a Sheet. The full group
 * and its collapsed control are both in the markup; the stylesheet shows one or the other,
 * which is what keeps the page correct without JavaScript (section 14).
 *
 * The view takes what `loadPage` read -- the address, the centre with its chain, the
 * neighbourhood -- and the Tree's index, and returns markup; it never touches the file
 * system, the environment or the request, and it never decides which Nodes are neighbours
 * (section 6).
 *
 * **[#138]** With `edit` (34.1) it draws a draft: every address through `edit.links`, an
 * Option's title through the `field` slot, and the structure slots of 34.2 where their
 * controls belong -- `structure` in the Answer row, `linkMenu` beside each Answer and Option
 * button, `sideAdd` in the fan's next free slot and after an Overlay's list. The Node type
 * follows the Tree read (`Readable`): a `Node` on the public page, a `DraftNode` in the
 * editor, whose Links are read through `linksOf` either way (34.6). Absent, not one
 * attribute differs.
 */
import type { CSSProperties, ReactNode } from 'react'
import { chrome, chromeLang, text, type Chrome } from '../chrome.ts'
import type { EditMode } from '../editor/mode.ts'
import type { Aside, NodePage, Placed } from '../neighbourhood.ts'
import type { Readable } from '../tree/loader.ts'
import { linksOf, type DraftNode, type Node } from '../tree/types.ts'
import { PUBLIC_LINKS, type Links, type PageAddress } from '../url.ts'
import { Branch } from './Branch.tsx'
import { Bubble, Interior, sheetWords } from './Bubble.tsx'
import { Carousel } from './Carousel.tsx'
import { Sheet } from './Sheet.tsx'
import { Slider } from './Slider.tsx'

/** The Node type a view draws: the public page's, or a draft's. */
type AnyNode = Node | DraftNode

/** The maximum length of an Option's title (tree-format.md 5.7). */
const OPTION_TITLE = { characters: 60 }

/** What every part of the view needs: the page's address, its chrome, and the title index. */
interface View {
  address: PageAddress
  ui: Chrome
  /** Set when the chrome speaks another language than the content. */
  uiLang: string | undefined
  /** A Node's title in the content language, from the index: never a second Node read. */
  titleOf: (id: string) => string
  root: string
  /**
   * Prepended to every `id` the frame writes. A neighbour frame is mounted beside the centre
   * during a slide, and two elements must not share an id even for that half second.
   */
  idPrefix: string
  /** False in a neighbour frame, which names no image file at all (11.4). */
  pictures: boolean
  /**
   * Whether a Branch of a kind that slides, to `href`, has a placement to slide to (11.1,
   * 11.2). A target the neighbourhood dropped or deduplicated is an ordinary link; so is every
   * Branch of a neighbour frame, which is inert and never clicked.
   */
  placed: (href: string) => boolean
  /**
   * The asides of the centre, for their Overlays (10.9), and the one the URL opened. Empty in
   * a neighbour frame, which draws the Option buttons and none of their interiors (11.3).
   */
  asides: Aside<AnyNode>[]
  open: Aside<AnyNode> | null
  /** The addresses and the pictures (34.3): the public functions, or the editor's. */
  links: Links
  /** Edit mode (34.1); absent on every public page. */
  edit: EditMode | undefined
}

export function TreeView<N extends AnyNode>({ page, tree, edit }: { page: NodePage<N>; tree: Readable<N>; edit?: EditMode }) {
  const { address, centre, neighbours } = page
  const lang = address.lang
  const links = edit?.links ?? PUBLIC_LINKS
  const hrefs = new Set(neighbours.placed.map((placed) => placed.href))
  const open = centre.chain[centre.chain.length - 1] ?? null
  const viewAt = (at: PageAddress, idPrefix: string, isCentre: boolean): View => ({
    address: at,
    ui: chrome(lang),
    uiLang: chromeLang(lang),
    // Every id a Branch names was accepted by `parseUrl` or validated by the loader, so the
    // index knows it; the empty fallback only makes a stale index show the placeholder
    // `text` reserves for a missing text, instead of a crash.
    titleOf: (id) => text(tree.getTitle(id) ?? {}, lang, `${id}.title`),
    root: tree.manifest.root,
    idPrefix,
    pictures: isCentre,
    placed: (href) => isCentre && hrefs.has(href),
    asides: isCentre ? neighbours.asides : [],
    open: isCentre ? open : null,
    links,
    edit,
  })
  const view = viewAt(centre.address, '', true)
  // The page's own URL, aside chain included: what a slide arrives at, and what a history step leaves.
  const here = links.node(address)

  return (
    <>
      <Slider
        // One mount per page, so each page runs its own half of a slide (`Slider`).
        key={here}
        href={here}
        neighbours={neighbours.placed.map((placed, index) => ({
          href: placed.href,
          ...position(placed),
          frame: <Frame node={placed.node} view={viewAt(placed.address, `n${index}-`, false)} />,
        }))}
      >
        <Frame node={centre.node} view={view} />
      </Slider>
      {/* Shown instead of the tree view at and below the floor of 10.4; the stylesheet decides,
          and shows the sentence for the dimension that is short, so a 1280 x 480 window is
          told to grow taller and not that it needs 320 by 480. */}
      <p className="minimum-size" lang={view.uiLang}>
        {view.ui.minimumSize} <span className="minimum-width">{view.ui.minimumWidth}</span>{' '}
        <span className="minimum-height">{view.ui.minimumHeight}</span>
      </p>
    </>
  )
}

/**
 * One Node laid out as the tree view draws it: the Bubble with the up arrow on it, the
 * Options with their Overlays, the Answers and the Carousel's band. The centre of the page is
 * one; so is each neighbour, which is why a Bubble arriving in a slide already carries its own
 * Branch labels (11.3).
 */
function Frame({ node, view }: { node: AnyNode; view: View }) {
  const lang = view.address.lang
  return (
    <>
      <Bubble
        node={node}
        treeId={view.address.treeId}
        lang={lang}
        ui={view.ui}
        uiLang={view.uiLang}
        idPrefix={view.idPrefix}
        pictures={view.pictures}
        up={<UpArrow view={view} />}
        edit={view.edit}
      />
      {(node.options.length > 0 || view.open || view.edit?.slots.sideAdd) && <Options node={node} view={view} />}
      <Answers node={node} view={view} />
      {/* The Carousel's band (section 12), on every Node, empty where there is no picture, so the
          Bubble never moves. A neighbour's is empty too: its pictures arrive with its own page (11.4). */}
      {view.pictures ? (
        <Carousel node={node} treeId={view.address.treeId} lang={lang} ui={view.ui} uiLang={view.uiLang} edit={view.edit} />
      ) : (
        <div className="carousel" />
      )}
    </>
  )
}

/**
 * Where a neighbour's frame is drawn, in widths and heights of the layer, from the Node on
 * screen (11.1): an Answer target below and towards its own Branch -- `yes` left, `no` right
 * -- and their Answer targets a layer further, spread so no two frames overlap; the parent
 * above, where the step down from it started, so the way back retraces that step: above and
 * right of a `yes` target, above and left of a `no` target, straight above anything else.
 */
function position({ direction, slot }: Placed): { x: number; y: number } {
  if (direction === 'up') return { x: slot < 2 ? 0.5 - slot : 0, y: -1 }
  return slot < 2 ? { x: slot - 0.5, y: 1 } : { x: slot - 3.5, y: 2 }
}

/**
 * The way back (10.2): one round button above the Bubble's top outline, a link to the Trail
 * entry directly above at the address that discards everything after it (core document
 * 10.17), named for a reader who cannot see the arrow by the title it leads to. The Trail
 * itself is not drawn; it stays in the URL. Where there is nothing above -- the root Node,
 * or a Node opened by its own URL -- nothing is drawn, and the band stays empty.
 */
function UpArrow({ view }: { view: View }) {
  const { address, ui, uiLang, titleOf, idPrefix, placed, links } = view
  const parent = address.trail.length - 1
  if (parent < 0) return null
  const href = links.trail(address, parent)

  return (
    <a
      className="up-arrow"
      href={href}
      rel="prev"
      aria-labelledby={`${idPrefix}up-label`}
      data-slide={placed(href) ? '' : undefined}
    >
      {/* `hidden`, not clipped: a name is read from a hidden element all the same (10.6). */}
      <span hidden id={`${idPrefix}up-label`} lang={uiLang}>
        {ui.up(titleOf(address.trail[parent]!))}
      </span>
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
        <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />
      </svg>
    </a>
  )
}

/**
 * The Options of the centre and the Overlay its URL opened (10.3, 10.9). A centre without
 * Options draws no fan and no collapsed control, only the one Overlay a URL may name that is
 * not an aside of the centre -- a second-level explanation Node, or one after a Terminal
 * (10.9) -- rendered open, with no button of its own: the way back to the first is the
 * browser's back or the first Option's button.
 *
 * With Options, the buttons are fanned out beside the Bubble, each the control of the Overlay
 * that holds its target: the first Option on the right, the second on the left, alternating,
 * each side top to bottom in Option order. Each button carries its row `--i` of the `--m` on
 * its side, from which the stylesheet places it on the Bubble's curve
 * (ADR-78-fan-out-and-option-picture). The same list as a Sheet of plain links to the
 * explanation Nodes' addresses is what the fan collapses to (10.5, step 4).
 *
 * **[#138]** In edit mode the `sideAdd` slot takes the fan's next free slot, as one more
 * entry after the last Option, and the `linkMenu` slot stands in each entry beside its button.
 */
function Options({ node, view }: { node: AnyNode; view: View }) {
  const { address, ui, uiLang, idPrefix, asides, open, links, edit } = view
  const lang = address.lang
  const count = node.options.length
  const sideAdd = edit?.slots.sideAdd?.(node) ?? null
  // The add slot is one more button of the fan (28.1's sketch), so the rows count it.
  const drawn = count + (sideAdd ? 1 : 0)
  const rows = (side: 'right' | 'left') => (side === 'right' ? Math.ceil(drawn / 2) : Math.floor(drawn / 2))
  const sideOf = (index: number) => (index % 2 === 0 ? 'right' : 'left')
  const extra = open && !asides.some((aside) => aside.href === open.href) ? open : null

  return (
    <>
      <span hidden id={`${idPrefix}options-label`} lang={uiLang}>
        {ui.options}
      </span>
      {/* The count is what the stylesheet collapses the fan on (10.5, step 4). */}
      {drawn > 0 && (
        <ul className="options" aria-labelledby={`${idPrefix}options-label`} data-count={count}>
          {node.options.map((option, index) => {
            const side = sideOf(index)
            // A neighbour frame carries no asides (11.3): its buttons are drawn empty and closed.
            const target = asides.find((aside) => aside.node.id === option.target) ?? null
            const title =
              edit?.slots.field?.(node, `options[${index}].title`, option.title[lang] ?? '', OPTION_TITLE) ??
              text(option.title, lang, `${node.id}.options[${index}].title`)
            return (
              <li
                key={option.target}
                data-side={side}
                style={{ '--i': Math.floor(index / 2), '--m': rows(side) } as CSSProperties}
              >
                <Overlay
                  title={title}
                  picture={optionPicture(target, view.address.treeId, lang, links)}
                  aside={target}
                  open={target !== null && open?.href === target.href}
                  view={view}
                  idPrefix={`${idPrefix}a${index}-`}
                />
                {edit?.slots.linkMenu?.(node, { kind: 'option', index })}
              </li>
            )
          })}
          {sideAdd && (
            <li className="options-add" data-side={sideOf(count)} style={{ '--i': Math.floor(count / 2), '--m': rows(sideOf(count)) } as CSSProperties}>
              {sideAdd}
            </li>
          )}
        </ul>
      )}
      {extra && (
        <div className="options-extra">
          <Overlay
            title={text(extra.node.title, lang, `${extra.node.id}.title`)}
            picture={null}
            aside={extra}
            open
            unbuttoned
            view={view}
            idPrefix={`${idPrefix}ax-`}
          />
        </div>
      )}
      {count > 0 && (
        <div className="options-collapsed">
          <Sheet
            className="options-sheet"
            summary={<span lang={uiLang}>{`${ui.options} (${count})`}</span>}
            items={node.options.map((option, index) => ({
              href: links.follow(address, option.target),
              label: text(option.title, lang, `${node.id}.options[${index}].title`),
            }))}
            words={sheetWords(ui)}
            uiLang={uiLang}
            idPrefix={idPrefix}
          />
        </div>
      )}
    </>
  )
}

/**
 * The picture on an Option button (10.3): the target's main image, the file its Overlay
 * shows. An Option has no Images of its own (tree-format.md 5.4).
 */
function optionPicture(target: Aside<AnyNode> | null, treeId: string, lang: string, links: Links): { src: string; alt: string } | null {
  const image = target?.node.images[0]
  if (!target || !image) return null
  return {
    src: links.image(treeId, image.file),
    alt: text(image.description, lang, `${target.node.id}.images[${image.file}].description`),
  }
}

/**
 * One Option's Overlay (10.9): a Sheet whose control is the Option button -- the target's
 * main image as a 48-pixel round picture, or the empty slot, and the target's title -- and
 * whose one page is the target's Interior, its heading a link to the target's own address,
 * with the target's own Options under it as plain links to the deeper addresses. In a
 * neighbour frame the button stands with an empty slot and no page behind it (11.3, 11.4).
 */
function Overlay({
  title,
  picture,
  aside,
  open,
  unbuttoned = false,
  view,
  idPrefix,
}: {
  /** The target's title; in edit mode the Option's title as a field (28.1). */
  title: ReactNode
  /** The 48-pixel picture on the button; null for the empty slot, and in a neighbour frame. */
  picture: { src: string; alt: string } | null
  /** The target as the page carries it; null in a neighbour frame. */
  aside: Aside<AnyNode> | null
  open: boolean
  /** The URL-named Overlay with no Option button of its own. */
  unbuttoned?: boolean
  view: View
  idPrefix: string
}) {
  const { ui, uiLang, links, edit } = view
  const lang = view.address.lang

  return (
    <Sheet
      className={`overlay${unbuttoned ? ' overlay--unbuttoned' : ''}`}
      summary={
        <>
          {/* `option-image` is the name the first Tree's walk (tests/first-tree/walk.spec.ts) finds an Option's picture by. */}
          {picture ? (
            <img className="option-image" src={picture.src} alt={picture.alt} width={48} height={48} loading="lazy" />
          ) : (
            <span className="option-image option-image--empty" />
          )}
          <span className="option-title">{title}</span>
        </>
      }
      // One page, the Interior and the target's own Options: no strip of the target's other
      // Images, which 10.9's pre-rendering bullet names and its panel has no room for (#100).
      pages={
        aside
          ? [
              <div key={aside.href} className="overlay-interior" lang={lang} data-node={aside.node.id}>
                <Interior node={aside.node} treeId={view.address.treeId} lang={lang} ui={ui} uiLang={uiLang} idPrefix={idPrefix} href={aside.href} edit={edit} />
                {aside.node.options.length > 0 && (
                  <>
                    <span hidden id={`${idPrefix}options-label`} lang={uiLang}>
                      {ui.options}
                    </span>
                    {/* A second-level Option is a plain link to the deeper address, which renders this page with that Overlay open (10.9). */}
                    <ul className="overlay-options" aria-labelledby={`${idPrefix}options-label`}>
                      {aside.node.options.map((option, index) => (
                        <li key={option.target}>
                          <a href={links.follow(aside.address, option.target)}>
                            {text(option.title, lang, `${aside.node.id}.options[${index}].title`)}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {edit?.slots.sideAdd?.(aside.node)}
              </div>,
            ]
          : []
      }
      open={open}
      cross
      words={sheetWords(ui)}
      uiLang={uiLang}
      idPrefix={idPrefix}
    />
  )
}

/**
 * The buttons below the Bubble (10.3): the two Answers of a question Node, and `startAgain`
 * below a Node that has none -- a Terminal, or an explanation Node that is the centre, which
 * only a path with no parent in it makes it (10.9) -- to the root Node with an empty Trail.
 * The way back is the up arrow, not a button here. **[#138]** A draft's question Node may
 * hold one Answer yet (19.2): each Answer that exists is drawn, and the `structure` slot
 * draws what the row offers for the rest (30.1).
 */
function Answers({ node, view }: { node: AnyNode; view: View }) {
  const { address, ui, uiLang, titleOf, root, idPrefix, placed, links, edit } = view
  const answers = linksOf(node)
  const sliding = (href: string) => ({ href, slides: placed(href) })
  // The word, a colon and the target's title: shown whole at every width but a phone's, and
  // the name at every width (10.3).
  const labelled = (word: string, target: string) => {
    const title = titleOf(target)
    return { word, wordLang: uiLang, title, name: `${word}: ${title}` }
  }

  return (
    <div className="answers" role="group" aria-labelledby={`${idPrefix}node-title`}>
      {node.kind === 'question' ? (
        <>
          {answers.yes !== undefined && (
            <Branch className="answer answer--yes" {...sliding(links.follow(address, answers.yes))} {...labelled(ui.yes, answers.yes)} />
          )}
          {edit?.slots.linkMenu?.(node, { kind: 'yes' })}
          {answers.no !== undefined && (
            <Branch className="answer answer--no" {...sliding(links.follow(address, answers.no))} {...labelled(ui.no, answers.no)} />
          )}
          {edit?.slots.linkMenu?.(node, { kind: 'no' })}
        </>
      ) : (
        <Branch
          className="answer answer--start-again"
          href={links.node({ ...address, trail: [], nodeId: root })}
          {...labelled(ui.startAgain, root)}
        />
      )}
      {edit?.slots.structure?.(node)}
    </div>
  )
}
