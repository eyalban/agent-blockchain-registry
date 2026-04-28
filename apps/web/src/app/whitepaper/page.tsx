import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Metadata } from 'next'
import { Marked } from 'marked'

export const metadata: Metadata = {
  title: 'White Paper · statem8',
  description:
    'Provenance-first accounting for agentic companies — the statem8 white paper.',
}

// Read at build time. The .md file is co-located under src/content so it
// gets bundled with the app; no dependency on the external git blob URL.
const WHITEPAPER_MD = readFileSync(
  join(process.cwd(), 'src/content/whitepaper.md'),
  'utf8',
)

const marked = new Marked({ gfm: true, breaks: false })

export default function WhitepaperPage() {
  const html = marked.parse(WHITEPAPER_MD) as string
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article
        className="whitepaper-prose"
        // Trusted content: the .md is our own, bundled at build time.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </main>
  )
}
