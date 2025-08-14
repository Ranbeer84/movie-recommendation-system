import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getMyRatings, deleteRating } from '../services/ratingService';
import '../styles/MyRatingsPage.css';

const MyRatingsPage = () => {
  const { user } = useContext(AuthContext);
  const [ratings, setRatings] = useState([]);
  const [filteredRatings, setFilteredRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [filterRating, setFilterRating] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    if (user) {
      fetchRatings(true);
    }
  }, [user]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [ratings, sortBy, filterRating, searchQuery]);

  const fetchRatings = async (reset = false) => {
    setLoading(true);
    setError(null);

    try {
      const currentPage = reset ? 1 : page;
      const data = await getMyRatings({
        page: currentPage,
        limit: 20
      });

      if (reset) {
        setRatings(data.ratings);
        setPage(2);
      } else {
        setRatings(prev => [...prev, ...data.ratings]);
        setPage(prev => prev + 1);
      }

      setHasMore(data.ratings.length === 20);
    } catch (error) {
      console.error('Error fetching ratings:', error);
      setError('Failed to load your ratings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...ratings];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(rating =>
        rating.movie_title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply rating filter
    if (filterRating !== 'all') {
      const ratingValue = parseInt(filterRating);
      filtered = filtered.filter(rating => Math.floor(rating.rating) === ratingValue);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.timestamp) - new Date(a.timestamp);
        case 'oldest':
          return new Date(a.timestamp) - new Date(b.timestamp);
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        case 'title':
          return a.movie_title.localeCompare(b.movie_title);
        case 'year':
          return b.movie_year - a.movie_year;
        default:
          return 0;
      }
    });

    setFilteredRatings(filtered);
  };

  const handleDeleteRating = async (movieId, movieTitle) => {
    if (!window.confirm(`Are you sure you want to delete your rating for "${movieTitle}"?`)) {
      return;
    }

    setDeleteLoading(movieId);

    try {
      await deleteRating(movieId);
      setRatings(prev => prev.filter(rating => rating.movie_id !== movieId));
      alert('Rating deleted successfully!');
    } catch (error) {
      console.error('Error deleting rating:', error);
      alert('Failed to delete rating. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <span className="stars">
        {'★'.repeat(fullStars)}
        {hasHalfStar && '⭐'}
        {'☆'.repeat(emptyStars)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return '#4CAF50';
    if (rating >= 3.5) return '#8BC34A';
    if (rating >= 2.5) return '#FFC107';
    if (rating >= 1.5) return '#FF9800';
    return '#F44336';
  };

  const getStatistics = () => {
    if (ratings.length === 0) return null;

    const totalRatings = ratings.length;
    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;
    const ratingCounts = ratings.reduce((acc, r) => {
      const star = Math.floor(r.rating);
      acc[star] = (acc[star] || 0) + 1;
      return acc;
    }, {});

    return { totalRatings, avgRating, ratingCounts };
  };

  if (!user) {
    return (
      <div className="my-ratings-page">
        <div className="auth-required">
          <h2>Sign in to view your ratings</h2>
          <Link to="/login" className="auth-button">Sign In</Link>
        </div>
      </div>
    );
  }

  if (loading && ratings.length === 0) {
    return <LoadingSpinner />;
  }

  const stats = getStatistics();

  return (
    <div className="my-ratings-page">
      <div className="page-header">
        <h1>📊 My Movie Ratings</h1>
        {stats && (
          <div className="stats-summary">
            <span className="stat">
              <strong>{stats.totalRatings}</strong> movies rated
            </span>
            <span className="stat">
              <strong>{stats.avgRating.toFixed(1)}</strong> average rating
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => fetchRatings(true)}>Try Again</button>
        </div>
      )}

      {ratings.length > 0 ? (
        <>
          {/* Filters and Search */}
          <div className="ratings-controls">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search your rated movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filters">
              <div className="filter-group">
                <label>Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-select"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
                  <option value="title">Movie Title</option>
                  <option value="year">Release Year</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Rating:</label>
                <select
                  value={filterRating}
                  onChange={(e) => setFilterRating(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>
            </div>
          </div>

          {/* Statistics Bar */}
          {stats && (
            <div className="rating-statistics">
              <h3>Your Rating Distribution</h3>
              <div className="stats-bars">
                {[5, 4, 3, 2, 1].map(star => (
                  <div key={star} className="stat-bar">
                    <span className="star-label">{star}★</span>
                    <div className="bar-background">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${stats.ratingCounts[star] ? (stats.ratingCounts[star] / stats.totalRatings) * 100 : 0}%`,
                          backgroundColor: getRatingColor(star)
                        }}
                      ></div>
                    </div>
                    <span className="count-label">{stats.ratingCounts[star] || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ratings List */}
          <div className="ratings-list">
            {filteredRatings.length > 0 ? (
              filteredRatings.map((rating) => (
                <div key={rating.movie_id} className="rating-card">
                  <div className="movie-poster">
                    <img
                      src={rating.poster_url || '/placeholder-movie.jpg'}
                      alt={rating.movie_title}
                      onError={(e) => {
                        e.target.src = '/placeholder-movie.jpg';
                      }}
                    />
                  </div>

                  <div className="rating-content">
                    <div className="movie-info">
                      <h3 className="movie-title">
                        <Link to={`/movies/${rating.movie_id}`}>
                          {rating.movie_title}
                        </Link>
                      </h3>
                      <p className="movie-year">({rating.movie_year})</p>
                    </div>

                    <div className="rating-details">
                      <div className="rating-score">
                        <div className="stars-display">
                          {renderStars(rating.rating)}
                        </div>
                        <span 
                          className="rating-number"
                          style={{ color: getRatingColor(rating.rating) }}
                        >
                          {rating.rating}/5
                        </span>
                      </div>
                      
                      <div className="rating-date">
                        Rated on {formatDate(rating.timestamp)}
                      </div>

                      {rating.review && (
                        <div className="rating-review">
                          <h4>Your Review:</h4>
                          <p>"{rating.review}"</p>
                        </div>
                      )}
                    </div>

                    <div className="rating-actions">
                      <Link
                        to={`/movies/${rating.movie_id}`}
                        className="view-movie-button"
                      >
                        View Movie
                      </Link>
                      <button
                        onClick={() => handleDeleteRating(rating.movie_id, rating.movie_title)}
                        disabled={deleteLoading === rating.movie_id}
                        className="delete-rating-button"
                      >
                        {deleteLoading === rating.movie_id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                <h3>No ratings found</h3>
                <p>
                  {searchQuery 
                    ? `No movies match your search for "${searchQuery}"`
                    : filterRating !== 'all' 
                      ? `No movies with ${filterRating} star rating`
                      : 'No ratings to show'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Load More Button */}
          {hasMore && !searchQuery && filterRating === 'all' && (
            <div className="load-more-section">
              <button
                onClick={() => fetchRatings(false)}
                disabled={loading}
                className="load-more-button"
              >
                {loading ? 'Loading...' : 'Load More Ratings'}
              </button>
            </div>
          )}

          {/* Results Summary */}
          <div className="results-summary">
            {filteredRatings.length !== ratings.length && (
              <p>
                Showing {filteredRatings.length} of {ratings.length} ratings
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="empty-ratings">
          <div className="empty-content">
            <h3>🎬 No movies rated yet</h3>
            <p>Start rating movies to build your profile and get personalized recommendations!</p>
            <div className="empty-actions">
              <Link to="/movies" className="browse-movies-button">
                Browse Movies
              </Link>
              <Link to="/recommendations" className="view-popular-button">
                View Popular Movies
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats for Non-Empty State */}
      {ratings.length > 0 && (
        <div className="quick-stats">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{ratings.length}</span>
              <span className="stat-label">Total Ratings</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {stats ? stats.avgRating.toFixed(1) : '0.0'}
              </span>
              <span className="stat-label">Average Rating</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {stats ? Math.max(...Object.keys(stats.ratingCounts).map(Number)) : 0}★
              </span>
              <span className="stat-label">Most Common Rating</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {ratings.length > 0 ? formatDate(ratings[0].timestamp) : 'N/A'}
              </span>
              <span className="stat-label">Last Rated</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRatingsPage;