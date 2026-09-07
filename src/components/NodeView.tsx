/**
 * The Node view: one step of the walk on screen (docs/CORE_DOCUMENT.md 3.2). It takes a
 * Node and the address it was reached by and returns markup; it never touches the file
 * system, the environment or the request (docs/specs/application.md section 6).
 *
 * The way back is the Trail above the title, and nothing else (issue #8, which took out
 * the interim "back" control of issue #7).
 */
import { chrome, chromeLanguage, type Chrome } from '../chrome.ts'
import { richTextToHtml } from '../markdown.ts'
import type { LocalisedText, Node, Option, Outcome, Source } from '../tree/types.ts'
import { followHref, imageHref, nodeHref, trailHref, type PageAddress } from '../url.ts'
import { ShareButton } from './ShareButton.tsx'
import { Thumbnails } from './Thumbnails.tsx'
import { Trail } from './Trail.tsx'

/** The chrome key that labels each kind of Source (tree-format.md 5.1). */
const SOURCE_LABEL: Record<Source['kind'], keyof Chrome> = {
  legal: 'sourceLegal',
  'case-law': 'sourceCaseLaw',
  literature: 'sourceLiterature',
}

/** The chrome key that names each Terminal outcome (tree-format.md 5.5). */
const OUTCOME_LABEL: Record<Outcome, keyof Chrome> = {
  'not-applicable': 'outcomeNotApplicable',
  applicable: 'outcomeApplicable',
  prohibited: 'outcomeProhibited',
  refer: 'outcomeRefer',
}

/**
 * The text of a localised field, or a visible placeholder when the Tree does not have it in
 * `lang`. Rule V-L10N guarantees every declared language is there, so a miss means the Tree
 * changed under the running server (`getNode` re-reads the file and does not re-validate) --
 * an authoring error. The reader is told, honestly, rather than shown an empty element, and
 * the server says which Node and which field, so the author can find it.
 *
 * `where` names the field: `start.title`, `start.options[1].title`.
 */
export function text(localised: LocalisedText, lang: string, where: string): string {
  const value = localised[lang]
  if (value !== undefined) return value
  console.warn(`Tree text missing: ${where} has no text for the language "${lang}"`)
  return `[${chrome(lang).missingText}]`
}

/**
 * `lang` for a chrome element: set only where the chrome speaks another language than the
 * content around it, so a screen reader pronounces both (docs/specs/application.md 3.1).
 */
export function chromeLang(contentLanguage: string): string | undefined {
  const language = chromeLanguage(contentLanguage)
  return language === contentLanguage ? undefined : language
}

export function NodeView({
  node,
  address,
  rootId,
  trailTitles,
}: {
  node: Node
  address: PageAddress
  /** The Tree's root Node: where the Trail leads when the address carries none. */
  rootId: string
  /**
   * The title of each Node of `address.trail`, in that order and of that length. The page
   * takes them from the loader's index, so drawing the Trail reads no second Node file
   * (docs/specs/application.md 5.1).
   */
  trailTitles: LocalisedText[]
}) {
  const lang = address.lang
  const ui = chrome(lang)
  const uiLang = chromeLang(lang)

  return (
    <article className="node" lang={lang}>
      <Trail
        entries={trailTitles.map((title, index) => ({
          href: trailHref(address, index),
          title: text(title, lang, `${address.trail[index]}.title`),
        }))}
        start={
          address.trail.length === 0 && address.nodeId !== rootId
            ? nodeHref({ ...address, trail: [], nodeId: rootId })
            : undefined
        }
        ui={ui}
        uiLang={uiLang}
      />

      {node.kind === 'terminal' && (
        <p className={`outcome outcome--${node.outcome}`} lang={uiLang}>
          {ui[OUTCOME_LABEL[node.outcome]]}
        </p>
      )}

      <h1 id="node-title">{text(node.title, lang, `${node.id}.title`)}</h1>

      <div
        className="prose"
        dangerouslySetInnerHTML={{
          __html: richTextToHtml(text(node.description, lang, `${node.id}.description`)),
        }}
      />

      {node.sources.length > 0 && (
        <Sources sources={node.sources} nodeId={node.id} lang={lang} ui={ui} uiLang={uiLang} />
      )}

      {node.images.length > 0 && (
        <Thumbnails images={node.images} nodeId={node.id} lang={lang} ui={ui} uiLang={uiLang} />
      )}

      {node.options.length > 0 && (
        <section className="options">
          <h2 lang={uiLang}>{ui.options}</h2>
          <ul>
            {node.options.map((option, index) => (
              <Entry
                key={option.target}
                option={option}
                where={`${node.id}.options[${index}]`}
                address={address}
                lang={lang}
              />
            ))}
          </ul>
        </section>
      )}

      {node.kind === 'question' && (
        <div className="answers" role="group" aria-labelledby="node-title">
          <a className="answer answer--yes" href={followHref(address, node.answers.yes)} lang={uiLang}>
            {ui.yes}
          </a>
          <a className="answer answer--no" href={followHref(address, node.answers.no)} lang={uiLang}>
            {ui.no}
          </a>
        </div>
      )}

      {node.kind === 'explanation' && (
        <p className="hint" lang={uiLang}>
          {ui.explanationOnly}
        </p>
      )}

      <div className="node-footer">
        <ShareButton ui={ui} uiLang={uiLang} />
        <p className="version" lang={uiLang}>
          {ui.version} {node.metadata.version}
        </p>
      </div>
    </article>
  )
}

/** One Option: the whole entry is the link to the child Node that explains it. */
function Entry({
  option,
  where,
  address,
  lang,
}: {
  option: Option
  /** Where this Option sits in its Node, for the warning `text` logs: `start.options[1]`. */
  where: string
  address: PageAddress
  lang: string
}) {
  return (
    <li>
      <a className="option" href={followHref(address, option.target)}>
        <span>{text(option.title, lang, `${where}.title`)}</span>
        {option.images.map((image) => (
          <img
            key={image.file}
            className="option-image"
            src={imageHref(image.file)}
            alt={text(image.description, lang, `${where}.images[${image.file}].description`)}
            loading="lazy"
          />
        ))}
      </a>
    </li>
  )
}

/** The Node's Sources, each labelled by its kind, each opening in a new tab. */
function Sources({
  sources,
  nodeId,
  lang,
  ui,
  uiLang,
}: {
  sources: Source[]
  /** The Node these Sources belong to, for the warning `text` logs. */
  nodeId: string
  lang: string
  ui: Chrome
  uiLang: string | undefined
}) {
  return (
    <section className="sources">
      <h2 lang={uiLang}>{ui.sources}</h2>
      <ul>
        {sources.map((source, index) => (
          <li key={`${source.kind}:${source.url}`}>
            <span className="kind" lang={uiLang}>
              {ui[SOURCE_LABEL[source.kind]]}
            </span>
            <a href={source.url} target="_blank" rel="noopener noreferrer">
              {text(source.label, lang, `${nodeId}.sources[${index}].label`)}
              <span className="visually-hidden" lang={uiLang}>
                {` (${ui.opensInNewTab})`}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
