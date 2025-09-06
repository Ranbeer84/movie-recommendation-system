import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MovieCard from '../components/movies/MovieCard';
import { getMovieDetails } from '../services/movieService';
import { rateMovie, checkUserRating } from '../services/ratingService';
import { getSimilarMovies } from '../services/recommendationService';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fab,
  Paper,
  Avatar,
  IconButton,
  Alert,
  Backdrop,
  CircularProgress,
  Divider,
  Stack,
  Tooltip,
  useTheme,
  alpha,
  Skeleton
} from '@mui/material';
import {
  Star,
  Favorite,
  FavoriteBorder,
  Share,
  PlayArrow,
  CalendarToday,
  AccessTime,
  People,
  ArrowBack,
  Close,
  ChevronRight,
  Refresh,
  MovieCreation,
  Security,
  TheatersOutlined,
  PersonOutline,
  DirectionsRun,
  StarRate
} from '@mui/icons-material';

const MovieDetailsPage = () => {
  const { movieId } = useParams();
  const { user, isAuthenticated } = useContext(AuthContext);
  const theme = useTheme();
  const [movie, setMovie] = useState(null);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [userRating, setUserRating] = useState(null);
  const [newRating, setNewRating] = useState(0);
  const [review, setReview] = useState('');
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

  const handleRatingSubmit = async () => {
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

  const formatRuntimeToHours = (runtimeMinutes) => {
    if (!runtimeMinutes) return '';
    const hours = Math.floor(runtimeMinutes / 60);
    const minutes = runtimeMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const MovieInfoChip = ({ icon, label, value, color = 'white' }) => (
    <Chip
      icon={icon}
      label={`${label}: ${value}`}
      variant="outlined"
      sx={{
        background: alpha('#ffffff', 0.1),
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha('#ffffff', 0.2)}`,
        color: color,
        fontWeight: 'bold',
        '& .MuiChip-icon': {
          color: color
        }
      }}
    />
  );

  if (loading) {
    console.log('🔄 Showing loading spinner');
    return (
      <Backdrop
        sx={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
          zIndex: theme.zIndex.drawer + 1,
          flexDirection: 'column'
        }}
        open={loading}
      >
        <Box sx={{ position: 'relative', mb: 4 }}>
          <CircularProgress size={80} sx={{ color: '#3b82f6' }} />
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)',
              animation: 'pulse 2s infinite'
            }}
          />
        </Box>
        <Typography variant="h4" color="white" fontWeight="bold" textAlign="center">
          Loading movie details...
        </Typography>
        {process.env.NODE_ENV === 'development' && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Movie ID: {movieId} ({typeof movieId})
          </Typography>
        )}
      </Backdrop>
    );
  }

  if (error) {
    console.log('❌ Showing error state:', error);
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={24}
            sx={{
              p: 6,
              textAlign: 'center',
              background: alpha('#ffffff', 0.05),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha('#ffffff', 0.1)}`,
              borderRadius: 4
            }}
          >
            <Typography variant="h3" color="white" fontWeight="bold" gutterBottom>
              Oops! Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
              {error}
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                startIcon={<Refresh />}
                onClick={() => {
                  console.log('🔄 Retrying movie data fetch');
                  fetchMovieData();
                }}
                sx={{
                  background: 'linear-gradient(45deg, #3b82f6 30%, #1d4ed8 90%)',
                  borderRadius: 2,
                  px: 4,
                  py: 1.5
                }}
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                size="large"
                component={Link}
                to="/movies"
                startIcon={<ArrowBack />}
                sx={{
                  borderColor: alpha('#ffffff', 0.3),
                  color: 'white',
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    borderColor: alpha('#ffffff', 0.5),
                    backgroundColor: alpha('#ffffff', 0.1)
                  }
                }}
              >
                Browse Movies
              </Button>
            </Stack>

            {process.env.NODE_ENV === 'development' && (
              <Paper
                sx={{
                  mt: 4,
                  p: 3,
                  background: alpha('#000000', 0.3),
                  borderRadius: 2
                }}
              >
                <Typography variant="subtitle2" color="white" gutterBottom>
                  🔍 Debug Info (Development Only)
                </Typography>
                <Box sx={{ textAlign: 'left', fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                  <Typography variant="body2"><strong>Movie ID:</strong> {movieId} ({typeof movieId})</Typography>
                  <Typography variant="body2"><strong>URL:</strong> {window.location.pathname}</Typography>
                  <Typography variant="body2"><strong>Error:</strong> {error}</Typography>
                  <Typography variant="body2"><strong>Auth Status:</strong> {isAuthenticated ? 'Authenticated' : 'Not authenticated'}</Typography>
                  <Typography variant="body2"><strong>User:</strong> {user?.username || 'None'}</Typography>
                  <Typography variant="body2"><strong>Movie State:</strong> {movie ? 'Has movie data' : 'No movie data'}</Typography>
                </Box>
              </Paper>
            )}
          </Paper>
        </Container>
      </Box>
    );
  }

  if (!movie) {
    console.log('❌ No movie data available');
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={24}
            sx={{
              p: 6,
              textAlign: 'center',
              background: alpha('#ffffff', 0.05),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha('#ffffff', 0.1)}`,
              borderRadius: 4
            }}
          >
            <Typography variant="h3" color="white" fontWeight="bold" gutterBottom>
              Movie not found
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
              The movie you're looking for doesn't exist or couldn't be loaded.
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                startIcon={<Refresh />}
                onClick={() => {
                  console.log('🔄 Retrying movie data fetch');
                  fetchMovieData();
                }}
                sx={{
                  background: 'linear-gradient(45deg, #3b82f6 30%, #1d4ed8 90%)',
                  borderRadius: 2,
                  px: 4,
                  py: 1.5
                }}
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                size="large"
                component={Link}
                to="/movies"
                startIcon={<ArrowBack />}
                sx={{
                  borderColor: alpha('#ffffff', 0.3),
                  color: 'white',
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    borderColor: alpha('#ffffff', 0.5),
                    backgroundColor: alpha('#ffffff', 0.1)
                  }
                }}
              >
                Browse Movies
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  console.log('✅ Rendering movie details for:', movie.title);

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)' }}>
      {/* Hero Section */}
      <Box sx={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        {/* Background */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${movie.poster_url || '/placeholder-movie.jpg'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.2,
              filter: 'blur(2px)'
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.9) 100%)'
            }
          }}
        />

        {/* Back Button */}
        <Fab
          component={Link}
          to="/movies"
          size="medium"
          sx={{
            position: 'absolute',
            top: 32,
            left: 32,
            zIndex: 50,
            background: alpha('#000000', 0.6),
            backdropFilter: 'blur(10px)',
            color: 'white',
            border: `1px solid ${alpha('#ffffff', 0.2)}`,
            '&:hover': {
              background: alpha('#000000', 0.8)
            }
          }}
        >
          <ArrowBack />
        </Fab>

        {/* Content */}
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 10, py: 10 }}>
          <Grid container spacing={8} alignItems="flex-start">
            {/* Poster */}
            <Grid item xs={12} lg={4}>
              <Box sx={{ position: 'relative', maxWidth: 400, mx: 'auto' }}>
                <Card
                  elevation={24}
                  sx={{
                    borderRadius: 4,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: theme.shadows[24]
                    }
                  }}
                >
                  <CardMedia
                    component="img"
                    image={movie.poster_url || '/placeholder-movie.jpg'}
                    alt={movie.title}
                    sx={{
                      aspectRatio: '3/4',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      console.warn('⚠️ Poster image failed to load:', movie.poster_url);
                      e.target.src = '/placeholder-movie.jpg';
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 40%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                      '&:hover': {
                        opacity: 1
                      }
                    }}
                  >
                    <IconButton
                      size="large"
                      sx={{
                        background: alpha('#ffffff', 0.2),
                        backdropFilter: 'blur(10px)',
                        color: 'white',
                        width: 80,
                        height: 80,
                        '&:hover': {
                          background: alpha('#ffffff', 0.3)
                        }
                      }}
                    >
                      <PlayArrow sx={{ fontSize: 40 }} />
                    </IconButton>
                  </Box>
                </Card>

                {/* Rating Badges */}
                <Box sx={{ position: 'absolute', top: -16, right: -16, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Chip
                    label={`⭐ ${movie.avg_rating ? parseFloat(movie.avg_rating).toFixed(1) : 'N/A'}`}
                    sx={{
                      background: 'linear-gradient(45deg, #fbbf24 30%, #f59e0b 90%)',
                      color: '#000',
                      fontWeight: 'bold',
                      transform: 'rotate(12deg)',
                      transition: 'transform 0.3s ease',
                      '&:hover': {
                        transform: 'rotate(0deg)'
                      }
                    }}
                  />
                  {movie.imdb_rating && (
                    <Chip
                      label={`IMDb ${movie.imdb_rating}`}
                      sx={{
                        background: 'linear-gradient(45deg, #f59e0b 30%, #d97706 90%)',
                        color: '#000',
                        fontWeight: 'bold',
                        transform: 'rotate(-8deg)',
                        transition: 'transform 0.3s ease',
                        '&:hover': {
                          transform: 'rotate(0deg)'
                        }
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Grid>

            {/* Movie Info */}
            <Grid item xs={12} lg={8}>
              <Box sx={{ color: 'white', mb: 4 }}>
                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight: 900,
                    background: 'linear-gradient(45deg, #ffffff 30%, #e5e7eb 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    mb: 3,
                    fontSize: { xs: '2.5rem', sm: '3.5rem', lg: '4rem' }
                  }}
                >
                  {movie.title}
                </Typography>

                {/* Enhanced Movie Information Grid */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  {(movie.released_year || movie.year) && (
                    <Grid item xs={12} sm={6} md={4}>
                      <MovieInfoChip 
                        icon={<CalendarToday />} 
                        label="Released" 
                        value={movie.released_year || movie.year}
                      />
                    </Grid>
                  )}
                  {movie.certificate && (
                    <Grid item xs={12} sm={6} md={4}>
                      <MovieInfoChip 
                        icon={<Security />} 
                        label="Certificate" 
                        value={movie.certificate}
                        color="#f59e0b"
                      />
                    </Grid>
                  )}
                  {movie.runtime && (
                    <Grid item xs={12} sm={6} md={4}>
                      <MovieInfoChip 
                        icon={<AccessTime />} 
                        label="Runtime" 
                        value={formatRuntimeToHours(movie.runtime)}
                      />
                    </Grid>
                  )}
                  {movie.imdb_rating && (
                    <Grid item xs={12} sm={6} md={4}>
                      <MovieInfoChip 
                        icon={<StarRate />} 
                        label="IMDb" 
                        value={`${movie.imdb_rating}/10`}
                        color="#fbbf24"
                      />
                    </Grid>
                  )}
                  <Grid item xs={12} sm={6} md={4}>
                    <MovieInfoChip 
                      icon={<People />} 
                      label="Ratings" 
                      value={movie.rating_count || 0}
                    />
                  </Grid>
                </Grid>



                {/* Community Rating */}
                <Paper
                  elevation={3}
                  sx={{
                    p: 4,
                    mb: 4,
                    background: alpha('#ffffff', 0.05),
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha('#ffffff', 0.1)}`,
                    borderRadius: 3
                  }}
                >
                  <Typography variant="h6" color="white" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                    Community Rating
                  </Typography>
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Rating
                      value={parseFloat(movie.avg_rating) || 0}
                      precision={0.1}
                      readOnly
                      size="large"
                      sx={{
                        '& .MuiRating-iconFilled': {
                          color: '#fbbf24'
                        }
                      }}
                    />
                    <Typography variant="h4" color="white" fontWeight="bold">
                      {movie.avg_rating ? parseFloat(movie.avg_rating).toFixed(1) : 'N/A'}
                    </Typography>
                    <Typography variant="h5" color="text.secondary">
                      / 5
                    </Typography>
                  </Stack>
                </Paper>

                {/* Genres */}
                {movie.genres && Array.isArray(movie.genres) && movie.genres.length > 0 && (
                  <Paper
                    elevation={3}
                    sx={{
                      p: 4,
                      mb: 4,
                      background: alpha('#ffffff', 0.05),
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha('#ffffff', 0.1)}`,
                      borderRadius: 3
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                      <TheatersOutlined sx={{ color: '#60a5fa', fontSize: 28 }} />
                      <Typography variant="h6" color="white" fontWeight="bold">
                        Genres
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {movie.genres.map((genre, index) => (
                        <Chip
                          key={`${genre}-${index}`}
                          label={genre}
                          component={Link}
                          to={`/movies?genre=${encodeURIComponent(genre)}`}
                          clickable
                          sx={{
                            background: 'linear-gradient(45deg, rgba(59,130,246,0.2) 30%, rgba(147,51,234,0.2) 90%)',
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${alpha('#ffffff', 0.2)}`,
                            color: 'white',
                            fontWeight: 'bold',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              background: 'linear-gradient(45deg, rgba(59,130,246,0.3) 30%, rgba(147,51,234,0.3) 90%)',
                              transform: 'scale(1.05)'
                            }
                          }}
                        />
                      ))}
                    </Stack>
                  </Paper>
                )}

                {/* Overview/Plot */}
                {(movie.overview || movie.plot) && (
                  <Paper
                    elevation={3}
                    sx={{
                      p: 4,
                      mb: 4,
                      background: alpha('#ffffff', 0.05),
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha('#ffffff', 0.1)}`,
                      borderRadius: 3
                    }}
                  >
                    <Typography variant="h6" color="white" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                      Overview
                    </Typography>
                    <Typography variant="body1" color="#d1d5db" sx={{ lineHeight: 1.8, fontSize: '1.125rem' }}>
                      {movie.overview || movie.plot}
                    </Typography>
                  </Paper>
                )}

                {/* Action Buttons */}
                <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 4 }}>
                  {isAuthenticated && (
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<Star />}
                      onClick={() => setShowRatingForm(true)}
                      sx={{
                        background: 'linear-gradient(45deg, #3b82f6 30%, #8b5cf6 90%)',
                        borderRadius: 3,
                        px: 4,
                        py: 1.5,
                        fontWeight: 'bold',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: theme.shadows[8]
                        }
                      }}
                    >
                      {userRating ? 'Update Rating' : 'Rate Movie'}
                    </Button>
                  )}
                  
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={isWatchlisted ? <Favorite /> : <FavoriteBorder />}
                    onClick={() => setIsWatchlisted(!isWatchlisted)}
                    sx={{
                      borderColor: isWatchlisted ? '#ef4444' : alpha('#ffffff', 0.3),
                      color: isWatchlisted ? '#ef4444' : 'white',
                      background: isWatchlisted 
                        ? 'linear-gradient(45deg, rgba(239,68,68,0.1) 30%, rgba(244,63,94,0.1) 90%)'
                        : alpha('#ffffff', 0.1),
                      backdropFilter: 'blur(10px)',
                      borderRadius: 3,
                      px: 4,
                      py: 1.5,
                      fontWeight: 'bold',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        borderColor: isWatchlisted ? '#dc2626' : alpha('#ffffff', 0.5),
                        background: isWatchlisted
                          ? 'linear-gradient(45deg, rgba(239,68,68,0.2) 30%, rgba(244,63,94,0.2) 90%)'
                          : alpha('#ffffff', 0.2)
                      }
                    }}
                  >
                    {isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<Share />}
                    sx={{
                      borderColor: alpha('#ffffff', 0.3),
                      color: 'white',
                      background: alpha('#ffffff', 0.1),
                      backdropFilter: 'blur(10px)',
                      borderRadius: 3,
                      px: 4,
                      py: 1.5,
                      fontWeight: 'bold',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        borderColor: alpha('#ffffff', 0.5),
                        background: alpha('#ffffff', 0.2)
                      }
                    }}
                  >
                    Share
                  </Button>
                </Stack>

                {/* User's Rating Display */}
                {userRating && (
                  <Paper
                    elevation={3}
                    sx={{
                      p: 4,
                      background: 'linear-gradient(45deg, rgba(34,197,94,0.2) 30%, rgba(16,185,129,0.2) 90%)',
                      backdropFilter: 'blur(10px)',
                      border: `1px solid rgba(34,197,94,0.3)`,
                      borderRadius: 3
                    }}
                  >
                    <Typography variant="h5" color="#86efac" fontWeight="bold" gutterBottom>
                      Your Rating
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <Rating
                        value={userRating.rating}
                        readOnly
                        sx={{
                          '& .MuiRating-iconFilled': {
                            color: '#fbbf24'
                          }
                        }}
                      />
                      <Typography variant="h5" color="white" fontWeight="bold">
                        {userRating.rating}/5
                      </Typography>
                    </Stack>
                    {userRating.review && (
                      <Typography variant="body1" color="#d1fae5" sx={{ fontStyle: 'italic', fontSize: '1.1rem', lineHeight: 1.7 }}>
                        "{userRating.review}"
                      </Typography>
                    )}
                  </Paper>
                )}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Movie Details Section */}
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Typography variant="h3" color="white" fontWeight="bold" gutterBottom sx={{ mb: 6 }}>
          Movie Information
        </Typography>
        
        <Grid container spacing={4}>
          {/* Technical Details */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 4,
                height: '100%',
                background: alpha('#ffffff', 0.05),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha('#ffffff', 0.1)}`,
                borderRadius: 3
              }}
            >
              <Typography variant="h5" color="white" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                Technical Details
              </Typography>
              <Stack spacing={3}>
                {(movie.released_year || movie.year) && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Release Year
                    </Typography>
                    <Typography variant="h6" color="white" fontWeight="bold">
                      {movie.released_year || movie.year}
                    </Typography>
                  </Box>
                )}
                {movie.certificate && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Certificate
                    </Typography>
                    <Chip
                      label={movie.certificate}
                      sx={{
                        background: 'linear-gradient(45deg, #f59e0b 30%, #d97706 90%)',
                        color: '#000',
                        fontWeight: 'bold',
                        mt: 1
                      }}
                    />
                  </Box>
                )}
                {movie.runtime && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Runtime
                    </Typography>
                    <Typography variant="h6" color="white" fontWeight="bold">
                      {formatRuntimeToHours(movie.runtime)} ({movie.runtime} minutes)
                    </Typography>
                  </Box>
                )}
                {movie.imdb_rating && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      IMDb Rating
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="h6" color="#fbbf24" fontWeight="bold">
                        {movie.imdb_rating}/10
                      </Typography>
                      <StarRate sx={{ color: '#fbbf24' }} />
                    </Stack>
                  </Box>
                )}
              </Stack>
            </Paper>
          </Grid>

          {/* Creative Team */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 4,
                height: '100%',
                background: alpha('#ffffff', 0.05),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha('#ffffff', 0.1)}`,
                borderRadius: 3
              }}
            >
              <Typography variant="h5" color="white" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                Creative Team
              </Typography>
              <Stack spacing={3}>
                {/* Director Section */}
                {(movie.Director || movie.director) && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Director
                    </Typography>
                    <Typography variant="h6" color="white" fontWeight="bold">
                      {movie.Director || movie.director}
                    </Typography>
                  </Box>
                )}
                
                {/* Cast Section - Handle both individual star fields and combined formats */}
                {(() => {
                  // First, try to get stars from individual fields (Star1, Star2, etc.)
                  const individualStars = [movie.Star1, movie.Star2, movie.Star3, movie.Star4]
                    .filter(star => star && star.trim() !== '');
                  
                  // Then check for combined formats
                  let allStars = [];
                  if (individualStars.length > 0) {
                    allStars = individualStars;
                  } else if (movie.stars && typeof movie.stars === 'string') {
                    allStars = movie.stars.split(',').map(s => s.trim()).filter(s => s !== '');
                  } else if (movie.cast && typeof movie.cast === 'string') {
                    allStars = movie.cast.split(',').map(s => s.trim()).filter(s => s !== '');
                  }
                  
                  // Debug logging
                  console.log('Cast data debug:', {
                    Star1: movie.Star1,
                    Star2: movie.Star2,
                    Star3: movie.Star3,
                    Star4: movie.Star4,
                    stars: movie.stars,
                    cast: movie.cast,
                    individualStars,
                    allStars
                  });
                  
                  return allStars.length > 0 ? (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                        Cast
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {allStars.slice(0, 6).map((actor, index) => (
                          <Chip
                            key={`cast-${index}`}
                            label={actor}
                            size="small"
                            sx={{
                              background: 'linear-gradient(45deg, rgba(139,92,246,0.2) 30%, rgba(59,130,246,0.2) 90%)',
                              backdropFilter: 'blur(10px)',
                              border: `1px solid ${alpha('#8b5cf6', 0.3)}`,
                              color: '#c4b5fd',
                              fontWeight: 'bold',
                              mb: 1,
                              '&:hover': {
                                background: 'linear-gradient(45deg, rgba(139,92,246,0.3) 30%, rgba(59,130,246,0.3) 90%)',
                                transform: 'scale(1.05)'
                              }
                            }}
                          />
                        ))}
                        {allStars.length > 6 && (
                          <Chip
                            label={`+${allStars.length - 6} more`}
                            size="small"
                            sx={{
                              background: alpha('#ffffff', 0.1),
                              border: `1px solid ${alpha('#ffffff', 0.2)}`,
                              color: 'text.secondary',
                              mb: 1
                            }}
                          />
                        )}
                      </Stack>
                    </Box>
                  ) : null;
                })()}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Rating Form Dialog */}
      <Dialog
        open={showRatingForm}
        onClose={() => setShowRatingForm(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 2
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" fontWeight="bold">
            {userRating ? 'Update Your Rating' : 'Rate This Movie'}
          </Typography>
          <IconButton
            onClick={() => setShowRatingForm(false)}
            sx={{
              '&:hover': {
                backgroundColor: alpha('#000000', 0.1)
              }
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h6" color="text.primary" fontWeight="bold" gutterBottom>
              Your Rating:
            </Typography>
            <Rating
              value={newRating}
              onChange={(event, newValue) => setNewRating(newValue)}
              size="large"
              sx={{
                fontSize: '3rem',
                mb: 2,
                '& .MuiRating-iconFilled': {
                  color: '#fbbf24'
                },
                '& .MuiRating-iconHover': {
                  color: '#f59e0b'
                }
              }}
            />
            <Typography variant="h6" color="text.primary" fontWeight="bold">
              {newRating > 0 ? `${newRating}/5 stars` : 'Select a rating'}
            </Typography>
          </Box>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Review (optional)"
            placeholder="Share your thoughts about this movie..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
            inputProps={{ maxLength: 1000 }}
            helperText={`${review.length}/1000 characters`}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setShowRatingForm(false)}
            variant="outlined"
            size="large"
            disabled={ratingLoading}
            sx={{ px: 4, py: 1.5 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRatingSubmit}
            variant="contained"
            size="large"
            disabled={ratingLoading || newRating === 0}
            sx={{
              px: 4,
              py: 1.5,
              background: 'linear-gradient(45deg, #3b82f6 30%, #8b5cf6 90%)',
              '&:disabled': {
                background: '#9ca3af'
              }
            }}
          >
            {ratingLoading ? <CircularProgress size={24} color="inherit" /> : 'Save Rating'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reviews Section */}
      {movie.reviews && Array.isArray(movie.reviews) && movie.reviews.length > 0 && (
        <Container maxWidth="xl" sx={{ py: 10 }}>
          <Typography variant="h3" color="white" fontWeight="bold" gutterBottom sx={{ mb: 6 }}>
            Recent Reviews
          </Typography>
          <Stack spacing={3}>
            {movie.reviews.slice(0, 5).map((reviewItem, index) => (
              <Paper
                key={`review-${index}`}
                elevation={3}
                sx={{
                  p: 4,
                  background: alpha('#ffffff', 0.05),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha('#ffffff', 0.1)}`,
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: alpha('#ffffff', 0.08),
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[8]
                  }
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        background: 'linear-gradient(45deg, #3b82f6 30%, #8b5cf6 90%)',
                        fontSize: '1.25rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {(reviewItem.username || 'Anonymous').charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" color="white" fontWeight="bold">
                        {reviewItem.username || 'Anonymous'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(reviewItem.timestamp || reviewItem.created_at)}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Rating
                      value={reviewItem.rating}
                      readOnly
                      size="small"
                      sx={{
                        '& .MuiRating-iconFilled': {
                          color: '#fbbf24'
                        }
                      }}
                    />
                    <Typography variant="subtitle1" color="white" fontWeight="bold">
                      {reviewItem.rating}/5
                    </Typography>
                  </Stack>
                </Stack>
                {reviewItem.review && (
                  <Typography variant="body1" color="#d1d5db" sx={{ fontSize: '1.1rem', lineHeight: 1.7, fontStyle: 'italic' }}>
                    "{reviewItem.review}"
                  </Typography>
                )}
              </Paper>
            ))}
          </Stack>
        </Container>
      )}

      {/* Similar Movies Section */}
      {similarMovies && similarMovies.length > 0 && (
        <Container maxWidth="xl" sx={{ py: 10 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 6 }}>
            <Typography variant="h3" color="white" fontWeight="bold">
              Similar Movies
            </Typography>
            <Button
              variant="text"
              endIcon={<ChevronRight />}
              sx={{
                color: '#60a5fa',
                fontWeight: 'bold',
                '&:hover': {
                  color: '#3b82f6'
                }
              }}
            >
              View All
            </Button>
          </Stack>
          <Grid container spacing={3}>
            {similarMovies.map(similarMovie => (
              <Grid item xs={6} sm={4} md={3} lg={2.4} key={`similar-${similarMovie.id}`}>
                <Box
                  sx={{
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  <MovieCard movie={similarMovie} />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      )}

      {/* Back Navigation */}
      <Container maxWidth="xl" sx={{ pb: 4 }}>
        <Button
          component={Link}
          to="/movies"
          variant="outlined"
          size="large"
          startIcon={<ArrowBack />}
          sx={{
            borderColor: alpha('#ffffff', 0.3),
            color: 'white',
            background: alpha('#ffffff', 0.1),
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            px: 4,
            py: 1.5,
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.05)',
              borderColor: alpha('#ffffff', 0.5),
              background: alpha('#ffffff', 0.2),
              boxShadow: theme.shadows[4]
            }
          }}
        >
          Back to Movies
        </Button>
      </Container>
    </Box>
  );
};

export default MovieDetailsPage;