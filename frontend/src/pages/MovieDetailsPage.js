import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MovieCard from '../components/movies/MovieCard';
import { getMovieDetails } from '../services/movieService';
import { rateMovie, checkUserRating } from '../services/ratingService';
import { getSimilarMovies } from '../services/recommendationService';
import '../styles/MovieDetailsPage.css';

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

  useEffect(() => {
    fetchMovieData();
  }, [movieId]);

  useEffect(() => {
    if (isAuthenticated && movieId) {
      fetchUserRating();
    }
  }, [isAuthenticated, movieId]);

  const fetchMovieData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch movie details and similar movies in parallel
      const [movieData, similarData] = await Promise.all([
        getMovieDetails(movieId),
        getSimilarMovies(movieId, 8)
      ]);

      setMovie(movieData);
      setSimilarMovies(similarData.similar_movies || []);
    } catch (error) {
      console.error('Error fetching movie data:', error);
      setError('Failed to load movie details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRating = async () => {
    try {
      const ratingData = await checkUserRating(movieId);
      if (ratingData.has_rated) {
        setUserRating(ratingData.rating);
        setNewRating(ratingData.rating.rating);
        setReview(ratingData.rating.review || '');
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
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
      const ratingData = await rateMovie({
        movie_id: movieId,
        rating: newRating,
        review: review.trim()
      });

      setUserRating(ratingData.rating);
      setShowRatingForm(false);
      
      // Refresh movie data to get updated rating
      fetchMovieData();
      
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

    for (let i = 1; i <= maxStars; i++) {
      const filled = i <= (interactive ? (hoverRating || newRating) : rating);
      stars.push(
        <span
          key={i}
          className={`star ${size} ${filled ? 'filled' : 'empty'} ${interactive ? 'interactive' : ''}`}
          onClick={interactive ? () => setNewRating(i) : undefined}
          onMouseEnter={interactive ? () => setHoverRating(i) : undefined}
          onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
        >
          {filled ? '★' : '☆'}
        </span>
      );
    }

    return <span className="stars-container">{stars}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !movie) {
    return (
      <div className="error-container">
        <h2>Oops! Movie not found</h2>
        <p>{error || 'The movie you\'re looking for doesn\'t exist.'}</p>
        <Link to="/movies" className="back-button">
          ← Browse Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="movie-details-page">
      {/* Hero Section */}
      <div className="movie-hero">
        <div className="movie-backdrop">
          <img
            src={movie.poster_url || '/placeholder-movie.jpg'}
            alt={movie.title}
            className="backdrop-image"
            onError={(e) => {
              e.target.src = '/placeholder-movie.jpg';
            }}
          />
          <div className="backdrop-overlay"></div>
        </div>
        
        <div className="movie-hero-content">
          <div className="movie-poster">
            <img
              src={movie.poster_url || '/placeholder-movie.jpg'}
              alt={movie.title}
              onError={(e) => {
                e.target.src = '/placeholder-movie.jpg';
              }}
            />
          </div>
          
          <div className="movie-info">
            <h1 className="movie-title">{movie.title}</h1>
            <div className="movie-meta">
              <span className="movie-year">{movie.year}</span>
              <div className="movie-rating">
                {renderStars(movie.avg_rating)}
                <span className="rating-text">
                  {movie.avg_rating?.toFixed(1)} ({movie.rating_count} ratings)
                </span>
              </div>
            </div>
            
            {movie.genres && movie.genres.length > 0 && (
              <div className="movie-genres">
                {movie.genres.map(genre => (
                  <Link
                    key={genre}
                    to={`/movies?genre=${encodeURIComponent(genre)}`}
                    className="genre-tag"
                  >
                    {genre}
                  </Link>
                ))}
              </div>
            )}
            
            <p className="movie-plot">{movie.plot}</p>
            
            {/* User Rating Section */}
            {isAuthenticated && (
              <div className="user-rating-section">
                {userRating ? (
                  <div className="existing-rating">
                    <h4>Your Rating:</h4>
                    <div className="rating-display">
                      {renderStars(userRating.rating)}
                      <span>({userRating.rating}/5)</span>
                      <button
                        onClick={() => setShowRatingForm(true)}
                        className="edit-rating-button"
                      >
                        Edit
                      </button>
                    </div>
                    {userRating.review && (
                      <p className="user-review">"{userRating.review}"</p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRatingForm(true)}
                    className="rate-movie-button"
                  >
                    ⭐ Rate this Movie
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating Form Modal */}
      {showRatingForm && (
        <div className="rating-modal-overlay" onClick={() => setShowRatingForm(false)}>
          <div className="rating-modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleRatingSubmit}>
              <h3>{userRating ? 'Update Your Rating' : 'Rate This Movie'}</h3>
              
              <div className="rating-input">
                <label>Your Rating:</label>
                <div className="stars-input">
                  {renderStars(newRating, true, 'large')}
                </div>
                <span className="rating-value">
                  {newRating > 0 ? `${newRating}/5 stars` : 'Select a rating'}
                </span>
              </div>
              
              <div className="review-input">
                <label htmlFor="review">Review (optional):</label>
                <textarea
                  id="review"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Share your thoughts about this movie..."
                  rows="4"
                  maxLength="1000"
                />
                <span className="char-count">{review.length}/1000</span>
              </div>
              
              <div className="modal-buttons">
                <button
                  type="button"
                  onClick={() => setShowRatingForm(false)}
                  className="cancel-button"
                  disabled={ratingLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-rating-button"
                  disabled={ratingLoading || newRating === 0}
                >
                  {ratingLoading ? 'Saving...' : 'Save Rating'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reviews Section */}
      {movie.reviews && movie.reviews.length > 0 && (
        <section className="reviews-section">
          <h2>Recent Reviews</h2>
          <div className="reviews-list">
            {movie.reviews.slice(0, 5).map((review, index) => (
              <div key={index} className="review-item">
                <div className="review-header">
                  <span className="reviewer-name">{review.username}</span>
                  <div className="review-rating">
                    {renderStars(review.rating, false, 'small')}
                  </div>
                  <span className="review-date">
                    {formatDate(review.timestamp)}
                  </span>
                </div>
                {review.review && (
                  <p className="review-text">"{review.review}"</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Similar Movies Section */}
      {similarMovies.length > 0 && (
        <section className="similar-movies-section">
          <h2>Similar Movies</h2>
          <div className="similar-movies-grid">
            {similarMovies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>
      )}

      {/* Back Navigation */}
      <div className="back-navigation">
        <Link to="/movies" className="back-button">
          ← Back to Movies
        </Link>
      </div>
    </div>
  );
};

export default MovieDetailsPage;