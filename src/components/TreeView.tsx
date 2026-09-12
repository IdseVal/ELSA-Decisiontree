/**
 * The tree view (docs/specs/application.md section 10): one screen with the current Node as
 * a round Bubble in the centre, the Trail as Branches above it, the Answers as Branches
 * below it and the Options as Branches beside it. Direction carries meaning: above is
 * where the reader came from, below is where an answer takes them, beside is an aside they
 * read and come back from (10.3, core document 10.23).
 *
 * Everything between the chrome bar and the disclaimer is one element, the tree layer, so
 * that the transitions of section 11 (#42) can move the whole tree with one transform. The
 * Carousel's row (#43) is present on every Node, so the Bubble sits in the same place; until
 * #43 draws the Carousel it holds the Node's Images as plain thumbnails (`Thumbnails.tsx`).
 *
 * Below the guaranteed viewport the layout gives things up in the order of 10.5, and each
 * thing it gives up stays reachable behind one control that opens a Sheet. The full group
 * and its collapsed control are both in the markup; the stylesheet shows one or the other,
 * which is what keeps the page correct without JavaScript (section 14).
 *
 * The view takes a Node, the address it was reached by and the Tree's index, and returns
 * markup; it never touches the file system, the environment or the request (section 6).
 */
import { Fragment } from 'react'
import { chrome, chromeLang, text, type Chrome } from '../chrome.ts'
import type { Tree } from '../tree/loader.ts'
import type { Node, Option } from '../tree/types.ts'
import { followHref, imageHref, nodeHref, trailHref, type PageAddress } from '../url.ts'
import { Branch } from './Branch.tsx'
import { Bubble, sheetWords } from './Bubble.tsx'
import { Sheet } from './Sheet.tsx'
import { Thumbnails } from './Thumbnails.tsx'

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
}

export function TreeView({ node, address, tree }: { node: Node; address: PageAddress; tree: Tree }) {
  const lang = address.lang
  const view: View = {
    address,
    ui: chrome(lang),
    uiLang: chromeLang(lang),
    // Every id a Branch names was accepted by `parseUrl` or validated by the loader, so the
    // index knows it; the empty fallback only makes a stale index show the placeholder
    // `text` reserves for a missing text, instead of a crash.
    titleOf: (id) => text(tree.getTitle(id) ?? {}, lang, `${id}.title`),
    root: tree.manifest.root,
  }

  return (
    <>
      <div className="tree-layer">
        <Trail node={node} treeTitle={text(tree.manifest.title, lang, 'tree.title')} view={view} />
        <Bubble node={node} lang={lang} ui={view.ui} uiLang={view.uiLang} />
        {node.options.length > 0 && <Options node={node} view={view} />}
        <Answers node={node} view={view} />
        {/* The Carousel's row (section 12, issue #43), on every Node, so the Bubble never moves. */}
        <div className="carousel">
          {node.images.length > 0 && (
            <Thumbnails
              images={node.images.map((image) => ({
                href: imageHref(image.file),
                description: text(image.description, lang, `${node.id}.images[${image.file}].description`),
                credit: image.credit,
              }))}
              words={{ images: view.ui.images, enlarge: view.ui.enlarge, close: view.ui.close, credit: view.ui.credit }}
              uiLang={view.uiLang}
            />
          )}
        </div>
      </div>
      {/* Shown instead of the tree view below the floor of 10.4; the stylesheet decides. */}
      <p className="minimum-size" lang={view.uiLang}>
        {view.ui.minimumSize}
      </p>
    </>
  )
}

/**
 * The Trail as the Branches above (10.2): oldest first, the parent nearest the Bubble. A
 * Trail longer than five collapses in the middle to `trailMore(n)`, which opens the whole
 * Trail as a Sheet; below the guaranteed height it collapses to the parent alone plus that
 * control (10.5, step 1), and on a phone-width screen, where a 200-pixel parent Branch
 * cannot hold three lines of title in its row, to that control alone. The control says how
 * many entries it hides in each of the three cases; the stylesheet shows one. The root Node
 * has no Trail and shows the Tree's title instead; a Node opened by its own URL offers the
 * `start` Branch, so no reader is stranded.
 */
function Trail({ node, treeTitle, view }: { node: Node; treeTitle: string; view: View }) {
  const { address, ui, uiLang, titleOf, root } = view
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
      aria-labelledby="trail-label"
    >
      {/* The name of the region is chrome and may be in another language than the titles
          under it. Only a referenced element can say so; an `aria-label` string cannot. It is
          `hidden` rather than clipped: a name is read from a hidden element all the same, and
          a clipped one is an element whose content is wider than itself (10.6). */}
      <span hidden id="trail-label" lang={uiLang}>
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
          return (
            <Fragment key={entry.href}>
              <li className="trail-step" data-kept={kept ? '' : undefined} data-parent={parent ? '' : undefined}>
                {/* The entry just above the current Node is the page the reader came from. */}
                <Branch className="trail-entry" href={entry.href} title={entry.title} rel={parent ? 'prev' : undefined} />
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
                    items={entries.map((e) => ({ href: e.href, label: e.title })).reverse()}
                    words={sheetWords(ui)}
                    uiLang={uiLang}
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
 * most four, each showing its target's title and, when the Option has Images, the first of
 * them. The same list as a Sheet is what the columns collapse to (10.5, steps 3 and 4).
 */
function Options({ node, view }: { node: Node; view: View }) {
  const { address, ui, uiLang } = view
  const lang = address.lang
  const half = Math.ceil(node.options.length / 2)

  const branch = (option: Option, index: number) => {
    const where = `${node.id}.options[${index}]`
    const image = option.images[0]
    return (
      <li key={option.target}>
        <Branch
          className="option"
          href={followHref(address, option.target)}
          title={text(option.title, lang, `${where}.title`)}
          image={
            image && {
              src: imageHref(image.file),
              alt: text(image.description, lang, `${where}.images[${image.file}].description`),
            }
          }
        />
      </li>
    )
  }

  return (
    <>
      <span hidden id="options-label" lang={uiLang}>
        {ui.options}
      </span>
      {/* The count is what the stylesheet collapses the columns on (10.5, step 4). */}
      <div className="options-columns" data-count={node.options.length}>
        <ul className="options options--left" aria-labelledby="options-label">
          {node.options.slice(0, half).map(branch)}
        </ul>
        {node.options.length > 1 && (
          <ul className="options options--right" aria-labelledby="options-label">
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
  const { address, ui, uiLang, titleOf, root } = view
  const parent = address.trail.length - 1

  return (
    <div className="answers" role="group" aria-labelledby="node-title">
      {node.kind === 'question' && (
        <>
          <Branch
            className="answer answer--yes"
            href={followHref(address, node.answers.yes)}
            word={ui.yes}
            wordLang={uiLang}
            title={titleOf(node.answers.yes)}
          />
          <Branch
            className="answer answer--no"
            href={followHref(address, node.answers.no)}
            word={ui.no}
            wordLang={uiLang}
            title={titleOf(node.answers.no)}
          />
        </>
      )}
      {node.kind !== 'question' && parent >= 0 && (
        <Branch
          className="answer answer--back"
          href={trailHref(address, parent)}
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
