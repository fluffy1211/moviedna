import { NextResponse } from 'next/server';
import { tmdbService } from '@/lib/tmdb';
import { movieAggregator } from '@/lib/movie-aggregator';
import { letterboxdService } from '@/lib/letterboxd';
import { justWatchService } from '@/lib/justwatch';
import { Movie, EnhancedMovie } from '@/lib/types';

// Enhanced cache for diverse movies
let enhancedMoviesCache: EnhancedMovie[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const country = url.searchParams.get('country') || 'US';
    const includeLetterboxd = url.searchParams.get('include_letterboxd') !== 'false';
    const includeStreaming = url.searchParams.get('include_streaming') !== 'false';
    const enriched = url.searchParams.get('enriched') === 'true';

    // Check cache first
    const now = Date.now();
    if (enhancedMoviesCache && (now - cacheTimestamp < CACHE_DURATION) && !enriched) {
      return NextResponse.json(enhancedMoviesCache);
    }

    console.log('Fetching enhanced diverse movies from multiple sources...');
    
    // Fetch movies from multiple enhanced sources
    const movieSets = await Promise.allSettled([
      // Core TMDB sources with enhanced methods
      tmdbService.getPopularMovies(1),
      tmdbService.getTopRatedMovies(1),
      tmdbService.getTrendingMovies('week'),
      tmdbService.getNowPlayingMovies(),
      
      // Enhanced discovery sources
      tmdbService.getHiddenGems(7.0, 50, 2),
      tmdbService.getCultClassics({ minYear: 1970 }),
      tmdbService.getAwardWinningMovies({ minRating: 7.5, minYear: 1990 }),
      tmdbService.getDocumentaryFilms({ minRating: 7.0, minYear: 2000 }),
      
      // International cinema from major film countries
      tmdbService.getInternationalCinema('KR', { minRating: 7.0, minYear: 2000 }), // Korean
      tmdbService.getInternationalCinema('JP', { minRating: 7.0, minYear: 1990 }), // Japanese
      tmdbService.getInternationalCinema('FR', { minRating: 6.8, minYear: 1980 }), // French
      tmdbService.getInternationalCinema('IT', { minRating: 6.8, minYear: 1960 }), // Italian
      tmdbService.getInternationalCinema('ES', { minRating: 6.8, minYear: 1970 }), // Spanish
      tmdbService.getInternationalCinema('DE', { minRating: 6.8, minYear: 1970 }), // German
      tmdbService.getInternationalCinema('IN', { minRating: 7.0, minYear: 1990 }), // Indian
      tmdbService.getInternationalCinema('BR', { minRating: 6.8, minYear: 1980 }), // Brazilian
      tmdbService.getInternationalCinema('MX', { minRating: 6.8, minYear: 1990 }), // Mexican
      tmdbService.getInternationalCinema('IR', { minRating: 7.0, minYear: 1990 }), // Iranian
      
      // Era-specific collections
      tmdbService.getMoviesByEra('2020', 'vote_average.desc', 2),
      tmdbService.getMoviesByEra('2010', 'popularity.desc', 2),
      tmdbService.getMoviesByEra('2000', 'vote_average.desc', 2),
      tmdbService.getMoviesByEra('1990', 'vote_average.desc', 2),
      tmdbService.getMoviesByEra('1980', 'vote_average.desc', 1),
      tmdbService.getMoviesByEra('1970', 'vote_average.desc', 1),
      
      // Genre-specific enhanced discovery
      fetchEnhancedGenreMovies(28, 'Action'), // Action
      fetchEnhancedGenreMovies(35, 'Comedy'), // Comedy
      fetchEnhancedGenreMovies(18, 'Drama'), // Drama
      fetchEnhancedGenreMovies(878, 'Sci-Fi'), // Science Fiction
      fetchEnhancedGenreMovies(27, 'Horror'), // Horror
      fetchEnhancedGenreMovies(53, 'Thriller'), // Thriller
      fetchEnhancedGenreMovies(10749, 'Romance'), // Romance
      fetchEnhancedGenreMovies(16, 'Animation'), // Animation
      fetchEnhancedGenreMovies(80, 'Crime'), // Crime
      fetchEnhancedGenreMovies(37, 'Western'), // Western
      fetchEnhancedGenreMovies(36, 'History'), // History
      fetchEnhancedGenreMovies(14, 'Fantasy'), // Fantasy
      fetchEnhancedGenreMovies(10752, 'War'), // War
      fetchEnhancedGenreMovies(9648, 'Mystery'), // Mystery
      fetchEnhancedGenreMovies(10402, 'Music'), // Music
      fetchEnhancedGenreMovies(10770, 'TV Movie') // TV Movie
    ]);

    // Combine all movies and remove duplicates
    const allMovies = new Map<number, Movie>();
    const movieStats = {
      total_sources: movieSets.length,
      successful_sources: 0,
      failed_sources: 0,
      total_movies_fetched: 0
    };

    movieSets.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        movieStats.successful_sources++;
        const movies = Array.isArray(result.value) ? result.value : result.value.results || [];
        movies.forEach((movie: Movie) => {
          if (movie.vote_average >= 5.5 && movie.vote_count >= 20) { // Quality filter
            allMovies.set(movie.id, movie);
          }
        });
        movieStats.total_movies_fetched += movies.length;
      } else {
        movieStats.failed_sources++;
        console.warn(`Source ${index} failed:`, result.reason);
      }
    });

    console.log('Movie aggregation stats:', movieStats);

    // Convert to array and apply smart filtering
    let uniqueMovies = Array.from(allMovies.values());
    
    // Apply intelligent filtering for diversity
    uniqueMovies = applyDiversityFiltering(uniqueMovies);
    
    // Limit to reasonable number for processing
    uniqueMovies = uniqueMovies.slice(0, 200);

    console.log(`Processing ${uniqueMovies.length} unique movies for enrichment...`);

    // Enrich movies with additional data if requested
    let finalMovies: EnhancedMovie[];
    
    if (enriched) {
      finalMovies = await movieAggregator.enrichMovieBatch(uniqueMovies, {
        includeLetterboxd,
        includeStreaming,
        country,
        timeout: 8000
      });
    } else {
      // Basic enrichment with TMDB data only
      finalMovies = await Promise.all(
        uniqueMovies.slice(0, 150).map(async (movie) => {
          try {
            return await tmdbService.getEnhancedMovieDetails(movie.id);
          } catch (error) {
            console.warn(`Failed to enhance movie ${movie.title}:`, error);
            return {
              ...movie,
              genre_names: [],
              decade: movie.release_date ? Math.floor(parseInt(movie.release_date.substring(0, 4)) / 10) * 10 + 's' : undefined
            } as EnhancedMovie;
          }
        })
      );
    }

    // Apply final quality and diversity sorting
    finalMovies = finalMovies
      .filter(movie => movie.vote_average >= 5.5)
      .sort((a, b) => {
        // Complex sorting algorithm considering multiple factors
        const scoreA = calculateMovieScore(a);
        const scoreB = calculateMovieScore(b);
        return scoreB - scoreA;
      })
      .slice(0, 120); // Final limit

    console.log(`Returning ${finalMovies.length} enriched movies`);

    // Cache the result if not enriched (basic version)
    if (!enriched) {
      enhancedMoviesCache = finalMovies;
      cacheTimestamp = Date.now();
    }

    return NextResponse.json(finalMovies);

  } catch (error) {
    console.error('Enhanced discover endpoint error:', error);
    
    // Fallback to basic TMDB data
    try {
      const basicMovies = await tmdbService.getPopularMovies(1);
      return NextResponse.json(basicMovies.results || []);
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return NextResponse.json({ error: 'Failed to fetch movies' }, { status: 500 });
    }
  }
}

