import { StreamingProvider } from './types';

interface JustWatchProvider {
  id: number;
  name: string;
  icon_url: string;
  slug: string;
  type: 'flatrate' | 'rent' | 'buy' | 'ads';
  monetization_types: string[];
}

interface JustWatchOffer {
  provider: JustWatchProvider;
  price?: {
    amount: number;
    currency: string;
  };
  quality: 'sd' | 'hd' | 'uhd';
  url: string;
}

interface JustWatchResult {
  id: number;
  title: string;
  offers: JustWatchOffer[];
  scoring: {
    tmdb_rating: number;
    imdb_rating?: number;
  };
}

class JustWatchService {
  private readonly baseUrl = 'https://apis.justwatch.com/content';
  private readonly graphqlUrl = 'https://apis.justwatch.com/graphql';
  
  // Popular streaming providers by region
  private readonly popularProviders = {
    US: ['nfx', 'hulu', 'dnp', 'hbo', 'atp', 'max'], // Netflix, Hulu, Disney+, HBO, Apple TV+, Max
    UK: ['nfx', 'bbci', 'atp', 'dnp', 'sky'],
    CA: ['nfx', 'atp', 'dnp', 'cbc'],
    AU: ['nfx', 'atp', 'dnp', 'stan'],
    DE: ['nfx', 'atp', 'dnp', 'wow', 'rtl'],
    FR: ['nfx', 'atp', 'dnp', 'ocg', 'sho']
  };

  async searchMovie(title: string, year?: number, country: string = 'US'): Promise<JustWatchResult[]> {
    try {
      // JustWatch doesn't have a public API, so this would typically use their unofficial GraphQL endpoint
      // For now, we'll provide mock data that simulates their response structure
      return this.getMockSearchResults(title, year, country);
    } catch (error) {
      console.warn(`Failed to search JustWatch for ${title}:`, error);
      return [];
    }
  }

  async getStreamingAvailability(tmdbId: number, country: string = 'US'): Promise<StreamingProvider[]> {
    try {
      // In a real implementation, this would map TMDB ID to JustWatch content
      // and fetch current streaming availability
      return this.getMockStreamingProviders(tmdbId, country);
    } catch (error) {
      console.warn(`Failed to get streaming availability for TMDB ID ${tmdbId}:`, error);
      return [];
    }
  }

  async batchGetAvailability(tmdbIds: number[], country: string = 'US'): Promise<Map<number, StreamingProvider[]>> {
    const results = new Map<number, StreamingProvider[]>();
    
    // Process in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < tmdbIds.length; i += batchSize) {
      const batch = tmdbIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async tmdbId => {
        const providers = await this.getStreamingAvailability(tmdbId, country);
        results.set(tmdbId, providers);
      });
      
      await Promise.allSettled(batchPromises);
      
