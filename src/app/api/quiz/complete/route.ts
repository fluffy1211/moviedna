import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@/generated/prisma'
import { MoviePreferences, MovieRecommendation, QuizCompletionResult, Movie, EnhancedMovie, RecommendationContext, EnhancedRecommendation } from '@/lib/types'
import { movieAggregator } from '@/lib/movie-aggregator'
import { enhancedRecommendationEngine } from '@/lib/enhanced-recommendation-engine'
import { generateRecommendations } from '@/lib/recommendation-utils'

const prisma = new PrismaClient()

// Enhanced recommendations using the new recommendation engine
async function generateEnhancedRecommendations(
  preferences: MoviePreferences, 
  userId: string
): Promise<MovieRecommendation[]> {
  try {
    // Get diverse movies from our enhanced endpoint
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/tmdb/discover?enriched=true&include_letterboxd=true&include_streaming=true`);
    
    if (!response.ok) {
      throw new Error(`Discovery API responded with status: ${response.status}`);
    }

    const candidateMovies: EnhancedMovie[] = await response.json();
    
    if (!Array.isArray(candidateMovies) || candidateMovies.length === 0) {
      throw new Error('No candidate movies received from discovery API');
    }

    console.log(`Using ${candidateMovies.length} candidate movies for enhanced recommendations`);

    // Create recommendation context
    const context: RecommendationContext = {
      user_preferences: preferences,
      discovery_preference: determineDiscoveryPreference(preferences),
      streaming_services: ['netflix', 'hulu', 'disney+', 'hbo max', 'apple tv+'] // Default popular services
    };

    // Generate enhanced recommendations
    const enhancedRecommendations = await enhancedRecommendationEngine.generateEnhancedRecommendations(
      userId,
      context,
      candidateMovies
    );

    // Convert enhanced recommendations to the format expected by the frontend
    return enhancedRecommendations.map(rec => ({
      movie: rec.movie,
      score: Math.round(rec.score * 100), // Convert to 0-100 scale
      reasons: rec.reasons.map(r => r.message)
    }));

  } catch (error) {
    console.warn('Enhanced recommendations failed, falling back to legacy system:', error);
    return generateRecommendations(preferences);
  }
}

// Determine user's discovery preference based on their quiz answers
function determineDiscoveryPreference(preferences: MoviePreferences): 'safe' | 'adventurous' | 'mixed' {
  const { favoriteGenres, ratingThreshold, moodPreferences } = preferences;
  
  let adventurousScore = 0;
  let safeScore = 0;
  
  // High rating threshold suggests preferring safe, acclaimed movies
  if (ratingThreshold >= 8.0) {
    safeScore += 2;
  } else if (ratingThreshold <= 6.5) {
    adventurousScore += 2;
  }
  
  // Certain genres suggest adventurous taste
  const adventurousGenres = [27, 878, 99, 36, 14]; // Horror, Sci-Fi, Documentary, History, Fantasy
  const safeGenres = [35, 10749, 16, 12]; // Comedy, Romance, Animation, Adventure
  
  if (Array.isArray(favoriteGenres)) {
    favoriteGenres.forEach(genreId => {
      if (adventurousGenres.includes(genreId)) adventurousScore++;
      if (safeGenres.includes(genreId)) safeScore++;
    });
  }
  
  // Mood preferences
  const adventurousMoods = ['mystery', 'thriller', 'sci-fi'];
  const safeMoods = ['comedy', 'action'];
  
  if (Array.isArray(moodPreferences)) {
    moodPreferences.forEach(mood => {
      if (adventurousMoods.includes(mood)) adventurousScore++;
      if (safeMoods.includes(mood)) safeScore++;
    });
  }
  
  if (adventurousScore > safeScore + 1) return 'adventurous';
  if (safeScore > adventurousScore + 1) return 'safe';
  return 'mixed';
}



function determinePersonalityType(preferences: MoviePreferences): string {
  const { favoriteGenres, moodPreferences, ratingThreshold } = preferences
  
  // Count genre preferences to determine primary type
  const genreCounts = new Map<string, number>()
  
  // Ensure favoriteGenres is an array before iterating
  if (Array.isArray(favoriteGenres)) {
    favoriteGenres.forEach(genreId => {
      switch (genreId) {
        case 28: genreCounts.set('action', (genreCounts.get('action') || 0) + 1); break
        case 35: genreCounts.set('comedy', (genreCounts.get('comedy') || 0) + 1); break
        case 18: genreCounts.set('drama', (genreCounts.get('drama') || 0) + 1); break
        case 878: genreCounts.set('sci-fi', (genreCounts.get('sci-fi') || 0) + 1); break
        case 27: genreCounts.set('horror', (genreCounts.get('horror') || 0) + 1); break
        case 53: genreCounts.set('thriller', (genreCounts.get('thriller') || 0) + 1); break
        case 10749: genreCounts.set('romance', (genreCounts.get('romance') || 0) + 1); break
        case 16: genreCounts.set('animation', (genreCounts.get('animation') || 0) + 1); break
        case 80: genreCounts.set('crime', (genreCounts.get('crime') || 0) + 1); break
        case 99: genreCounts.set('documentary', (genreCounts.get('documentary') || 0) + 1); break
      }
    })
  }
  
  // Also consider mood preferences
  if (Array.isArray(moodPreferences)) {
    moodPreferences.forEach(mood => {
      genreCounts.set(mood, (genreCounts.get(mood) || 0) + 0.5)
    })
  }
  
  // Find the dominant preference
  let dominantType = 'eclectic'
  let maxCount = 0
  
  for (const [type, count] of genreCounts.entries()) {
    if (count > maxCount) {
      maxCount = count
      dominantType = type
    }
  }
  
  // Consider rating threshold for personality modifiers
  const isQualityFocused = ratingThreshold >= 8.0
  const isAdventurous = ratingThreshold <= 6.0
  
  // Determine personality type based on dominant genre and modifiers
  switch (dominantType) {
    case 'action':
      return isQualityFocused ? "Sophisticated Action Fan" : "Adrenaline Junkie"
    case 'comedy':
      return isQualityFocused ? "Refined Comedy Connoisseur" : "Fun-Seeking Optimist"
    case 'drama':
      return isQualityFocused ? "Artistic Soul" : "Emotional Explorer"
    case 'sci-fi':
      return isQualityFocused ? "Visionary Thinker" : "Future Explorer"
    case 'horror':
      return "Thrill Seeker"
    case 'thriller':
      return "Suspense Lover"
    case 'romance':
      return "Romantic Heart"
    case 'crime':
      return "Mystery Solver"
    case 'documentary':
      return "Truth Seeker"
    case 'animation':
      return "Animation Enthusiast"
    default:
      return isQualityFocused ? "Discerning Cinephile" : "Eclectic Explorer"
  }
}

export async function POST(request: NextRequest) {
  // Parse request data once at the beginning
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { preferences, answers } = await request.json()

  if (!preferences) {
    return NextResponse.json({ error: 'Missing preferences' }, { status: 400 })
  }

  try {
    console.log(`Generating recommendations for user ${session.user.id} with enhanced system`);

    const personalityType = determinePersonalityType(preferences)
    
    // Use enhanced recommendation system
    const recommendations = await generateEnhancedRecommendations(preferences, session.user.id)
    
    console.log(`Generated ${recommendations.length} enhanced recommendations`);

    // Save quiz results to database with enhanced data
    await prisma.quizResult.create({
      data: {
        userId: session.user.id,
        answers: answers || {},
        moviePreferences: {
          ...preferences,
          discoveryPreference: determineDiscoveryPreference(preferences)
        },
        personalityType,
        completedAt: new Date()
      }
    })

    const result: QuizCompletionResult = {
      recommendations,
      personalityType,
      preferences: {
        ...preferences,
        discoveryPreference: determineDiscoveryPreference(preferences)
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error completing quiz with enhanced system:', error)
    
    // Fallback to legacy system
    try {
      console.log('Falling back to legacy recommendation system');
      
      const personalityType = determinePersonalityType(preferences)
      const recommendations = await generateRecommendations(preferences)
      
      await prisma.quizResult.create({
        data: {
          userId: session.user.id,
          answers: answers || {},
          moviePreferences: preferences,
          personalityType,
          completedAt: new Date()
        }
      })

      const result: QuizCompletionResult = {
        recommendations,
        personalityType,
        preferences
      }

      return NextResponse.json(result)
    } catch (fallbackError) {
      console.error('Legacy fallback also failed:', fallbackError)
      return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 })
    }
  } finally {
    await prisma.$disconnect()
  }
} 