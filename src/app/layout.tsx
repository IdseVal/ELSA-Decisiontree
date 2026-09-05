import type { ReactNode } from 'react'

/** The html shell. The language switch and the disclaimer footer are the UI issue's. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
