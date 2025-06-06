'use client'

import './globals.css'
import { SessionProvider } from 'next-auth/react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { UsernameSetupGuard } from '@/components/auth/UsernameSetupGuard'
import { LoadingProvider } from '@/lib/loading-context'
import { usePathname } from 'next/navigation'
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/auth')

  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <title>{APP_NAME}</title>
        <meta name="description" content={APP_DESCRIPTION} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <ErrorBoundary>
          <LoadingProvider>
            <SessionProvider>
              <UsernameSetupGuard>
                <div className="relative flex min-h-screen flex-col">
                  {!isAuthPage && <Header />}
                  <main className="flex-1 relative">
                    {children}
                  </main>
                  {!isAuthPage && <Footer />}
                </div>
              </UsernameSetupGuard>
            </SessionProvider>
          </LoadingProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
