import { 
  EnhancedMovie, 
  MoviePreferences, 
  EnhancedRecommendation, 
  RecommendationContext,
  RecommendationReason
} from './types';
import { movieAggregator } from './movie-aggregator';

interface UserProfile {
  preferences: MoviePreferences;
  viewing_history: number[];
  ratings: Map<number, number>;
  genres_affinity: Map<number, number>;
  director_affinity: Map<string, number>;
  actor_affinity: Map<string, number>;
  decade_affinity: Map<string, number>;
  theme_affinity: Map<string, number>;
}

interface MovieFeatures {
  genre_vector: number[];
  decade_score: number;
  popularity_score: number;
  quality_score: number;
  indie_score: number;
  international_score: number;
  cult_score: number;
  director_score: number;
  theme_vector: number[];
}

interface SimilarityMatrix {
  content_similarity: Map<string, number>;
  user_similarity: Map<string, number>;
  hybrid_score: number;
}

class EnhancedRecommendationEngine {
  private userProfiles = new Map<string, UserProfile>();
  private movieFeatures = new Map<number, MovieFeatures>();
  private genreList = [28, 35, 18, 27, 10749, 878, 53, 16, 80, 99, 37, 36, 14, 10752, 9648];
  private themeList = ['friendship', 'love', 'family', 'revenge', 'war', 'coming-of-age', 'redemption', 'sacrifice'];

  async generateEnhancedRecommendations(
    userId: string,
    context: RecommendationContext,
    candidateMovies: EnhancedMovie[]
  ): Promise<EnhancedRecommendation[]> {
    
    // Build or update user profile
    const userProfile = await this.buildUserProfile(userId, context);
    
    // Extract features for all candidate movies
    const movieFeatures = this.extractMovieFeatures(candidateMovies);
    
    // Generate recommendations using hybrid approach
    const recommendations = await this.hybridRecommendation(
      userProfile,
      candidateMovies,
      movieFeatures,
      context
    );
    
    // Apply contextual filtering
    const contextualRecommendations = this.applyContextualFiltering(
      recommendations,
      context
    );
    
    // Rank and diversify results
    const finalRecommendations = this.rankAndDiversify(
      contextualRecommendations,
      context.discovery_preference || 'mixed'
    );
    
    return finalRecommendations;
  }

  private async buildUserProfile(userId: string, context: RecommendationContext): Promise<UserProfile> {
    let profile = this.userProfiles.get(userId);
    
    if (!profile) {
      profile = {
        preferences: context.user_preferences,
        viewing_history: context.viewing_history || [],
        ratings: new Map(),
        genres_affinity: new Map(),
        director_affinity: new Map(),
        actor_affinity: new Map(),
        decade_affinity: new Map(),
        theme_affinity: new Map()
      };
    }

    // Update profile with new preferences
    profile.preferences = { ...profile.preferences, ...context.user_preferences };
    
    // Calculate genre affinity from preferences
    context.user_preferences.favoriteGenres.forEach(genreId => {
      const currentAffinity = profile!.genres_affinity.get(genreId) || 0;
      profile!.genres_affinity.set(genreId, Math.min(1.0, currentAffinity + 0.2));
    });
    
    // Calculate decade affinity
    context.user_preferences.preferredDecades.forEach(decade => {
      const currentAffinity = profile!.decade_affinity.get(decade) || 0;
      profile!.decade_affinity.set(decade, Math.min(1.0, currentAffinity + 0.15));
    });

    this.userProfiles.set(userId, profile);
    return profile;
  }

