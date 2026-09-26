import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { chrome } from '../../../chrome.ts'

/**
 * The admin area's head (docs/specs/application.md 20.9): every page `noindex, nofollow`,
 * matching the header the proxy sends. It renders nothing else and decides nothing: each
 * page asks for its own session (`pageSession`), because a layout is not rendered again on
 * a client navigation between its pages.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return children
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  return { title: chrome((await params).lang).siteTitle, robots: { index: false, follow: false } }
}
