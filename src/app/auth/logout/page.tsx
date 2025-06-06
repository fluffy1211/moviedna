'use client'

import { useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LogoutPage() {
  useEffect(() => {
    const handleLogout = async () => {
      await signOut({ 
        callbackUrl: '/',
        redirect: true 
      })
    }

    handleLogout()
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Logging out...</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            You are being logged out. Please wait...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}