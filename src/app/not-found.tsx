import { chrome } from '../chrome.ts'
import { Disclaimer } from '../components/Disclaimer.tsx'
import { servedTree } from '../config.ts'
import { rootHref } from '../url.ts'

/**
 * Rendered per request: the Tree is a run-time setting, so nothing here may be baked into
 * the build (docs/specs/application.md section 2).
 */
export const dynamic = 'force-dynamic'

/**
 * The 404 page (docs/specs/application.md 4.3): a small page in the chrome language with a
 * link to the start. A page cannot read the query, so it speaks the Tree's default language.
 */
export default async function NotFound() {
  const tree = await servedTree()
  const lang = tree.manifest.defaultLanguage
  const ui = chrome(lang)
  return (
    <>
      <main>
        <article className="node">
          <h1>{ui.notFoundTitle}</h1>
          <p className="prose">{ui.notFoundText}</p>
          <div className="answers">
            <a className="answer answer--yes" href={rootHref(tree, null)}>
              {ui.start}
            </a>
          </div>
        </article>
      </main>
      <Disclaimer lang={lang} />
    </>
  )
}