      // Add delay between batches
      if (i + batchSize < tmdbIds.length) {
        await this.delay(200);
      }
    }
    
    return results;
  }

  async getProviderCatalog(providerId: string, country: string = 'US', genres?: string[]): Promise<JustWatchResult[]> {
    try {
      // Get movies available on a specific streaming service
      return this.getMockProviderCatalog(providerId, country, genres);
    } catch (error) {
      console.warn(`Failed to get catalog for provider ${providerId}:`, error);
      return [];
    }
  }

  async getNewReleases(country: string = 'US', providers?: string[]): Promise<JustWatchResult[]> {
    try {
      // Get recently added movies to streaming services
      return this.getMockNewReleases(country, providers);
    } catch (error) {
      console.warn(`Failed to get new releases for ${country}:`, error);
      return [];
    }
  }

  async getLeavingSoon(country: string = 'US', providers?: string[]): Promise<JustWatchResult[]> {
    try {
      // Get movies leaving streaming services soon
      return this.getMockLeavingSoon(country, providers);
    } catch (error) {
      console.warn(`Failed to get leaving soon for ${country}:`, error);
      return [];
    }
  }

  // Mock implementations - in production, these would make actual API calls
  private getMockSearchResults(title: string, year?: number, country: string = 'US'): JustWatchResult[] {
    const mockMovies: Record<string, JustWatchResult> = {
      'inception': {
        id: 12345,
        title: 'Inception',
        offers: [
          {
            provider: { id: 8, name: 'Netflix', icon_url: '/netflix.png', slug: 'nfx', type: 'flatrate', monetization_types: ['flatrate'] },
            quality: 'hd',
            url: 'https://netflix.com/title/123'
          },
          {
            provider: { id: 2, name: 'Apple TV', icon_url: '/appletv.png', slug: 'atp', type: 'rent', monetization_types: ['rent', 'buy'] },
            price: { amount: 3.99, currency: 'USD' },
            quality: 'uhd',
            url: 'https://tv.apple.com/movie/123'
          }
        ],
        scoring: { tmdb_rating: 8.8, imdb_rating: 8.8 }
      },
      'the matrix': {
        id: 12346,
        title: 'The Matrix',
        offers: [
          {
            provider: { id: 1, name: 'HBO Max', icon_url: '/hbo.png', slug: 'hbo', type: 'flatrate', monetization_types: ['flatrate'] },
            quality: 'uhd',
            url: 'https://hbomax.com/series/123'
          }
        ],
        scoring: { tmdb_rating: 8.7, imdb_rating: 8.7 }
      }
    };

    const key = title.toLowerCase();
    const match = mockMovies[key];
    return match ? [match] : [];
  }

  private getMockStreamingProviders(tmdbId: number, country: string): StreamingProvider[] {
    // Mock streaming providers based on TMDB ID patterns
    const providers: StreamingProvider[] = [];
    
    // Simulate different availability patterns
    if (tmdbId % 3 === 0) {
      providers.push({
        provider_id: 8,
        provider_name: 'Netflix',
        logo_path: '/netflix.png',
        display_priority: 1,
        country,
        type: 'flatrate'
      });
    }
    
    if (tmdbId % 4 === 0) {
      providers.push({
        provider_id: 384,
        provider_name: 'HBO Max',
        logo_path: '/hbo.png',
        display_priority: 2,
        country,
        type: 'flatrate'
      });
    }
    
    if (tmdbId % 5 === 0) {
      providers.push({
        provider_id: 337,
        provider_name: 'Disney+',
        logo_path: '/disney.png',
        display_priority: 3,
        country,
        type: 'flatrate'
      });
    }
    
    // Always add rental options
    providers.push({
      provider_id: 2,
      provider_name: 'Apple TV',
      logo_path: '/appletv.png',
      display_priority: 10,
      country,
      type: 'rent'
    });

    return providers;
  }

  private getMockProviderCatalog(providerId: string, country: string, genres?: string[]): JustWatchResult[] {
    // Mock catalog based on provider
    const catalogs: Record<string, JustWatchResult[]> = {
      'nfx': [
        { id: 1, title: 'Stranger Things', offers: [], scoring: { tmdb_rating: 8.7 } },
        { id: 2, title: 'The Crown', offers: [], scoring: { tmdb_rating: 8.6 } },
        { id: 3, title: 'Ozark', offers: [], scoring: { tmdb_rating: 8.4 } }
      ],
      'hbo': [
        { id: 4, title: 'The Sopranos', offers: [], scoring: { tmdb_rating: 9.2 } },
        { id: 5, title: 'Game of Thrones', offers: [], scoring: { tmdb_rating: 9.3 } },
        { id: 6, title: 'True Detective', offers: [], scoring: { tmdb_rating: 8.9 } }
      ],
      'dnp': [
        { id: 7, title: 'The Mandalorian', offers: [], scoring: { tmdb_rating: 8.7 } },
        { id: 8, title: 'WandaVision', offers: [], scoring: { tmdb_rating: 7.9 } },
        { id: 9, title: 'Loki', offers: [], scoring: { tmdb_rating: 8.2 } }
      ]
    };

    return catalogs[providerId] || [];
  }

  private getMockNewReleases(country: string, providers?: string[]): JustWatchResult[] {
    return [
      { id: 100, title: 'Latest Blockbuster', offers: [], scoring: { tmdb_rating: 7.5 } },
      { id: 101, title: 'New Indie Film', offers: [], scoring: { tmdb_rating: 8.1 } },
      { id: 102, title: 'Recent Documentary', offers: [], scoring: { tmdb_rating: 7.8 } }
    ];
  }

  private getMockLeavingSoon(country: string, providers?: string[]): JustWatchResult[] {
    return [
      { id: 200, title: 'Leaving Netflix Soon', offers: [], scoring: { tmdb_rating: 8.2 } },
      { id: 201, title: 'HBO Departure', offers: [], scoring: { tmdb_rating: 7.9 } },
      { id: 202, title: 'Limited Time Left', offers: [], scoring: { tmdb_rating: 8.0 } }
    ];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper methods
  getPopularProviders(country: string = 'US'): string[] {
    return this.popularProviders[country as keyof typeof this.popularProviders] || this.popularProviders.US;
  }

  formatProviderName(slug: string): string {
    const nameMap: Record<string, string> = {
      'nfx': 'Netflix',
      'hulu': 'Hulu',
      'dnp': 'Disney+',
      'hbo': 'HBO Max',
      'atp': 'Apple TV+',
      'max': 'Max',
      'bbci': 'BBC iPlayer',
      'sky': 'Sky',
      'cbc': 'CBC Gem',
      'stan': 'Stan',
      'wow': 'WOW',
      'rtl': 'RTL+',
      'ocg': 'Orange',
      'sho': 'Showtime'
    };
    
    return nameMap[slug] || slug.toUpperCase();
  }
}

export const justWatchService = new JustWatchService(); 