import { NextResponse } from 'next/server';
import { letterboxdService } from '@/lib/letterboxd';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const title = url.searchParams.get('title');
    const year = url.searchParams.get('year');
    
    if (!title) {
      return NextResponse.json(
        { error: 'Title parameter is required' },
        { status: 400 }
      );
    }
    
    const letterboxdData = await letterboxdService.searchFilm(title, year || undefined);
    
    return NextResponse.json(letterboxdData);
  } catch (error) {
    console.error('Error searching Letterboxd:', error);
    return NextResponse.json(
      { error: 'Failed to search Letterboxd' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { movies } = await request.json();
    
    if (!Array.isArray(movies)) {
      return NextResponse.json(
        { error: 'Movies array is required' },
        { status: 400 }
      );
    }
    
    const batchResults = await letterboxdService.batchSearch(movies);
    
    // Convert Map to object for JSON serialization
    const resultsObject = Object.fromEntries(batchResults);
    
    return NextResponse.json(resultsObject);
  } catch (error) {
    console.error('Error batch searching Letterboxd:', error);
    return NextResponse.json(
      { error: 'Failed to batch search Letterboxd' },
      { status: 500 }
    );
  }
} 