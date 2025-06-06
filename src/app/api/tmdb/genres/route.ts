import { NextResponse } from 'next/server';
import { tmdbService } from '@/lib/tmdb';

// Cache genres for 1 hour
let genresCache: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function GET() {
  try {
    // Check cache first
    const now = Date.now();
    if (genresCache && (now - cacheTimestamp < CACHE_DURATION)) {
      return NextResponse.json(genresCache);
    }

    const genres = await tmdbService.getGenres();
    
    // Update cache
    genresCache = genres;
    cacheTimestamp = now;
    
    return NextResponse.json(genres);
  } catch (error) {
    console.error('Error fetching genres:', error);
    
    // Return cached data if available, even if expired
    if (genresCache) {
      console.log('Returning cached genres due to API error');
      return NextResponse.json(genresCache);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch genres' },
      { status: 500 }
    );
  }
} 