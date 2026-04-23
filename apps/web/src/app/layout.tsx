import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { Providers } from '@/components/web3/providers'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Statemate | Trustless AI Agents on Base',
    template: '%s | Statemate',
  },
  description:
    'Discover, register, and interact with AI agents on Base blockchain using the ERC-8004 Trustless Agents standard.',
  keywords: ['AI agents', 'ERC-8004', 'Base', 'blockchain', 'registry', 'trustless'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-(--color-bg-primary) text-(--color-text-primary)">
        <Providers>
          <div className="dot-bg fixed inset-0 z-0 pointer-events-none" />
          <div className="relative z-10 flex min-h-full flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
