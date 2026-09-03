/**
 * The Node view: one step of the walk on screen (docs/CORE_DOCUMENT.md 3.2). It takes a
 * Node and the address it was reached by and returns markup; it never touches the file
 * system, the environment or the request (docs/specs/application.md section 6).
 *
 * The "back" control here is the interim one this issue asks for; issue #8 replaces it
 * with the Trail.
 */
import { chrome, chromeLanguage, type Chrome } from '../chrome.ts'
import { richTextToHtml } from '../markdown.ts'
import type { LocalisedText, Node, Option, Outcome, Source } from '../tree/types.ts'
import { followHref, imageHref, nodeHref, trailHref, type PageAddress } from '../url.ts'
import { Thumbnails } from './Thumbnails.tsx'

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

/** The text of a localised field. Rule V-L10N guarantees every declared language is there. */
export function text(localised: LocalisedText, lang: string): string {
  return localised[lang] ?? ''
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
}: {
  node: Node
  address: PageAddress
  /** The Tree's root Node: where "back" leads when the address carries no Trail. */
  rootId: string
}) {
  const lang = address.lang
  const ui = chrome(lang)
  const uiLang = chromeLang(lang)
  const back =
    address.trail.length > 0
      ? { href: trailHref(address, address.trail.length - 1), label: ui.back }
      : node.kind === 'explanation'
        ? { href: nodeHref({ ...address, trail: [], nodeId: rootId }), label: ui.start }
        : null

  return (
    <article className="node" lang={lang}>
      {back && (
        <a className="back" href={back.href} lang={uiLang} rel="prev">
          {back.label}
        </a>
      )}

      {node.kind === 'terminal' && (
        <p className={`outcome outcome--${node.outcome}`} lang={uiLang}>
          {ui[OUTCOME_LABEL[node.outcome]]}
        </p>
      )}

      <h1 id="node-title">{text(node.title, lang)}</h1>

      <div
        className="prose"
        dangerouslySetInnerHTML={{ __html: richTextToHtml(text(node.description, lang)) }}
      />

      {node.sources.length > 0 && <Sources sources={node.sources} lang={lang} ui={ui} uiLang={uiLang} />}

      {node.images.length > 0 && <Thumbnails images={node.images} lang={lang} ui={ui} uiLang={uiLang} />}

      {node.options.length > 0 && (
        <section className="options">
          <h2 lang={uiLang}>{ui.options}</h2>
          <ul>
            {node.options.map((option) => (
              <Entry key={option.target} option={option} address={address} lang={lang} />
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

      <p className="version" lang={uiLang}>
        {ui.version} {node.metadata.version}
      </p>
    </article>
  )
}

/** One Option: the whole entry is the link to the child Node that explains it. */
function Entry({ option, address, lang }: { option: Option; address: PageAddress; lang: string }) {
  return (
    <li>
      <a className="option" href={followHref(address, option.target)}>
        {option.images.map((image) => (
          <img
            key={image.file}
            className="option-image"
            src={imageHref(image.file)}
            alt={text(image.description, lang)}
            loading="lazy"
          />
        ))}
        <span>{text(option.title, lang)}</span>
      </a>
    </li>
  )
}

/** The Node's Sources, each labelled by its kind, each opening in a new tab. */
function Sources({
  sources,
  lang,
  ui,
  uiLang,
}: {
  sources: Source[]
  lang: string
  ui: Chrome
  uiLang: string | undefined
}) {
  return (
    <section className="sources">
      <h2 lang={uiLang}>{ui.sources}</h2>
      <ul>
        {sources.map((source) => (
          <li key={`${source.kind}:${source.url}`}>
            <span className="kind" lang={uiLang}>
              {ui[SOURCE_LABEL[source.kind]]}
            </span>
            <a href={source.url} target="_blank" rel="noopener noreferrer">
              {text(source.label, lang)}
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
