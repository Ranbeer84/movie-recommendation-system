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
      console.log('📞 Calling getMovieDetails with:', movieId);
      const movieData = await getMovieDetails(movieId);
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

      // Map backend fields to frontend expectations
      const mappedMovieData = {
        ...processedMovieData,
        // Runtime mapping: backend uses runtime_minutes, frontend expects runtime
        runtime: processedMovieData.runtime_minutes || processedMovieData.runtime,
        // Overview/plot mapping
        overview: processedMovieData.plot || processedMovieData.overview,
        // Released year mapping
        released_year: processedMovieData.year || processedMovieData.released_year,
        // Director mapping (handle single director from backend)
        director: processedMovieData.directors && processedMovieData.directors.length > 0 
          ? processedMovieData.directors[0] 
          : processedMovieData.director,
        Director: processedMovieData.directors && processedMovieData.directors.length > 0 
          ? processedMovieData.directors[0] 
          : processedMovieData.Director
      };

      setMovie(mappedMovieData);
      console.log('✅ Movie details set successfully:', mappedMovieData.title);

      try {
        console.log('📞 Calling getSimilarMovies with:', movieId);
        const similarData = await getSimilarMovies(movieId, 8);
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
      const ratingData = await checkUserRating(movieId);
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
    console.log('🚀 Submitting rating:', {
      movie_id: movieId,
      rating: parseFloat(newRating),
      review: review.trim()
    });

    const ratingData = await rateMovie(
      movieId,
      parseFloat(newRating),
      review.trim()
    );

    console.log('✅ Rating response:', ratingData);

    // Update user rating state
    setUserRating(ratingData.rating);
    setShowRatingForm(false);
    
    // Update movie's average rating if provided in response
    if (ratingData.new_avg_rating) {
      setMovie(prevMovie => ({
        ...prevMovie,
        avg_rating: ratingData.new_avg_rating,
        rating_count: (prevMovie.rating_count || 0) + (userRating ? 0 : 1)
      }));
    }
    
    alert('Rating saved successfully!');
  } catch (error) {
    console.error('💥 Error saving rating:', error);
    
    // Show more specific error message
    let errorMessage = 'Failed to save rating. Please try again.';
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.errors) {
      errorMessage = `Validation errors: ${error.response.data.errors.join(', ')}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    alert(errorMessage);
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
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
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
                      / 10
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
                              background: 'linear-gradient(45deg, rgba(59,130,246,0.4) 30%, rgba(147,51,234,0.4) 90%)',
                              transform: 'translateY(-2px)'
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
                      Plot Overview
                    </Typography>
                    <Typography 
                      variant="body1" 
                      color="#d1d5db" 
                      sx={{ 
                        fontSize: '1.1rem', 
                        lineHeight: 1.8,
                        fontStyle: 'italic' 
                      }}
                    >
                      {movie.overview || movie.plot}
                    </Typography>
                  </Paper>
                )}

                {/* Cast and Crew */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {(movie.director || movie.Director) && (
                    <Grid item xs={12} md={6}>
                      <Paper
                        elevation={3}
                        sx={{
                          p: 3,
                          background: alpha('#ffffff', 0.05),
                          backdropFilter: 'blur(10px)',
                          border: `1px solid ${alpha('#ffffff', 0.1)}`,
                          borderRadius: 3,
                          textAlign: 'center'
                        }}
                      >
                        <PersonOutline sx={{ color: '#60a5fa', fontSize: 32, mb: 2 }} />
                        <Typography variant="h6" color="white" fontWeight="bold" gutterBottom>
                          Director
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {movie.director || movie.Director}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                  
                  {movie.stars && Array.isArray(movie.stars) && movie.stars.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Paper
                        elevation={3}
                        sx={{
                          p: 3,
                          background: alpha('#ffffff', 0.05),
                          backdropFilter: 'blur(10px)',
                          border: `1px solid ${alpha('#ffffff', 0.1)}`,
                          borderRadius: 3,
                          textAlign: 'center'
                        }}
                      >
                        <Star sx={{ color: '#fbbf24', fontSize: 32, mb: 2 }} />
                        <Typography variant="h6" color="white" fontWeight="bold" gutterBottom>
                          Stars
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {movie.stars.slice(0, 3).join(', ')}
                          {movie.stars.length > 3 && ` +${movie.stars.length - 3} more`}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>

                {/* Action Buttons */}
                <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
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
                        '&:hover': {
                          transform: 'scale(1.05)'
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
                    sx={{
                      borderColor: alpha('#ffffff', 0.3),
                      color: 'white',
                      borderRadius: 3,
                      px: 4,
                      py: 1.5,
                      fontWeight: 'bold',
                      '&:hover': {
                        borderColor: alpha('#ffffff', 0.5),
                        backgroundColor: alpha('#ffffff', 0.1),
                        transform: 'scale(1.05)'
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
                      borderRadius: 3,
                      px: 4,
                      py: 1.5,
                      fontWeight: 'bold',
                      '&:hover': {
                        borderColor: alpha('#ffffff', 0.5),
                        backgroundColor: alpha('#ffffff', 0.1),
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    Share
                  </Button>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

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

      {/* Reviews Section - Enhanced to show if reviews exist */}
      {movie.reviews && Array.isArray(movie.reviews) && movie.reviews.length > 0 ? (
        <Container maxWidth="xl" sx={{ py: 10 }}>
          <Typography variant="h3" color="white" fontWeight="bold" gutterBottom sx={{ mb: 6 }}>
            Recent Reviews ({movie.reviews.length})
          </Typography>
          <Stack spacing={3}>
            {movie.reviews.slice(0, 10).map((reviewItem, index) => (
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
                        {reviewItem.username || 'Anonymous User'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(reviewItem.timestamp || reviewItem.created_at)}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Rating
                      value={reviewItem.rating || 0}
                      readOnly
                      size="small"
                      sx={{
                        '& .MuiRating-iconFilled': {
                          color: '#fbbf24'
                        }
                      }}
                    />
                    <Typography variant="subtitle1" color="white" fontWeight="bold">
                      {reviewItem.rating || 0}/5
                    </Typography>
                  </Stack>
                </Stack>
                {reviewItem.review && reviewItem.review.trim() && (
                  <Typography variant="body1" color="#d1d5db" sx={{ fontSize: '1.1rem', lineHeight: 1.7, fontStyle: 'italic' }}>
                    "{reviewItem.review}"
                  </Typography>
                )}
              </Paper>
            ))}
          </Stack>
        </Container>
      ) : (
        // Show placeholder when no reviews exist
        <Container maxWidth="xl" sx={{ py: 10 }}>
          <Typography variant="h3" color="white" fontWeight="bold" gutterBottom sx={{ mb: 6 }}>
            User Reviews
          </Typography>
          <Paper
            elevation={3}
            sx={{
              p: 6,
              textAlign: 'center',
              background: alpha('#ffffff', 0.03),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha('#ffffff', 0.1)}`,
              borderRadius: 3
            }}
          >
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No reviews yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Be the first to share your thoughts about this movie!
            </Typography>
            {isAuthenticated ? (
              <Button
                variant="contained"
                size="large"
                startIcon={<Star />}
                onClick={() => setShowRatingForm(true)}
                sx={{
                  background: 'linear-gradient(45deg, #3b82f6 30%, #8b5cf6 90%)',
                  borderRadius: 3,
                  px: 4,
                  py: 1.5
                }}
              >
                Write First Review
              </Button>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Please log in to write a review
              </Typography>
            )}
          </Paper>
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