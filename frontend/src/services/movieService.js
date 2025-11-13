import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "https://popcorn-ggng.onrender.com/api";

// Debug helper
const debugLog = (message, data) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`🔍 [MovieService] ${message}`, data);
  }
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000, // 10 second timeout
});

// Debug API configuration
debugLog("API Configuration:", {
  baseURL: API_BASE_URL,
  timeout: 10000,
  environment: process.env.NODE_ENV,
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Debug outgoing requests
    debugLog("Outgoing Request:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`,
      params: config.params,
      hasAuth: !!token,
    });

    return config;
  },
  (error) => {
    debugLog("Request Interceptor Error:", error);
    return Promise.reject(error);
  }
);

// Handle responses and errors
api.interceptors.response.use(
  (response) => {
    // Debug successful responses
    debugLog("Successful Response:", {
      status: response.status,
      url: response.config.url,
      dataType: typeof response.data,
      hasData: !!response.data,
    });
    return response;
  },
  (error) => {
    // Enhanced error logging
    if (error.response) {
      // Server responded with error status
      debugLog("Response Error:", {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        data: error.response.data,
        headers: error.response.headers,
      });

      // Handle token expiration
      if (error.response.status === 401) {
        debugLog("Token expired, redirecting to login");
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    } else if (error.request) {
      // Request was made but no response received
      debugLog("Network Error:", {
        message: "No response received",
        url: error.config?.url,
        timeout: error.code === "ECONNABORTED",
      });
    } else {
      // Something else happened
      debugLog("Request Setup Error:", error.message);
    }

    return Promise.reject(error);
  }
);

// Get movies with pagination and filters
export async function getMovies(
  page = 1,
  limit = 20,
  genre = null,
  sortBy = "avg_rating"
) {
  try {
    const params = { page, limit, sort_by: sortBy };
    if (genre) params.genre = genre;

    debugLog("getMovies called with params:", params);
    const response = await api.get("/movies/", { params });
    return response.data;
  } catch (error) {
    debugLog("getMovies error:", error.message);
    throw error;
  }
}

// Search movies
export async function searchMovies(query, limit = 20) {
  try {
    if (!query || !query.trim()) {
      debugLog("searchMovies: Empty query provided");
      return { movies: [], count: 0, query: "" };
    }

    debugLog("searchMovies called:", { query, limit });
    const response = await api.get("/movies/search", {
      params: { q: query.trim(), limit },
    });
    return response.data;
  } catch (error) {
    debugLog("searchMovies error:", error.message);
    throw error;
  }
}

// Get movie details - ENHANCED WITH DETAILED DEBUGGING
export async function getMovieDetails(movieId) {
  try {
    // Validate movieId
    if (!movieId || movieId === "undefined" || movieId === "null") {
      const errorMsg = `Invalid movie ID provided: ${movieId}`;
      debugLog("getMovieDetails validation failed:", errorMsg);
      throw new Error(errorMsg);
    }

    // Clean and validate movieId
    const cleanMovieId = String(movieId).trim();
    debugLog("getMovieDetails called:", {
      originalId: movieId,
      cleanId: cleanMovieId,
      idType: typeof movieId,
      cleanIdType: typeof cleanMovieId,
    });

    // Make the API call
    const response = await api.get(`/movies/${cleanMovieId}`);

    debugLog("getMovieDetails success:", {
      movieId: cleanMovieId,
      hasData: !!response.data,
      dataKeys: Object.keys(response.data || {}),
    });

    return response.data;
  } catch (error) {
    debugLog("getMovieDetails error details:", {
      movieId,
      errorMessage: error.message,
      errorStatus: error.response?.status,
      errorData: error.response?.data,
      isNetworkError: !error.response,
      fullURL: error.config
        ? `${error.config.baseURL}${error.config.url}`
        : "unknown",
    });
    throw error;
  }
}

// Get movie genres
export async function getGenres() {
  try {
    debugLog("getGenres called");
    const response = await api.get("/movies/genres");

    // Handle different response formats
    const genres = response.data.genres || response.data;
    debugLog("getGenres success:", { genreCount: genres?.length });
    return genres;
  } catch (error) {
    debugLog("getGenres error:", error.message);
    throw error;
  }
}

// Get popular movies
export async function getPopularMovies(genre = null, limit = 20) {
  try {
    const params = { limit };
    if (genre) params.genre = genre;

    debugLog("getPopularMovies called:", params);
    const response = await api.get("/movies/popular", { params });
    return response.data;
  } catch (error) {
    debugLog("getPopularMovies error:", error.message);
    throw error;
  }
}

// Rate a movie
export async function rateMovie(movieId, rating, review = "") {
  try {
    debugLog("rateMovie called:", { movieId, rating, hasReview: !!review });
    const response = await api.post("/ratings/rate", {
      movie_id: movieId,
      rating,
      review,
    });
    return response.data;
  } catch (error) {
    debugLog("rateMovie error:", error.message);
    throw error;
  }
}

// Get user's ratings
export async function getUserRatings(page = 1, limit = 20) {
  try {
    debugLog("getUserRatings called:", { page, limit });
    const response = await api.get("/ratings/my-ratings", {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    debugLog("getUserRatings error:", error.message);
    throw error;
  }
}

// Check if user has rated a movie
export async function checkUserRating(movieId) {
  try {
    debugLog("checkUserRating called:", { movieId });
    const response = await api.get(`/ratings/check/${movieId}`);
    return response.data;
  } catch (error) {
    debugLog("checkUserRating error:", error.message);
    throw error;
  }
}

// Delete user's rating
export async function deleteRating(movieId) {
  try {
    debugLog("deleteRating called:", { movieId });
    const response = await api.delete(`/ratings/delete/${movieId}`);
    return response.data;
  } catch (error) {
    debugLog("deleteRating error:", error.message);
    throw error;
  }
}

// Get rating statistics
export async function getRatingStats() {
  try {
    debugLog("getRatingStats called");
    const response = await api.get("/ratings/stats");
    return response.data;
  } catch (error) {
    debugLog("getRatingStats error:", error.message);
    throw error;
  }
}

// Test function to validate API connection
export async function testConnection() {
  try {
    debugLog("Testing API connection...");
    const response = await api.get("/movies/debug");
    debugLog("Connection test successful:", {
      status: response.status,
      hasData: !!response.data,
    });
    return response.data;
  } catch (error) {
    debugLog("Connection test failed:", {
      message: error.message,
      status: error.response?.status,
      isNetworkError: !error.response,
    });
    throw error;
  }
}

const movieService = {
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
  testConnection,
};

export default movieService;