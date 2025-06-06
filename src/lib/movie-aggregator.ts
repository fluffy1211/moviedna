import { Movie, EnhancedMovie, LetterboxdData, StreamingProvider } from './types';
import { tmdbService } from './tmdb';
import { letterboxdService } from './letterboxd';
import { justWatchService } from './justwatch';

interface AggregationOptions {
  includeLetterboxd?: boolean;
  includeStreaming?: boolean;
  includeCredits?: boolean;
  includeKeywords?: boolean;
  country?: string;
  timeout?: number; // ms
}

interface DataQualityMetrics {
  tmdb_available: boolean;
  letterboxd_available: boolean;
  streaming_available: boolean;
  credits_available: boolean;
  keywords_available: boolean;
  completeness_score: number; // 0-1
}

class MovieDataAggregator {
  private cache = new Map<string, { data: EnhancedMovie; timestamp: number }>();
  private cacheTimeout = 30 * 60 * 1000; // 30 minutes

  async enrichMovie(movie: Movie, options: AggregationOptions = {}): Promise<EnhancedMovie> {
    const {
      includeLetterboxd = true,
      includeStreaming = true,
      includeCredits = true,
      includeKeywords = true,
      country = 'US',
      timeout = 5000
    } = options;

    const cacheKey = `${movie.id}-${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Fetch enhanced details from TMDB
      const enhanced = await this.withTimeout(
        tmdbService.getEnhancedMovieDetails(movie.id),
        timeout
      );

      // Fetch additional data in parallel
      const additionalDataPromises: Promise<any>[] = [];
      
      if (includeLetterboxd) {
        additionalDataPromises.push(
          this.withTimeout(letterboxdService.enhancedSearch(movie), timeout / 2)
            .catch(() => null)
        );
      }
      
      if (includeStreaming) {
        additionalDataPromises.push(
          this.withTimeout(justWatchService.getStreamingAvailability(movie.id, country), timeout / 2)
            .catch(() => [])
        );
      }

      const [letterboxdData, streamingData] = await Promise.allSettled(additionalDataPromises);

      // Merge all data
      const enrichedMovie = this.mergeMovieData(
        enhanced,
        letterboxdData.status === 'fulfilled' ? letterboxdData.value : null,
        streamingData.status === 'fulfilled' ? streamingData.value : []
      );

      // Calculate data quality metrics
      enrichedMovie.data_quality = this.calculateDataQuality(enrichedMovie, {
        letterboxd: letterboxdData.status === 'fulfilled' && letterboxdData.value !== null,
        streaming: streamingData.status === 'fulfilled' && streamingData.value.length > 0
      });

      // Cache the result
      this.cache.set(cacheKey, { data: enrichedMovie, timestamp: Date.now() });

      return enrichedMovie;
    } catch (error) {
      console.warn(`Failed to enrich movie ${movie.title}:`, error);
      // Return basic enhanced movie with available data
      return {
        ...movie,
        genre_names: [],
        decade: movie.release_date ? Math.floor(parseInt(movie.release_date.substring(0, 4)) / 10) * 10 + 's' : undefined
      };
    }
  }

  async enrichMovieBatch(movies: Movie[], options: AggregationOptions = {}): Promise<EnhancedMovie[]> {
    const batchSize = 5; // Process in smaller batches to avoid overwhelming APIs
    const results: EnhancedMovie[] = [];

    for (let i = 0; i < movies.length; i += batchSize) {
      const batch = movies.slice(i, i + batchSize);
      
      const batchPromises = batch.map(movie => 
        this.enrichMovie(movie, options).catch(error => {
          console.warn(`Failed to enrich movie ${movie.title}:`, error);
          return {
            ...movie,
            genre_names: [],
            decade: movie.release_date ? Math.floor(parseInt(movie.release_date.substring(0, 4)) / 10) * 10 + 's' : undefined
          } as EnhancedMovie;
        })
      );

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : {} as EnhancedMovie
      ).filter(movie => movie.id));

      // Add delay between batches
      if (i + batchSize < movies.length) {
        await this.delay(200);
      }
    }

    return results;
  }

  async getAdvancedRecommendations(options: {
    genres?: number[];
    minRating?: number;
    maxRating?: number;
    minYear?: number;
    maxYear?: number;
    includeInternational?: boolean;
    includeDocumentaries?: boolean;
    includeIndieFilms?: boolean;
    includeCultClassics?: boolean;
    streaming_providers?: string[];
    country?: string;
    limit?: number;
  } = {}): Promise<EnhancedMovie[]> {
    const {
      genres = [],
      minRating = 6.0,
      maxRating = 10.0,
      minYear,
      maxYear,
      includeInternational = true,
      includeDocumentaries = false,
      includeIndieFilms = true,
      includeCultClassics = true,
      country = 'US',
      limit = 50
    } = options;

    // Collect movies from various sources
    const movieSets = await Promise.allSettled([
      // Core TMDB sources
      tmdbService.getPersonalizedRecommendations({
        genres,
        minRating,
        minYear,
        maxYear,
        maxPages: 3
      }),
      
      // Enhanced discovery
      includeIndieFilms ? tmdbService.getHiddenGems(minRating, 50, 2) : Promise.resolve([]),
      includeCultClassics ? tmdbService.getCultClassics({ minYear, maxYear }) : Promise.resolve([]),
      includeDocumentaries ? tmdbService.getDocumentaryFilms({ minRating, minYear }) : Promise.resolve([]),
      
      // International cinema
      includeInternational ? this.getInternationalMovies(minRating, minYear) : Promise.resolve([]),
      
      // Award-winning films
      tmdbService.getAwardWinningMovies({ minRating: minRating + 1, minYear }),
      
      // Trending content
      tmdbService.getTrendingMovies('week')
    ]);

    // Combine all movies and remove duplicates
    const allMovies = new Map<number, Movie>();
    movieSets.forEach(result => {
      if (result.status === 'fulfilled') {
        result.value.forEach(movie => {
          if (movie.vote_average >= minRating && movie.vote_average <= maxRating) {
            allMovies.set(movie.id, movie);
          }
        });
      }
    });

    // Convert to array and limit
    const uniqueMovies = Array.from(allMovies.values()).slice(0, limit * 2); // Get more than needed for filtering

    // Enrich the movies
    const enrichedMovies = await this.enrichMovieBatch(uniqueMovies, {
      includeLetterboxd: true,
      includeStreaming: true,
      country
    });

    // Filter by streaming availability if specified
    let filteredMovies = enrichedMovies;
    if (options.streaming_providers && options.streaming_providers.length > 0) {
      filteredMovies = enrichedMovies.filter(movie => 
        movie.streaming_providers?.some(provider => 
          options.streaming_providers!.includes(provider.provider_name.toLowerCase())
        )
      );
    }

    // Sort by a combination of factors
    filteredMovies.sort((a, b) => {
      const scoreA = this.calculateDiscoveryScore(a);
      const scoreB = this.calculateDiscoveryScore(b);
      return scoreB - scoreA;
    });

    return filteredMovies.slice(0, limit);
  }

  private mergeMovieData(
    tmdbMovie: EnhancedMovie,
    letterboxdData: LetterboxdData | null,
    streamingProviders: StreamingProvider[]
  ): EnhancedMovie {
    const merged: EnhancedMovie = { ...tmdbMovie };

    // Add Letterboxd data
    if (letterboxdData) {
      merged.letterboxd_rating = letterboxdData.rating;
      merged.letterboxd_watches = letterboxdData.watches;
      merged.is_cult_classic = letterboxdData.is_cult_classic || merged.is_cult_classic;
      
      // Enhance themes and similar movies
      if (letterboxdData.themes.length > 0) {
        merged.themes = letterboxdData.themes;
      }
    }

    // Add streaming data
    if (streamingProviders.length > 0) {
      merged.streaming_providers = streamingProviders;
    }

    // Enhance categorization
    merged.critical_consensus = this.enhancedCriticalConsensus(merged);
    merged.box_office_category = this.enhancedBoxOfficeCategory(merged);

    return merged;
  }

  private calculateDataQuality(movie: EnhancedMovie, availability: {
    letterboxd: boolean;
    streaming: boolean;
  }): DataQualityMetrics {
    const metrics: DataQualityMetrics = {
      tmdb_available: true, // Always true since we start with TMDB data
      letterboxd_available: availability.letterboxd,
      streaming_available: availability.streaming,
      credits_available: Boolean(movie.credits && movie.credits.cast.length > 0),
      keywords_available: Boolean(movie.keywords && movie.keywords.length > 0),
      completeness_score: 0
    };

    // Calculate completeness score
    const factors = [
      metrics.tmdb_available,
      metrics.letterboxd_available,
      metrics.streaming_available,
      metrics.credits_available,
      metrics.keywords_available
    ];

    metrics.completeness_score = factors.filter(Boolean).length / factors.length;

    return metrics;
  }

  private calculateDiscoveryScore(movie: EnhancedMovie): number {
    let score = 0;

    // Base rating score
    score += (movie.vote_average || 0) * 10;

    // Letterboxd bonus
    if (movie.letterboxd_rating) {
      score += movie.letterboxd_rating * 5;
    }

    // Popularity adjustment (prefer less mainstream for discovery)
    if (movie.popularity) {
      if (movie.popularity < 30) {
        score += 20; // Hidden gem bonus
      } else if (movie.popularity > 80) {
        score -= 10; // Mainstream penalty
      }
    }

    // Quality bonuses
    if (movie.critical_consensus === 'acclaimed') score += 15;
    if (movie.is_cult_classic) score += 10;
    if (movie.is_arthouse) score += 8;
    if (movie.is_indie) score += 5;

    // Recency bonus for quality films
    if (movie.decade === '2020s' && (movie.vote_average || 0) > 7.5) {
      score += 8;
    }

    // Data quality bonus
    if (movie.data_quality && movie.data_quality.completeness_score > 0.7) {
      score += 5;
    }

    return score;
  }

  private async getInternationalMovies(minRating: number, minYear?: number): Promise<Movie[]> {
    const countries = ['KR', 'JP', 'FR', 'IT', 'ES', 'DE', 'IN', 'BR', 'MX'];
    const allMovies: Movie[] = [];

    const promises = countries.map(country =>
      tmdbService.getInternationalCinema(country, { minRating, minYear, pages: 1 })
        .catch(() => [])
    );

    const results = await Promise.allSettled(promises);
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        allMovies.push(...result.value.slice(0, 5)); // Limit per country
      }
    });

    return allMovies;
  }

  private enhancedCriticalConsensus(movie: EnhancedMovie): 'acclaimed' | 'mixed' | 'poor' | 'unknown' {
    const tmdbRating = movie.vote_average || 0;
    const letterboxdRating = movie.letterboxd_rating || 0;
    const voteCount = movie.vote_count || 0;

    if (voteCount < 30) return 'unknown';

    // Combine ratings for better assessment
    const avgRating = letterboxdRating > 0 
      ? (tmdbRating + letterboxdRating * 2) / 3 // Weight Letterboxd more heavily
      : tmdbRating;

    if (avgRating >= 8.0) return 'acclaimed';
    if (avgRating >= 6.5) return 'mixed';
    return 'poor';
  }

  private enhancedBoxOfficeCategory(movie: EnhancedMovie): 'blockbuster' | 'moderate' | 'indie' | 'unknown' {
    // Use existing logic but enhance with additional data
    const budget = movie.budget || 0;
    const revenue = movie.revenue || 0;
    const popularity = movie.popularity || 0;

    const budgetMil = budget / 1000000;
    const revenueMil = revenue / 1000000;

    // Enhanced categorization using popularity as well
    if (budgetMil > 100 || revenueMil > 200 || popularity > 80) {
      return 'blockbuster';
    }
    
    if (budgetMil > 20 || revenueMil > 50 || popularity > 40) {
      return 'moderate';
    }
    
    if (budget > 0 && budgetMil < 15) {
      return 'indie';
    }

    return 'unknown';
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    );

    return Promise.race([promise, timeoutPromise]);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Clean up old cache entries
  clearCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }
}

// Add data quality field to EnhancedMovie interface
declare module './types' {
  interface EnhancedMovie {
    data_quality?: DataQualityMetrics;
    themes?: string[];
  }
}

export const movieAggregator = new MovieDataAggregator();
export type { DataQualityMetrics, AggregationOptions }; 