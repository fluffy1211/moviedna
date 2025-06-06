import { MoviePreferences, MovieRecommendation, Movie } from '@/lib/types'

// Legacy recommendation system
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
      backdrop_path: "/90ez6ArvpO8bvyIngBuwXOqJm5.jpg",
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
      backdrop_path: "/loWLKS8hj4pXvTcEfx3CKQgAJxr.jpg",
      release_date: "1988-11-17",
      vote_average: 8.4,
      genre_ids: [18, 10749],
      popularity: 45.0
    },
    {
      id: 637,
      title: "Life Is Beautiful",
      overview: "A touching story of an Italian book seller of Jewish ancestry who lives in his own little fairy tale.",
      poster_path: "/6FJOGNkhJnNjLM6G0rskoLFhfaX.jpg",
      backdrop_path: "/bORe0eI72D874TMawAgpC6sXj9h.jpg",
      release_date: "1997-12-20",
      vote_average: 8.4,
      genre_ids: [35, 18],
      popularity: 42.0
    },
    {
      id: 389,
      title: "12 Angry Men",
      overview: "The defense and the prosecution have rested and the jury is filing into the jury room.",
      poster_path: "/ow3wq89wM8qd5X7hWKxiRfsFf9C.jpg",
      backdrop_path: "/qqHQsStV6exghCM7zbObuYBiYxw.jpg",
      release_date: "1957-04-10",
      vote_average: 8.9,
      genre_ids: [18],
      popularity: 38.0
    }
    ];
  }

  console.log(`Using ${movies.length} movies for legacy recommendations`);

  const { favoriteGenres, moodPreferences, ratingThreshold, preferredDecades } = preferences;

  const recommendations = movies.map(movie => {
    let score = 0;
    const reasons: string[] = [];

    // Genre matching - boost for preferred genres
    const genreBoost = movie.genre_ids ? movie.genre_ids.reduce((boost, genreId) => {
      if (Array.isArray(favoriteGenres) && favoriteGenres.includes(genreId)) {
        reasons.push(`Matches your love for ${getGenreName(genreId)} films`);
        return boost + 25;
      }
      return boost;
    }, 0) : 0;

    score += genreBoost;

    // Rating threshold matching
    if (movie.vote_average >= ratingThreshold) {
      score += 20;
      if (movie.vote_average >= 8.0) {
        reasons.push("Critically acclaimed with excellent ratings");
      } else {
        reasons.push("Highly rated by audiences");
      }
    }

    // Preferred decades
    if (preferredDecades && preferredDecades.length > 0 && movie.release_date) {
      const movieYear = parseInt(movie.release_date.substring(0, 4));
      const movieDecade = Math.floor(movieYear / 10) * 10;
      if (preferredDecades.includes(movieDecade.toString())) {
        score += 10;
        reasons.push(`From your preferred era (${movieDecade}s)`);
      }
    }

    // Mood preferences matching through genre
    if (Array.isArray(moodPreferences)) {
      moodPreferences.forEach(mood => {
        const moodGenres = getMoodGenres(mood);
        if (movie.genre_ids && movie.genre_ids.some(genreId => moodGenres.includes(genreId))) {
          score += 15;
          reasons.push(`Perfect for when you want something ${mood}`);
        }
      });
    }

    // Popularity bonus for mainstream appeal
    if (movie.popularity > 50) {
      score += 5;
      reasons.push("Popular choice among movie lovers");
    }

    // Base score from movie quality
    score += Math.min(movie.vote_average * 5, 50);

    // Ensure we have at least one reason
    if (reasons.length === 0) {
      reasons.push("Recommended based on your preferences");
    }

    return {
      movie,
      score: Math.round(score),
      reasons
    };
  });

  // Sort by score and return top recommendations
  const sortedRecommendations = recommendations
    .filter(rec => rec.score > 20) // Only include movies with reasonable scores
    .sort((a, b) => b.score - a.score);

  // Ensure diversity in the final recommendations
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

function getGenreName(genreId: number): string {
  const genreMap: { [key: number]: string } = {
    28: "Action",
    12: "Adventure", 
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Science Fiction",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western"
  };
  return genreMap[genreId] || "Unknown";
}

function getMoodGenres(mood: string): number[] {
  const moodGenreMap: { [key: string]: number[] } = {
    'action': [28, 53, 12], // Action, Thriller, Adventure
    'comedy': [35, 16], // Comedy, Animation
    'drama': [18, 10749], // Drama, Romance
    'thriller': [53, 27, 9648], // Thriller, Horror, Mystery
    'sci-fi': [878, 14], // Science Fiction, Fantasy
    'mystery': [9648, 53, 80], // Mystery, Thriller, Crime
    'adventure': [12, 28, 14], // Adventure, Action, Fantasy
    'romance': [10749, 35, 18], // Romance, Comedy, Drama
    'family': [10751, 16, 12], // Family, Animation, Adventure
    'documentary': [99], // Documentary
    'horror': [27, 53], // Horror, Thriller
    'fantasy': [14, 878, 16], // Fantasy, Sci-Fi, Animation
    'crime': [80, 53, 18], // Crime, Thriller, Drama
    'war': [10752, 18, 36] // War, Drama, History
  };
  return moodGenreMap[mood] || [];
} 