// Enhanced genre movie fetching with multiple sorting strategies
async function fetchEnhancedGenreMovies(genreId: number, genreName: string): Promise<Movie[]> {
  try {
    const [popular, topRated, recent] = await Promise.allSettled([
      tmdbService.getMoviesByGenre(genreId, 1),
      fetchGenreMoviesBySort(genreId, 'vote_average.desc'),
      fetchGenreMoviesBySort(genreId, 'primary_release_date.desc')
    ]);

    const allMovies: Movie[] = [];
    
    [popular, topRated, recent].forEach(result => {
      if (result.status === 'fulfilled') {
        const movies = Array.isArray(result.value) ? result.value : result.value.results || [];
        allMovies.push(...movies.slice(0, 8)); // Limit per sorting strategy
      }
    });

    return allMovies;
  } catch (error) {
    console.warn(`Failed to fetch enhanced ${genreName} movies:`, error);
    return [];
  }
}

async function fetchGenreMoviesBySort(genreId: number, sortBy: string): Promise<{ results: Movie[] }> {
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  const response = await fetch(
    `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=${sortBy}&vote_count.gte=100&vote_average.gte=6.0`
  );
  return response.json();
}

// Intelligent diversity filtering
function applyDiversityFiltering(movies: Movie[]): Movie[] {
  const genreDistribution = new Map<number, number>();
  const decadeDistribution = new Map<string, number>();
  const languageDistribution = new Map<string, number>();
  
  // Track distributions
  movies.forEach(movie => {
            (movie.genre_ids || []).forEach(genreId => {
      genreDistribution.set(genreId, (genreDistribution.get(genreId) || 0) + 1);
    });
    
    if (movie.release_date) {
      const decade = Math.floor(parseInt(movie.release_date.substring(0, 4)) / 10) * 10 + 's';
      decadeDistribution.set(decade, (decadeDistribution.get(decade) || 0) + 1);
    }
    
    if (movie.original_language) {
      languageDistribution.set(movie.original_language, (languageDistribution.get(movie.original_language) || 0) + 1);
    }
  });

  // Sort movies by diversity score
  return movies.sort((a, b) => {
    const diversityScoreA = calculateDiversityScore(a, genreDistribution, decadeDistribution, languageDistribution);
    const diversityScoreB = calculateDiversityScore(b, genreDistribution, decadeDistribution, languageDistribution);
    
    // Combine quality and diversity
    const qualityScoreA = (a.vote_average || 0) * (Math.log10((a.vote_count || 1) + 1));
    const qualityScoreB = (b.vote_average || 0) * (Math.log10((b.vote_count || 1) + 1));
    
    const totalScoreA = qualityScoreA * 0.7 + diversityScoreA * 0.3;
    const totalScoreB = qualityScoreB * 0.7 + diversityScoreB * 0.3;
    
    return totalScoreB - totalScoreA;
  });
}