  private extractMovieFeatures(movies: EnhancedMovie[]): Map<number, MovieFeatures> {
    const features = new Map<number, MovieFeatures>();
    
    movies.forEach(movie => {
      if (this.movieFeatures.has(movie.id)) {
        features.set(movie.id, this.movieFeatures.get(movie.id)!);
        return;
      }

      const movieFeature: MovieFeatures = {
              genre_vector: this.createGenreVector(movie.genre_ids || []),
      decade_score: this.calculateDecadeScore(movie.release_date || ''),
        popularity_score: this.normalizePopularity(movie.popularity || 0),
        quality_score: this.calculateQualityScore(movie),
        indie_score: movie.is_indie ? 1.0 : 0.0,
        international_score: this.calculateInternationalScore(movie),
        cult_score: movie.is_cult_classic ? 1.0 : 0.0,
        director_score: this.calculateDirectorScore(movie),
        theme_vector: this.createThemeVector(movie.themes || [])
      };

      features.set(movie.id, movieFeature);
      this.movieFeatures.set(movie.id, movieFeature);
    });

    return features;
  }

  private async hybridRecommendation(
    userProfile: UserProfile,
    movies: EnhancedMovie[],
    movieFeatures: Map<number, MovieFeatures>,
    context: RecommendationContext
  ): Promise<EnhancedRecommendation[]> {
    
    const recommendations: EnhancedRecommendation[] = [];
    
    movies.forEach(movie => {
      const features = movieFeatures.get(movie.id);
      if (!features) return;

      // Content-based score
      const contentScore = this.calculateContentBasedScore(userProfile, movie, features);
      
      // Collaborative filtering score
      const collaborativeScore = this.calculateCollaborativeScore(userProfile, movie);
      
      // Contextual score
      const contextualScore = this.calculateContextualScore(movie, context, features);
      
      // Popularity-based score
      const popularityScore = this.calculatePopularityScore(movie, context.discovery_preference);
      
      // Combine scores with weights
      const hybridScore = (
        contentScore * 0.4 +
        collaborativeScore * 0.2 +
        contextualScore * 0.3 +
        popularityScore * 0.1
      );
      
      // Calculate confidence
      const confidence = this.calculateConfidence(movie, userProfile, features);
      
      // Generate reasons
      const reasons = this.generateReasons(movie, userProfile, features, {
        contentScore,
        collaborativeScore,
        contextualScore,
        popularityScore
      });
      
      // Estimate enjoyment likelihood
      const estimatedEnjoyment = this.estimateEnjoyment(hybridScore, confidence, movie);
      
      recommendations.push({
        movie,
        score: hybridScore,
        confidence,
        reasons,
        tags: this.generateTags(movie, features),
        watch_priority: this.calculateWatchPriority(hybridScore, confidence, context),
        estimated_enjoyment: estimatedEnjoyment
      });
    });

    return recommendations;
  }

  private calculateContentBasedScore(
    userProfile: UserProfile,
    movie: EnhancedMovie,
    features: MovieFeatures
  ): number {
    let score = 0;
    
    // Genre similarity
    const genreScore = this.calculateGenreSimilarity(userProfile.genres_affinity, features.genre_vector);
    score += genreScore * 0.3;
    
    // Decade preference
    const decade = movie.decade;
    if (decade) {
      const decadeAffinity = userProfile.decade_affinity.get(decade) || 0;
      score += decadeAffinity * 0.2;
    }
    
    // Quality preference
    const ratingScore = (movie.vote_average || 0) >= userProfile.preferences.ratingThreshold ? 0.2 : 0;
    score += ratingScore;
    
    // Director affinity
    if (movie.director) {
      const directorAffinity = userProfile.director_affinity.get(movie.director) || 0;
      score += directorAffinity * 0.15;
    }
    
    // Theme similarity
    if (movie.themes && movie.themes.length > 0) {
      const themeScore = this.calculateThemeSimilarity(userProfile.theme_affinity, features.theme_vector);
      score += themeScore * 0.15;
    }
    
    return Math.min(1.0, score);
  }

