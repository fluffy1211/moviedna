'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Play, Target, Zap, Film } from 'lucide-react'

export default function Hero() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const handleStartQuiz = () => {
    if (!session) {
      // Not authenticated - redirect to sign in
      signIn(undefined, { callbackUrl: '/quiz' })
    } else if (!session.user?.username) {
      // Authenticated but no username - redirect to username setup
      router.push('/auth/username-setup')
    } else {
      // Authenticated with username - go to quiz
      router.push('/quiz')
    }
  }

  const getButtonText = () => {
    if (status === 'loading') return 'Loading...'
    if (!session) return 'Sign in to start'
    if (!session.user?.username) return 'Set up my profile'
    return 'Start Quiz'
  }

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-6 animate-slide-up">
      <div className="bg-muted/30 backdrop-blur-sm rounded-lg p-6 max-w-md mx-auto">
        <div className="h-4 bg-muted rounded w-3/4 mb-2 animate-pulse"></div>
        <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
      </div>
      <div className="flex justify-center">
        <div className="h-12 bg-muted rounded-lg w-48 animate-pulse"></div>
      </div>
    </div>
  )

  return (
    <section
      id="hero"
      className="flex flex-col items-center justify-center text-center section-padding min-h-[calc(100vh-160px)] bg-gradient-to-br from-background via-background to-muted/20"
    >
      <div className="page-container max-w-4xl space-y-8 animate-fade-in">
        <div className="space-y-6">
          <h1 className="heading-1 text-gradient">
            Welcome to MovieDNA
          </h1>
          <p className="subtitle max-w-2xl mx-auto">
            Discover your unique movie profile and get personalized recommendations
          </p>
        </div>
        
        {status === 'loading' ? (
          <LoadingSkeleton />
        ) : session?.user?.username ? (
          <div className="space-y-6 animate-slide-up">
            <div className="bg-muted/30 backdrop-blur-sm rounded-lg p-6 max-w-md mx-auto">
              <p className="text-muted-foreground mb-2">
                Hello <span className="font-semibold text-foreground">{session.user.username}</span>! 
              </p>
              <p className="text-sm text-muted-foreground">
                Ready to discover your movie DNA?
              </p>
            </div>
            <Link href="/quiz">
              <Button 
                size="lg" 
                className="btn-primary text-base px-8 py-6 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Quiz
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6 animate-slide-up">
            <Button 
              onClick={handleStartQuiz}
              disabled={status === 'loading'}
              size="lg"
              className="btn-primary text-base px-8 py-6 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:hover:scale-100 disabled:opacity-50"
            >
              {status === 'loading' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  {getButtonText()}
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  {getButtonText()}
                </>
              )}
            </Button>
          </div>
        )}
        
        <div className="max-w-2xl mx-auto space-y-6 text-sm text-muted-foreground animate-slide-up">
          <p className="leading-relaxed">
            Take our personalized quiz and discover what type of movie lover you are. 
            Get movie recommendations based on your unique profile!
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <div className="flex items-center gap-2 bg-muted/30 backdrop-blur-sm rounded-full px-4 py-2">
              <Film className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Personalized Quiz</span>
            </div>
            <div className="flex items-center gap-2 bg-muted/30 backdrop-blur-sm rounded-full px-4 py-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Precise Recommendations</span>
            </div>
            <div className="flex items-center gap-2 bg-muted/30 backdrop-blur-sm rounded-full px-4 py-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Instant Results</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
