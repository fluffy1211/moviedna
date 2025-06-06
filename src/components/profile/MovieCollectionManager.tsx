'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Heart, Star, Trash2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserMovie, MovieStatus } from '@/lib/types'

export default function MovieCollectionManager() {
  const [watchlistMovies, setWatchlistMovies] = useState<UserMovie[]>([])
  const [watchedMovies, setWatchedMovies] = useState<UserMovie[]>([])
  const [favoriteMovies, setFavoriteMovies] = useState<UserMovie[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingMovies, setUpdatingMovies] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchMovies()
  }, [])

  const fetchMovies = async () => {
    try {
      setLoading(true)
      const [watchlistResponse, watchedResponse, allMoviesResponse] = await Promise.all([
        fetch('/api/user/movies?status=WATCHLIST'),
        fetch('/api/user/movies?status=WATCHED'),
        fetch('/api/user/movies') // Fetch all movies to filter favorites
      ])

      if (watchlistResponse.ok && watchedResponse.ok && allMoviesResponse.ok) {
        const watchlist = await watchlistResponse.json()
        const watched = await watchedResponse.json()
        const allMovies = await allMoviesResponse.json()
        
        setWatchlistMovies(watchlist)
        setWatchedMovies(watched)
        setFavoriteMovies(allMovies.filter((movie: UserMovie) => movie.isHearted))
      }
    } catch (error) {
      console.error('Error fetching movies:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateMovie = async (movieId: string, updates: Partial<UserMovie>) => {
    setUpdatingMovies(prev => ({ ...prev, [movieId]: true }))
    
    // Optimistic update - update the UI immediately
    const updateMovieInState = (movies: UserMovie[]) => 
      movies.map(movie => 
        movie.id === movieId 
          ? { ...movie, ...updates, watchedAt: updates.status === MovieStatus.WATCHED ? new Date() : movie.watchedAt }
          : movie
      )

    // Apply optimistic updates
    setWatchlistMovies(updateMovieInState)
    setWatchedMovies(updateMovieInState)
    setFavoriteMovies(updateMovieInState)

    try {
      const response = await fetch('/api/user/movies', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movieId,
          ...updates
        }),
      })

      if (response.ok) {
        const updatedMovie = await response.json()
        
        // Update states based on the new status and properties
        if (updates.status === MovieStatus.WATCHLIST) {
          // Move from watched to watchlist
          setWatchedMovies(prev => prev.filter(m => m.id !== movieId))
          setWatchlistMovies(prev => {
            const filtered = prev.filter(m => m.id !== movieId)
            return [...filtered, updatedMovie]
          })
        } else if (updates.status === MovieStatus.WATCHED) {
          // Move from watchlist to watched
          setWatchlistMovies(prev => prev.filter(m => m.id !== movieId))
          setWatchedMovies(prev => {
            const filtered = prev.filter(m => m.id !== movieId)
            return [...filtered, updatedMovie]
          })
        }

        // Update favorites based on isHearted status
        if (updates.isHearted !== undefined) {
          if (updates.isHearted) {
            setFavoriteMovies(prev => {
              const filtered = prev.filter(m => m.id !== movieId)
              return [...filtered, updatedMovie]
            })
          } else {
            setFavoriteMovies(prev => prev.filter(m => m.id !== movieId))
          }
        }
      } else {
        // Revert optimistic update on error
        await fetchMovies()
      }
    } catch (error) {
      console.error('Error updating movie:', error)
      // Revert optimistic update on error
      await fetchMovies()
    } finally {
      setUpdatingMovies(prev => ({ ...prev, [movieId]: false }))
    }
  }

  const deleteMovie = async (movieId: string) => {
    setUpdatingMovies(prev => ({ ...prev, [movieId]: true }))
    
    // Optimistic update - remove from UI immediately
    const removeFromState = (movies: UserMovie[]) => movies.filter(m => m.id !== movieId)
    
    setWatchlistMovies(removeFromState)
    setWatchedMovies(removeFromState)
    setFavoriteMovies(removeFromState)
    
    try {
      const response = await fetch(`/api/user/movies?movieId=${movieId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        // Revert optimistic update on error
        await fetchMovies()
      }
    } catch (error) {
      console.error('Error deleting movie:', error)
      // Revert optimistic update on error
      await fetchMovies()
    } finally {
      setUpdatingMovies(prev => ({ ...prev, [movieId]: false }))
    }
  }

  const markAsWatched = (movieId: string) => {
    updateMovie(movieId, { status: MovieStatus.WATCHED })
  }

  const markAsWatchlist = (movieId: string) => {
    updateMovie(movieId, { status: MovieStatus.WATCHLIST })
  }

  const rateMovie = (movieId: string, rating: number) => {
    updateMovie(movieId, { rating })
  }

  const toggleHeart = (movieId: string, currentHeart: boolean) => {
    updateMovie(movieId, { isHearted: !currentHeart })
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full mb-6 shadow-lg">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent"></div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading your collection</h3>
        <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
          We&apos;re gathering all your movies and watchlist items...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full mb-4 shadow-lg">
          <span className="text-2xl">🎬</span>
        </div>
        <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          My Movie Collection
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Manage your watchlist and track the movies you&apos;ve watched
        </p>
      </div>

      <Tabs defaultValue="watchlist" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="watchlist" className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold">
            Watchlist ({watchlistMovies.length})
          </TabsTrigger>
          <TabsTrigger value="watched" className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold">
            Watched ({watchedMovies.length})
          </TabsTrigger>
          <TabsTrigger value="favorites" className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold">
            Favorites ({favoriteMovies.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="watchlist" className="space-y-6 mt-6">
          {watchlistMovies.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-200">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
                <span className="text-3xl">📽️</span>
              </div>
              <p className="text-gray-600 text-xl font-semibold mb-2">Your watchlist is empty</p>
              <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                Add movies from quiz recommendations or browse to start building your list!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {watchlistMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onMarkAsWatched={() => markAsWatched(movie.id)}
                  onRate={(rating) => rateMovie(movie.id, rating)}
                  onToggleHeart={() => toggleHeart(movie.id, movie.isHearted)}
                  onDelete={() => deleteMovie(movie.id)}
                  isUpdating={updatingMovies[movie.id] || false}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="watched" className="space-y-6 mt-6">
          {watchedMovies.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-200">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <p className="text-gray-600 text-xl font-semibold mb-2">No watched movies yet</p>
              <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                Mark movies as watched from your watchlist to see them here!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {watchedMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onMarkAsWatchlist={() => markAsWatchlist(movie.id)}
                  onRate={(rating) => rateMovie(movie.id, rating)}
                  onToggleHeart={() => toggleHeart(movie.id, movie.isHearted)}
                  onDelete={() => deleteMovie(movie.id)}
                  isUpdating={updatingMovies[movie.id] || false}
                  isWatched
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-6 mt-6">
          {favoriteMovies.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl border-2 border-dashed border-red-200">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <span className="text-3xl">❤️</span>
              </div>
              <p className="text-gray-600 text-xl font-semibold mb-2">No favorite movies yet</p>
              <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                Heart movies from your watchlist or watched collection to see them here!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favoriteMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onMarkAsWatched={movie.status === MovieStatus.WATCHLIST ? () => markAsWatched(movie.id) : undefined}
                  onMarkAsWatchlist={movie.status === MovieStatus.WATCHED ? () => markAsWatchlist(movie.id) : undefined}
                  onRate={(rating) => rateMovie(movie.id, rating)}
                  onToggleHeart={() => toggleHeart(movie.id, movie.isHearted)}
                  onDelete={() => deleteMovie(movie.id)}
                  isUpdating={updatingMovies[movie.id] || false}
                  isWatched={movie.status === MovieStatus.WATCHED}
                  isFavorite={true}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface MovieCardProps {
  movie: UserMovie
  onMarkAsWatched?: () => void
  onMarkAsWatchlist?: () => void
  onRate: (rating: number) => void
  onToggleHeart: () => void
  onDelete: () => void
  isUpdating: boolean
  isWatched?: boolean
  isFavorite?: boolean
}

function MovieCard({
  movie,
  onMarkAsWatched,
  onMarkAsWatchlist,
  onRate,
  onToggleHeart,
  onDelete,
  isUpdating,
  isWatched = false,
  isFavorite = false
}: MovieCardProps) {
  return (
    <Card className="h-full flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white border-0">
      <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        {movie.posterPath ? (
          <Image
            src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
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
        
        {/* Action buttons */}
        <div className="absolute top-3 left-3">
          <Button
            size="sm"
            variant={movie.isHearted ? "default" : "secondary"}
            onClick={onToggleHeart}
            disabled={isUpdating}
            className={`p-2 backdrop-blur-sm shadow-lg transition-all duration-200 ${
              movie.isHearted 
                ? 'bg-red-500 hover:bg-red-600 border-0' 
                : 'bg-white/90 hover:bg-white border-0'
            }`}
          >
            <Heart className={`w-4 h-4 ${movie.isHearted ? 'fill-current text-white' : 'text-gray-700'}`} />
          </Button>
        </div>
        <div className="absolute top-3 right-3">
          <Button
            size="sm"
            variant="secondary"
            onClick={onDelete}
            disabled={isUpdating}
            className="p-2 bg-red-500/90 hover:bg-red-600 backdrop-blur-sm text-white border-0 shadow-lg transition-all duration-200"
          >
            {isUpdating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent border-white"></div>
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Movie title overlay on hover */}
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
        {movie.releaseDate && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
            <span className="font-medium">{new Date(movie.releaseDate).getFullYear()}</span>
            {movie.rating && (
              <>
                <span className="text-gray-400">•</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{movie.rating}/5</span>
                </div>
              </>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col pt-0 px-4 pb-4">
        {movie.overview && (
          <p className="text-sm text-gray-700 mb-4 line-clamp-3 flex-1 leading-relaxed">
            {movie.overview}
          </p>
        )}
        
        {/* Rating */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-800 uppercase tracking-wide mb-2">Your Rating:</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => onRate(star)}
                disabled={isUpdating}
                className={`p-1 transition-colors duration-200 hover:scale-110 ${
                  star <= (movie.rating || 0) 
                    ? 'text-yellow-400' 
                    : 'text-gray-300 hover:text-yellow-200'
                }`}
              >
                <Star className="w-5 h-5 fill-current transition-transform duration-200" />
              </button>
            ))}
          </div>
        </div>
        
        {/* Actions */}
        <div className="space-y-3">
          {isFavorite ? (
            // In favorites tab, show different actions based on status
            <div className="space-y-2">
              {onMarkAsWatched && (
                <Button
                  onClick={onMarkAsWatched}
                  disabled={isUpdating}
                  className="w-full font-semibold transition-all duration-200 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  size="sm"
                >
                  {isUpdating ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent border-white"></div>
                      Marking...
                    </div>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Mark as Watched
                    </>
                  )}
                </Button>
              )}
              {onMarkAsWatchlist && (
                <Button
                  onClick={onMarkAsWatchlist}
                  disabled={isUpdating}
                  variant="outline"
                  className="w-full font-semibold transition-all duration-200 border-2 hover:bg-gray-50"
                  size="sm"
                >
                  {isUpdating ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent border-current"></div>
                      Moving...
                    </div>
                  ) : (
                    'Move to Watchlist'
                  )}
                </Button>
              )}
            </div>
          ) : (
            // Original actions for watchlist/watched tabs
            <>
              {isWatched ? (
                <Button
                  onClick={onMarkAsWatchlist}
                  disabled={isUpdating}
                  variant="outline"
                  className="w-full font-semibold transition-all duration-200 border-2 hover:bg-gray-50"
                  size="sm"
                >
                  {isUpdating ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent border-current"></div>
                      Moving...
                    </div>
                  ) : (
                    'Move to Watchlist'
                  )}
                </Button>
              ) : (
                <Button
                  onClick={onMarkAsWatched}
                  disabled={isUpdating}
                  className="w-full font-semibold transition-all duration-200 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  size="sm"
                >
                  {isUpdating ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent border-white"></div>
                      Marking...
                    </div>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Mark as Watched
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </div>
        
        {movie.watchedAt && (
          <p className="text-xs text-gray-500 mt-3 text-center italic">
            Watched on {new Date(movie.watchedAt).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  )
} 