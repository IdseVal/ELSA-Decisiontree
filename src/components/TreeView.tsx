/**
 * The tree view (docs/specs/application.md section 10): one screen with the current Node as
 * a round Bubble in the centre, the Trail as Branches above it, the Answers as Branches
 * below it and the Options as Branches beside it. Direction carries meaning: above is
 * where the reader came from, below is where an answer takes them, beside is an aside they
 * read and come back from (10.3, core document 10.23).
 *
 * Everything between the chrome bar and the disclaimer is one element, the tree layer, so
 * that the slide of section 11 moves the whole tree with one transform (`Slider`). The
 * neighbours of the Node (11.2) are drawn as frames of the same layout, one layer away in
 * the direction of the Branch that leads to them, carry no image URL at all (11.4), and draw
 * only the part of their Trail the guaranteed viewport shows, not the Trail Sheet (#60). The
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
import { Fragment } from 'react'
import { chrome, chromeLang, text, type Chrome } from '../chrome.ts'
import type { Placed } from '../neighbourhood.ts'
import type { Tree } from '../tree/loader.ts'
import type { Node, Option } from '../tree/types.ts'
import { followHref, nodeHref, trailHref, type PageAddress } from '../url.ts'
import { Branch } from './Branch.tsx'
import { Bubble, sheetWords } from './Bubble.tsx'
import { Carousel } from './Carousel.tsx'
import { Sheet } from './Sheet.tsx'
import { Slider } from './Slider.tsx'

/** How many Trail Branches carry a title at the guaranteed viewport (10.2). */
const TRAIL_SHOWN = 5

