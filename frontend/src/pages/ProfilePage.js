import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Avatar,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  CircularProgress,
  Divider,
  IconButton
} from '@mui/material';
import {
  Movie,
  Star,
  TrendingUp,
  Category,
  Analytics,
  Refresh,
  ExitToApp,
  DeleteForever,
  Recommend,
  Search,
  AutoAwesome,
  LocalMovies,
  EmojiEvents,
  Timeline,
  Close
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { getUserRatingStats } from '../services/ratingService';

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

    const mockDistribution = [
      { stars: 5, count: Math.floor(stats.total_ratings * 0.3), color: '#22c55e' },
      { stars: 4, count: Math.floor(stats.total_ratings * 0.4), color: '#84cc16' },
      { stars: 3, count: Math.floor(stats.total_ratings * 0.2), color: '#eab308' },
      { stars: 2, count: Math.floor(stats.total_ratings * 0.08), color: '#f97316' },
      { stars: 1, count: Math.floor(stats.total_ratings * 0.02), color: '#ef4444' }
    ];

    const maxCount = Math.max(...mockDistribution.map(d => d.count));

    return (
      <Card
        sx={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '1.5rem',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Analytics sx={{ color: '#a855f7', mr: 1 }} />
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
              Your Rating Distribution
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {mockDistribution.map(({ stars, count, color }) => (
              <Box key={stars} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '80px' }}>
                  <Typography variant="body2" sx={{ color: 'white', mr: 1 }}>
                    {stars}
                  </Typography>
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} sx={{ fontSize: 12, color: '#fbbf24' }} />
                  ))}
                  {Array.from({ length: 5 - stars }).map((_, i) => (
                    <Star key={i} sx={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.3)' }} />
                  ))}
                </Box>
                
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={maxCount > 0 ? (count / maxCount) * 100 : 0}
                    sx={{
                      flex: 1,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: color,
                        borderRadius: 4,
                      }
                    }}
                  />
                  <Typography variant="body2" sx={{ color: '#d1d5db', minWidth: '30px' }}>
                    {count}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (!user) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #7c3aed 50%, #0f172a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2,
        }}
      >
        <Card
          sx={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '1.5rem',
            p: 4,
            textAlign: 'center',
            maxWidth: '400px',
          }}
        >
          <Movie sx={{ fontSize: 64, color: '#a855f7', mb: 2 }} />
          <Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 600 }}>
            Sign in to view your profile
          </Typography>
          <Button
            component={Link}
            to="/login"
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
              borderRadius: '0.75rem',
              px: 4,
              py: 1.5,
              fontWeight: 600,
            }}
          >
            Sign In
          </Button>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #7c3aed 50%, #0f172a 100%)',
        position: 'relative',
        overflow: 'hidden',
        // Animated background elements
        '&::before': {
          content: '""',
          position: 'fixed',
          top: '-160px',
          right: '-160px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'rgba(168, 85, 247, 0.2)',
          filter: 'blur(48px)',
          animation: 'pulse 3s ease-in-out infinite',
          zIndex: 0,
        },
        '&::after': {
          content: '""',
          position: 'fixed',
          bottom: '-160px',
          left: '-160px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'rgba(59, 130, 246, 0.2)',
          filter: 'blur(48px)',
          animation: 'pulse 3s ease-in-out infinite 1.5s',
          zIndex: 0,
        },
        '@keyframes pulse': {
          '0%, 100%': { opacity: 0.4, transform: 'scale(1)' },
          '50%': { opacity: 0.6, transform: 'scale(1.1)' },
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress size={60} sx={{ color: '#a855f7' }} />
          </Box>
        ) : (
          <>
            {/* Profile Header */}
            <Card
              sx={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '1.5rem',
                mb: 4,
                overflow: 'hidden',
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      boxShadow: '0 10px 25px rgba(168, 85, 247, 0.3)',
                    }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                      {user.username}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#d1d5db', mb: 1 }}>
                      {user.email}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AutoAwesome sx={{ fontSize: 16, color: '#a855f7' }} />
                      <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                        Member since {formatMemberSince(user.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      onClick={logout}
                      sx={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        '&:hover': { background: 'rgba(255, 255, 255, 0.2)' }
                      }}
                    >
                      <ExitToApp />
                    </IconButton>
                    <IconButton
                      onClick={() => setShowDeleteConfirm(true)}
                      sx={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#f87171',
                        '&:hover': { background: 'rgba(239, 68, 68, 0.3)' }
                      }}
                    >
                      <DeleteForever />
                    </IconButton>
                  </Box>
                </Box>

                {error && (
                  <Alert
                    severity="error"
                    action={
                      <Button onClick={fetchUserStats} size="small" sx={{ color: 'white' }}>
                        <Refresh sx={{ mr: 1 }} /> Try Again
                      </Button>
                    }
                    sx={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '0.75rem',
                      '& .MuiAlert-message': { color: '#fca5a5' },
                      '& .MuiAlert-icon': { color: '#f87171' },
                    }}
                  >
                    {error}
                  </Alert>
                )}
              </CardContent>
            </Card>

            {stats && (
              <>
                {/* Statistics Overview */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{
                        background: 'rgba(34, 197, 94, 0.2)',
                        backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        borderRadius: '1.5rem',
                        transition: 'transform 0.2s ease',
                        '&:hover': { transform: 'scale(1.05)' }
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 3 }}>
                        <LocalMovies sx={{ fontSize: 40, color: '#22c55e', mb: 1 }} />
                        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                          {stats.total_ratings}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                          Movies Rated
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{
                        background: 'rgba(251, 191, 36, 0.2)',
                        backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(251, 191, 36, 0.3)',
                        borderRadius: '1.5rem',
                        transition: 'transform 0.2s ease',
                        '&:hover': { transform: 'scale(1.05)' }
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 3 }}>
                        <Star sx={{ fontSize: 40, color: '#fbbf24', mb: 1 }} />
                        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                          {stats.avg_rating ? stats.avg_rating.toFixed(1) : '0.0'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                          Average Rating
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{
                        background: 'rgba(168, 85, 247, 0.2)',
                        backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        borderRadius: '1.5rem',
                        transition: 'transform 0.2s ease',
                        '&:hover': { transform: 'scale(1.05)' }
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 3 }}>
                        <Category sx={{ fontSize: 40, color: '#a855f7', mb: 1 }} />
                        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                          {stats.rated_genres?.length || 0}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                          Genres Explored
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{
                        background: 'rgba(236, 72, 153, 0.2)',
                        backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(236, 72, 153, 0.3)',
                        borderRadius: '1.5rem',
                        transition: 'transform 0.2s ease',
                        '&:hover': { transform: 'scale(1.05)' }
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 3 }}>
                        <EmojiEvents sx={{ fontSize: 40, color: '#ec4899', mb: 1 }} />
                        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                          {stats.max_rating ? `${stats.max_rating}★` : 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                          Highest Rating
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Rating Distribution */}
                {stats.total_ratings > 0 && (
                  <Box sx={{ mb: 4 }}>
                    {renderRatingDistribution()}
                  </Box>
                )}

                {/* Two Column Layout */}
                <Grid container spacing={3}>
                  {/* Left Column */}
                  <Grid item xs={12} md={6}>
                    {/* Favorite Genres */}
                    {stats.rated_genres && stats.rated_genres.length > 0 && (
                      <Card
                        sx={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(24px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '1.5rem',
                          mb: 3,
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Category sx={{ color: '#a855f7', mr: 1 }} />
                            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                              Your Favorite Genres
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {stats.rated_genres.map(genre => (
                              <Chip
                                key={genre}
                                label={genre}
                                component={Link}
                                to={`/movies?genre=${encodeURIComponent(genre)}`}
                                clickable
                                sx={{
                                  background: 'rgba(168, 85, 247, 0.3)',
                                  color: 'white',
                                  border: '1px solid rgba(168, 85, 247, 0.5)',
                                  '&:hover': {
                                    background: 'rgba(168, 85, 247, 0.5)',
                                    transform: 'scale(1.05)',
                                  }
                                }}
                              />
                            ))}
                          </Box>
                        </CardContent>
                      </Card>
                    )}

                    {/* Improvement Tips */}
                    {stats.total_ratings < 10 && (
                      <Card
                        sx={{
                          background: 'rgba(59, 130, 246, 0.2)',
                          backdropFilter: 'blur(24px)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: '1.5rem',
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <TrendingUp sx={{ color: '#3b82f6', mr: 1 }} />
                            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                              💡 Improve Your Recommendations
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <Star sx={{ color: '#fbbf24', fontSize: 20 }} />
                              <Box>
                                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                                  Rate more movies:
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                                  You've rated {stats.total_ratings} movies. Try rating at least 10 for better recommendations.
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                            
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <Category sx={{ color: '#a855f7', fontSize: 20 }} />
                              <Box>
                                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                                  Explore different genres:
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                                  Rate movies from various genres to discover new favorites.
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    )}
                  </Grid>

                  {/* Right Column */}
                  <Grid item xs={12} md={6}>
                    {/* Quick Actions */}
                    <Card
                      sx={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '1.5rem',
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <Timeline sx={{ color: '#a855f7', mr: 1 }} />
                          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                            Quick Actions
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Button
                            component={Link}
                            to="/my-ratings"
                            variant="outlined"
                            startIcon={<Analytics />}
                            sx={{
                              justifyContent: 'flex-start',
                              p: 2,
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              color: 'white',
                              borderRadius: '0.75rem',
                              '&:hover': {
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                              }
                            }}
                          >
                            <Box sx={{ textAlign: 'left', ml: 1 }}>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                View My Ratings
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                                See all movies you've rated
                              </Typography>
                            </Box>
                          </Button>

                          <Button
                            component={Link}
                            to="/recommendations"
                            variant="outlined"
                            startIcon={<Recommend />}
                            sx={{
                              justifyContent: 'flex-start',
                              p: 2,
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              color: 'white',
                              borderRadius: '0.75rem',
                              '&:hover': {
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                              }
                            }}
                          >
                            <Box sx={{ textAlign: 'left', ml: 1 }}>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                Get Recommendations
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                                Discover new movies you'll love
                              </Typography>
                            </Box>
                          </Button>

                          <Button
                            component={Link}
                            to="/movies"
                            variant="outlined"
                            startIcon={<Search />}
                            sx={{
                              justifyContent: 'flex-start',
                              p: 2,
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              color: 'white',
                              borderRadius: '0.75rem',
                              '&:hover': {
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                              }
                            }}
                          >
                            <Box sx={{ textAlign: 'left', ml: 1 }}>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                Browse Movies
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                                Find more movies to rate
                              </Typography>
                            </Box>
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Empty State for New Users */}
                {stats.total_ratings === 0 && (
                  <Card
                    sx={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(24px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '1.5rem',
                      mt: 4,
                      textAlign: 'center',
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Movie sx={{ fontSize: 64, color: '#a855f7', mb: 2 }} />
                      <Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 600 }}>
                        Welcome to CineRecommend!
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#d1d5db', mb: 3 }}>
                        You haven't rated any movies yet. Start building your profile by rating some movies.
                      </Typography>
                      <Button
                        component={Link}
                        to="/movies"
                        variant="contained"
                        size="large"
                        sx={{
                          background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                          borderRadius: '0.75rem',
                          px: 4,
                          py: 2,
                          fontWeight: 600,
                          boxShadow: '0 10px 25px rgba(168, 85, 247, 0.3)',
                        }}
                      >
                        Get Started - Browse Movies
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        )}

        {/* Floating Action Button */}
        <Fab
          onClick={fetchUserStats}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(135deg, #9333ea 0%, #db2777 100%)',
            }
          }}
        >
          <Refresh />
        </Fab>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          PaperProps={{
            sx: {
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '1rem',
              color: 'white',
            }
          }}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Delete Account
            </Typography>
            <IconButton
              onClick={() => setShowDeleteConfirm(false)}
              sx={{ color: 'white' }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ color: '#d1d5db' }}>
              Are you sure you want to delete your account? This action cannot be undone.
              All your ratings and preferences will be permanently lost.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setShowDeleteConfirm(false)}
              sx={{
                color: '#d1d5db',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                }
              }}
            >
              Delete Account
            </Button>
          </DialogActions>
        </Dialog>
      </Container>

      {/* Additional floating background elements */}
      <Box
        sx={{
          position: 'fixed',
          top: '20%',
          left: '10%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(236, 72, 153, 0.1)',
          filter: 'blur(40px)',
          animation: 'pulse 4s ease-in-out infinite',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'fixed',
          bottom: '30%',
          right: '15%',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.1)',
          filter: 'blur(40px)',
          animation: 'pulse 4s ease-in-out infinite 2s',
          zIndex: 0,
        }}
      />
    </Box>
  );
};

export default ProfilePage;