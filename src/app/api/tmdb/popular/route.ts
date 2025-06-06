import { NextResponse } from 'next/server';
import { tmdbService } from '@/lib/tmdb';

// Cache popular movies for 30 minutes
let moviesCache: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export async function GET() {
  try {
    // Check cache first
    const now = Date.now();
    if (moviesCache && (now - cacheTimestamp < CACHE_DURATION)) {
      return NextResponse.json(moviesCache);
    }

    const movies = await tmdbService.getPopularMovies();
    
    // Update cache
    moviesCache = movies;
    cacheTimestamp = now;
    
    return NextResponse.json(movies);
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    
    // Return cached data if available, even if expired
    if (moviesCache) {
      console.log('Returning cached movies due to API error');
      return NextResponse.json(moviesCache);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch popular movies' },
      { status: 500 }
    );
  }
} 