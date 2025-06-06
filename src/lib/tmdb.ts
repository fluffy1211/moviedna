import { Movie, Genre, EnhancedMovie, MovieCredits, Keyword, StreamingProvider } from './types';

class TMDbService {
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private readonly imageBaseUrl = 'https://image.tmdb.org/t/p';

  private async fetchFromTMDb(endpoint: string, params?: Record<string, string>) {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    
    if (!TMDB_API_KEY) {
      throw new Error('TMDb API key is not configured. Please add TMDB_API_KEY to your environment variables.');
    }
    
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('api_key', TMDB_API_KEY);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`TMDb API error: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Basic endpoints
  async getGenres(): Promise<Genre[]> {
    const data = await this.fetchFromTMDb('/genre/movie/list');
    return data.genres;
  }

  async getPopularMovies(page: number = 1): Promise<{ results: Movie[], total_pages: number }> {
    const data = await this.fetchFromTMDb('/movie/popular', { page: page.toString() });
    return data;
  }

  async getTrendingMovies(timeWindow: 'day' | 'week' = 'week'): Promise<Movie[]> {
    const data = await this.fetchFromTMDb(`/trending/movie/${timeWindow}`);
    return data.results;
  }

  async getNowPlayingMovies(): Promise<Movie[]> {
    const data = await this.fetchFromTMDb('/movie/now_playing');
    return data.results;
  }

  async getUpcomingMovies(): Promise<Movie[]> {
    const data = await this.fetchFromTMDb('/movie/upcoming');
    return data.results;
  }

  async getTopRatedMovies(page: number = 1): Promise<{ results: Movie[], total_pages: number }> {
    const data = await this.fetchFromTMDb('/movie/top_rated', { page: page.toString() });
    return data;
  }

  // Enhanced movie details
  async getEnhancedMovieDetails(movieId: number): Promise<EnhancedMovie> {
    const [details, credits, keywords, watchProviders] = await Promise.allSettled([
      this.fetchFromTMDb(`/movie/${movieId}`, { append_to_response: 'videos,images,release_dates' }),
      this.fetchFromTMDb(`/movie/${movieId}/credits`),
      this.fetchFromTMDb(`/movie/${movieId}/keywords`),
      this.fetchFromTMDb(`/movie/${movieId}/watch/providers`)
    ]);

    const movieDetails = details.status === 'fulfilled' ? details.value : null;
    const movieCredits = credits.status === 'fulfilled' ? credits.value : null;
    const movieKeywords = keywords.status === 'fulfilled' ? keywords.value : null;
    const providers = watchProviders.status === 'fulfilled' ? watchProviders.value : null;

    if (!movieDetails) {
      throw new Error(`Failed to fetch movie details for ID: ${movieId}`);
    }

    // Enrich with computed fields
    const enhanced: EnhancedMovie = {
      ...movieDetails,
      keywords: movieKeywords?.keywords || [],
      credits: movieCredits || { cast: [], crew: [] },
      streaming_providers: this.extractStreamingProviders(providers),
      // Computed fields
      genre_names: movieDetails.genres?.map((g: Genre) => g.name) || [],
      decade: movieDetails.release_date ? Math.floor(parseInt(movieDetails.release_date.substring(0, 4)) / 10) * 10 + 's' : undefined,
      director: movieCredits?.crew?.find((c: any) => c.job === 'Director')?.name,
      main_cast: movieCredits?.cast?.slice(0, 5).map((c: any) => c.name) || [],
      box_office_category: this.categorizeBoxOffice(movieDetails.budget, movieDetails.revenue),
      critical_consensus: this.categorizeCriticalConsensus(movieDetails.vote_average, movieDetails.vote_count),
      is_indie: this.isIndieFilm(movieDetails),
      is_arthouse: this.isArthouseFilm(movieDetails, movieKeywords?.keywords || []),
      is_cult_classic: this.isCultClassic(movieDetails, movieKeywords?.keywords || [])
    };

    return enhanced;
  }

  // Advanced discovery methods
  async discoverMoviesByKeywords(keywordIds: number[], options: {
    minRating?: number;
    minYear?: number;
    maxYear?: number;
    sortBy?: string;
    pages?: number;
  } = {}): Promise<Movie[]> {
    const { minRating = 6.0, sortBy = 'popularity.desc', pages = 2 } = options;
    
    const baseParams: Record<string, string> = {
      with_keywords: keywordIds.join(','),
      'vote_average.gte': minRating.toString(),
      'vote_count.gte': '50',
      sort_by: sortBy,
    };

    if (options.minYear) baseParams['primary_release_date.gte'] = `${options.minYear}-01-01`;
    if (options.maxYear) baseParams['primary_release_date.lte'] = `${options.maxYear}-12-31`;

    const allMovies: Movie[] = [];
    for (let page = 1; page <= pages; page++) {
      try {
        const params = { ...baseParams, page: page.toString() };
        const data = await this.fetchFromTMDb('/discover/movie', params);
        allMovies.push(...data.results);
      } catch (error) {
        console.warn(`Failed to fetch keywords page ${page}:`, error);
        break;
      }
    }

    return allMovies;
  }

  async getAwardWinningMovies(options: {
    minRating?: number;
    minYear?: number;
    sortBy?: string;
    pages?: number;
  } = {}): Promise<Movie[]> {
    const { minRating = 7.5, sortBy = 'vote_average.desc', pages = 3 } = options;
    
    // Search for movies with award-related keywords
    const awardKeywords = [180547, 9715, 1721]; // Academy Awards, Golden Globes, Cannes
    
    return this.discoverMoviesByKeywords(awardKeywords, {
      ...options,
      minRating,
      sortBy,
      pages
    });
  }

  async getInternationalCinema(country: string, options: {
    minRating?: number;
    minYear?: number;
    sortBy?: string;
    pages?: number;
  } = {}): Promise<Movie[]> {
    const { minRating = 6.5, sortBy = 'popularity.desc', pages = 2 } = options;
    
    const baseParams: Record<string, string> = {
      with_origin_country: country,
      'vote_average.gte': minRating.toString(),
      'vote_count.gte': '30',
      sort_by: sortBy,
    };

    if (options.minYear) baseParams['primary_release_date.gte'] = `${options.minYear}-01-01`;

    const allMovies: Movie[] = [];
    for (let page = 1; page <= pages; page++) {
      try {
        const params = { ...baseParams, page: page.toString() };
        const data = await this.fetchFromTMDb('/discover/movie', params);
        allMovies.push(...data.results);
      } catch (error) {
        console.warn(`Failed to fetch ${country} movies page ${page}:`, error);
        break;
      }
    }

    return allMovies;
  }

  async getMoviesByDirector(directorId: number, sortBy: string = 'popularity.desc'): Promise<Movie[]> {
    const data = await this.fetchFromTMDb('/discover/movie', {
      with_crew: directorId.toString(),
      sort_by: sortBy,
      'vote_count.gte': '20'
    });
    return data.results;
  }

  async getMoviesByActor(actorId: number, sortBy: string = 'popularity.desc'): Promise<Movie[]> {
    const data = await this.fetchFromTMDb('/discover/movie', {
      with_cast: actorId.toString(),
      sort_by: sortBy,
      'vote_count.gte': '50'
    });
    return data.results;
  }

  async getDocumentaryFilms(options: {
    minRating?: number;
    minYear?: number;
    sortBy?: string;
    pages?: number;
  } = {}): Promise<Movie[]> {
    const { minRating = 6.5, sortBy = 'vote_average.desc', pages = 2 } = options;
    
    const baseParams: Record<string, string> = {
      with_genres: '99', // Documentary genre
      'vote_average.gte': minRating.toString(),
      'vote_count.gte': '20',
      sort_by: sortBy,
    };

    if (options.minYear) baseParams['primary_release_date.gte'] = `${options.minYear}-01-01`;

    const allMovies: Movie[] = [];
    for (let page = 1; page <= pages; page++) {
      try {
        const params = { ...baseParams, page: page.toString() };
        const data = await this.fetchFromTMDb('/discover/movie', params);
        allMovies.push(...data.results);
      } catch (error) {
        console.warn(`Failed to fetch documentaries page ${page}:`, error);
        break;
      }
    }

    return allMovies;
  }

  async getCultClassics(options: {
    minYear?: number;
    maxYear?: number;
    pages?: number;
  } = {}): Promise<Movie[]> {
    const { pages = 2 } = options;
    
    // Search for movies with cult-related keywords
    const cultKeywords = [14819, 4344, 157186]; // Cult film, Underground, Midnight movie
    
    return this.discoverMoviesByKeywords(cultKeywords, {
      ...options,
      minRating: 6.0,
      sortBy: 'vote_average.desc',
      pages
    });
  }

  // Helper methods for data enrichment
  private extractStreamingProviders(providersData: any): StreamingProvider[] {
    if (!providersData?.results) return [];
    
    const providers: StreamingProvider[] = [];
    const country = 'US'; // Default to US, could be made configurable
    
    const countryData = providersData.results[country];
    if (!countryData) return [];

    ['flatrate', 'rent', 'buy', 'ads'].forEach(type => {
      if (countryData[type]) {
        countryData[type].forEach((provider: any) => {
          providers.push({
            provider_id: provider.provider_id,
            provider_name: provider.provider_name,
            logo_path: provider.logo_path,
            display_priority: provider.display_priority,
            country,
            type: type as 'rent' | 'buy' | 'flatrate' | 'ads'
          });
        });
      }
    });

    return providers;
  }

  private categorizeBoxOffice(budget?: number, revenue?: number): 'blockbuster' | 'moderate' | 'indie' | 'unknown' {
    if (!budget && !revenue) return 'unknown';
    
    const budgetMil = (budget || 0) / 1000000;
    const revenueMil = (revenue || 0) / 1000000;
    
    if (budgetMil > 100 || revenueMil > 200) return 'blockbuster';
    if (budgetMil > 20 || revenueMil > 50) return 'moderate';
    return 'indie';
  }

  private categorizeCriticalConsensus(rating: number, voteCount: number): 'acclaimed' | 'mixed' | 'poor' | 'unknown' {
    if (voteCount < 50) return 'unknown';
    
    if (rating >= 8.0) return 'acclaimed';
    if (rating >= 6.0) return 'mixed';
    return 'poor';
  }

  private isIndieFilm(movie: any): boolean {
    const budgetMil = (movie.budget || 0) / 1000000;
    return budgetMil < 15 && movie.vote_count < 1000;
  }

  private isArthouseFilm(movie: any, keywords: Keyword[]): boolean {
    const arthouseKeywords = ['art house', 'auteur', 'experimental', 'avant-garde', 'minimalist'];
    const hasArthouseKeyword = keywords.some(k => 
      arthouseKeywords.some(ak => k.name.toLowerCase().includes(ak))
    );
    
    return hasArthouseKeyword || (movie.vote_average > 7.0 && movie.popularity < 30);
  }

  private isCultClassic(movie: any, keywords: Keyword[]): boolean {
    const cultKeywords = ['cult', 'midnight', 'underground', 'bizarre', 'surreal'];
    return keywords.some(k => 
      cultKeywords.some(ck => k.name.toLowerCase().includes(ck))
    );
  }

  // ... existing methods from original file ...
  async searchMovies(query: string, page: number = 1): Promise<{ results: Movie[], total_pages: number }> {
    const data = await this.fetchFromTMDb('/search/movie', { 
      query,
      page: page.toString() 
    });
    return data;
  }

  async getMoviesByGenre(genreId: number, page: number = 1): Promise<{ results: Movie[], total_pages: number }> {
    const data = await this.fetchFromTMDb('/discover/movie', {
      with_genres: genreId.toString(),
      page: page.toString(),
      sort_by: 'popularity.desc'
    });
    return data;
  }

  async getMovieDetails(movieId: number): Promise<Movie & { genres: Genre[], runtime: number }> {
    const data = await this.fetchFromTMDb(`/movie/${movieId}`);
    return data;
  }

  async getRecommendations(movieId: number): Promise<Movie[]> {
    const data = await this.fetchFromTMDb(`/movie/${movieId}/recommendations`);
    return data.results;
  }

  async getSimilarMovies(movieId: number): Promise<Movie[]> {
    const data = await this.fetchFromTMDb(`/movie/${movieId}/similar`);
    return data.results;
  }

  async getPersonalizedRecommendations(preferences: {
    genres: number[];
    minRating: number;
    minYear?: number;
    maxYear?: number;
    sortBy?: string;
    maxPages?: number;
  }): Promise<Movie[]> {
    const { genres, minRating, minYear, maxYear, sortBy = 'popularity.desc', maxPages = 3 } = preferences;
    
    const baseParams: Record<string, string> = {
      with_genres: genres.join(','),
      'vote_average.gte': minRating.toString(),
      'vote_count.gte': '100',
      sort_by: sortBy,
    };

    if (minYear) baseParams['primary_release_date.gte'] = `${minYear}-01-01`;
    if (maxYear) baseParams['primary_release_date.lte'] = `${maxYear}-12-31`;

    const allMovies: Movie[] = [];
    for (let page = 1; page <= maxPages; page++) {
      try {
        const params = { ...baseParams, page: page.toString() };
        const data = await this.fetchFromTMDb('/discover/movie', params);
        allMovies.push(...data.results);
      } catch (error) {
        console.warn(`Failed to fetch page ${page}:`, error);
        break;
      }
    }

    return allMovies;
  }

  async getMoviesByEra(decade: string, sortBy: string = 'popularity.desc', pages: number = 2): Promise<Movie[]> {
    const startYear = decade;
    const endYear = (parseInt(decade) + 9).toString();
    
    const allMovies: Movie[] = [];
    for (let page = 1; page <= pages; page++) {
      try {
        const params = {
          'primary_release_date.gte': `${startYear}-01-01`,
          'primary_release_date.lte': `${endYear}-12-31`,
          'vote_count.gte': '50',
          sort_by: sortBy,
          page: page.toString()
        };
        const data = await this.fetchFromTMDb('/discover/movie', params);
        allMovies.push(...data.results);
      } catch (error) {
        console.warn(`Failed to fetch ${decade}s movies page ${page}:`, error);
        break;
      }
    }

    return allMovies;
  }

  async getHiddenGems(minRating: number = 7.5, maxPopularity: number = 40, pages: number = 2): Promise<Movie[]> {
    const allMovies: Movie[] = [];
    
    for (let page = 1; page <= pages; page++) {
      try {
        const params = {
          'vote_average.gte': minRating.toString(),
          'vote_count.gte': '200',
          'popularity.lte': maxPopularity.toString(),
          sort_by: 'vote_average.desc',
          page: page.toString()
        };
        const data = await this.fetchFromTMDb('/discover/movie', params);
        allMovies.push(...data.results);
      } catch (error) {
        console.warn(`Failed to fetch hidden gems page ${page}:`, error);
        break;
      }
    }

    return allMovies;
  }

  getImageUrl(path: string | null, size: 'w200' | 'w300' | 'w500' | 'original' = 'w500'): string | null {
    if (!path) return null;
    return `${this.imageBaseUrl}/${size}${path}`;
  }
}

export const tmdbService = new TMDbService(); 