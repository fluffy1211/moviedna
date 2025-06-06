import { LetterboxdData, Movie } from './types';

// Note: Letterboxd doesn't have an official API, so this uses web scraping techniques
// In production, you might want to use a third-party service or cache heavily
class LetterboxdService {
  private readonly baseUrl = 'https://letterboxd.com';
  private readonly searchUrl = 'https://letterboxd.com/search/films';
  
  // Cache to avoid excessive requests
  private cache = new Map<string, LetterboxdData>();
  private cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours

  async searchFilm(title: string, year?: string): Promise<LetterboxdData | null> {
    const cacheKey = `${title}-${year || 'no-year'}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Search for the film
      const searchQuery = year ? `${title} ${year}` : title;
      const searchResults = await this.performSearch(searchQuery);
      
      if (searchResults.length === 0) {
        return null;
      }

      // Get the most relevant result (first one is usually best)
      const filmData = await this.getFilmData(searchResults[0]);
      
      if (filmData) {
        this.cache.set(cacheKey, filmData);
      }
      
      return filmData;
    } catch (error) {
      console.warn(`Failed to fetch Letterboxd data for ${title}:`, error);
      return null;
    }
  }

  async getFilmBySlug(slug: string): Promise<LetterboxdData | null> {
    const cacheKey = `slug-${slug}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const filmData = await this.getFilmData(slug);
      
      if (filmData) {
        this.cache.set(cacheKey, filmData);
      }
      
      return filmData;
    } catch (error) {
      console.warn(`Failed to fetch Letterboxd data for slug ${slug}:`, error);
      return null;
    }
  }

  private async performSearch(query: string): Promise<string[]> {
    // In a real implementation, you would:
    // 1. Make a request to Letterboxd search
    // 2. Parse the HTML response
    // 3. Extract film slugs from the search results
    
    // For now, we'll simulate this with a mock implementation
    // In production, you'd want to use a proper web scraping solution
    
    const mockResults = this.getMockSearchResults(query);
    return mockResults;
  }

  private async getFilmData(slug: string): Promise<LetterboxdData | null> {
    // In a real implementation, you would:
    // 1. Fetch the film page HTML
    // 2. Parse the structured data (JSON-LD)
    // 3. Extract ratings, reviews, and other metadata
    
    // For now, we'll simulate this with mock data
    return this.getMockFilmData(slug);
  }

  private getMockSearchResults(query: string): string[] {
    // Mock search results - in production, this would parse actual search results
    const mockFilms = [
      'the-shawshank-redemption',
      'the-godfather',
      'the-dark-knight',
      'pulp-fiction',
      'fight-club',
      'inception',
      'goodfellas',
      'the-matrix',
      'seven',
      'the-silence-of-the-lambs'
    ];
    
    // Return a relevant mock result based on the query
    const queryLower = query.toLowerCase();
    const matchingFilm = mockFilms.find(film => 
      queryLower.includes(film.replace(/-/g, ' ')) || 
      film.replace(/-/g, ' ').includes(queryLower.split(' ')[0])
    );
    
    return matchingFilm ? [matchingFilm] : [];
  }

  private getMockFilmData(slug: string): LetterboxdData | null {
    // Mock film data - in production, this would parse actual film pages
    const mockData: Record<string, LetterboxdData> = {
      'the-shawshank-redemption': {
        film_id: 'the-shawshank-redemption',
        slug: 'the-shawshank-redemption',
        rating: 4.5,
        watches: 2500000,
        fans: 450000,
        lists_count: 125000,
        reviews_count: 85000,
        popularity_rank: 1,
        top_250_rank: 1,
        is_cult_classic: false,
        themes: ['friendship', 'hope', 'redemption', 'prison'],
        similar_films: ['the-green-mile', 'the-count-of-monte-cristo', 'one-flew-over-the-cuckoos-nest']
      },
      'the-godfather': {
        film_id: 'the-godfather',
        slug: 'the-godfather',
        rating: 4.4,
        watches: 2200000,
        fans: 380000,
        lists_count: 110000,
        reviews_count: 75000,
        popularity_rank: 2,
        top_250_rank: 2,
        is_cult_classic: false,
        themes: ['family', 'crime', 'power', 'loyalty'],
        similar_films: ['goodfellas', 'casino', 'the-departed']
      },
      'fight-club': {
        film_id: 'fight-club',
        slug: 'fight-club',
        rating: 4.3,
        watches: 1800000,
        fans: 320000,
        lists_count: 95000,
        reviews_count: 65000,
        popularity_rank: 8,
        top_250_rank: 12,
        is_cult_classic: true,
        themes: ['masculinity', 'consumerism', 'identity', 'rebellion'],
        similar_films: ['american-psycho', 'requiem-for-a-dream', 'trainspotting']
      }
    };
    
    return mockData[slug] || null;
  }

  // Enhanced search that tries multiple strategies
  async enhancedSearch(movie: Movie): Promise<LetterboxdData | null> {
    const title = movie.title;
    const year = movie.release_date ? movie.release_date.substring(0, 4) : undefined;
    
    // Try exact title first
    let result = await this.searchFilm(title, year);
    if (result) return result;
    
    // Try without year
    result = await this.searchFilm(title);
    if (result) return result;
    
    // Try original title if different
    if (movie.original_title && movie.original_title !== title) {
      result = await this.searchFilm(movie.original_title, year);
      if (result) return result;
    }
    
    // Try simplified title (remove articles, punctuation)
    const simplifiedTitle = this.simplifyTitle(title);
    if (simplifiedTitle !== title) {
      result = await this.searchFilm(simplifiedTitle, year);
      if (result) return result;
    }
    
    return null;
  }

  private simplifyTitle(title: string): string {
    return title
      .replace(/^(The|A|An)\s+/i, '') // Remove leading articles
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .trim();
  }

  // Get curated lists and recommendations
  async getCuratedLists(): Promise<{ name: string; films: string[] }[]> {
    // Mock curated lists - in production, this would fetch actual Letterboxd lists
    return [
      {
        name: 'Letterboxd Top 250',
        films: ['the-shawshank-redemption', 'the-godfather', 'the-dark-knight']
      },
      {
        name: 'Cult Classics',
        films: ['fight-club', 'donnie-darko', 'the-rocky-horror-picture-show']
      },
      {
        name: 'Hidden Gems',
        films: ['moon', 'primer', 'the-man-from-earth']
      },
      {
        name: 'International Cinema',
        films: ['parasite', 'spirited-away', 'amelie']
      }
    ];
  }

  // Get trending films from Letterboxd
  async getTrendingFilms(): Promise<string[]> {
    // Mock trending - in production, this would fetch current trending films
    return [
      'oppenheimer',
      'barbie',
      'everything-everywhere-all-at-once',
      'the-batman',
      'dune'
    ];
  }

  // Batch search for multiple movies
  async batchSearch(movies: Movie[]): Promise<Map<number, LetterboxdData>> {
    const results = new Map<number, LetterboxdData>();
    
    // Process in batches to avoid overwhelming the service
    const batchSize = 5;
    for (let i = 0; i < movies.length; i += batchSize) {
      const batch = movies.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async movie => {
        const data = await this.enhancedSearch(movie);
        if (data) {
          results.set(movie.id, data);
        }
      });
      
      await Promise.allSettled(batchPromises);
      
      // Add a small delay between batches
      if (i + batchSize < movies.length) {
        await this.delay(100);
      }
    }
    
    return results;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Clear old cache entries
  clearOldCache(): void {
    const now = Date.now();
    // Note: This is a simplified cache implementation
    // In production, you'd want a more sophisticated cache with TTL per entry
    if (this.cache.size > 1000) {
      this.cache.clear();
    }
  }
}

export const letterboxdService = new LetterboxdService(); 