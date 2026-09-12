import { chrome, chromeLanguage } from '../../chrome.ts'
import { Disclaimer } from '../../components/Disclaimer.tsx'
import { Logo } from '../../components/Logo.tsx'
import { servedTree } from '../../config.ts'
import { rootHref } from '../../url.ts'

/**
 * Rendered per request: the Tree is a run-time setting, so nothing here may be baked into
 * the build (docs/specs/application.md section 2).
 */
export const dynamic = 'force-dynamic'

/**
 * The 404 page (docs/specs/application.md 4.3): a small page in the chrome language with a
 * link to the start.
 *
 * Next.js renders `not-found.tsx` without params, so this page cannot know the content
 * language. Everything it says is chrome, which exists in English and Dutch only, so it
 * speaks the chrome language of the Tree's default and marks its own subtree with exactly
 * that -- on a `de` Tree the text is English, and `lang="de"` on it would be the false
 * attribute this page's `<html lang>` no longer is. `<html lang>` around it stays the
 * request's content language, set by the layout
 * (docs/adrs/ADR-19-content-language-in-the-route.md, decision 7).
 */
export default async function NotFound() {
  const tree = await servedTree()
  const lang = chromeLanguage(tree.manifest.defaultLanguage)
  const ui = chrome(lang)
  return (
    <>
      {/* The chrome bar of the Node page, less its controls: the body's first grid row is
          its height (10.1), and a page without one would be laid out from the wrong row. */}
      <header className="page-chrome">
        <Logo theme={tree.manifest.theme} title={tree.manifest.title} lang={tree.manifest.defaultLanguage} />
      </header>
      <main lang={lang}>
        <article className="bubble bubble--notice">
          <div className="bubble-text">
            <h1>{ui.notFoundTitle}</h1>
            <p className="prose">{ui.notFoundText}</p>
          </div>
        </article>
        <div className="answers">
          <a className="branch answer answer--yes" href={rootHref(tree, tree.manifest.defaultLanguage)}>
            <span className="branch-label">
              <span className="branch-title">{ui.start}</span>
            </span>
          </a>
        </div>
      </main>
      <Disclaimer lang={lang} />
    </>
  )
}
