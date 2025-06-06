// Preload critical data to improve perceived performance

import { fetchJson } from './api-utils';

export class PreloadManager {
  private preloadPromises = new Map<string, Promise<any>>();

  async preloadGenres() {
    if (!this.preloadPromises.has('genres')) {
      const promise = fetchJson('/api/tmdb/genres', { retries: 2 });
      this.preloadPromises.set('genres', promise);
    }
    return this.preloadPromises.get('genres');
  }

  async preloadPopularMovies() {
    if (!this.preloadPromises.has('popular')) {
      const promise = fetchJson('/api/tmdb/popular', { retries: 2 });
      this.preloadPromises.set('popular', promise);
    }
    return this.preloadPromises.get('popular');
  }

  async preloadCriticalData() {
    try {
      // Preload both genres and popular movies in parallel
      await Promise.allSettled([
        this.preloadGenres(),
        this.preloadPopularMovies()
      ]);
    } catch (error) {
      console.warn('Preload failed:', error);
    }
  }

  clearCache() {
    this.preloadPromises.clear();
  }
}

export const preloadManager = new PreloadManager();

// Auto-preload on module load in browser
if (typeof window !== 'undefined') {
  // Delay preload slightly to not interfere with critical path
  setTimeout(() => {
    preloadManager.preloadCriticalData();
  }, 1000);
} 