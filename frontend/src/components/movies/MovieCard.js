import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
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
  const [showQuickRate, setShowQuickRate] = useState(false);
  const [quickRating, setQuickRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isRating, setIsRating] = useState(false);
  const [userRating, setUserRating] = useState(null);

  React.useEffect(() => {
    if (isAuthenticated && movie.id) {
      fetchUserRating();
    }
  }, [isAuthenticated, movie.id]);

  const fetchUserRating = async () => {
    try {
      const ratingData = await checkUserRating(movie.id);
      if (ratingData.has_rated) {
        setUserRating(ratingData.rating);
      }
    } catch (error) {
      // User hasn't rated this movie, which is fine
    }
  };

  const handleQuickRate = async (rating) => {
    if (!isAuthenticated) return;

    setIsRating(true);
    try {
      const ratingData = await rateMovie({
        movie_id: movie.id,
        rating: rating,
        review: ''
      });
      
      setUserRating(ratingData.rating);
      setShowQuickRate(false);
      
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

  const renderStars = (rating, interactive = false, size = 'small') => {
    const stars = [];
    const maxStars = 5;
    const displayRating = interactive ? (hoverRating || quickRating) : rating;

    for (let i = 1; i <= maxStars; i++) {
      const filled = i <= displayRating;
      stars.push(
        <span
          key={i}
          className={`star ${size} ${filled ? 'filled' : 'empty'} ${interactive ? 'interactive' : ''}`}
          onClick={interactive ? () => {
            setQuickRating(i);
            handleQuickRate(i);
          } : undefined}
          onMouseEnter={interactive ? () => setHoverRating(i) : undefined}
          onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
        >
          {filled ? '★' : '☆'}
        </span>
      );
    }

    return <span className="stars-container">{stars}</span>;
  };

  const getRecommendationBadge = () => {
    if (!showRecommendationScore || !recommendationSources || recommendationSources.length === 0) {
      return null;
    }

    const badgeText = recommendationSources.includes('collaborative') && recommendationSources.includes('content')
      ? 'Perfect Match'
      : recommendationSources.includes('collaborative')
        ? 'Similar Users'
        : recommendationSources.includes('content')
          ? 'Your Taste'
          : 'Recommended';

    const badgeColor = recommendationSources.length > 1 
      ? '#4CAF50' 
      : recommendationSources.includes('collaborative')
        ? '#2196F3'
        : '#FF9800';

    return (
      <div 
        className="recommendation-badge"
        style={{ backgroundColor: badgeColor }}
      >
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

  return (
    <div className="movie-card">
      {getRecommendationBadge()}
      
      <Link to={`/movies/${movie.id}`} className="movie-card-link">
        <div className="movie-poster-container">
          <img
            src={movie.poster_url || '/placeholder-movie.jpg'}
            alt={movie.title}
            className="movie-poster"
            onError={(e) => {
              e.target.src = '/placeholder-movie.jpg';
            }}
          />
          
          {/* Overlay with quick actions */}
          <div className="movie-overlay">
            <div className="overlay-content">
              <div className="movie-rating">
                {renderStars(movie.avg_rating)}
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
      </Link>
      
      <div className="movie-info">
        <Link to={`/movies/${movie.id}`} className="movie-title-link">
          <h3 className="movie-title" title={movie.title}>
            {truncateTitle(movie.title)}
          </h3>
        </Link>
        <p className="movie-year">{formatYear(movie.year)}</p>
        
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
                  e.stopPropagation();
                  setShowQuickRate(true);
                }}
                className="quick-rate-button"
                disabled={isRating}
              >
                ⭐ Quick Rate
              </button>
            ) : (
              <div className="quick-rate-stars" onClick={(e) => e.stopPropagation()}>
                <span className="rate-label">Rate:</span>
                {renderStars(quickRating, true)}
                <button
                  onClick={() => setShowQuickRate(false)}
                  className="cancel-rate-button"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Movie metadata */}
        <div className="movie-metadata">
          {movie.rating_count > 0 && (
            <span className="rating-count">
              {movie.rating_count} rating{movie.rating_count !== 1 ? 's' : ''}
            </span>
          )}
          
          {showRecommendationScore && movie.recommendation_score && (
            <span className="recommendation-score">
              Match: {(movie.recommendation_score * 20).toFixed(0)}%
            </span>
          )}
        </div>
        
        {/* Genres (if available) */}
        {movie.genres && movie.genres.length > 0 && (
          <div className="movie-genres-preview">
            {movie.genres.slice(0, 2).map(genre => (
              <span key={genre} className="genre-chip-small">
                {genre}
              </span>
            ))}
            {movie.genres.length > 2 && (
              <span className="more-genres">+{movie.genres.length - 2}</span>
            )}
          </div>
        )}
      </div>
      
      {/* Loading overlay for rating */}
      {isRating && (
        <div className="rating-loading-overlay">
          <div className="loading-spinner-small"></div>
        </div>
      )}
    </div>
  );
};

export default MovieCard;