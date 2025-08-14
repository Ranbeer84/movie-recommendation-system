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

export const rateMovie = async (ratingData) => {
  try {
    const response = await api.post('/ratings/rate', ratingData);
    return response.data;
  } catch (error) {
    console.error('Error rating movie:', error);
    throw error;
  }
};

export const getMyRatings = async (params = {}) => {
  try {
    const response = await api.get('/ratings/my-ratings', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching my ratings:', error);
    throw error;
  }
};

export const getMovieRatings = async (movieId, params = {}) => {
  try {
    const response = await api.get(`/ratings/movie/${movieId}`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching movie ratings:', error);
    throw error;
  }
};

export const checkUserRating = async (movieId) => {
  try {
    const response = await api.get(`/ratings/check/${movieId}`);
    return response.data;
  } catch (error) {
    console.error('Error checking user rating:', error);
    throw error;
  }
};

export const deleteRating = async (movieId) => {
  try {
    const response = await api.delete(`/ratings/delete/${movieId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting rating:', error);
    throw error;
  }
};

export const getUserRatingStats = async () => {
  try {
    const response = await api.get('/ratings/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching rating stats:', error);
    throw error;
  }
};

export default {
  rateMovie,
  getMyRatings,
  getMovieRatings,
  checkUserRating,
  deleteRating,
  getUserRatingStats
};