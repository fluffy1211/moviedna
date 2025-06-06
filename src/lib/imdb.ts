import { Movie } from './types';

// IMDb API Configuration (AWS Data Exchange)
const IMDB_ENDPOINT = process.env.IMDB_ENDPOINT; // From AWS Data Exchange
const IMDB_API_KEY = process.env.IMDB_API_KEY; // From IMDb staff email
const IMDB_DATA_SET_ID = process.env.IMDB_DATA_SET_ID;
const IMDB_REVISION_ID = process.env.IMDB_REVISION_ID;
const IMDB_ASSET_ID = process.env.IMDB_ASSET_ID;

interface IMDbTitle {
  id: string;
  titleText: {
    text: string;
  };
  releaseDate?: {
    year: number;
    month?: number;
    day?: number;
  };
  ratingsSummary?: {
    aggregateRating: number;
    voteCount: number;
  };
  plot?: {
    plotText: {
      plainText: string;
    };
  };
  primaryImage?: {
    url: string;
  };
  genres?: {
    genres: Array<{
      text: string;
    }>;
  };
}

class IMDbService {
  private async queryIMDb(query: string, variables?: Record<string, any>) {
    if (!IMDB_ENDPOINT || !IMDB_API_KEY) {
      throw new Error('IMDb API credentials not configured. Please check your AWS Data Exchange setup.');
    }

    const response = await fetch(`${IMDB_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${IMDB_API_KEY}`,
        'X-Amzn-DataExchange-DataSet-Id': IMDB_DATA_SET_ID!,
        'X-Amzn-DataExchange-Revision-Id': IMDB_REVISION_ID!,
        'X-Amzn-DataExchange-Asset-Id': IMDB_ASSET_ID!,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`IMDb API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`IMDb GraphQL error: ${data.errors[0].message}`);
    }

    return data.data;
  }

  async searchTitles(searchTerm: string, limit: number = 10): Promise<Movie[]> {
    const query = `
      query SearchTitles($searchTerm: String!, $limit: Int!) {
        search(query: $searchTerm, first: $limit) {
          edges {
            node {
              entity {
                ... on Title {
                  id
                  titleText {
                    text
                  }
                  releaseDate {
                    year
                    month
                    day
                  }
                  ratingsSummary {
                    aggregateRating
                    voteCount
                  }
                  plot {
                    plotText {
                      plainText
                    }
                  }
                  primaryImage {
                    url
                  }
                  genres {
                    genres {
                      text
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const data = await this.queryIMDb(query, { searchTerm, limit });
    
    return this.convertIMDbTitlesToMovies(
      data.search.edges.map((edge: any) => edge.node.entity)
    );
  }

  async getTitleDetails(imdbId: string): Promise<Movie> {
    const query = `
      query GetTitle($id: ID!) {
        title(id: $id) {
          id
          titleText {
            text
          }
          releaseDate {
            year
            month
            day
          }
          ratingsSummary {
            aggregateRating
            voteCount
          }
          plot {
            plotText {
              plainText
            }
          }
          primaryImage {
            url
          }
          genres {
            genres {
              text
            }
          }
        }
      }
    `;

    const data = await this.queryIMDb(query, { id: imdbId });
    return this.convertIMDbTitleToMovie(data.title);
  }

  async getPopularTitles(limit: number = 50): Promise<Movie[]> {
    const query = `
      query GetPopularTitles($limit: Int!) {
        mostPopularTitles(first: $limit) {
          edges {
            node {
              id
              titleText {
                text
              }
              releaseDate {
                year
                month
                day
              }
              ratingsSummary {
                aggregateRating
                voteCount
              }
              plot {
                plotText {
                  plainText
                }
              }
              primaryImage {
                url
              }
              genres {
                genres {
                  text
                }
              }
            }
          }
        }
      }
    `;

    const data = await this.queryIMDb(query, { limit });
    
    return this.convertIMDbTitlesToMovies(
      data.mostPopularTitles.edges.map((edge: any) => edge.node)
    );
  }

  async getTitlesByGenre(genre: string, limit: number = 20): Promise<Movie[]> {
    const query = `
      query GetTitlesByGenre($genre: String!, $limit: Int!) {
        titlesByGenre(genre: $genre, first: $limit) {
          edges {
            node {
              id
              titleText {
                text
              }
              releaseDate {
                year
                month
                day
              }
              ratingsSummary {
                aggregateRating
                voteCount
              }
              plot {
                plotText {
                  plainText
                }
              }
              primaryImage {
                url
              }
              genres {
                genres {
                  text
                }
              }
            }
          }
        }
      }
    `;

    const data = await this.queryIMDb(query, { genre, limit });
    
    return this.convertIMDbTitlesToMovies(
      data.titlesByGenre.edges.map((edge: any) => edge.node)
    );
  }

  private convertIMDbTitleToMovie(title: IMDbTitle): Movie {
    return {
      id: parseInt(title.id.replace('tt', '')), // Convert IMDb ID to number
      title: title.titleText.text,
      overview: title.plot?.plotText.plainText || '',
      poster_path: title.primaryImage?.url || null,
      backdrop_path: null, // IMDb doesn't provide backdrop images in the same way
      release_date: title.releaseDate ? 
        `${title.releaseDate.year}-${(title.releaseDate.month || 1).toString().padStart(2, '0')}-${(title.releaseDate.day || 1).toString().padStart(2, '0')}` : 
        '',
      vote_average: title.ratingsSummary?.aggregateRating || 0,
      genre_ids: [], // Would need genre mapping
      popularity: title.ratingsSummary?.voteCount || 0,
    };
  }

  private convertIMDbTitlesToMovies(titles: IMDbTitle[]): Movie[] {
    return titles.map(title => this.convertIMDbTitleToMovie(title));
  }
}

export const imdbService = new IMDbService(); 