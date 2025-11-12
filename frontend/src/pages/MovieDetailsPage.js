import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  Backdrop,
  CircularProgress,
  Stack,
  useTheme,
  alpha,
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
  TheatersOutlined,
  PersonOutline,
  StarRate,
  Security,
} from '@mui/icons-material';

// Movie Info Chip Component
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

const MovieDetailsPage = () => {
  const { movieId } = useParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const theme = useTheme();
  const hasInitialFetch = useRef(false);
  const lastFetchedMovieId = useRef(null);

  // State
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

  // Utility functions
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
      return dateString;
    }
  };

  const formatRuntimeToHours = (runtimeMinutes) => {
    if (!runtimeMinutes) return '';
    const hours = Math.floor(runtimeMinutes / 60);
    const minutes = runtimeMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const processMovieData = (movieData) => {
    if (!movieData) return null;

    let processedData = movieData;
    
    // Unwrap nested data
    if (movieData.movie && !movieData.id) {
      processedData = movieData.movie;
    } else if (movieData.data && !movieData.id) {
      processedData = movieData.data;
    }

    // Map backend fields to frontend expectations
    return {
      ...processedData,
      runtime: processedData.runtime_minutes || processedData.runtime,
      overview: processedData.plot || processedData.overview,
      released_year: processedData.year || processedData.released_year,
      director: processedData.directors?.[0] || processedData.director || processedData.Director,
      stars: processedData.actors || processedData.stars || [],
      actors: processedData.actors || processedData.stars || []
    };
  };

  // Fetch movie data
  const fetchMovieData = async () => {
    if (!movieId || movieId === 'undefined' || movieId === 'null') {
      setError('Invalid movie ID provided');
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token || !user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const movieData = await getMovieDetails(movieId);
      
      if (!movieData) {
        throw new Error('No movie data returned from API');
      }

      const mappedMovieData = processMovieData(movieData);
      
      if (!mappedMovieData?.id && !mappedMovieData?.title) {
        throw new Error('Invalid movie data received from server');
      }

      setMovie(mappedMovieData);

      // Fetch similar movies
      try {
        const similarData = await getSimilarMovies(movieId, 8);
        let similarMoviesArray = [];
        
        if (similarData?.similar_movies && Array.isArray(similarData.similar_movies)) {
          similarMoviesArray = similarData.similar_movies;
        } else if (Array.isArray(similarData)) {
          similarMoviesArray = similarData;
        } else if (similarData?.data && Array.isArray(similarData.data)) {
          similarMoviesArray = similarData.data;
        }
        
        setSimilarMovies(similarMoviesArray);
      } catch (similarError) {
        console.warn('Failed to fetch similar movies:', similarError.message);
        setSimilarMovies([]);
      }

    } catch (error) {
      if (error.response?.status === 401) {
        setLoading(false);
        return;
      }

      let errorMessage = 'Failed to load movie details. Please try again.';
      
      if (error.response?.status === 404) {
        errorMessage = `Movie with ID "${movieId}" not found.`;
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. You may need to log in to view this movie.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }

      setError(errorMessage);
      setMovie(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user rating
  const fetchUserRating = async () => {
    if (!movieId || !isAuthenticated || movieId === 'undefined' || movieId === 'null') {
      return;
    }

    try {
      const ratingData = await checkUserRating(movieId);
      
      if (ratingData?.has_rated && ratingData?.rating) {
        setUserRating(ratingData.rating);
        setNewRating(ratingData.rating.rating || 0);
        setReview(ratingData.rating.review || '');
      } else {
        setUserRating(null);
        setNewRating(0);
        setReview('');
      }
    } catch (error) {
      console.warn('Error fetching user rating:', error.message);
      setUserRating(null);
    }
  };

  // Handle rating submission
  const handleRatingSubmit = async () => {
    if (!newRating || newRating < 1 || newRating > 5) {
      alert('Please select a rating between 1 and 5 stars');
      return;
    }

    setRatingLoading(true);

    try {
      const ratingData = await rateMovie(movieId, parseFloat(newRating), review.trim());
      
      setUserRating(ratingData.rating);
      setShowRatingForm(false);

      if (ratingData.new_avg_rating) {
        setMovie(prevMovie => ({
          ...prevMovie,
          avg_rating: ratingData.new_avg_rating,
          rating_count: (prevMovie.rating_count || 0) + (userRating ? 0 : 1)
        }));
      }

      alert('Rating saved successfully!');
    } catch (error) {
      let errorMessage = 'Failed to save rating. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = `Validation errors: ${error.response.data.errors.join(', ')}`;
      }

      alert(errorMessage);
    } finally {
      setRatingLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    if (!movieId || movieId === 'undefined' || movieId === 'null') {
      setError('Invalid movie ID provided');
      setLoading(false);
      return;
    }

    if (lastFetchedMovieId.current && lastFetchedMovieId.current !== movieId) {
      setMovie(null);
      setSimilarMovies([]);
      setUserRating(null);
      setError(null);
      setLoading(true);
    }

    if (lastFetchedMovieId.current === movieId) {
      return;
    }

    if (!authLoading && user && movieId) {
      const timer = setTimeout(() => {
        const token = localStorage.getItem('token');
        if (token && user) {
          lastFetchedMovieId.current = movieId;
          hasInitialFetch.current = true;
          fetchMovieData();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [authLoading, user, movieId]);

  useEffect(() => {
    if (isAuthenticated && movieId && movieId !== 'undefined' && movieId !== 'null' && hasInitialFetch.current) {
      fetchUserRating();
    }
  }, [isAuthenticated, movieId]);

  // Loading states
  if (error && loading) {
    return (
      <Backdrop
        sx={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
          zIndex: theme.zIndex.drawer + 1,
          flexDirection: 'column'
        }}
        open
      >
        <Box sx={{ position: 'relative', mb: 4 }}>
          <CircularProgress size={80} sx={{ color: '#3b82f6' }} />
        </Box>
        <Typography variant="h5" color="white" sx={{ mt: 4, fontWeight: 500 }}>
          Retrieving data...
        </Typography>
      </Backdrop>
    );
  }

  if (authLoading || loading) {
    return (
      <Backdrop
        sx={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
          zIndex: theme.zIndex.drawer + 1,
          flexDirection: 'column'
        }}
        open
      >
        <Box sx={{ position: 'relative', mb: 4 }}>
          <CircularProgress size={80} sx={{ color: '#3b82f6' }} />
        </Box>
        <Typography variant="h4" color="white" fontWeight="bold" textAlign="center">
          Loading movie details...
        </Typography>
      </Backdrop>
    );
  }

  if (error && !loading) {
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
                  setLoading(true);
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

  if (!movie && !loading && !error) {
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
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/movies"
              startIcon={<ArrowBack />}
              sx={{
                background: 'linear-gradient(45deg, #3b82f6 30%, #1d4ed8 90%)',
                borderRadius: 2,
                px: 4,
                py: 1.5
              }}
            >
              Browse Movies
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

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

                {/* Movie Information Grid */}
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
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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
                  {movie.director && (
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
                          {movie.director}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                  {movie.actors && Array.isArray(movie.actors) && movie.actors.length > 0 && (
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
                        <People sx={{ color: '#fbbf24', fontSize: 32, mb: 2 }} />
                        <Typography variant="h6" color="white" fontWeight="bold" gutterBottom>
                          Actors
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {movie.actors.slice(0, 3).join(', ')}
                          {movie.actors.length > 3 && ` +${movie.actors.length - 3} more`}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>

                {/* Action Buttons */}
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 4 }}>
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

      {/* Reviews Section */}
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