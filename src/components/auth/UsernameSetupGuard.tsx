'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'

interface UsernameSetupGuardProps {
  children: React.ReactNode
}

export function UsernameSetupGuard({ children }: UsernameSetupGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Don't redirect if still loading
    if (status === 'loading') return

    // Don't redirect if not authenticated
    if (status === 'unauthenticated') return

    // Don't redirect if already on auth pages
    if (pathname?.startsWith('/auth')) return

    // Don't redirect if on home page (allow browsing without username)
    if (pathname === '/') return

    // Redirect if authenticated but no username and trying to access protected pages
    if (session?.user && !session.user.username) {
      const protectedPages = ['/profile', '/quiz']
      const isProtectedPage = protectedPages.some(page => pathname?.startsWith(page))
      
      if (isProtectedPage) {
        router.push('/auth/username-setup')
      }
    }
  }, [session, status, pathname, router])

  return <>{children}</>
}

export default UsernameSetupGuard 