'use client'

/**
 * The share button (docs/CORE_DOCUMENT.md 3.2): it copies the page's own URL, which already
 * carries the Node and the Trail taken to reach it, so the recipient sees the same path
 * (docs/specs/application.md 4.1). Nothing is stored anywhere: the path travels in the link.
 *
 * Without JavaScript there is no button and the address bar is the share link, which is the
 * same link -- that is what "the share link is the page's own URL" buys.
 */
import { useState } from 'react'

/** The three things the button says; strings, because a client component takes no module. */
export interface ShareWords {
  share: string
  copied: string
  copyFailed: string
}

export function ShareButton({
  ui,
  uiLang,
}: {
  ui: ShareWords
  /** Set when the chrome speaks another language than the content. */
  uiLang: string | undefined
}) {
  const [copied, setCopied] = useState(false)
  /** The link to copy by hand: set only when the clipboard refused, never at first paint. */
  const [byHand, setByHand] = useState<string | null>(null)

  return (
    <div className="share-control">
      <button
        className="share"
        type="button"
        lang={uiLang}
        onClick={async () => {
          try {
            // The browser's own idea of this page, so the link is exactly what the reader
            // is looking at -- including a `lang` the address carries.
            await navigator.clipboard.writeText(window.location.href)
            setCopied(true)
            setByHand(null)
          } catch {
            // A clipboard write is refused outside a secure context and by permission. The
            // button must not claim a copy that did not happen, so it offers the link.
            setCopied(false)
            setByHand(window.location.href)
          }
        }}
      >
        {ui.share}
      </button>
      {/*
        On the page from the first paint, so a screen reader announces what appears in it --
        and everything the button has to say goes in here, the refusal included: a reader who
        cannot see the link offered by hand is the reader who most needs to be told about it.
      */}
      <div className="share-said" role="status" lang={uiLang}>
        {copied && ui.copied}
        {byHand !== null && (
          <p className="share-by-hand">
            {ui.copyFailed} <code>{byHand}</code>
          </p>
        )}
      </div>
    </div>
  )
}
