/**
 * The tree view (docs/specs/application.md section 10): one screen with the current Node as
 * a round Bubble in the centre, the up arrow on its top outline, the Answers as buttons
 * below it and the Options as Branches beside it. Direction carries meaning: above is
 * where the reader came from, below is where an answer takes them, beside is an aside they
 * read and come back from (10.3, core document 10.23).
 *
 * Everything between the chrome bar and the disclaimer is one element, the tree layer, so
 * that the slide of section 11 moves the whole tree with one transform (`Slider`). The
 * neighbours of the Node (11.2) are drawn as frames of the same layout, one layer away in
 * the direction of the Branch that leads to them and carry no image URL at all (11.4). The
 * Carousel's row (section 12) is present on every Node, so the Bubble sits in the same place.
 *
 * Below the guaranteed viewport the layout gives things up in the order of 10.5, and each
 * thing it gives up stays reachable behind one control that opens a Sheet. The full group
 * and its collapsed control are both in the markup; the stylesheet shows one or the other,
 * which is what keeps the page correct without JavaScript (section 14).
 *
 * The view takes a Node, the address it was reached by, its neighbourhood and the Tree's
 * index, and returns markup; it never touches the file system, the environment or the
 * request, and it never decides which Nodes are neighbours (section 6).
 */
import { chrome, chromeLang, text, type Chrome } from '../chrome.ts'
import type { Placed } from '../neighbourhood.ts'
import type { Tree } from '../tree/loader.ts'
import type { Node, Option } from '../tree/types.ts'
import { followHref, imageHref, nodeHref, trailHref, type PageAddress } from '../url.ts'
import { Branch } from './Branch.tsx'
import { Bubble, sheetWords } from './Bubble.tsx'
import { Carousel } from './Carousel.tsx'
import { Sheet } from './Sheet.tsx'
import { Slider } from './Slider.tsx'

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
}

