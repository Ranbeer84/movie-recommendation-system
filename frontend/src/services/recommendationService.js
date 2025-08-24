import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// THIS IS THE MISSING METHOD YOUR HOMEPAGE IS CALLING
export const getPersonalRecommendations = async (algorithm = 'hybrid', limit = 15) => {
  try {
    console.log(`🎯 Fetching ${algorithm} recommendations with limit ${limit}`);
    
    // Map algorithm types to the correct endpoints
    let endpoint;
    switch (algorithm) {
      case 'collaborative':
        endpoint = '/recommendations/for-me?type=collaborative';
        break;
      case 'content':
        endpoint = '/recommendations/for-me?type=content';
        break;
      case 'hybrid':
      default:
        endpoint = '/recommendations/for-me?type=hybrid';
        break;
    }
    
    const response = await api.get(endpoint, { 
      params: { limit } 
    });
    
    console.log('✅ Personal recommendations response:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('❌ Error fetching personal recommendations:', error);
    
    // Return empty recommendations structure instead of throwing
    return {
      recommendations: [],
      user_id: null,
      type: algorithm,
      count: 0,
      error: error.message
    };
  }
};

// THIS IS THE MISSING METHOD FOR POPULAR RECOMMENDATIONS
export const getPopularRecommendations = async (genre = null, limit = 20) => {
  try {
    console.log(`📈 Fetching popular movies for genre: ${genre}, limit: ${limit}`);
    
    const params = { limit };
    if (genre) {
      params.genre = genre;
    }
    
    const response = await api.get('/recommendations/popular', { params });
    
    console.log('✅ Popular movies response:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('❌ Error fetching popular movies:', error);
    
    // Return empty structure instead of throwing
    return {
      movies: [],
      genre: genre,
      type: 'popular',
      count: 0,
      error: error.message
    };
  }
};

export const getMyRecommendations = async (params = {}) => {
  try {
    const response = await api.get('/recommendations/for-me', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching personal recommendations:', error);
    throw error;
  }
};

export const getCollaborativeRecommendations = async (userId, params = {}) => {
  try {
    const response = await api.get(`/recommendations/collaborative/${userId}`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching collaborative recommendations:', error);
    throw error;
  }
};

export const getContentBasedRecommendations = async (userId, params = {}) => {
  try {
    const response = await api.get(`/recommendations/content/${userId}`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching content-based recommendations:', error);
    throw error;
  }
};

export const getHybridRecommendations = async (userId, params = {}) => {
  try {
    const response = await api.get(`/recommendations/hybrid/${userId}`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching hybrid recommendations:', error);
    throw error;
  }
};

export const getPopularMovies = async (params = {}) => {
  try {
    const response = await api.get('/recommendations/popular', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    throw error;
  }
};

export const getSimilarMovies = async (movieId, limit = 10) => {
  try {
    const response = await api.get(`/recommendations/similar/${movieId}`, {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching similar movies:', error);
    throw error;
  }
};

export const getRecommendationsByGenre = async (genre, params = {}) => {
  try {
    const response = await api.get(`/recommendations/by-genre/${encodeURIComponent(genre)}`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching genre recommendations:', error);
    throw error;
  }
};

export const getNewReleases = async (params = {}) => {
  try {
    const response = await api.get('/recommendations/new-releases', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching new releases:', error);
    throw error;
  }
};

export const explainRecommendation = async (userId, movieId) => {
  try {
    const response = await api.get(`/recommendations/explain/${userId}/${movieId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting recommendation explanation:', error);
    throw error;
  }
};

// Utility function to get recommendations based on user's rating history
export const getRecommendationsForNewUser = async () => {
  try {
    // For users without ratings, show popular movies and new releases
    const [popular, newReleases] = await Promise.all([
      getPopularMovies({ limit: 10 }),
      getNewReleases({ limit: 10 })
    ]);

    return {
      popular: popular.movies || [],
      newReleases: newReleases.movies || []
    };
  } catch (error) {
    console.error('Error fetching recommendations for new user:', error);
    throw error;
  }
};

// Get recommendations with fallback strategy
export const getRecommendationsWithFallback = async (userId, preferredType = 'hybrid') => {
  try {
    let recommendations = [];
    
    // Try preferred recommendation type first
    try {
      if (preferredType === 'collaborative') {
        const result = await getCollaborativeRecommendations(userId, { limit: 15 });
        recommendations = result.recommendations || [];
      } else if (preferredType === 'content') {
        const result = await getContentBasedRecommendations(userId, { limit: 15 });
        recommendations = result.recommendations || [];
      } else {
        const result = await getHybridRecommendations(userId, { limit: 15 });
        recommendations = result.recommendations || [];
      }
    } catch (error) {
      console.warn(`${preferredType} recommendations failed, trying fallback`);
    }

    // If no personalized recommendations, fall back to popular movies
    if (recommendations.length === 0) {
      console.log('No personalized recommendations available, showing popular movies');
      const popular = await getPopularMovies({ limit: 15 });
      recommendations = popular.movies || [];
    }

    return {
      recommendations,
      type: recommendations.length > 0 ? preferredType : 'popular',
      fallback: recommendations.length === 0
    };
  } catch (error) {
    console.error('Error in recommendation fallback strategy:', error);
    throw error;
  }
};

export default {
  getPersonalRecommendations, // ← This was missing!
  getPopularRecommendations,  // ← This was missing!
  getMyRecommendations,
  getCollaborativeRecommendations,
  getContentBasedRecommendations,
  getHybridRecommendations,
  getPopularMovies,
  getSimilarMovies,
  getRecommendationsByGenre,
  getNewReleases,
  explainRecommendation,
  getRecommendationsForNewUser,
  getRecommendationsWithFallback
};