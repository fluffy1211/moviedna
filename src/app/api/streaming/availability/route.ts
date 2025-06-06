import { NextResponse } from 'next/server';
import { justWatchService } from '@/lib/justwatch';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tmdbId = url.searchParams.get('tmdb_id');
    const country = url.searchParams.get('country') || 'US';
    
    if (!tmdbId) {
      return NextResponse.json(
        { error: 'TMDB ID parameter is required' },
        { status: 400 }
      );
    }
    
    const streamingProviders = await justWatchService.getStreamingAvailability(
      parseInt(tmdbId),
      country
    );
    
    return NextResponse.json(streamingProviders);
  } catch (error) {
    console.error('Error fetching streaming availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch streaming availability' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { tmdb_ids, country = 'US' } = await request.json();
    
    if (!Array.isArray(tmdb_ids)) {
      return NextResponse.json(
        { error: 'TMDB IDs array is required' },
        { status: 400 }
      );
    }
    
    const batchResults = await justWatchService.batchGetAvailability(tmdb_ids, country);
    
    // Convert Map to object for JSON serialization
    const resultsObject = Object.fromEntries(batchResults);
    
    return NextResponse.json(resultsObject);
  } catch (error) {
    console.error('Error batch fetching streaming availability:', error);
    return NextResponse.json(
      { error: 'Failed to batch fetch streaming availability' },
      { status: 500 }
    );
  }
} 