  private calculateCollaborativeScore(userProfile: UserProfile, movie: EnhancedMovie): number {
    let score = 0;
    
    // Use Letterboxd data as proxy for collaborative filtering
    if (movie.letterboxd_watches && movie.letterboxd_rating) {
      const popularityNormalized = Math.min(1.0, movie.letterboxd_watches / 1000000);
      const ratingNormalized = movie.letterboxd_rating / 5.0;
      score = (popularityNormalized * 0.3 + ratingNormalized * 0.7) * 0.8;
    }
    
    // Genre overlap boost
    if (userProfile.viewing_history.length > 0 && movie.genre_ids && Array.isArray(movie.genre_ids)) {
      const genreOverlap = movie.genre_ids.filter(genreId => 
        userProfile.preferences.favoriteGenres.includes(genreId)
      ).length;
      score += (genreOverlap / Math.max(1, movie.genre_ids.length)) * 0.2;
    }
    
    return Math.min(1.0, score);
  }

  private calculateContextualScore(
    movie: EnhancedMovie,
    context: RecommendationContext,
    features: MovieFeatures
  ): number {
    let score = 0;
    
    // Streaming availability
    if (context.streaming_services && movie.streaming_providers) {
      const hasPreferredStreaming = movie.streaming_providers.some(provider =>
        context.streaming_services!.some(service => 
          provider.provider_name.toLowerCase().includes(service.toLowerCase())
        )
      );
      if (hasPreferredStreaming) score += 0.3;
    }
    
    // Watch context
    if (context.watch_with) {
      score += this.getWatchContextScore(movie, context.watch_with);
    }
    
    // Available time
    if (context.available_time && movie.runtime) {
      const timeFit = context.available_time >= movie.runtime ? 0.2 : -0.1;
      score += timeFit;
    }
    
    // Current mood
    if (context.current_mood) {
      score += this.getMoodScore(movie, context.current_mood);
    }
    
    return Math.max(0, Math.min(1.0, score));
  }

  private calculatePopularityScore(movie: EnhancedMovie, discoveryPreference?: string): number {
    const popularity = movie.popularity || 0;
    const normalizedPopularity = Math.min(1.0, popularity / 100);
    
    switch (discoveryPreference) {
      case 'safe':
        return normalizedPopularity;
      case 'adventurous':
        return 1.0 - normalizedPopularity;
      case 'mixed':
      default:
        return 0.5;
    }
  }

  private applyContextualFiltering(
    recommendations: EnhancedRecommendation[],
    context: RecommendationContext
  ): EnhancedRecommendation[] {
    return recommendations.filter(rec => {
      if (context.available_time && rec.movie.runtime) {
        if (rec.movie.runtime > context.available_time + 30) {
          return false;
        }
      }
      
      if (context.streaming_services && context.streaming_services.length > 0) {
        if (!rec.movie.streaming_providers || rec.movie.streaming_providers.length === 0) {
          rec.score *= 0.7;
        }
      }
      
      return true;
    });
  }

  private rankAndDiversify(
    recommendations: EnhancedRecommendation[],
    discoveryPreference: string
  ): EnhancedRecommendation[] {
    recommendations.sort((a, b) => b.score - a.score);
    
    const diversified: EnhancedRecommendation[] = [];
    const usedGenres = new Set<number>();
    const usedDecades = new Set<string>();
    const usedDirectors = new Set<string>();
    
    for (const rec of recommendations) {
      if (diversified.length >= 12) break;
      
      const hasNewGenre = rec.movie.genre_ids && Array.isArray(rec.movie.genre_ids) ? 
        rec.movie.genre_ids.some(g => !usedGenres.has(g)) : false;
      const hasNewDecade = rec.movie.decade && !usedDecades.has(rec.movie.decade);
      const hasNewDirector = rec.movie.director && !usedDirectors.has(rec.movie.director);
      
      const diversityBonus = discoveryPreference === 'adventurous' ? 
        (hasNewGenre ? 0.1 : 0) + (hasNewDecade ? 0.05 : 0) + (hasNewDirector ? 0.05 : 0) : 0;
      
      if (hasNewGenre || hasNewDecade || rec.score >= 0.7 || diversified.length < 6) {
        rec.score += diversityBonus;
        diversified.push(rec);
        
        if (rec.movie.genre_ids && Array.isArray(rec.movie.genre_ids)) {
          rec.movie.genre_ids.forEach(g => usedGenres.add(g));
        }
        if (rec.movie.decade) usedDecades.add(rec.movie.decade);
        if (rec.movie.director) usedDirectors.add(rec.movie.director);
      }
    }
    
    for (const rec of recommendations) {
      if (diversified.length >= 15) break;
      if (!diversified.find(d => d.movie.id === rec.movie.id)) {
        diversified.push(rec);
      }
    }
    
    diversified.sort((a, b) => b.score - a.score);
    return diversified.slice(0, 12);
  }

