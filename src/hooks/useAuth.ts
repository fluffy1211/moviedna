import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAuth(requireAuth: boolean = false) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (requireAuth && status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [requireAuth, status, router])

  const isLoading = status === 'loading'
  const isAuthenticated = !!session
  const needsUsername = isAuthenticated && !session?.user?.username

  return {
    session,
    isLoading,
    isAuthenticated,
    needsUsername,
    user: session?.user,
  }
}

export function useRequireAuth() {
  return useAuth(true)
} 