import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Vazirmatn } from 'next/font/google'
import { LanguageProvider } from '@/contexts/language-context'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const vazirmatn = Vazirmatn({ subsets: ['arabic', 'latin'], variable: '--font-vazirmatn' })

export const metadata: Metadata = {
  title: {
    default: 'MRQ Express Post — Cargo & Shipment Management',
    template: '%s | MRQ Express Post',
  },
  description:
    'MRQ Express Post: fast, reliable and secure international cargo delivery. Register, manage and track shipments in one place.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#0f2a71',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" dir="ltr" className={`${inter.variable} ${vazirmatn.variable}`}>
      <body className="antialiased">
        <LanguageProvider>
          {children}
          <Toaster richColors />
        </LanguageProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
