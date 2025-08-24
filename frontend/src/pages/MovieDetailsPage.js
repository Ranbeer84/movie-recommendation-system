import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MovieCard from '../components/movies/MovieCard';
import { getMovieDetails } from '../services/movieService';
import { rateMovie, checkUserRating } from '../services/ratingService';
import { getSimilarMovies } from '../services/recommendationService';
import { Star, Heart, Share2, Play, Calendar, Clock, Users, ArrowLeft, X, ChevronRight } from 'lucide-react';

const MovieDetailsPage = () => {
  const { movieId } = useParams();
  const { user, isAuthenticated } = useContext(AuthContext);
  const [movie, setMovie] = useState(null);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [userRating, setUserRating] = useState(null);
  const [newRating, setNewRating] = useState(0);
  const [review, setReview] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  // Enhanced debugging
  console.log('🎬 MovieDetailsPage render:', {
    movieId,
    movieIdType: typeof movieId,
    movie: movie ? { id: movie.id, title: movie.title } : null,
    loading,
    error,
    isAuthenticated,
    user: user?.username,
    urlParams: window.location.pathname
  });

  useEffect(() => {
    console.log('🔄 useEffect triggered - movieId:', movieId);
    
    if (movieId && movieId !== 'undefined' && movieId !== 'null') {
      console.log('✅ Valid movieId, fetching data...');
      fetchMovieData();
    } else {
      console.error('❌ Invalid movieId:', movieId);
      setError('Invalid movie ID provided');
      setLoading(false);
    }
  }, [movieId]);

  useEffect(() => {
    if (isAuthenticated && movieId && movieId !== 'undefined' && movieId !== 'null') {
      console.log('🔄 Auth changed, fetching user rating...');
      fetchUserRating();
    }
  }, [isAuthenticated, movieId]);

  const fetchMovieData = async () => {
    if (!movieId || movieId === 'undefined' || movieId === 'null') {
      console.error('❌ fetchMovieData: Invalid movieId:', movieId);
      setError('Invalid movie ID provided');
      setLoading(false);
      return;
    }

    console.log('🚀 fetchMovieData: Starting for movieId:', movieId, typeof movieId);
    setLoading(true);
    setError(null);
    setMovie(null);

    try {
      const numericMovieId = isNaN(movieId) ? movieId : parseInt(movieId, 10);
      console.log('🔢 Using movieId:', numericMovieId, typeof numericMovieId);

      console.log('📞 Calling getMovieDetails with:', numericMovieId);
      const movieData = await getMovieDetails(numericMovieId);
      console.log('📊 Movie details response:', movieData);

      if (!movieData) {
        throw new Error('No movie data returned from API');
      }

      let processedMovieData = movieData;
      
      if (movieData.movie && !movieData.id) {
        processedMovieData = movieData.movie;
        console.log('📦 Unwrapped movie data from response');
      }
      
      if (movieData.data && !movieData.id) {
        processedMovieData = movieData.data;
        console.log('📦 Unwrapped movie data from data property');
      }

      if (!processedMovieData.id && !processedMovieData.title) {
        console.error('❌ Invalid movie data structure:', processedMovieData);
        throw new Error('Invalid movie data received from server');
      }

      if (processedMovieData.id) {
        processedMovieData.id = parseInt(processedMovieData.id, 10);
      }

      setMovie(processedMovieData);
      console.log('✅ Movie details set successfully:', processedMovieData.title);

      try {
        console.log('📞 Calling getSimilarMovies with:', numericMovieId);
        const similarData = await getSimilarMovies(numericMovieId, 8);
        console.log('📊 Similar movies response:', similarData);
        
        let similarMoviesArray = [];
        
        if (similarData?.similar_movies && Array.isArray(similarData.similar_movies)) {
          similarMoviesArray = similarData.similar_movies;
        } else if (Array.isArray(similarData)) {
          similarMoviesArray = similarData;
        } else if (similarData?.data && Array.isArray(similarData.data)) {
          similarMoviesArray = similarData.data;
        }
        
        setSimilarMovies(similarMoviesArray);
        console.log('✅ Similar movies set:', similarMoviesArray.length, 'movies');
        
      } catch (similarError) {
        console.warn('⚠️ Failed to fetch similar movies (non-critical):', similarError.message);
        setSimilarMovies([]);
      }

    } catch (error) {
      console.error('💥 Error in fetchMovieData:', error);
      console.error('💥 Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method
      });

      let errorMessage = 'Failed to load movie details. Please try again.';
      
      if (error.response?.status === 404) {
        errorMessage = `Movie with ID "${movieId}" not found. It may have been removed or the link is incorrect.`;
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. You may need to log in to view this movie.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.name === 'NetworkError' || !navigator.onLine) {
        errorMessage = 'No internet connection. Please check your connection and try again.';
      } else if (error.message.includes('Invalid movie ID')) {
        errorMessage = `Invalid movie ID: "${movieId}". Please check the URL.`;
      }

      setError(errorMessage);
      setMovie(null);
    } finally {
      console.log('✅ fetchMovieData completed, setting loading to false');
      setLoading(false);
    }
  };

  const fetchUserRating = async () => {
    if (!movieId || !isAuthenticated || movieId === 'undefined' || movieId === 'null') {
      console.log('⏭️ Skipping fetchUserRating - missing requirements');
      return;
    }

    try {
      console.log('📞 Fetching user rating for movie:', movieId);
      const numericMovieId = isNaN(movieId) ? movieId : parseInt(movieId, 10);
      const ratingData = await checkUserRating(numericMovieId);
      console.log('📊 User rating response:', ratingData);
      
      if (ratingData?.has_rated && ratingData?.rating) {
        setUserRating(ratingData.rating);
        setNewRating(ratingData.rating.rating || 0);
        setReview(ratingData.rating.review || '');
        console.log('✅ User rating set:', ratingData.rating);
      } else {
        console.log('ℹ️ User has not rated this movie');
        setUserRating(null);
        setNewRating(0);
        setReview('');
      }
    } catch (error) {
      console.warn('⚠️ Error fetching user rating (non-critical):', error.message);
      setUserRating(null);
    }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!newRating || newRating < 1 || newRating > 5) {
      alert('Please select a rating between 1 and 5 stars');
      return;
    }

    setRatingLoading(true);

    try {
      const numericMovieId = isNaN(movieId) ? movieId : parseInt(movieId, 10);
      const ratingData = await rateMovie({
        movie_id: numericMovieId,
        rating: newRating,
        review: review.trim()
      });

      setUserRating(ratingData.rating);
      setShowRatingForm(false);
      
      await fetchMovieData();
      
      alert('Rating saved successfully!');
    } catch (error) {
      console.error('Error saving rating:', error);
      alert('Failed to save rating. Please try again.');
    } finally {
      setRatingLoading(false);
    }
  };

  const renderStars = (rating, interactive = false, size = 'medium') => {
    const stars = [];
    const maxStars = 5;
    const numericRating = parseFloat(rating) || 0;
    const currentRating = interactive ? (hoverRating || newRating) : numericRating;

    const sizeClasses = {
      small: 'text-sm',
      medium: 'text-lg',
      large: 'text-2xl'
    };

    for (let i = 1; i <= maxStars; i++) {
      const filled = i <= currentRating;
      stars.push(
        <button
          key={i}
          type="button"
          className={`${sizeClasses[size]} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform duration-200' : 'cursor-default'} ${filled ? 'text-yellow-400' : 'text-gray-400'} focus:outline-none`}
          onClick={interactive ? () => setNewRating(i) : undefined}
          onMouseEnter={interactive ? () => setHoverRating(i) : undefined}
          onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
          disabled={!interactive}
        >
          <Star className={`w-full h-full ${filled ? 'fill-current' : ''}`} />
        </button>
      );
    }

    return <div className="flex items-center gap-1">{stars}</div>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('Error formatting date:', dateString);
      return dateString;
    }
  };

  if (loading) {
    console.log('🔄 Showing loading spinner');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center">
        <LoadingSpinner />
        <div className="text-center mt-6">
          <p className="text-white text-lg">Loading movie details...</p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-gray-400 text-sm mt-2">
              Movie ID: {movieId} ({typeof movieId})
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    console.log('❌ Showing error state:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <h2 className="text-3xl font-bold text-white mb-4">Oops! Something went wrong</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => {
                console.log('🔄 Retrying movie data fetch');
                fetchMovieData();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2"
            >
              🔄 Try Again
            </button>
            <Link 
              to="/movies" 
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Browse Movies
            </Link>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left bg-gray-800/50 rounded-lg p-4">
              <summary className="cursor-pointer font-bold text-white text-sm">
                🔍 Debug Info (Development Only)
              </summary>
              <div className="mt-3 text-xs text-gray-300 font-mono">
                <p><strong>Movie ID:</strong> {movieId} ({typeof movieId})</p>
                <p><strong>URL:</strong> {window.location.pathname}</p>
                <p><strong>Error:</strong> {error}</p>
                <p><strong>Auth Status:</strong> {isAuthenticated ? 'Authenticated' : 'Not authenticated'}</p>
                <p><strong>User:</strong> {user?.username || 'None'}</p>
                <p><strong>Movie State:</strong> {movie ? 'Has movie data' : 'No movie data'}</p>
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }

  if (!movie) {
    console.log('❌ No movie data available');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <h2 className="text-3xl font-bold text-white mb-4">Movie not found</h2>
          <p className="text-gray-300 mb-6">The movie you're looking for doesn't exist or couldn't be loaded.</p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => {
                console.log('🔄 Retrying movie data fetch');
                fetchMovieData();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              🔄 Try Again
            </button>
            <Link 
              to="/movies" 
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Browse Movies
            </Link>
          </div>
        </div>
      </div>
    );
  }

  console.log('✅ Rendering movie details for:', movie.title);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            src={movie.poster_url || '/placeholder-movie.jpg'}
            alt={movie.title}
            className="w-full h-full object-cover opacity-20"
            onError={(e) => {
              console.warn('⚠️ Backdrop image failed to load:', movie.poster_url);
              e.target.src = '/placeholder-movie.jpg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/50" />
        </div>

        {/* Back Button */}
        <Link 
          to="/movies"
          className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full text-white hover:bg-black/60 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-5 gap-12 items-start">
            {/* Poster */}
            <div className="lg:col-span-2">
              <div className="relative group">
                <img
                  src={movie.poster_url || '/placeholder-movie.jpg'}
                  alt={movie.title}
                  className="w-full max-w-md mx-auto rounded-2xl shadow-2xl transform group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    console.warn('⚠️ Poster image failed to load:', movie.poster_url);
                    e.target.src = '/placeholder-movie.jpg';
                  }}
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Play Button Overlay */}
                <button className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-200">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </button>
              </div>
            </div>

            {/* Movie Info */}
            <div className="lg:col-span-3 text-white space-y-6">
              <div>
                <h1 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4">
                  {movie.title}
                </h1>
                <div className="flex items-center gap-4 text-lg text-gray-300 mb-6 flex-wrap">
                  {movie.year && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      <span>{movie.year}</span>
                    </div>
                  )}
                  {movie.runtime && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      <span>{movie.runtime} min</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span>{movie.rating_count || 0} ratings</span>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  {renderStars(movie.avg_rating)}
                  <span className="text-2xl font-bold text-white">
                    {movie.avg_rating ? parseFloat(movie.avg_rating).toFixed(1) : 'N/A'}
                  </span>
                  <span className="text-gray-400">/ 5</span>
                </div>
              </div>

              {/* Genres */}
              {movie.genres && Array.isArray(movie.genres) && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre, index) => (
                    <Link
                      key={`${genre}-${index}`}
                      to={`/movies?genre=${encodeURIComponent(genre)}`}
                      className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium hover:bg-white/20 transition-colors duration-200"
                    >
                      {genre}
                    </Link>
                  ))}
                </div>
              )}

              {/* Plot */}
              {movie.plot && (
                <p className="text-xl leading-relaxed text-gray-200 max-w-3xl">
                  {movie.plot}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 flex-wrap">
                {isAuthenticated && (
                  <button
                    onClick={() => setShowRatingForm(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    <Star className="w-5 h-5" />
                    {userRating ? 'Update Rating' : 'Rate Movie'}
                  </button>
                )}
                
                <button
                  onClick={() => setIsWatchlisted(!isWatchlisted)}
                  className={`flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg ${
                    isWatchlisted
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-white/10 hover:bg-white/20 backdrop-blur-sm'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWatchlisted ? 'fill-current' : ''}`} />
                  {isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
                </button>

                <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg">
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </div>

              {/* User's Rating Display */}
              {userRating && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-xl font-semibold mb-3">Your Rating</h3>
                  <div className="flex items-center gap-3 mb-3">
                    {renderStars(userRating.rating)}
                    <span className="text-lg font-semibold">{userRating.rating}/5</span>
                  </div>
                  {userRating.review && (
                    <p className="text-gray-300 italic">"{userRating.review}"</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Form Modal */}
      {showRatingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowRatingForm(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-2xl font-bold mb-6">{userRating ? 'Update Your Rating' : 'Rate This Movie'}</h3>
            
            <div className="space-y-6">
              <div className="text-center">
                <label className="block text-gray-700 font-medium mb-4">Your Rating:</label>
                <div className="flex justify-center mb-2">
                  {renderStars(newRating, true, 'large')}
                </div>
                <span className="text-lg font-semibold text-gray-800">
                  {newRating > 0 ? `${newRating}/5 stars` : 'Select a rating'}
                </span>
              </div>
              
              <div>
                <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-2">
                  Review (optional):
                </label>
                <textarea
                  id="review"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Share your thoughts about this movie..."
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  maxLength="1000"
                />
                <span className="text-sm text-gray-500 mt-1">{review.length}/1000</span>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRatingForm(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200"
                  disabled={ratingLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRatingSubmit}
                  disabled={ratingLoading || newRating === 0}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {ratingLoading ? 'Saving...' : 'Save Rating'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Section */}
      {movie.reviews && Array.isArray(movie.reviews) && movie.reviews.length > 0 && (
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-12">Recent Reviews</h2>
            <div className="grid gap-6">
              {movie.reviews.slice(0, 5).map((review, index) => (
                <div
                  key={`review-${index}`}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center font-bold text-white">
                        {(review.username || 'Anonymous').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-semibold text-white">{review.username || 'Anonymous'}</span>
                        <span className="block text-sm text-gray-400">
                          {formatDate(review.timestamp || review.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating, false, 'small')}
                      <span className="text-white font-semibold">{review.rating}/5</span>
                    </div>
                  </div>
                  {review.review && (
                    <p className="text-gray-300 leading-relaxed text-lg">"{review.review}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Similar Movies Section */}
      {similarMovies && similarMovies.length > 0 && (
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-4xl font-bold text-white">Similar Movies</h2>
              <button className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors duration-200">
                View All
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
              {similarMovies.map(similarMovie => (
                <MovieCard key={`similar-${similarMovie.id}`} movie={similarMovie} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Back Navigation */}
      <div className="px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <Link 
            to="/movies" 
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Movies
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailsPage;