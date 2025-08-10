import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
  (error) => Promise.reject(error)
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const recommendationService = {
  // Get personalized recommendations for current user
  getPersonalRecommendations: async (type = 'hybrid', limit = 15) => {
    const response = await api.get('/recommendations/for-me', {
      params: { type, limit }
    });
    return response.data;
  },

  // Get collaborative filtering recommendations
  getCollaborativeRecommendations: async (userId, limit = 10) => {
    const response = await api.get(`/recommendations/collaborative/${userId}`, {
      params: { limit }
    });
    return response.data;
  },

  // Get content-based recommendations
  getContentBasedRecommendations: async (userId, limit = 10) => {
    const response = await api.get(`/recommendations/content/${userId}`, {
      params: { limit }
    });
    return response.data;
  },

  // Get hybrid recommendations
  getHybridRecommendations: async (userId, limit = 15) => {
    const response = await api.get(`/recommendations/hybrid/${userId}`, {
      params: { limit }
    });
    return response.data;
  },

  // Get popular/trending movies
  getPopularRecommendations: async (genre = null, limit = 20) => {
    const params = { limit };
    if (genre) params.genre = genre;
    
    const response = await api.get('/recommendations/popular', { params });
    return response.data;
  },

  // Get similar movies to a specific movie
  getSimilarMovies: async (movieId, limit = 10) => {
    const response = await api.get(`/recommendations/similar/${movieId}`, {
      params: { limit }
    });
    return response.data;
  },

  // Get recommendations by genre
  getGenreRecommendations: async (genre, limit = 20, minRating = 3.5) => {
    const response = await api.get(`/recommendations/by-genre/${genre}`, {
      params: { limit, min_rating: minRating }
    });
    return response.data;
  },

  // Get new releases
  getNewReleases: async (limit = 20, yearsBack = 5) => {
    const response = await api.get('/recommendations/new-releases', {
      params: { limit, years_back: yearsBack }
    });
    return response.data;
  },

  // Get explanation for why a movie was recommended
  getRecommendationExplanation: async (userId, movieId) => {
    const response = await api.get(`/recommendations/explain/${userId}/${movieId}`);
    return response.data;
  },
};

export default recommendationService;