export function TreeView({
  node,
  address,
  tree,
  neighbours,
}: {
  node: Node
  address: PageAddress
  tree: Tree
  /** The Nodes around this one, from `src/neighbourhood.ts` (11.2). */
  neighbours: Placed[]
}) {
  const lang = address.lang
  const hrefs = new Set(neighbours.map((placed) => placed.href))
  const viewAt = (at: PageAddress, idPrefix: string, centre: boolean): View => ({
    address: at,
    ui: chrome(lang),
    uiLang: chromeLang(lang),
    // Every id a Branch names was accepted by `parseUrl` or validated by the loader, so the
    // index knows it; the empty fallback only makes a stale index show the placeholder
    // `text` reserves for a missing text, instead of a crash.
    titleOf: (id) => text(tree.getTitle(id) ?? {}, lang, `${id}.title`),
    root: tree.manifest.root,
    idPrefix,
    pictures: centre,
    placed: (href) => centre && hrefs.has(href),
  })
  const view = viewAt(address, '', true)
  const here = nodeHref(address)

  return (
    <>
      <Slider
        // One mount per page, so each page runs its own half of a slide (`Slider`).
        key={here}
        href={here}
        neighbours={neighbours.map((placed, index) => ({
          href: placed.href,
          ...position(placed, node),
          frame: <Frame node={placed.node} view={viewAt(placed.address, `n${index}-`, false)} />,
        }))}
      >
        <Frame node={node} view={view} />
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
 * Options, the Answers and the Carousel's row. The centre of the page is one; so is each neighbour, which
 * is why a Bubble arriving in a slide already carries its own Branch labels (11.3).
 */
function Frame({ node, view }: { node: Node; view: View }) {
  const lang = view.address.lang
  return (
    <>
      <Bubble
        node={node}
        lang={lang}
        ui={view.ui}
        uiLang={view.uiLang}
        idPrefix={view.idPrefix}
        up={<UpArrow view={view} />}
      />
      {node.options.length > 0 && <Options node={node} view={view} />}
      <Answers node={node} view={view} />
      {/* The Carousel's row (section 12), on every Node, empty where there are no pictures, so the
          Bubble never moves. A neighbour's is empty too: its pictures arrive with its own page (11.4). */}
      {view.pictures ? (
        <Carousel node={node} lang={lang} ui={view.ui} uiLang={view.uiLang} />
      ) : (
        <div className="carousel" />
      )}
    </>
  )
}

/**
 * Where a neighbour's frame is drawn, in widths and heights of the layer, from the Node on
 * screen (11.1): the parent straight above; an Answer target
 * below and towards its own Branch -- `yes` left, `no` right -- and their Answer targets a
 * layer further, spread so no two frames overlap; an Option target beside, on the side of
 * its column and a little towards its row.
 */
function position({ direction, slot }: Placed, node: Node): { x: number; y: number } {
  if (direction === 'up') return { x: 0, y: -1 }
  if (direction === 'down') return slot < 2 ? { x: slot - 0.5, y: 1 } : { x: slot - 3.5, y: 2 }
  const half = Math.ceil(node.options.length / 2)
  const left = slot < half
  const rows = left ? half : node.options.length - half
  const row = left ? slot : slot - half
  return { x: left ? -1 : 1, y: (row - (rows - 1) / 2) / 4 }
}

/**
 * The way back (10.2): one round button on the Bubble's top outline, a link to the Trail
 * entry directly above at the address that discards everything after it (core document
 * 10.17), named for a reader who cannot see the arrow by the title it leads to. The Trail
 * itself is not drawn; it stays in the URL. Where there is nothing above -- the root Node,
 * or a Node opened by its own URL -- nothing is drawn, and the band stays empty.
 */
function UpArrow({ view }: { view: View }) {
  const { address, ui, uiLang, titleOf, idPrefix, placed } = view
  const parent = address.trail.length - 1
  if (parent < 0) return null
  const href = trailHref(address, parent)

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
 * The Option Branches beside the Bubble (10.3): the side children, in two columns of at
 * most four, each showing its target's title and, when the Option has Images, the first of
 * them. The same list as a Sheet is what the columns collapse to (10.5, steps 3 and 4).
 */
function Options({ node, view }: { node: Node; view: View }) {
  const { address, ui, uiLang, idPrefix, pictures, placed } = view
  const lang = address.lang
  const half = Math.ceil(node.options.length / 2)

  const branch = (option: Option, index: number) => {
    const where = `${node.id}.options[${index}]`
    const image = option.images[0]
    const href = followHref(address, option.target)
    return (
      <li key={option.target}>
        <Branch
          className="option"
          href={href}
          title={text(option.title, lang, `${where}.title`)}
          image={
            image &&
            (pictures
              ? { src: imageHref(image.file), alt: text(image.description, lang, `${where}.images[${image.file}].description`) }
              : 'withheld')
          }
          slides={placed(href)}
        />
      </li>
    )
  }

  return (
    <>
      <span hidden id={`${idPrefix}options-label`} lang={uiLang}>
        {ui.options}
      </span>
      {/* The count is what the stylesheet collapses the columns on (10.5, step 4). */}
      <div className="options-columns" data-count={node.options.length}>
        <ul className="options options--left" aria-labelledby={`${idPrefix}options-label`}>
          {node.options.slice(0, half).map(branch)}
        </ul>
        {node.options.length > 1 && (
          <ul className="options options--right" aria-labelledby={`${idPrefix}options-label`}>
            {node.options.slice(half).map((option, index) => branch(option, half + index))}
          </ul>
        )}
      </div>
      <div className="options-collapsed">
        <Sheet
          className="options-sheet"
          summary={<span lang={uiLang}>{`${ui.options} (${node.options.length})`}</span>}
          items={node.options.map((option, index) => ({
            href: followHref(address, option.target),
            label: text(option.title, lang, `${node.id}.options[${index}].title`),
          }))}
          words={sheetWords(ui)}
          uiLang={uiLang}
          idPrefix={idPrefix}
        />
      </div>
    </>
  )
}

/**
 * The buttons below the Bubble (10.3): the two Answers of a question Node, and `startAgain`
 * below a Node that has none -- an explanation Node or a Terminal -- to the root Node with
 * an empty Trail. The way back is the up arrow, not a button here.
 */
function Answers({ node, view }: { node: Node; view: View }) {
  const { address, ui, uiLang, titleOf, root, idPrefix, placed } = view
  const sliding = (href: string) => ({ href, slides: placed(href) })

  return (
    <div className="answers" role="group" aria-labelledby={`${idPrefix}node-title`}>
      {node.kind === 'question' ? (
        <>
          <Branch
            className="answer answer--yes"
            {...sliding(followHref(address, node.answers.yes))}
            word={ui.yes}
            wordLang={uiLang}
            title={titleOf(node.answers.yes)}
          />
          <Branch
            className="answer answer--no"
            {...sliding(followHref(address, node.answers.no))}
            word={ui.no}
            wordLang={uiLang}
            title={titleOf(node.answers.no)}
          />
        </>
      ) : (
        <Branch
          className="answer answer--start-again"
          href={nodeHref({ ...address, trail: [], nodeId: root })}
          word={ui.startAgain}
          wordLang={uiLang}
          title={titleOf(root)}
        />
      )}
    </div>
  )
}
