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

      // DEBUG: Log JWT token content (remove in production)
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        console.log("🔍 JWT Payload:", payload);
      } catch (e) {
        console.warn("Could not decode JWT token");
      }
    } else {
      console.warn("⚠️ No JWT token found in localStorage");
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

// FIXED: Main method, RecommendationsPage uses
export const getMyRecommendations = async (params = {}) => {
  try {
    console.log("📡 Calling /recommendations/for-me with params:", params);

    const response = await api.get("/recommendations/for-me", { params });

    console.log("✅ Raw API Response:", response.data);

    // Handle different possible response structures
    const data = response.data;

    // Python backend returns: { recommendations: [...], user_id: "...", type: "...", count: ... }
    // But let's handle various structures
    let recommendations = [];

    if (data.recommendations && Array.isArray(data.recommendations)) {
      recommendations = data.recommendations;
    } else if (Array.isArray(data)) {
      recommendations = data;
    } else {
      console.warn("Unexpected response structure:", data);
    }

    console.log(`🎬 Processed ${recommendations.length} recommendations`);

    return {
      recommendations: recommendations,
      user_id: data.user_id || null,
      type: data.type || params.type || "hybrid",
      count: recommendations.length,
      debug_info: data.debug_info || null,
      error: data.error || null,
    };
  } catch (error) {
    console.error("❌ Error fetching personal recommendations:", error);

    // Log more details about the error
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
      console.error("Response headers:", error.response.headers);
    }

    // Return structured error response instead of throwing
    return {
      recommendations: [],
      user_id: null,
      type: params.type || "hybrid",
      count: 0,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch recommendations",
      debug_info: error.response?.data || null,
    };
  }
};

// DEBUG: Test specific user ID (for testing with your Neo4j data)
export const testRecommendationsForUser = async (userId = "user_demo_1") => {
  try {
    console.log(`🧪 Testing recommendations for user: ${userId}`);

    // Test all three types
    const [collaborative, content, hybrid] = await Promise.all([
      api.get(`/recommendations/collaborative/${userId}`, {
        params: { limit: 5 },
      }),
      api.get(`/recommendations/content/${userId}`, { params: { limit: 5 } }),
      api.get(`/recommendations/hybrid/${userId}`, { params: { limit: 5 } }),
    ]);

    console.log("🧪 Test Results:");
    console.log("- Collaborative:", collaborative.data);
    console.log("- Content:", content.data);
    console.log("- Hybrid:", hybrid.data);

    return {
      collaborative: collaborative.data,
      content: content.data,
      hybrid: hybrid.data,
    };
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
};

// DEBUG: Check what user info we have
export const debugUserInfo = async () => {
  try {
    console.log("🔍 Debugging user info...");

    const response = await api.get("/recommendations/debug/jwt-info");
    console.log("🔍 JWT Debug Response:", response.data);

    return response.data;
  } catch (error) {
    console.error("❌ JWT Debug failed:", error);
    return { error: error.message };
  }
};

export const getPersonalRecommendations = async (
  algorithm = "hybrid",
  limit = 15
) => {
  try {
    console.log(`🎯 Fetching ${algorithm} recommendations with limit ${limit}`);

    const response = await getMyRecommendations({
      type: algorithm,
      limit: limit,
    });

    return response;
  } catch (error) {
    console.error("❌ Error in getPersonalRecommendations:", error);

    return {
      recommendations: [],
      user_id: null,
      type: algorithm,
      count: 0,
      error: error.message,
    };
  }
};

export const getPopularRecommendations = async (genre = null, limit = 20) => {
  try {
    console.log(
      `📈 Fetching popular movies for genre: ${genre}, limit: ${limit}`
    );

    const params = { limit };
    if (genre) {
      params.genre = genre;
    }

    const response = await api.get("/recommendations/popular", { params });

    console.log("✅ Popular movies response:", response.data);

    // Handle response structure: { movies: [...], genre: "...", type: "popular", count: ... }
    const data = response.data;

    return {
      movies: data.movies || [],
      genre: data.genre || genre,
      type: "popular",
      count: (data.movies || []).length,
      error: data.error || null,
    };
  } catch (error) {
    console.error("❌ Error fetching popular movies:", error);

    return {
      movies: [],
      genre: genre,
      type: "popular",
      count: 0,
      error: error.message,
    };
  }
};

export const getCollaborativeRecommendations = async (userId, params = {}) => {
  try {
    const response = await api.get(`/recommendations/collaborative/${userId}`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching collaborative recommendations:", error);
    throw error;
  }
};

export const getContentBasedRecommendations = async (userId, params = {}) => {
  try {
    const response = await api.get(`/recommendations/content/${userId}`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching content-based recommendations:", error);
    throw error;
  }
};

export const getHybridRecommendations = async (userId, params = {}) => {
  try {
    const response = await api.get(`/recommendations/hybrid/${userId}`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching hybrid recommendations:", error);
    throw error;
  }
};

export const getPopularMovies = async (params = {}) => {
  try {
    const response = await api.get("/recommendations/popular", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching popular movies:", error);
    throw error;
  }
};

export const getSimilarMovies = async (movieId, limit = 10) => {
  try {
    const response = await api.get(`/recommendations/similar/${movieId}`, {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching similar movies:", error);
    throw error;
  }
};

export const getRecommendationsByGenre = async (genre, params = {}) => {
  try {
    const response = await api.get(
      `/recommendations/by-genre/${encodeURIComponent(genre)}`,
      { params }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching genre recommendations:", error);
    throw error;
  }
};

export const getNewReleases = async (params = {}) => {
  try {
    const response = await api.get("/recommendations/new-releases", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching new releases:", error);
    throw error;
  }
};

export const explainRecommendation = async (userId, movieId) => {
  try {
    const response = await api.get(
      `/recommendations/explain/${userId}/${movieId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error getting recommendation explanation:", error);
    throw error;
  }
};

// Utility function to get recommendations based on user's rating history
export const getRecommendationsForNewUser = async () => {
  try {
    // For users without ratings, show popular movies and new releases
    const [popular, newReleases] = await Promise.all([
      getPopularMovies({ limit: 10 }),
      getNewReleases({ limit: 10 }),
    ]);

    return {
      popular: popular.movies || [],
      newReleases: newReleases.movies || [],
    };
  } catch (error) {
    console.error("Error fetching recommendations for new user:", error);
    throw error;
  }
};

const recommendationService = {
  getMyRecommendations,
  getPersonalRecommendations,
  getPopularRecommendations,
  getCollaborativeRecommendations,
  getContentBasedRecommendations,
  getHybridRecommendations,
  getPopularMovies,
  getSimilarMovies,
  getRecommendationsByGenre,
  getNewReleases,
  explainRecommendation,
  getRecommendationsForNewUser,
  testRecommendationsForUser,
  debugUserInfo,
};

export default recommendationService;
