import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Changed from Link to useNavigate
import { AuthContext } from '../../context/AuthContext';
import { rateMovie, checkUserRating } from '../../services/ratingService';
import './MovieCard.css';

const MovieCard = ({ 
  movie, 
  showRecommendationScore = false, 
  recommendationSources = [], 
  onRatingUpdate = null 
}) => {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate(); // Add navigation hook
  const [showQuickRate, setShowQuickRate] = useState(false);
  const [quickRating, setQuickRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isRating, setIsRating] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const fetchUserRating = useCallback(async () => {
    if (!isAuthenticated || !movie?.id) return;
    
    try {
      const ratingData = await checkUserRating(movie.id);
      if (ratingData?.has_rated) {
        setUserRating(ratingData);
      }
    } catch (error) {
      console.warn('User rating not found:', error.message);
      // This is expected for unrated movies
    }
  }, [isAuthenticated, movie?.id]);

  useEffect(() => {
    fetchUserRating();
  }, [fetchUserRating]);

  // Handle navigation to movie details
  const handleMovieClick = (e) => {
    // Only navigate if the click isn't on an interactive element
    if (e.target.closest('.quick-rate-section') || 
        e.target.closest('.star.interactive') || 
        e.target.closest('.cancel-rate-button')) {
      return;
    }
    
    if (movie?.id) {
      console.log('Navigating to movie details:', { movieId: movie.id, movieTitle: movie.title });
      navigate(`/movies/${movie.id}`);
    }
  };

  const handleQuickRate = async (rating) => {
    if (!isAuthenticated || !movie?.id) return;

    setIsRating(true);
    try {
      const ratingData = await rateMovie(movie.id, rating, '');
      
      setUserRating(ratingData);
      setShowQuickRate(false);
      setQuickRating(0);
      
      if (onRatingUpdate) {
        onRatingUpdate(movie.id, rating);
      }
    } catch (error) {
      console.error('Error rating movie:', error);
      alert('Failed to rate movie. Please try again.');
    } finally {
      setIsRating(false);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = (e) => {
    setImageError(true);
    e.target.src = '/placeholder-movie.jpg';
  };

  const renderStars = (rating, interactive = false, size = 'small') => {
    const stars = [];
    const maxStars = 5;
    const displayRating = interactive ? (hoverRating || quickRating) : rating;

    for (let i = 1; i <= maxStars; i++) {
      const filled = i <= displayRating;
      const halfFilled = !filled && (displayRating > i - 1 && displayRating < i);
      
      stars.push(
        <span
          key={i}
          className={`star ${size} ${filled ? 'filled' : halfFilled ? 'half-filled' : 'empty'} ${interactive ? 'interactive' : ''}`}
          onClick={interactive ? (e) => {
            e.preventDefault();
            e.stopPropagation();
            setQuickRating(i);
            handleQuickRate(i);
          } : undefined}
          onMouseEnter={interactive ? () => setHoverRating(i) : undefined}
          onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
          role={interactive ? 'button' : undefined}
          tabIndex={interactive ? 0 : undefined}
          onKeyPress={interactive ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              setQuickRating(i);
              handleQuickRate(i);
            }
          } : undefined}
        >
          {filled ? '★' : halfFilled ? '⯨' : '☆'}
        </span>
      );
    }

    return <div className="stars-container">{stars}</div>;
  };

  const getRecommendationBadge = () => {
    if (!showRecommendationScore || !recommendationSources?.length) {
      return null;
    }

    const hasCollaborative = recommendationSources.includes('collaborative');
    const hasContent = recommendationSources.includes('content');
    
    let badgeText, badgeClass;
    
    if (hasCollaborative && hasContent) {
      badgeText = 'Perfect Match';
      badgeClass = 'badge-perfect';
    } else if (hasCollaborative) {
      badgeText = 'Similar Users';
      badgeClass = 'badge-collaborative';
    } else if (hasContent) {
      badgeText = 'Your Taste';
      badgeClass = 'badge-content';
    } else {
      badgeText = 'Recommended';
      badgeClass = 'badge-default';
    }

    return (
      <div className={`recommendation-badge ${badgeClass}`}>
        <span className="badge-icon">✨</span>
        {badgeText}
      </div>
    );
  };

  const formatYear = (year) => {
    return year ? `(${year})` : '';
  };

  const truncateTitle = (title, maxLength = 30) => {
    if (!title) return '';
    return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
  };

  const truncatePlot = (plot, maxLength = 100) => {
    if (!plot) return '';
    return plot.length > maxLength ? `${plot.substring(0, maxLength)}...` : plot;
  };

  // Ensure movie object exists and has valid ID
  if (!movie || !movie.id) {
    console.warn('MovieCard: Invalid movie data', movie);
    return null;
  }

  // Ensure movie ID is valid for URL
  const movieId = movie.id;
  if (!movieId || movieId === 'undefined' || movieId === 'null') {
    console.warn('MovieCard: Invalid movie ID', movieId);
    return null;
  }

  return (
    <div className="movie-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {getRecommendationBadge()}
      
      <div className="movie-card-container" onClick={handleMovieClick}>
        {/* Removed Link wrapper - using onClick instead */}
        <div className="movie-card-content">
          <div className="movie-poster-container">
            <div className={`image-wrapper ${imageLoaded ? 'loaded' : ''}`}>
              <img
                src={movie.poster_url || '/placeholder-movie.jpg'}
                alt={`${movie.title} poster`}
                className="movie-poster"
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="lazy"
              />
              {!imageLoaded && !imageError && (
                <div className="image-skeleton">
                  <div className="skeleton-shimmer"></div>
                </div>
              )}
            </div>
            
            {/* Gradient overlay for better text readability */}
            <div className="movie-overlay">
              <div className="overlay-gradient"></div>
              <div className="overlay-content">
                <div className="movie-rating-overlay">
                  {renderStars(movie.avg_rating || 0)}
                  <span className="rating-text">
                    {movie.avg_rating ? movie.avg_rating.toFixed(1) : 'No rating'}
                  </span>
                </div>
                
                {movie.plot && (
                  <p className="movie-plot-preview">
                    {truncatePlot(movie.plot)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="movie-info">
          {/* Removed Link wrapper - title click handled by parent */}
          <div className="movie-title-section">
            <h3 className="movie-title" title={movie.title}>
              {truncateTitle(movie.title)}
            </h3>
          </div>
          
          <div className="movie-year-rating">
            <p className="movie-year">{formatYear(movie.year)}</p>
            
            {movie.rating_count > 0 && (
              <span className="rating-count">
                {movie.rating_count} rating{movie.rating_count !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          {/* User's rating if available */}
          {userRating && (
            <div className="user-rating-display">
              <span className="user-rating-label">Your rating:</span>
              {renderStars(userRating.rating)}
            </div>
          )}
          
          {/* Quick rating for authenticated users */}
          {isAuthenticated && !userRating && (
            <div className="quick-rate-section">
              {!showQuickRate ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowQuickRate(true);
                  }}
                  className="quick-rate-button"
                  disabled={isRating}
                  aria-label="Quick rate this movie"
                >
                  <span className="button-icon">⭐</span>
                  Quick Rate
                </button>
              ) : (
                <div className="quick-rate-stars" onClick={(e) => e.stopPropagation()}>
                  <span className="rate-label">Rate:</span>
                  {renderStars(quickRating, true)}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowQuickRate(false);
                      setQuickRating(0);
                      setHoverRating(0);
                    }}
                    className="cancel-rate-button"
                    aria-label="Cancel rating"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Recommendation score */}
          {showRecommendationScore && movie.recommendation_score && (
            <div className="recommendation-score">
              <span className="score-label">Match:</span>
              <span className="score-value">
                {Math.round(movie.recommendation_score * 100)}%
              </span>
            </div>
          )}
          
          {/* Genres preview */}
          {movie.genres && movie.genres.length > 0 && (
            <div className="movie-genres-preview">
              {movie.genres.slice(0, 2).map(genre => (
                <span key={genre} className="genre-chip">
                  {genre}
                </span>
              ))}
              {movie.genres.length > 2 && (
                <span className="more-genres">
                  +{movie.genres.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Loading overlay for rating */}
      {isRating && (
        <div className="rating-loading-overlay">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieCard;