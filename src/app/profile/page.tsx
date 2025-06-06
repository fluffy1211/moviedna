'use client'

import { useRequireAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import MovieCollectionManager from '@/components/profile/MovieCollectionManager'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Film, Clock, Star, Dna } from 'lucide-react'

export default function ProfilePage() {
  const { isLoading, isAuthenticated, needsUsername, user } = useRequireAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated && needsUsername) {
      router.push('/auth/username-setup')
    }
  }, [isLoading, isAuthenticated, needsUsername, router])

  if (isLoading) {
    return (
      <main className="page-container section-padding min-h-[calc(100vh-160px)] flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center space-y-4 p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold">Loading...</h3>
              <p className="text-sm text-muted-foreground">Retrieving your information</p>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (!isAuthenticated) {
    return null // Will be redirected by useRequireAuth
  }

  if (needsUsername) {
    return null // Will be redirected to username setup
  }

  return (
    <main className="min-h-[calc(100vh-160px)] bg-gradient-to-br from-background via-background to-muted/20">
      <div className="page-container section-padding">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <User className="w-4 h-4" />
              <span>My Profile</span>
            </div>
            <h1 className="heading-2">
              Welcome, <span className="text-gradient">{user?.username}</span>!
            </h1>
            <p className="text-muted-foreground">
              Manage your information and movie collection
            </p>
          </div>
          
          {/* User Info Section */}
          <Card className="card-gradient border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <User className="w-5 h-5 text-primary" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>Username</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold">{user?.username}</p>
                    <Badge variant="secondary" className="text-xs">
                      Verified
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>Email Address</span>
                  </div>
                  <p className="text-lg">{user?.email}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                <div className="text-center space-y-1">
                  <Dna className="w-8 h-8 mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">MovieDNA</p>
                  <p className="text-xs text-muted-foreground">Analyzed</p>
                </div>
                <div className="text-center space-y-1">
                  <Clock className="w-8 h-8 mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">Watchlist</p>
                  <p className="text-xs text-muted-foreground">Organized</p>
                </div>
                <div className="text-center space-y-1">
                  <Star className="w-8 h-8 mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">Rated Movies</p>
                  <p className="text-xs text-muted-foreground">Evaluated</p>
                </div>
                <div className="text-center space-y-1">
                  <Film className="w-8 h-8 mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">Discoveries</p>
                  <p className="text-xs text-muted-foreground">Recommended</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Movie Collection Section */}
          <Card className="card-gradient border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Film className="w-5 h-5 text-primary" />
                My Movie Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MovieCollectionManager />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
} 