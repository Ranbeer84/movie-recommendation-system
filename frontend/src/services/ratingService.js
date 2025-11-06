import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "https://popcorn-ggng.onrender.com/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
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
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Rate a movie
export const rateMovie = async (movieId, rating, review = "") => {
  try {
    console.log(`Rating movie ${movieId} with ${rating} stars`);
    const response = await api.post("/ratings/rate", {
      movie_id: movieId,
      rating: rating,
      review: review,
    });
    console.log("Rating response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error rating movie:", error);
    throw error;
  }
};

// Get user's ratings
export const getMyRatings = async (params = {}) => {
  try {
    console.log("Fetching user ratings with params:", params);
    const response = await api.get("/ratings/my-ratings", { params });
    console.log("My ratings response:", response.data);

    // Ensure we always return a valid structure
    return {
      ratings: response.data.ratings || [],
      page: response.data.page || 1,
      limit: response.data.limit || 20,
      count: response.data.count || 0,
      total: response.data.total || 0,
      has_more: response.data.has_more || false,
    };
  } catch (error) {
    console.error("Error fetching my ratings:", error);
    console.error("Error details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

// Get ratings for a specific movie
export const getMovieRatings = async (movieId, params = {}) => {
  try {
    const response = await api.get(`/ratings/movie/${movieId}`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching movie ratings:", error);
    throw error;
  }
};

// Check if user has rated a movie
export const checkUserRating = async (movieId) => {
  try {
    const response = await api.get(`/ratings/check/${movieId}`);
    return response.data;
  } catch (error) {
    console.error("Error checking user rating:", error);
    throw error;
  }
};

// Delete a rating
export const deleteRating = async (movieId) => {
  try {
    const response = await api.delete(`/ratings/delete/${movieId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting rating:", error);
    throw error;
  }
};

// Get user rating statistics
export const getUserRatingStats = async () => {
  try {
    const response = await api.get("/ratings/stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching rating stats:", error);
    throw error;
  }
};

// Update an existing rating
export const updateRating = async (movieId, rating, review = "") => {
  try {
    // The backend handles both create and update in the same endpoint
    return await rateMovie(movieId, rating, review);
  } catch (error) {
    console.error("Error updating rating:", error);
    throw error;
  }
};

// Utility function to format rating for display
export const formatRating = (rating) => {
  if (typeof rating === "number") {
    return rating.toFixed(1);
  }
  return "0.0";
};

// Utility function to get star display
export const getStarDisplay = (rating) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return {
    full: fullStars,
    half: hasHalfStar,
    empty: emptyStars,
  };
};

// Utility function to get rating color
export const getRatingColor = (rating) => {
  if (rating >= 4.5) return "#22c55e"; // green
  if (rating >= 3.5) return "#84cc16"; // lime
  if (rating >= 2.5) return "#eab308"; // yellow
  if (rating >= 1.5) return "#f97316"; // orange
  return "#ef4444"; // red
};

export default {
  rateMovie,
  getMyRatings,
  getMovieRatings,
  checkUserRating,
  deleteRating,
  updateRating,
  getUserRatingStats,
  formatRating,
  getStarDisplay,
  getRatingColor,
};
