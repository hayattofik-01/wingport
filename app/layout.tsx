import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Bricolage_Grotesque } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-inter',
  display: 'swap',
})

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-bricolage',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Wingport — Ship AI features. Skip the backend.',
  description:
    'Open-source AI layer for Flutter apps. Deploys into your own Supabase — your keys, your data, no middleman. One SDK call streams any model into your app.',
  metadataBase: new URL('https://wingport.dev'),
  openGraph: {
    title: 'Wingport — Ship AI features. Skip the backend.',
    description:
      'Open-source AI layer for Flutter apps. Deploys into your own Supabase — your keys, your data, no middleman. One SDK call streams any model into your app.',
    url: 'https://wingport.dev',
    siteName: 'Wingport',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Wingport — the safe wire between your app and AI',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wingport — Ship AI features. Skip the backend.',
    description:
      'Open-source AI layer for Flutter apps. Deploys into your own Supabase — your keys, your data, no middleman. One SDK call streams any model into your app.',
    images: ['/og.png'],
  },
  icons: {
    icon: '/favicon.svg',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${bricolage.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen font-body">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
