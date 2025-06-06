import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@/generated/prisma'
import { MoviePreferences, MovieRecommendation, QuizCompletionResult, Movie, EnhancedMovie, RecommendationContext, EnhancedRecommendation } from '@/lib/types'
import { movieAggregator } from '@/lib/movie-aggregator'
import { enhancedRecommendationEngine } from '@/lib/enhanced-recommendation-engine'

const prisma = new PrismaClient()

// Enhanced recommendations using the new recommendation engine
export async function generateEnhancedRecommendations(
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
      country: 'US', // Could be made configurable
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

// Legacy recommendation system (fallback)
export async function generateRecommendations(preferences: MoviePreferences): Promise<MovieRecommendation[]> {
  // Fetch diverse movies from our comprehensive endpoint
  let movies: Movie[] = [];
  
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/tmdb/discover`);
    if (response.ok) {
      const fetchedMovies = await response.json();
      if (Array.isArray(fetchedMovies) && fetchedMovies.length > 0) {
        movies = fetchedMovies;
      } else {
        throw new Error('Empty or invalid movie array');
      }
    } else {
      throw new Error(`API responded with status: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to fetch diverse movies, using fallback:', error);
    // Fallback to a comprehensive set of movies if the API fails
    movies = [
    {
      id: 550,
      title: "Fight Club",
      overview: "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.",
      poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      backdrop_path: "/52AfXWuXCHn3UjD17rBruA9f5qb.jpg",
      release_date: "1999-10-15",
      vote_average: 8.4,
      genre_ids: [18, 53],
      popularity: 84.0
    },
    {
      id: 13,
      title: "Forrest Gump",
      overview: "A man with a low IQ has accomplished great things in his life and been present during significant historic events.",
      poster_path: "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
      backdrop_path: "/7c9UVPPiTPltouxRVY6N9uugaVA.jpg",
      release_date: "1994-06-23",
      vote_average: 8.5,
      genre_ids: [35, 18, 10749],
      popularity: 78.0
    },
    {
      id: 27205,
      title: "Inception",
      overview: "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets.",
      poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
      backdrop_path: "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
      release_date: "2010-07-16",
      vote_average: 8.4,
      genre_ids: [28, 878, 53],
      popularity: 89.0
    },
    {
      id: 238,
      title: "The Godfather",
      overview: "Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family.",
      poster_path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
      backdrop_path: "/tmU7GeKVybMWFButWEGl2M4GeiP.jpg",
      release_date: "1972-03-14",
      vote_average: 9.2,
      genre_ids: [18, 80],
      popularity: 92.0
    },
    {
      id: 19404,
      title: "Dilwale Dulhania Le Jayenge",
      overview: "Raj is a rich, carefree, happy-go-lucky second generation NRI. Simran is the daughter of Chaudhary Baldev Singh.",
      poster_path: "/2CAL2433ZeIihfX1Hb2139CX0pW.jpg",
      backdrop_path: "/90ez6ArvpO8bvpyIngBuwXOqJm5.jpg",
      release_date: "1995-10-20",
      vote_average: 8.7,
      genre_ids: [35, 18, 10749],
      popularity: 65.0
    },
    {
      id: 680,
      title: "Pulp Fiction",
      overview: "A burger-loving hit man, his philosophical partner, and a drug-addled gangster's moll intertwine in this crime comedy.",
      poster_path: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
      backdrop_path: "/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg",
      release_date: "1994-09-10",
      vote_average: 8.9,
      genre_ids: [80, 18],
      popularity: 85.0
    },
    {
      id: 155,
      title: "The Dark Knight",
      overview: "Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent.",
      poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
      backdrop_path: "/hqkIcbrOHL86UncnHIsHVcVmzue.jpg",
      release_date: "2008-07-14",
      vote_average: 9.0,
      genre_ids: [28, 80, 18, 53],
      popularity: 96.0
    },
    {
      id: 11216,
      title: "Cinema Paradiso",
      overview: "A filmmaker recalls his childhood when falling in love with the pictures at the cinema of his home village.",
      poster_path: "/8SRUfRUi6x4O68n0VCbDNRa6iGL.jpg",
      backdrop_path: "/aUPJpBpI9bxx7NVWzp5XPQaWuAg.jpg",
      release_date: "1988-11-17",
      vote_average: 8.4,
      genre_ids: [18, 10749],
      popularity: 45.0
    },
    {
      id: 429,
      title: "The Good, the Bad and the Ugly",
      overview: "While the Civil War rages between the Union and the Confederacy, three men hunt for the fortune in gold.",
      poster_path: "/bX2xnavhMYjWDoZp1VM6VnU1xwe.jpg",
      backdrop_path: "/Adrip2Jqzw56KeuV2nAxucKMNXA.jpg",
      release_date: "1966-12-23",
      vote_average: 8.7,
      genre_ids: [37, 28],
      popularity: 67.0
    },
    {
      id: 496243,
      title: "Parasite",
      overview: "All unemployed, Ki-taek and his family take peculiar interest in the wealthy Park family.",
      poster_path: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
      backdrop_path: "/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg",
      release_date: "2019-05-30",
      vote_average: 8.5,
      genre_ids: [35, 53, 18],
              popularity: 88.0
      },
      {
        id: 157336,
        title: "Interstellar",
        overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.",
        poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
        backdrop_path: "/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg",
        release_date: "2014-11-05",
        vote_average: 8.4,
        genre_ids: [12, 18, 878],
        popularity: 75.0
      },
      {
        id: 122,
        title: "The Lord of the Rings: The Return of the King",
        overview: "Aragorn is revealed as the heir to the ancient kings as he, Gandalf and the other members of the broken fellowship struggle to save Gondor.",
        poster_path: "/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg",
        backdrop_path: "/2u7zbn8EudG6kLlBzUYqP8RyFU4.jpg",
        release_date: "2003-12-01",
        vote_average: 8.7,
        genre_ids: [12, 18, 14],
        popularity: 82.0
      },
      {
        id: 24428,
        title: "The Avengers",
        overview: "When an unexpected enemy emerges and threatens global safety and security, Nick Fury assembles a team of the world's most legendary superheroes.",
        poster_path: "/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg",
        backdrop_path: "/hbn46fQaRmlpBuUrEiFqv0GDL6Y.jpg",
        release_date: "2012-04-25",
        vote_average: 7.7,
        genre_ids: [28, 12, 878],
        popularity: 95.0
      },
      {
        id: 278,
        title: "The Shawshank Redemption",
        overview: "Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison.",
        poster_path: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
        backdrop_path: "/iNh3BivHyg5sQRPP1KOkzguEX0H.jpg",
        release_date: "1994-09-23",
        vote_average: 9.3,
        genre_ids: [18, 80],
        popularity: 88.0
      },
      {
        id: 11216,
        title: "Cinema Paradiso",
        overview: "A filmmaker recalls his childhood when falling in love with the pictures at the cinema of his home village.",
        poster_path: "/8SRUfRUi6x4O68n0VCbDNRa6iGL.jpg",
        backdrop_path: "/aUPJpBpI9bxx7NVWzp5XPQaWuAg.jpg",
        release_date: "1988-11-17",
        vote_average: 8.4,
        genre_ids: [18, 10749],
        popularity: 45.0
      }
    ];
  }

  console.log(`Generating recommendations from ${movies.length} movies`);
  
  // Detailed scoring based on user preferences
  const recommendations: MovieRecommendation[] = movies.map(movie => {
    let score = 0
    const reasons: string[] = []

    // Score based on genres (highest weight)
    const movieGenres = movie.genre_ids || []
    const preferredGenres = preferences.favoriteGenres || []
    const genreMatchCount = movieGenres.filter(genreId => preferredGenres.includes(genreId)).length
    
    if (genreMatchCount > 0) {
      const genreScore = genreMatchCount * 25; // 25 points per matching genre
      score += genreScore
      reasons.push(`Matches ${genreMatchCount} of your favorite genres`)
    }

    // Score based on rating threshold (important weight)
    if (movie.vote_average >= preferences.ratingThreshold) {
      score += 30
      reasons.push(`High rating (${movie.vote_average}/10)`)
    } else if (movie.vote_average >= preferences.ratingThreshold - 1) {
      score += 15
      reasons.push("Good rating")
    }

    // Score based on mood preferences (detailed matching)
    (preferences.moodPreferences || []).forEach(mood => {
      switch (mood) {
        case 'action':
          if (movieGenres.includes(28)) { // Action
            score += 20
            reasons.push("Perfect for action mood")
          }
          break
        case 'thriller':
          if (movieGenres.includes(53)) { // Thriller
            score += 20
            reasons.push("Great thriller choice")
          }
          break
        case 'comedy':
          if (movieGenres.includes(35)) { // Comedy
            score += 20
            reasons.push("Perfect for laughs")
          }
          break
        case 'drama':
          if (movieGenres.includes(18)) { // Drama
            score += 20
            reasons.push("Deep emotional story")
          }
          break
        case 'mystery':
          if (movieGenres.includes(9648)) { // Mystery
            score += 20
            reasons.push("Mind-bending mystery")
          }
          break
        case 'sci-fi':
          if (movieGenres.includes(878)) { // Science Fiction
            score += 20
            reasons.push("Thought-provoking sci-fi")
          }
          break
        case 'horror':
          if (movieGenres.includes(27)) { // Horror
            score += 20
            reasons.push("Spine-chilling experience")
          }
          break
      }
    })

    // Score based on preferred decades (extract year from release_date)
    const movieYear = movie.release_date ? movie.release_date.substring(0, 4) : null
    if (movieYear) {
      const movieDecade = Math.floor(parseInt(movieYear) / 10) * 10
      if ((preferences.preferredDecades || []).includes(movieDecade.toString())) {
        score += 15
        reasons.push(`From your preferred era (${movieDecade}s)`)
      }
    }

    // Diversity bonus - prefer less mainstream movies for variety
    if (movie.popularity < 50 && movie.vote_average >= 7.0) {
      score += 12
      reasons.push("Hidden gem with great reviews")
    } else if (movie.popularity > 80) {
      score += 5
      reasons.push("Popular choice")
    }

    // Quality bonus for exceptional movies
    if (movie.vote_average >= 8.5) {
      score += 10
      reasons.push("Exceptional movie")
    }

    // Recency bonus for recent quality films
    if (movieYear && parseInt(movieYear) >= 2020 && movie.vote_average >= 7.5) {
      score += 8
      reasons.push("Recent quality release")
    }

    // International cinema bonus for diversity
    const isLikelyInternational = movie.title !== movie.original_title || 
                                 (movie.original_language && movie.original_language !== 'en')
    if (isLikelyInternational && movie.vote_average >= 7.0) {
      score += 10
      reasons.push("International cinema")
    }

    return {
      movie,
      score,
      reasons: reasons.length > 0 ? reasons : ["General recommendation"]
    }
  })

  // Sort by score and ensure variety in final recommendations
  const sortedRecommendations = recommendations
    .sort((a, b) => b.score - a.score)
    .filter(rec => rec.score > 0); // Only include movies with positive scores

  // Ensure genre diversity in final recommendations
  const diverseRecommendations: MovieRecommendation[] = [];
  const usedGenres = new Set<number>();
  const usedDecades = new Set<string>();
  
  // First pass: select movies ensuring genre and decade diversity
  for (const rec of sortedRecommendations) {
    if (diverseRecommendations.length >= 8) break;
    
    const movieYear = rec.movie.release_date ? rec.movie.release_date.substring(0, 4) : null;
    const movieDecade = movieYear ? Math.floor(parseInt(movieYear) / 10) * 10 : null;
    
    // Check if this movie adds genre diversity
    const hasNewGenre = (rec.movie.genre_ids || []).some(genreId => !usedGenres.has(genreId));
    const hasNewDecade = movieDecade && !usedDecades.has(movieDecade.toString());
    
    // Prioritize movies that add diversity or have very high scores
    if (hasNewGenre || hasNewDecade || rec.score >= 60 || diverseRecommendations.length < 4) {
      diverseRecommendations.push(rec);
      (rec.movie.genre_ids || []).forEach(genreId => usedGenres.add(genreId));
      if (movieDecade) usedDecades.add(movieDecade.toString());
    }
  }
  
  // Second pass: fill remaining slots with highest scoring movies
  if (diverseRecommendations.length < 8) {
    for (const rec of sortedRecommendations) {
      if (diverseRecommendations.length >= 8) break;
      if (!diverseRecommendations.find(existing => existing.movie.id === rec.movie.id)) {
        diverseRecommendations.push(rec);
      }
    }
  }
  
  const finalRecommendations = diverseRecommendations.slice(0, 8);
  
  // Ensure we always return at least some recommendations
  if (finalRecommendations.length === 0) {
    console.warn('No recommendations generated, creating default ones');
    return movies.slice(0, 4).map(movie => ({
      movie,
      score: 50,
      reasons: ['General recommendation']
    }));
  }
  
  return finalRecommendations;
}

export function determinePersonalityType(preferences: MoviePreferences): string {
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