  // Helper methods
  private createGenreVector(genreIds: number[]): number[] {
    const vector = new Array(this.genreList.length).fill(0);
    if (genreIds && Array.isArray(genreIds)) {
      genreIds.forEach(genreId => {
        const index = this.genreList.indexOf(genreId);
        if (index !== -1) vector[index] = 1;
      });
    }
    return vector;
  }

  private createThemeVector(themes: string[]): number[] {
    const vector = new Array(this.themeList.length).fill(0);
    themes.forEach(theme => {
      const index = this.themeList.findIndex(t => t.toLowerCase() === theme.toLowerCase());
      if (index !== -1) vector[index] = 1;
    });
    return vector;
  }

  private calculateGenreSimilarity(genreAffinity: Map<number, number>, genreVector: number[]): number {
    let similarity = 0;
    this.genreList.forEach((genreId, index) => {
      const affinity = genreAffinity.get(genreId) || 0;
      similarity += affinity * genreVector[index];
    });
    return Math.min(1.0, similarity / Math.max(1, genreAffinity.size));
  }

  private calculateThemeSimilarity(themeAffinity: Map<string, number>, themeVector: number[]): number {
    let similarity = 0;
    this.themeList.forEach((theme, index) => {
      const affinity = themeAffinity.get(theme) || 0;
      similarity += affinity * themeVector[index];
    });
    return Math.min(1.0, similarity / Math.max(1, themeAffinity.size));
  }

  private calculateDecadeScore(releaseDate: string): number {
    if (!releaseDate) return 0;
    const year = parseInt(releaseDate.substring(0, 4));
    const decade = Math.floor(year / 10) * 10;
    return decade / 2020;
  }

  private normalizePopularity(popularity: number): number {
    return Math.min(1.0, popularity / 100);
  }

  private calculateQualityScore(movie: EnhancedMovie): number {
    let score = (movie.vote_average || 0) / 10;
    
    if (movie.letterboxd_rating) {
      score = (score + movie.letterboxd_rating / 5) / 2;
    }
    
    if (movie.critical_consensus === 'acclaimed') score += 0.1;
    if (movie.is_cult_classic) score += 0.05;
    
    return Math.min(1.0, score);
  }

  private calculateInternationalScore(movie: EnhancedMovie): number {
    if (movie.original_language && movie.original_language !== 'en') return 1.0;
    if (movie.production_countries?.some(c => c.iso_3166_1 !== 'US')) return 0.5;
    return 0.0;
  }

  private calculateDirectorScore(movie: EnhancedMovie): number {
    return movie.director ? 0.5 : 0.0;
  }

  private calculateConfidence(
    movie: EnhancedMovie,
    userProfile: UserProfile,
    features: MovieFeatures
  ): number {
    let confidence = 0.5;
    
    if (movie.data_quality) {
      confidence += movie.data_quality.completeness_score * 0.3;
    }
    
    const profileCompleteness = (
      userProfile.preferences.favoriteGenres.length +
      userProfile.preferences.preferredDecades.length +
      userProfile.viewing_history.length
    ) / 15;
    
    confidence += Math.min(0.2, profileCompleteness);
    
    return Math.min(1.0, confidence);
  }

