import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from "@/components/ui/sonner"
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { PageTransition } from '@/components/PageTransition'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'
import { AnnouncementProvider } from '@/components/AnnouncementProvider'
import { AddToHomeScreenPrompt } from '@/components/AddToHomeScreenPrompt'
import { RootClientLayout } from '@/components/RootClientLayout'

// Plus Jakarta Sans for headings - modern, geometric, excellent readability
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['500', '600', '700', '800'],
})

// Inter for body text - excellent readability at all sizes
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'Pact - Agricultural Marketplace',
  description: 'Connect farmers directly with buyers for fresh, locally-sourced produce',
  keywords: 'agriculture, marketplace, farmers, fresh produce, pooled buying',
  authors: [{ name: 'Pact Team' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#16a34a" />
      </head>
      <body className={`${plusJakarta.variable} ${inter.variable} font-body min-h-screen bg-background text-foreground antialiased`}>
        <ThemeProvider>
          <AnnouncementProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-pact-green focus:px-4 focus:py-2 focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-pact-green focus:ring-offset-2 dark:focus:ring-offset-background"
            >
              Skip to main content
            </a>
            <div className="relative flex min-h-screen flex-col bg-background">
              <Navbar />
              <main id="main-content" className="flex-1">
                <PageTransition>
                  <RootClientLayout>
                    {children}
                  </RootClientLayout>
                </PageTransition>
              </main>
              <Footer />
            </div>
            <Toaster />
            <ServiceWorkerRegister />
            <AddToHomeScreenPrompt />
          </AnnouncementProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}