import { DefaultSession } from "next-auth"

// Extend the default session type to include username
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username?: string
    } & DefaultSession["user"]
  }
}

// Quiz types
export interface QuizQuestion {
  id: string
  question: string
  type: 'multiple-choice' | 'rating' | 'preference'
  options?: string[]
  movies?: Movie[]
  required: boolean
}

export interface QuizOption {
  id: string
  text: string
  value: string
}

export interface QuizResult {
  userId: string
  answers: Record<string, string | string[]>
  profileType: string
  completedAt: Date
}

// User profile types
export interface UserProfile {
  id: string
  username: string
  email: string
  movieDNA?: MovieDNA
  createdAt: Date
  updatedAt: Date
}

export interface MovieDNA {
  profileType: string
  genres: string[]
  characteristics: Record<string, any>
  lastUpdated: Date
}

// Movie and Quiz Types
export interface Movie {
  id: number
  title: string
  original_title?: string
  original_language?: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count?: number
  genre_ids: number[]
  popularity: number
  adult?: boolean
  video?: boolean
  // Enhanced movie data
  keywords?: Keyword[]
  credits?: MovieCredits
  runtime?: number
  budget?: number
  revenue?: number
  production_countries?: ProductionCountry[]
  spoken_languages?: SpokenLanguage[]
  // External ratings
  letterboxd_rating?: number
  letterboxd_watches?: number
  imdb_rating?: number
  rotten_tomatoes_score?: number
  metacritic_score?: number
  // Contextual data
  streaming_providers?: StreamingProvider[]
  awards?: Award[]
  is_cult_classic?: boolean
  is_arthouse?: boolean
  is_indie?: boolean
}

export interface EnhancedMovie extends Movie {
  // Computed/derived fields
  genre_names?: string[]
  decade?: string
  director?: string
  main_cast?: string[]
  certification?: string
  box_office_category?: 'blockbuster' | 'moderate' | 'indie' | 'unknown'
  critical_consensus?: 'acclaimed' | 'mixed' | 'poor' | 'unknown'
  recommendation_reasons?: string[]
  similarity_score?: number
}

export interface Keyword {
  id: number
  name: string
}

export interface MovieCredits {
  cast: CastMember[]
  crew: CrewMember[]
}

export interface CastMember {
  id: number
  name: string
  character: string
  order: number
  profile_path?: string
}

export interface CrewMember {
  id: number
  name: string
  job: string
  department: string
  profile_path?: string
}

export interface ProductionCountry {
  iso_3166_1: string
  name: string
}

export interface SpokenLanguage {
  english_name: string
  iso_639_1: string
  name: string
}

export interface StreamingProvider {
  provider_id: number
  provider_name: string
  logo_path: string
  display_priority: number
  country: string
  type: 'rent' | 'buy' | 'flatrate' | 'ads'
}

export interface Award {
  name: string
  category?: string
  year: number
  won: boolean
  nominated: boolean
}

export interface LetterboxdData {
  film_id: string
  slug: string
  rating: number
  watches: number
  fans: number
  lists_count: number
  reviews_count: number
  popularity_rank?: number
  top_250_rank?: number
  is_cult_classic: boolean
  themes: string[]
  similar_films: string[]
}

// Enhanced recommendation types
export interface RecommendationContext {
  user_preferences: MoviePreferences
  viewing_history?: number[]
  current_mood?: string
  available_time?: number // minutes
  streaming_services?: string[]
  watch_with?: 'alone' | 'friends' | 'family' | 'date'
  discovery_preference?: 'safe' | 'adventurous' | 'mixed'
}

export interface EnhancedRecommendation {
  movie: EnhancedMovie
  score: number
  confidence: number
  reasons: RecommendationReason[]
  tags: string[]
  watch_priority: 'high' | 'medium' | 'low'
  estimated_enjoyment: number // 0-10
}

export interface RecommendationReason {
  type: 'genre' | 'mood' | 'era' | 'director' | 'actor' | 'theme' | 'similar' | 'trending' | 'award' | 'hidden_gem' | 'streaming'
  message: string
  weight: number
}

export interface Genre {
  id: number
  name: string
}

export interface QuizAnswer {
  questionId: string
  answer: string | string[] | number
}

export interface MoviePreferences {
  favoriteGenres: number[]
  preferredDecades: string[]
  favoriteActors: string[]
  moodPreferences: string[]
  ratingThreshold: number
}

export interface MovieDNAResult {
  userId: string
  moviePreferences: MoviePreferences
  personalityType: string
  recommendedMovies: Movie[]
  createdAt: Date
}

// User Movie Management Types
export enum MovieStatus {
  WATCHLIST = 'WATCHLIST',
  WATCHED = 'WATCHED'
}

export interface UserMovie {
  id: string
  userId: string
  tmdbId: number
  title: string
  posterPath: string | null
  overview: string | null
  releaseDate: string | null
  status: MovieStatus
  rating: number | null
  isHearted: boolean
  addedAt: Date
  watchedAt: Date | null
}

export interface MovieRecommendation {
  movie: Movie
  score: number
  reasons: string[]
}

export interface QuizCompletionResult {
  recommendations: MovieRecommendation[]
  personalityType: string
  preferences: MoviePreferences
} 