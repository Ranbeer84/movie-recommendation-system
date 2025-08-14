import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getUserRatingStats } from '../services/ratingService';
import '../styles/ProfilePage.css';

const ProfilePage = () => {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const statsData = await getUserRatingStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setError('Failed to load profile statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    // This would require implementing a delete user endpoint
    alert('Account deletion feature coming soon!');
    setShowDeleteConfirm(false);
  };

  const formatMemberSince = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const renderRatingDistribution = () => {
    if (!stats || !stats.total_ratings) return null;

    // This would require additional backend endpoint for rating distribution
    // For now, showing placeholder
    const mockDistribution = [
      { stars: 5, count: Math.floor(stats.total_ratings * 0.3) },
      { stars: 4, count: Math.floor(stats.total_ratings * 0.4) },
      { stars: 3, count: Math.floor(stats.total_ratings * 0.2) },
      { stars: 2, count: Math.floor(stats.total_ratings * 0.08) },
      { stars: 1, count: Math.floor(stats.total_ratings * 0.02) }
    ];

    const maxCount = Math.max(...mockDistribution.map(d => d.count));

    return (
      <div className="rating-distribution">
        <h3>Your Rating Distribution</h3>
        <div className="distribution-bars">
          {mockDistribution.map(({ stars, count }) => (
            <div key={stars} className="distribution-row">
              <span className="star-label">
                {stars} {'★'.repeat(stars)}{'☆'.repeat(5-stars)}
              </span>
              <div className="bar-container">
                <div 
                  className="rating-bar" 
                  style={{ 
                    width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%`,
                    backgroundColor: `hsl(${(stars - 1) * 30 + 60}, 70%, 50%)`
                  }}
                ></div>
              </div>
              <span className="count-label">{count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="auth-required">
          <h2>Sign in to view your profile</h2>
          <Link to="/login" className="auth-button">Sign In</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-circle">
            {user.username.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="profile-info">
          <h1>{user.username}</h1>
          <p className="email">{user.email}</p>
          <p className="member-since">
            Member since {formatMemberSince(user.created_at)}
          </p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchUserStats}>Try Again</button>
        </div>
      )}

      {stats && (
        <div className="profile-content">
          {/* Statistics Overview */}
          <section className="stats-overview">
            <h2>Your Movie Journey</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{stats.total_ratings}</div>
                <div className="stat-label">Movies Rated</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {stats.avg_rating ? stats.avg_rating.toFixed(1) : '0.0'}
                </div>
                <div className="stat-label">Average Rating</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.rated_genres?.length || 0}</div>
                <div className="stat-label">Genres Explored</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {stats.max_rating ? `${stats.max_rating}★` : 'N/A'}
                </div>
                <div className="stat-label">Highest Rating</div>
              </div>
            </div>
          </section>

          {/* Rating Distribution */}
          {stats.total_ratings > 0 && (
            <section className="rating-analysis">
              {renderRatingDistribution()}
            </section>
          )}

          {/* Favorite Genres */}
          {stats.rated_genres && stats.rated_genres.length > 0 && (
            <section className="favorite-genres">
              <h3>Your Favorite Genres</h3>
              <div className="genres-list">
                {stats.rated_genres.map(genre => (
                  <Link
                    key={genre}
                    to={`/movies?genre=${encodeURIComponent(genre)}`}
                    className="genre-chip"
                  >
                    {genre}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Quick Actions */}
          <section className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="actions-grid">
              <Link to="/my-ratings" className="action-card">
                <div className="action-icon">📊</div>
                <div className="action-content">
                  <h4>View My Ratings</h4>
                  <p>See all movies you've rated</p>
                </div>
              </Link>
              <Link to="/recommendations" className="action-card">
                <div className="action-icon">🎯</div>
                <div className="action-content">
                  <h4>Get Recommendations</h4>
                  <p>Discover new movies you'll love</p>
                </div>
              </Link>
              <Link to="/movies" className="action-card">
                <div className="action-icon">🎬</div>
                <div className="action-content">
                  <h4>Browse Movies</h4>
                  <p>Find more movies to rate</p>
                </div>
              </Link>
            </div>
          </section>

          {/* Recommendation Tips */}
          {stats.total_ratings < 10 && (
            <section className="recommendation-tips">
              <h3>💡 Improve Your Recommendations</h3>
              <div className="tips-list">
                <div className="tip-item">
                  <span className="tip-icon">⭐</span>
                  <p>
                    <strong>Rate more movies:</strong> You've rated {stats.total_ratings} movies. 
                    Try rating at least 10 for better recommendations.
                  </p>
                </div>
                <div className="tip-item">
                  <span className="tip-icon">🎭</span>
                  <p>
                    <strong>Explore different genres:</strong> Rate movies from various genres 
                    to discover new favorites.
                  </p>
                </div>
                <div className="tip-item">
                  <span className="tip-icon">✍️</span>
                  <p>
                    <strong>Write reviews:</strong> Add detailed reviews to help our algorithm 
                    understand your preferences better.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Account Management */}
          <section className="account-management">
            <h3>Account Settings</h3>
            <div className="account-actions">
              <button onClick={logout} className="logout-button">
                Sign Out
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="delete-account-button"
              >
                Delete Account
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Account</h3>
            <p>
              Are you sure you want to delete your account? This action cannot be undone.
              All your ratings and preferences will be permanently lost.
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button onClick={handleDeleteAccount} className="confirm-delete-button">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State for New Users */}
      {stats && stats.total_ratings === 0 && (
        <div className="empty-profile">
          <div className="empty-content">
            <h3>Welcome to CineRecommend!</h3>
            <p>You haven't rated any movies yet. Start building your profile by rating some movies.</p>
            <Link to="/movies" className="get-started-button">
              Get Started - Browse Movies
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;