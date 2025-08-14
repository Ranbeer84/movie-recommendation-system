import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});
// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
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

// Get movies with pagination and filters
export async function getMovies(page = 1, limit = 20, genre = null, sortBy = 'avg_rating') {
  const params = { page, limit, sort_by: sortBy };
  if (genre) params.genre = genre;
  const response = await api.get('/movies/', { params });
  return response.data;
}
// Search movies
export async function searchMovies(query, limit = 20) {
  const response = await api.get('/movies/search', { params: { q: query, limit } });
  return response.data;
}
// Get movie details
export async function getMovieDetails(movieId) {
  const response = await api.get(`/movies/${movieId}`);
  return response.data;
}
// Get movie genres
export async function getGenres() {
  const response = await api.get('/movies/genres');
  return response.data.genres;
}
// Get popular movies
export async function getPopularMovies(genre = null, limit = 20) {
  const params = { limit };
  if (genre) params.genre = genre;
  const response = await api.get('/movies/popular', { params });
  return response.data;
}
// Rate a movie
export async function rateMovie(movieId, rating, review = '') {
  const response = await api.post('/ratings/rate', { movie_id: movieId, rating, review });
  return response.data;
}
// Get user's ratings
export async function getUserRatings(page = 1, limit = 20) {
  const response = await api.get('/ratings/my-ratings', { params: { page, limit } });
  return response.data;
}
// Check if user has rated a movie
export async function checkUserRating(movieId) {
  const response = await api.get(`/ratings/check/${movieId}`);
  return response.data;
}
// Delete user's rating
export async function deleteRating(movieId) {
  const response = await api.delete(`/ratings/delete/${movieId}`);
  return response.data;
}
// Get rating statistics
export async function getRatingStats() {
  const response = await api.get('/ratings/stats');
  return response.data;
}

export default {
  getMovies,
  searchMovies,
  getMovieDetails,
  getGenres,
  getPopularMovies,
  rateMovie,
  getUserRatings,
  checkUserRating,
  deleteRating,
  getRatingStats,
};
