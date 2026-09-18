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

/**
 * Puts `text` on the clipboard, and says whether it got there. The Clipboard API is the way
 * where it exists, but a browser gives an insecure context -- a plain `http://` address that
 * is not this machine -- no `navigator.clipboard` at all, and a permission can refuse it
 * (issue #86). The older copy of a selection works in both, so it is the second way.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return copySelection(text)
  }
}

/** Copies `text` by selecting it in a field nobody sees, the way a reader's own copy would. */
function copySelection(text: string): boolean {
  // Selecting moves the focus; the reader's place for the keyboard is given back after.
  const focused = document.activeElement
  const field = document.createElement('textarea')
  field.value = text
  field.readOnly = true
  // Fixed and invisible, so the selection neither scrolls the page nor shows (10.6).
  field.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0'
  document.body.append(field)
  try {
    field.select()
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    field.remove()
    if (focused instanceof HTMLElement) focused.focus({ preventScroll: true })
  }
}

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
  /** The link to copy by hand: set only when no way of copying worked, never at first paint. */
  const [byHand, setByHand] = useState<string | null>(null)

  return (
    <div className="share-control">
      <button
        className="share"
        type="button"
        lang={uiLang}
        onClick={async () => {
          // The browser's own idea of this page, so the link is exactly what the reader is
          // looking at -- including a `lang` the address carries.
          const link = window.location.href
          // The button must not claim a copy that did not happen: when neither way copied,
          // it offers the link instead.
          const done = await copyToClipboard(link)
          setCopied(done)
          setByHand(done ? null : link)
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