/** What every part of the view needs: the page's address, its chrome, and the title index. */
interface View {
  address: PageAddress
  ui: Chrome
  /** Set when the chrome speaks another language than the content. */
  uiLang: string | undefined
  /** A Node's title in the content language, from the index: never a second Node read. */
  titleOf: (id: string) => string
  root: string
  treeTitle: string
  /**
   * Prepended to every `id` the frame writes. A neighbour frame is mounted beside the centre
   * during a slide, and two elements must not share an id even for that half second.
   */
  idPrefix: string
  /** False in a neighbour frame, which names no image file at all (11.4). */
  pictures: boolean
  /**
   * False in a neighbour frame, which draws only the Trail Branches 10.2 draws at the
   * guaranteed viewport and the collapsed control, with no Trail Sheet list behind it (11.3,
   * #60). Every narrower step shows a subset of those, so the frame looks the same at every
   * size; it is inert, so nothing could open the list; and at a 49-entry Trail the whole
   * Trail repeated in every neighbour was most of the page.
   */
  wholeTrail: boolean
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
    treeTitle: text(tree.manifest.title, lang, 'tree.title'),
    idPrefix,
    pictures: centre,
    wholeTrail: centre,
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
 * One Node laid out as the tree view draws it: the Trail, the Bubble, the Options, the
 * Answers and the Carousel's row. The centre of the page is one; so is each neighbour, which
 * is why a Bubble arriving in a slide already carries its own Branch labels (11.3).
 */
function Frame({ node, view }: { node: Node; view: View }) {
  const lang = view.address.lang
  return (
    <>
      <Trail node={node} view={view} />
      <Bubble node={node} lang={lang} ui={view.ui} uiLang={view.uiLang} idPrefix={view.idPrefix} />
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
 * screen (11.1): a Trail entry straight above, one layer per step back; an Answer target
 * below and towards its own Branch -- `yes` left, `no` right -- and their Answer targets a
 * layer further, spread so no two frames overlap; an Option target beside, on the side of
 * its column and a little towards its row.
 */
function position({ direction, slot }: Placed, node: Node): { x: number; y: number } {
  if (direction === 'up') return { x: 0, y: -(slot + 1) }
  if (direction === 'down') return slot < 2 ? { x: slot - 0.5, y: 1 } : { x: slot - 3.5, y: 2 }
  const half = Math.ceil(node.options.length / 2)
  const left = slot < half
  const rows = left ? half : node.options.length - half
  const row = left ? slot : slot - half
  return { x: left ? -1 : 1, y: (row - (rows - 1) / 2) / 4 }
}

/**
 * The Trail as the Branches above (10.2): oldest first, the parent nearest the Bubble. A
 * Trail longer than five collapses in the middle to `trailMore(n)`, which opens the whole
 * Trail as a Sheet; below the guaranteed height it collapses to the parent alone plus that
 * control (10.5, step 1), and on a phone-width screen, where a 212-pixel parent Branch
 * cannot hold three lines of title in its row, to that control alone. The control says how
 * many entries it hides in each of the three cases; the stylesheet shows one. The root Node
 * has no Trail and shows the Tree's title instead; a Node opened by its own URL offers the
 * `start` Branch, so no reader is stranded.
 */
function Trail({ node, view }: { node: Node; view: View }) {
  const { address, ui, uiLang, titleOf, root, treeTitle, idPrefix, wholeTrail, placed } = view
  const entries = address.trail.map((id, index) => ({ href: trailHref(address, index), title: titleOf(id) }))

  if (entries.length === 0 && node.id === root) {
    return (
      <div className="trail trail--root">
        <p className="tree-name">{treeTitle}</p>
      </div>
    )
  }

  const long = entries.length > TRAIL_SHOWN
  const collapsible = entries.length > 1

  return (
    <nav
      className={`trail${long ? ' trail--long' : ''}${collapsible ? ' trail--collapsible' : ''}`}
      aria-labelledby={`${idPrefix}trail-label`}
    >
      {/* The name of the region is chrome and may be in another language than the titles
          under it. Only a referenced element can say so; an `aria-label` string cannot. It is
          `hidden` rather than clipped: a name is read from a hidden element all the same, and
          a clipped one is an element whose content is wider than itself (10.6). */}
      <span hidden id={`${idPrefix}trail-label`} lang={uiLang}>
        {ui.trail}
      </span>
      <ol>
        {entries.length === 0 && (
          <li className="trail-step" data-parent="">
            {/* Chrome, not a Node title: it marks its own language. */}
            <Branch
              className="trail-entry"
              href={nodeHref({ ...address, trail: [], nodeId: root })}
              title={<span lang={uiLang}>{ui.start}</span>}
            />
          </li>
        )}
        {entries.map((entry, index) => {
          const parent = index === entries.length - 1
          // `start` and the last four stay when the middle collapses (10.2).
          const kept = index === 0 || index >= entries.length - 4
          if (!kept && !wholeTrail) return null
          return (
            <Fragment key={entry.href}>
              <li className="trail-step" data-kept={kept ? '' : undefined} data-parent={parent ? '' : undefined}>
                {/* The entry just above the current Node is the page the reader came from. */}
                <Branch
                  className="trail-entry"
                  href={entry.href}
                  title={entry.title}
                  rel={parent ? 'prev' : undefined}
                  // Only the parent and the grandparent are placed above (11.2); an older entry
                  // is an ordinary link (11.1).
                  slides={placed(entry.href)}
                />
              </li>
              {/* The collapsed middle sits where the middle is: after `start`, before what stays. */}
              {index === 0 && (
                <li className="trail-more">
                  <Sheet
                    className="trail-sheet"
                    summary={
                      <>
                        {long && (
                          <span className="trail-more-wide" lang={uiLang}>
                            {ui.trailMore(entries.length - TRAIL_SHOWN)}
                          </span>
                        )}
                        <span className="trail-more-short" lang={uiLang}>
                          {ui.trailMore(entries.length - 1)}
                        </span>
                        <span className="trail-more-all" lang={uiLang}>
                          {ui.trailMore(entries.length)}
                        </span>
                      </>
                    }
                    // The whole Trail, newest first (10.2).
                    items={wholeTrail ? entries.map((e) => ({ href: e.href, label: e.title })).reverse() : []}
                    words={sheetWords(ui)}
                    uiLang={uiLang}
                    idPrefix={idPrefix}
                  />
                </li>
              )}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}

/**
 * The Option Branches beside the Bubble (10.3): the side children, in two columns of at
 * most four, each showing its title. An Option has no Images of its own in `elsa-tree/3`
 * (tree-format.md 5.4); the picture its button shows is its target's main image, which is
 * #80's to draw. The same list as a Sheet is what the columns collapse to (10.5, steps 3 and 4).
 */
function Options({ node, view }: { node: Node; view: View }) {
  const { address, ui, uiLang, idPrefix, placed } = view
  const lang = address.lang
  const half = Math.ceil(node.options.length / 2)

  const branch = (option: Option, index: number) => {
    const where = `${node.id}.options[${index}]`
    const href = followHref(address, option.target)
    return (
      <li key={option.target}>
        <Branch
          className="option"
          href={href}
          title={text(option.title, lang, `${where}.title`)}
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
 * The Branches out of the bottom of the Bubble (10.3): the two Answers of a question Node,
 * `back` on an explanation Node, `back` and `startAgain` on a Terminal. `back` leads to the
 * Trail entry directly above, which is the page the reader came from; a Node opened by its
 * own URL has none, and the Trail row's `start` Branch is its way on.
 */
function Answers({ node, view }: { node: Node; view: View }) {
  const { address, ui, uiLang, titleOf, root, idPrefix, placed } = view
  const parent = address.trail.length - 1
  const sliding = (href: string) => ({ href, slides: placed(href) })

  return (
    <div className="answers" role="group" aria-labelledby={`${idPrefix}node-title`}>
      {node.kind === 'question' && (
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
      )}
      {node.kind !== 'question' && parent >= 0 && (
        <Branch
          className="answer answer--back"
          {...sliding(trailHref(address, parent))}
          word={ui.back}
          wordLang={uiLang}
          title={titleOf(address.trail[parent]!)}
        />
      )}
      {node.kind === 'terminal' && (
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
