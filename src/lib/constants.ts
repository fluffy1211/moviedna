// Application constants
export const APP_NAME = 'MovieDNA'
export const APP_DESCRIPTION = 'Discover your unique movie profile'

// Quiz configuration
export const QUIZ_CONFIG = {
  MIN_QUESTIONS: 10,
  MAX_QUESTIONS: 20,
  TIME_LIMIT_MINUTES: 15,
} as const

// Movie DNA profile types
export const DNA_PROFILES = {
  CINEPHILE: 'cinephile',
  BLOCKBUSTER_FAN: 'blockbuster-fan',
  INDIE_LOVER: 'indie-lover',
  CLASSIC_ENTHUSIAST: 'classic-enthusiast',
  GENRE_SPECIALIST: 'genre-specialist',
  CASUAL_VIEWER: 'casual-viewer',
} as const

// Movie genres
export const MOVIE_GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'History',
  'Horror',
  'Music',
  'Mystery',
  'Romance',
  'Science Fiction',
  'Thriller',
  'War',
  'Western',
] as const

// UI constants
export const UI_CONFIG = {
  HEADER_HEIGHT: '80px',
  FOOTER_HEIGHT: '80px',
  SIDEBAR_WIDTH: '240px',
  MAX_CONTENT_WIDTH: '1200px',
} as const

// Validation constants
export const VALIDATION = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  USERNAME_PATTERN: /^[a-zA-Z0-9_-]+$/,
} as const 