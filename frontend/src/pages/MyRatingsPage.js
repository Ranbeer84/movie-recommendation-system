import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
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
  CircularProgress,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Avatar,
  Divider,
  IconButton,
  Paper,
  Skeleton
} from '@mui/material';
import {
  Movie,
  Star,
  Analytics,
  Search,
  FilterList,
  Sort,
  DeleteOutline,
  Visibility,
  AutoAwesome,
  TrendingUp,
  CalendarToday,
  Category,
  Close,
  ExpandMore,
  Refresh
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { getMyRatings, deleteRating } from '../services/ratingService';

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
  const [deleteDialog, setDeleteDialog] = useState({ open: false, movieId: null, title: '' });
  const [showStats, setShowStats] = useState(true);

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

    if (searchQuery.trim()) {
      filtered = filtered.filter(rating =>
        rating.movie_title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterRating !== 'all') {
      const ratingValue = parseInt(filterRating);
      filtered = filtered.filter(rating => Math.floor(rating.rating) === ratingValue);
    }

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
    setDeleteDialog({ open: true, movieId, title: movieTitle });
  };

  const confirmDelete = async () => {
    const { movieId, title } = deleteDialog;
    setDeleteLoading(movieId);
    setDeleteDialog({ open: false, movieId: null, title: '' });

    try {
      await deleteRating(movieId);
      setRatings(prev => prev.filter(rating => rating.movie_id !== movieId));
    } catch (error) {
      console.error('Error deleting rating:', error);
      setError('Failed to delete rating. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        sx={{
          fontSize: 18,
          color: index < Math.floor(rating) ? '#fbbf24' : 'rgba(255, 255, 255, 0.3)',
          filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.3))'
        }}
      />
    ));
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
    if (rating >= 4.5) return '#22c55e';
    if (rating >= 3.5) return '#84cc16';
    if (rating >= 2.5) return '#eab308';
    if (rating >= 1.5) return '#f97316';
    return '#ef4444';
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
          <Analytics sx={{ fontSize: 64, color: '#a855f7', mb: 2 }} />
          <Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 600 }}>
            Sign in to view your ratings
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

  const stats = getStatistics();

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
        {/* Page Header */}
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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 56,
                    height: 56,
                    background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                    borderRadius: '1rem',
                    boxShadow: '0 10px 25px rgba(168, 85, 247, 0.3)',
                  }}
                >
                  <Analytics sx={{ fontSize: 28, color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 0.5 }}>
                    My Movie Ratings
                  </Typography>
                  {stats && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Movie sx={{ fontSize: 16, color: '#a855f7' }} />
                        <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                          <strong>{stats.totalRatings}</strong> movies rated
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Star sx={{ fontSize: 16, color: '#fbbf24' }} />
                        <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                          <strong>{stats.avgRating.toFixed(1)}</strong> average rating
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
              
              <IconButton
                onClick={() => fetchRatings(true)}
                disabled={loading}
                sx={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  '&:hover': { background: 'rgba(255, 255, 255, 0.2)' }
                }}
              >
                <Refresh />
              </IconButton>
            </Box>

            {error && (
              <Alert
                severity="error"
                action={
                  <Button onClick={() => fetchRatings(true)} size="small" sx={{ color: 'white' }}>
                    Try Again
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

        {loading && ratings.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} sx={{ color: '#a855f7' }} />
          </Box>
        ) : ratings.length > 0 ? (
          <>
            {/* Controls */}
            <Card
              sx={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '1.5rem',
                mb: 4,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      placeholder="Search your rated movies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: <Search sx={{ color: '#9ca3af', mr: 1 }} />,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '0.75rem',
                          color: 'white',
                          '& fieldset': { border: 'none' },
                          '&:hover': { background: 'rgba(255, 255, 255, 0.15)' },
                          '&.Mui-focused': {
                            background: 'rgba(255, 255, 255, 0.15)',
                            boxShadow: '0 0 0 2px rgba(168, 85, 247, 0.5)',
                          },
                        },
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <Select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        displayEmpty
                        startAdornment={<Sort sx={{ color: '#9ca3af', mr: 1 }} />}
                        sx={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '0.75rem',
                          color: 'white',
                          '& fieldset': { border: 'none' },
                          '& .MuiSvgIcon-root': { color: 'white' },
                        }}
                      >
                        <MenuItem value="newest">Newest First</MenuItem>
                        <MenuItem value="oldest">Oldest First</MenuItem>
                        <MenuItem value="highest">Highest Rated</MenuItem>
                        <MenuItem value="lowest">Lowest Rated</MenuItem>
                        <MenuItem value="title">Movie Title</MenuItem>
                        <MenuItem value="year">Release Year</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <Select
                        value={filterRating}
                        onChange={(e) => setFilterRating(e.target.value)}
                        displayEmpty
                        startAdornment={<FilterList sx={{ color: '#9ca3af', mr: 1 }} />}
                        sx={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '0.75rem',
                          color: 'white',
                          '& fieldset': { border: 'none' },
                          '& .MuiSvgIcon-root': { color: 'white' },
                        }}
                      >
                        <MenuItem value="all">All Ratings</MenuItem>
                        <MenuItem value="5">5 Stars</MenuItem>
                        <MenuItem value="4">4 Stars</MenuItem>
                        <MenuItem value="3">3 Stars</MenuItem>
                        <MenuItem value="2">2 Stars</MenuItem>
                        <MenuItem value="1">1 Star</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Statistics */}
            {stats && showStats && (
              <Card
                sx={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '1.5rem',
                  mb: 4,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUp sx={{ color: '#a855f7' }} />
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                        Rating Distribution
                      </Typography>
                    </Box>
                    <IconButton
                      onClick={() => setShowStats(!showStats)}
                      sx={{ color: 'white' }}
                    >
                      <ExpandMore />
                    </IconButton>
                  </Box>
                  
                  <Grid container spacing={2}>
                    {[5, 4, 3, 2, 1].map(star => (
                      <Grid item xs={12} key={star}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '60px' }}>
                            <Typography variant="body2" sx={{ color: 'white', mr: 1 }}>
                              {star}
                            </Typography>
                            <Star sx={{ fontSize: 16, color: '#fbbf24' }} />
                          </Box>
                          
                          <LinearProgress
                            variant="determinate"
                            value={stats.ratingCounts[star] ? (stats.ratingCounts[star] / stats.totalRatings) * 100 : 0}
                            sx={{
                              flex: 1,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: getRatingColor(star),
                                borderRadius: 4,
                              }
                            }}
                          />
                          
                          <Typography variant="body2" sx={{ color: '#d1d5db', minWidth: '30px' }}>
                            {stats.ratingCounts[star] || 0}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Ratings Grid */}
            <Grid container spacing={3}>
              {filteredRatings.length > 0 ? (
                filteredRatings.map((rating) => (
                  <Grid item xs={12} sm={6} md={4} key={rating.movie_id}>
                    <Card
                      sx={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '1.5rem',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(168, 85, 247, 0.5)',
                        }
                      }}
                    >
                      <Box sx={{ position: 'relative' }}>
                        <Box
                          component="img"
                          src={rating.poster_url || '/placeholder-movie.jpg'}
                          alt={rating.movie_title}
                          onError={(e) => {
                            e.target.src = '/placeholder-movie.jpg';
                          }}
                          sx={{
                            width: '100%',
                            height: '300px',
                            objectFit: 'cover',
                            borderRadius: '1.5rem 1.5rem 0 0',
                          }}
                        />
                        
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            background: `linear-gradient(135deg, ${getRatingColor(rating.rating)} 0%, ${getRatingColor(rating.rating)}CC 100%)`,
                            backdropFilter: 'blur(12px)',
                            borderRadius: '0.5rem',
                            px: 1.5,
                            py: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          <Star sx={{ fontSize: 16, color: 'white' }} />
                          <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                            {rating.rating}
                          </Typography>
                        </Box>
                      </Box>

                      <CardContent sx={{ p: 3 }}>
                        <Typography
                          variant="h6"
                          component={Link}
                          to={`/movies/${rating.movie_id}`}
                          sx={{
                            color: 'white',
                            fontWeight: 600,
                            textDecoration: 'none',
                            display: 'block',
                            mb: 1,
                            '&:hover': { color: '#a855f7' }
                          }}
                        >
                          {rating.movie_title}
                        </Typography>
                        
                        <Typography variant="body2" sx={{ color: '#d1d5db', mb: 2 }}>
                          ({rating.movie_year})
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Box sx={{ display: 'flex', mr: 2 }}>
                            {renderStars(rating.rating)}
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <CalendarToday sx={{ fontSize: 14, color: '#9ca3af' }} />
                          <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                            {formatDate(rating.timestamp)}
                          </Typography>
                        </Box>

                        {rating.review && (
                          <Paper
                            sx={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '0.5rem',
                              p: 2,
                              mb: 2,
                            }}
                          >
                            <Typography variant="body2" sx={{ color: '#d1d5db', fontStyle: 'italic' }}>
                              "{rating.review}"
                            </Typography>
                          </Paper>
                        )}

                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                          <Button
                            component={Link}
                            to={`/movies/${rating.movie_id}`}
                            variant="outlined"
                            size="small"
                            startIcon={<Visibility />}
                            sx={{
                              flex: 1,
                              background: 'rgba(168, 85, 247, 0.2)',
                              border: '1px solid rgba(168, 85, 247, 0.5)',
                              color: 'white',
                              '&:hover': {
                                background: 'rgba(168, 85, 247, 0.3)',
                                border: '1px solid rgba(168, 85, 247, 0.7)',
                              }
                            }}
                          >
                            View
                          </Button>
                          
                          <IconButton
                            onClick={() => handleDeleteRating(rating.movie_id, rating.movie_title)}
                            disabled={deleteLoading === rating.movie_id}
                            size="small"
                            sx={{
                              background: 'rgba(239, 68, 68, 0.2)',
                              color: '#f87171',
                              '&:hover': {
                                background: 'rgba(239, 68, 68, 0.3)',
                              }
                            }}
                          >
                            {deleteLoading === rating.movie_id ? (
                              <CircularProgress size={16} sx={{ color: '#f87171' }} />
                            ) : (
                              <DeleteOutline />
                            )}
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Card
                    sx={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(24px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '1.5rem',
                      textAlign: 'center',
                      py: 6,
                    }}
                  >
                    <Search sx={{ fontSize: 64, color: '#9ca3af', mb: 2 }} />
                    <Typography variant="h5" sx={{ color: 'white', mb: 1 }}>
                      No ratings found
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#d1d5db' }}>
                      {searchQuery 
                        ? `No movies match your search for "${searchQuery}"`
                        : filterRating !== 'all' 
                          ? `No movies with ${filterRating} star rating`
                          : 'No ratings to show'
                      }
                    </Typography>
                  </Card>
                </Grid>
              )}
            </Grid>

            {/* Load More Button */}
            {hasMore && !searchQuery && filterRating === 'all' && (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Button
                  onClick={() => fetchRatings(false)}
                  disabled={loading}
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
                  {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} sx={{ color: 'white' }} />
                      Loading...
                    </Box>
                  ) : (
                    'Load More Ratings'
                  )}
                </Button>
              </Box>
            )}

            {/* Results Summary */}
            {filteredRatings.length !== ratings.length && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                  Showing {filteredRatings.length} of {ratings.length} ratings
                </Typography>
              </Box>
            )}
          </>
        ) : (
          <Card
            sx={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '1.5rem',
              textAlign: 'center',
              py: 8,
            }}
          >
            <Movie sx={{ fontSize: 64, color: '#a855f7', mb: 2 }} />
            <Typography variant="h4" sx={{ color: 'white', mb: 2, fontWeight: 600 }}>
              No movies rated yet
            </Typography>
            <Typography variant="body1" sx={{ color: '#d1d5db', mb: 4 }}>
              Start rating movies to build your profile and get personalized recommendations!
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                component={Link}
                to="/movies"
                variant="contained"
                sx={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                  borderRadius: '0.75rem',
                  px: 4,
                  py: 2,
                  fontWeight: 600,
                  boxShadow: '0 10px 25px rgba(168, 85, 247, 0.3)',
                }}
              >
                Browse Movies
              </Button>
              <Button
                component={Link}
                to="/recommendations"
                variant="outlined"
                sx={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  borderRadius: '0.75rem',
                  px: 4,
                  py: 2,
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }
                }}
              >
                View Popular Movies
              </Button>
            </Box>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, movieId: null, title: '' })}
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
              Delete Rating
            </Typography>
            <IconButton
              onClick={() => setDeleteDialog({ open: false, movieId: null, title: '' })}
              sx={{ color: 'white' }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ color: '#d1d5db' }}>
              Are you sure you want to delete your rating for "{deleteDialog.title}"?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setDeleteDialog({ open: false, movieId: null, title: '' })}
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
              onClick={confirmDelete}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                }
              }}
            >
              Delete Rating
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

export default MyRatingsPage;