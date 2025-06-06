'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Heart, Plus, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MovieRecommendation, QuizCompletionResult } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface MovieRecommendationsProps {
  result: QuizCompletionResult
}

export default function MovieRecommendations({ result }: MovieRecommendationsProps) {
  const [addingMovies, setAddingMovies] = useState<Record<number, boolean>>({})
  const [addedMovies, setAddedMovies] = useState<Record<number, boolean>>({})
  const router = useRouter()

  // Defensive check for recommendations
  if (!result || !result.recommendations || !Array.isArray(result.recommendations)) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">🎬 Loading Your Results...</h1>
          <p className="text-xl text-gray-600">
            We're processing your movie recommendations. Please wait a moment.
          </p>
          <Button 
            onClick={() => router.push('/quiz')}
            variant="outline"
            className="mt-4"
          >
            Back to Quiz
          </Button>
        </div>
      </div>
    )
  }

  const handleAddToProfile = async (recommendation: MovieRecommendation) => {
    const { movie } = recommendation
    setAddingMovies(prev => ({ ...prev, [movie.id]: true }))

    try {
      const response = await fetch('/api/user/movies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tmdbId: movie.id,
          title: movie.title,
          posterPath: movie.poster_path,
          overview: movie.overview,
          releaseDate: movie.release_date,
        }),
      })

      if (response.ok) {
        setAddedMovies(prev => ({ ...prev, [movie.id]: true }))
      } else {
        const error = await response.json()
        console.error('Error adding movie:', error)
      }
    } catch (error) {
      console.error('Error adding movie:', error)
    } finally {
      setAddingMovies(prev => ({ ...prev, [movie.id]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full mb-6 shadow-lg">
            <span className="text-3xl">🎬</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Your MovieDNA Results!
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Based on your preferences, we've found some perfect movie matches for you.
            <br className="hidden sm:block" />
            Add them to your profile to start building your watchlist!
          </p>
        </div>

      {/* Movie Recommendations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {result.recommendations.map((recommendation) => (
          <MovieRecommendationCard
            key={recommendation.movie.id}
            recommendation={recommendation}
            isAdding={addingMovies[recommendation.movie.id] || false}
            isAdded={addedMovies[recommendation.movie.id] || false}
            onAdd={() => handleAddToProfile(recommendation)}
          />
        ))}
      </div>

        {/* Action Buttons */}
        <div className="text-center space-y-6 mt-12">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={() => router.push('/profile')}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
              size="lg"
            >
              View My Profile
            </Button>
            <Button 
              onClick={() => router.push('/quiz')}
              variant="outline"
              size="lg"
              className="border-2 hover:bg-gray-50 transition-all duration-200 w-full sm:w-auto"
            >
              Retake Quiz
            </Button>
          </div>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            You can always add more movies and manage your collection from your profile.
          </p>
        </div>
      </div>
    </div>
  )
}

interface MovieRecommendationCardProps {
  recommendation: MovieRecommendation
  isAdding: boolean
  isAdded: boolean
  onAdd: () => void
}

function MovieRecommendationCard({ 
  recommendation, 
  isAdding, 
  isAdded, 
  onAdd 
}: MovieRecommendationCardProps) {
  const { movie, score, reasons } = recommendation

  return (
    <Card className="h-full flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white border-0">
      <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        {movie.poster_path ? (
          <Image
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={movie.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 hover:scale-105"
            priority={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">🎬</div>
              <p className="text-sm font-medium">No Image</p>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-black/80 backdrop-blur-sm text-white border-0 font-semibold shadow-lg">
            {Math.round(score)}% Match
          </Badge>
        </div>
        <div className="absolute bottom-3 left-3 right-3 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <h3 className="text-white font-bold text-lg leading-tight drop-shadow-lg line-clamp-2">
            {movie.title}
          </h3>
        </div>
      </div>
      
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="text-lg font-bold line-clamp-2 text-gray-900 leading-tight">
          {movie.title}
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{movie.vote_average.toFixed(1)}</span>
          </div>
          <span className="text-gray-400">•</span>
          <span className="font-medium">{new Date(movie.release_date).getFullYear()}</span>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col pt-0 px-4 pb-4">
        <p className="text-sm text-gray-700 mb-4 line-clamp-3 flex-1 leading-relaxed">
          {movie.overview}
        </p>
        
        <div className="space-y-3 mb-4">
          <p className="text-xs font-semibold text-gray-800 uppercase tracking-wide">Why we picked this:</p>
          <div className="flex flex-wrap gap-1.5">
            {reasons.slice(0, 2).map((reason, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs px-2 py-1 bg-primary/5 border-primary/20 text-primary font-medium"
              >
                {reason}
              </Badge>
            ))}
          </div>
        </div>
        
        <Button
          onClick={onAdd}
          disabled={isAdding || isAdded}
          className="w-full font-semibold transition-all duration-200"
          variant={isAdded ? "outline" : "default"}
          size="sm"
        >
          {isAdding ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent border-white"></div>
              Adding...
            </div>
          ) : isAdded ? (
            <>
              <Heart className="w-4 h-4 mr-2 fill-current text-red-500" />
              Added to Profile
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add to Profile
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
} 