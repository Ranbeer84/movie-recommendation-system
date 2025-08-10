import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  Skeleton,
  Chip,
  Paper,
} from '@mui/material';
import {
  Recommend as RecommendIcon,
  TrendingUp as TrendingIcon,
  Star as StarIcon,
  Movie as MovieIcon,
  AutoAwesome as MagicIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MovieCard from '../components/movies/MovieCard';
import recommendationService from '../services/recommendationService';
import movieService from '../services/movieService';

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recommendations, setRecommendations] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHomePageData();
  }, []);

  const loadHomePageData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        recommendationsData,
        popularData,
        statsData,
      ] = await Promise.all([
        recommendationService.getPersonalRecommendations('hybrid', 8),
        recommendationService.getPopularRecommendations(null, 8),
        movieService.getRatingStats(),
      ]);

      setRecommendations(recommendationsData.recommendations || []);
      setPopularMovies(popularData.movies || []);
      setUserStats(statsData);
    } catch (error) {
      console.error('Failed to load home page data:', error);
      setError('Failed to load recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMovieRated = () => {
    // Refresh recommendations after rating a movie
    loadHomePageData();
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="text" width="300px" height={60} />
        <Box sx={{ mt: 4 }}>
          <Grid container spacing={3}>
            {[...Array(8)].map((_, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card>
                  <Skeleton variant="rectangular" height={300} />
                  <CardContent>
                    <Skeleton variant="text" height={30} />
                    <Skeleton variant="text" height={20} />
                    <Skeleton variant="text" height={20} width="60%" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 'bold', color: 'primary.main' }}
        >
          Welcome back, {user?.username}! 🎬
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Discover your next favorite movie with personalized recommendations
        </Typography>
      </Box>

      {/* User Stats */}
      {userStats && (
        <Paper sx={{ p: 3, mb: 4, bgcolor: 'background.paper' }}>
          <Typography variant="h6" gutterBottom>
            <StarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Your Movie Journey
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main">
                  {userStats.total_ratings}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Movies Rated
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary.main">
                  {userStats.avg_rating ? userStats.avg_rating.toFixed(1) : '0.0'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Rating
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {userStats.rated_genres?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Genres Explored
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<RecommendIcon />}
                  onClick={() => navigate('/recommendations')}
                  size="small"
                >
                  Get More
                </Button>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Recommendations
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Personal Recommendations */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <MagicIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h4" component="h2">
              Recommended For You
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={() => navigate('/recommendations')}
            startIcon={<RecommendIcon />}
          >
            View All
          </Button>
        </Box>

        {recommendations.length > 0 ? (
          <>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Based on your ratings and movies liked by similar users
            </Typography>
            <Grid container spacing={3}>
              {recommendations.map((movie) => (
                <Grid item xs={12} sm={6} md={3} key={movie.id}>
                  <MovieCard
                    movie={movie}
                    onRatingChange={handleMovieRated}
                    showRating={true}
                  />
                </Grid>
              ))}
            </Grid>
          </>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper' }}>
            <MovieIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No recommendations yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Rate some movies to get personalized recommendations!
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/movies')}
              startIcon={<MovieIcon />}
            >
              Browse Movies
            </Button>
          </Paper>
        )}
      </Box>

      {/* Popular Movies */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingIcon sx={{ mr: 2, color: 'secondary.main' }} />
            <Typography variant="h4" component="h2">
              Trending Now
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={() => navigate('/movies?sort=popular')}
            startIcon={<TrendingIcon />}
          >
            View All
          </Button>
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Popular movies with high ratings from our community
        </Typography>

        {popularMovies.length > 0 ? (
          <Grid container spacing={3}>
            {popularMovies.map((movie) => (
              <Grid item xs={12} sm={6} md={3} key={movie.id}>
                <MovieCard
                  movie={movie}
                  onRatingChange={handleMovieRated}
                  showRating={true}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper' }}>
            <Typography variant="body1" color="text.secondary">
              No popular movies available at the moment.
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Quick Actions */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<MovieIcon />}
              onClick={() => navigate('/movies')}
              sx={{ py: 2 }}
            >
              Browse Movies
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RecommendIcon />}
              onClick={() => navigate('/recommendations')}
              sx={{ py: 2 }}
            >
              Get Recommendations
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<StarIcon />}
              onClick={() => navigate('/my-ratings')}
              sx={{ py: 2 }}
            >
              My Ratings
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/profile')}
              sx={{ py: 2 }}
            >
              Profile
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default HomePage;