  private generateReasons(
    movie: EnhancedMovie,
    userProfile: UserProfile,
    features: MovieFeatures,
    scores: any
  ): RecommendationReason[] {
    const reasons: RecommendationReason[] = [];
    
    const matchingGenres = (movie.genre_ids && Array.isArray(movie.genre_ids)) ? 
      movie.genre_ids.filter(g => userProfile.preferences.favoriteGenres.includes(g)) : [];
    if (matchingGenres.length > 0) {
      reasons.push({
        type: 'genre',
        message: `Matches ${matchingGenres.length} of your favorite genres`,
        weight: scores.contentScore * 0.3
      });
    }
    
    if ((movie.vote_average || 0) >= userProfile.preferences.ratingThreshold + 1) {
      reasons.push({
        type: 'mood',
                  message: `Excellent rating (${movie.vote_average || 0}/10)`,
        weight: 0.2
      });
    }
    
    if (movie.streaming_providers && movie.streaming_providers.length > 0) {
      reasons.push({
        type: 'streaming',
        message: `Available on ${movie.streaming_providers[0].provider_name}`,
        weight: 0.15
      });
    }
    
    if (movie.is_cult_classic) {
      reasons.push({
        type: 'hidden_gem',
        message: 'Cult classic with devoted following',
        weight: 0.1
      });
    }
    
    if (movie.is_indie) {
      reasons.push({
        type: 'hidden_gem',
        message: 'Independent film with unique perspective',
        weight: 0.1
      });
    }
    
    return reasons.sort((a, b) => b.weight - a.weight).slice(0, 3);
  }

  private generateTags(movie: EnhancedMovie, features: MovieFeatures): string[] {
    const tags: string[] = [];
    
    if (features.quality_score > 0.8) tags.push('high-quality');
    if (features.indie_score > 0) tags.push('indie');
    if (features.international_score > 0) tags.push('international');
    if (features.cult_score > 0) tags.push('cult-classic');
    if (movie.critical_consensus === 'acclaimed') tags.push('critically-acclaimed');
    if (movie.box_office_category === 'blockbuster') tags.push('blockbuster');
    if (movie.decade === '2020s') tags.push('recent');
    
    return tags;
  }

  private calculateWatchPriority(
    score: number,
    confidence: number,
    context: RecommendationContext
  ): 'high' | 'medium' | 'low' {
    const priorityScore = score * confidence;
    
    if (priorityScore > 0.7) return 'high';
    if (priorityScore > 0.4) return 'medium';
    return 'low';
  }

  private estimateEnjoyment(score: number, confidence: number, movie: EnhancedMovie): number {
    let enjoyment = score * 10;
    
    enjoyment = enjoyment * confidence + (10 - enjoyment) * (1 - confidence) * 0.5;
    
    if ((movie.vote_average || 0) > 8) {
      enjoyment += 0.5;
    }
    
    return Math.min(10, Math.max(0, enjoyment));
  }

  private getWatchContextScore(movie: EnhancedMovie, watchWith: string): number {
    if (!movie.genre_ids || !Array.isArray(movie.genre_ids)) return 0;
    
    switch (watchWith) {
      case 'family':
        return movie.genre_ids.includes(16) || 
               movie.genre_ids.includes(12) ||
               movie.adult === false ? 0.2 : -0.1;
      case 'date':
        return movie.genre_ids.includes(10749) || 
               movie.genre_ids.includes(35) ? 0.2 : 0;
      case 'friends':
        return movie.genre_ids.includes(28) || 
               movie.genre_ids.includes(35) ||
               movie.genre_ids.includes(27) ? 0.15 : 0;
      default:
        return 0;
    }
  }

  private getMoodScore(movie: EnhancedMovie, mood: string): number {
    if (!movie.genre_ids || !Array.isArray(movie.genre_ids)) return 0;
    
    const moodGenreMap: Record<string, number[]> = {
      'happy': [35, 16, 10749],
      'sad': [18],
      'excited': [28, 12, 53],
      'relaxed': [99, 36],
      'scared': [27],
      'thoughtful': [878, 18]
    };
    
    const relevantGenres = moodGenreMap[mood.toLowerCase()] || [];
    const hasRelevantGenre = movie.genre_ids.some(g => relevantGenres.includes(g));
    
    return hasRelevantGenre ? 0.2 : 0;
  }
}

export const enhancedRecommendationEngine = new EnhancedRecommendationEngine(); 