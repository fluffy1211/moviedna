import { NextResponse } from 'next/server';
import { tmdbService } from '@/lib/tmdb';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const timeWindow = url.searchParams.get('time_window') as 'day' | 'week' || 'week';
    
    const trendingMovies = await tmdbService.getTrendingMovies(timeWindow);
    
    return NextResponse.json(trendingMovies);
  } catch (error) {
    console.error('Error fetching trending movies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending movies' },
      { status: 500 }
    );
  }
} 