function calculateDiversityScore(
  movie: Movie,
  genreDistribution: Map<number, number>,
  decadeDistribution: Map<string, number>,
  languageDistribution: Map<string, number>
): number {
  let score = 0;
  
  // Prefer less common genres
  const genreRarity = movie.genre_ids.reduce((acc, genreId) => {
    const count = genreDistribution.get(genreId) || 0;
    return acc + (1 / (count + 1));
  }, 0);
  score += genreRarity;
  
  // Prefer less common decades
  if (movie.release_date) {
    const decade = Math.floor(parseInt(movie.release_date.substring(0, 4)) / 10) * 10 + 's';
    const decadeCount = decadeDistribution.get(decade) || 0;
    score += 1 / (decadeCount + 1);
  }
  
  // Prefer less common languages for international diversity
  if (movie.original_language) {
    const langCount = languageDistribution.get(movie.original_language) || 0;
    score += 1 / (langCount + 1);
  }
  
  return score;
}

function calculateMovieScore(movie: EnhancedMovie): number {
  let score = 0;
  
  // Base quality score
  score += (movie.vote_average || 0) * 10;
  
  // Vote count reliability bonus
  const voteCountBonus = Math.min(20, Math.log10((movie.vote_count || 1) + 1) * 3);
  score += voteCountBonus;
  
  // Letterboxd rating bonus
  if (movie.letterboxd_rating) {
    score += movie.letterboxd_rating * 4;
  }
  
  // Special category bonuses
  if (movie.is_cult_classic) score += 15;
  if (movie.is_arthouse) score += 10;
  if (movie.is_indie && movie.vote_average > 7.0) score += 12;
  if (movie.critical_consensus === 'acclaimed') score += 18;
  
  // International cinema bonus for diversity
  if (movie.original_language && movie.original_language !== 'en') {
    score += 8;
  }
  
  // Era diversity bonuses
  if (movie.decade) {
    if (['1970s', '1980s', '1990s'].includes(movie.decade)) score += 5;
    if (movie.decade === '2020s' && movie.vote_average > 7.5) score += 10;
  }
  
  // Data completeness bonus
  if (movie.data_quality && movie.data_quality.completeness_score > 0.7) {
    score += 8;
  }
  
  // Streaming availability bonus
  if (movie.streaming_providers && movie.streaming_providers.length > 0) {
    score += 5;
  }
  
  return score;
} 