import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Avatar,
  IconButton,
  Fade,
  useTheme,
  alpha,
  LinearProgress,
} from '@mui/material';
import {
  Recommend as RecommendIcon,
  TrendingUp as TrendingIcon,
  Star as StarIcon,
  Movie as MovieIcon,
  AutoAwesome as MagicIcon,
  PlayArrow as PlayIcon,
  Favorite as FavoriteIcon,
  LocalFireDepartment as FireIcon,
  Psychology as BrainIcon,
  Insights as InsightsIcon,
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MovieCard from '../components/movies/MovieCard';
import recommendationService from '../services/recommendationService';
import movieService from '../services/movieService';

// Memoized components for better performance
const StatCard = React.memo(({ icon, value, label, color, progress, theme }) => {
  const cardStyles = useMemo(() => ({
    height: '100%',
    background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
    border: `1px solid ${alpha(color, 0.2)}`,
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[8],
      border: `1px solid ${alpha(color, 0.3)}`,
    },
  }), [color, theme]);

  return (
    <Card sx={cardStyles}>
      <CardContent sx={{ textAlign: 'center', py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: alpha(color, 0.2),
              color: color,
              width: 56,
              height: 56,
            }}
          >
            {icon}
          </Avatar>
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 'bold', color: color, mb: 1 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {label}
        </Typography>
        {progress !== undefined && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: alpha(color, 0.1),
              '& .MuiLinearProgress-bar': {
                bgcolor: color,
                borderRadius: 3,
              },
            }}
          />
        )}
      </CardContent>
    </Card>
  );
});

const SectionHeader = React.memo(({ icon, title, subtitle, action, theme }) => {
  const titleStyles = useMemo(() => ({
    fontWeight: 'bold',
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  }), [theme]);

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              mr: 2,
              width: 48,
              height: 48,
            }}
          >
            {icon}
          </Avatar>
          <Typography variant="h4" component="h2" sx={titleStyles}>
            {title}
          </Typography>
        </Box>
        {action}
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ ml: 8 }}>
        {subtitle}
      </Typography>
    </Box>
  );
});

const QuickActionCard = React.memo(({ icon, title, description, onClick, color, theme }) => {
  const cardStyles = useMemo(() => ({
    height: '100%',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    background: `linear-gradient(135deg, ${alpha(color, 0.05)} 0%, ${alpha(color, 0.02)} 100%)`,
    border: `1px solid ${alpha(color, 0.1)}`,
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[12],
      border: `1px solid ${alpha(color, 0.3)}`,
      '& .action-icon': {
        transform: 'translateX(4px)',
      },
    },
  }), [color, theme]);

  return (
    <Card sx={cardStyles} onClick={onClick}>
      <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', height: '100%' }}>
        <Avatar
          sx={{
            bgcolor: alpha(color, 0.2),
            color: color,
            mr: 2,
            width: 48,
            height: 48,
          }}
        >
          {icon}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
        <ArrowForwardIcon
          className="action-icon"
          sx={{ color: color, transition: 'transform 0.3s ease' }}
        />
      </CardContent>
    </Card>
  );
});

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [homeData, setHomeData] = useState({
    recommendations: [],
    popularMovies: [],
    userStats: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Optimize data loading with priority
  const loadCriticalData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user stats first (usually fastest)
      const statsData = await movieService.getRatingStats();
      setHomeData(prev => ({ ...prev, userStats: statsData }));

      // Then load recommendations and popular movies
      const [recommendationsData, popularData] = await Promise.all([
        recommendationService.getPersonalRecommendations('hybrid', 8),
        recommendationService.getPopularRecommendations(null, 8),
      ]);

      setHomeData(prev => ({
        ...prev,
        recommendations: recommendationsData.recommendations || [],
        popularMovies: popularData.movies || [],
      }));

    } catch (error) {
      console.error('Failed to load home page data:', error);
      setError('Failed to load recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCriticalData();
  }, [loadCriticalData]);

  const handleMovieRated = useCallback(() => {
    // Only refresh recommendations, not all data
    recommendationService.getPersonalRecommendations('hybrid', 8)
      .then(data => {
        setHomeData(prev => ({ 
          ...prev, 
          recommendations: data.recommendations || [] 
        }));
      })
      .catch(console.error);
  }, []);

  // Memoize computed values
  const welcomeTitle = useMemo(() => ({
    fontWeight: 'bold',
    mb: 2,
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  }), [theme]);

  const { recommendations, popularMovies, userStats } = homeData;

  // Simplified loading state - remove complex skeletons
  if (loading && !userStats) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Skeleton variant="text" width="60%" height={80} sx={{ mx: 'auto', mb: 2 }} />
          <Skeleton variant="text" width="40%" height={40} sx={{ mx: 'auto' }} />
        </Box>
        <Grid container spacing={3}>
          {[...Array(8)].map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Simplified Welcome Header - Remove animation delays */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" sx={welcomeTitle}>
          Welcome back, {user?.username}! 🎬
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 3 }}>
          Discover your next favorite movie with AI-powered recommendations
        </Typography>
        <Chip
          icon={<BrainIcon />}
          label="Powered by Machine Learning"
          variant="outlined"
          color="primary"
          sx={{ fontSize: '0.9rem', py: 2 }}
        />
      </Box>

      {/* User Stats */}
      {userStats && (
        <Box sx={{ mb: 6 }}>
          <SectionHeader
            icon={<InsightsIcon />}
            title="Your Movie Journey"
            subtitle="Track your progress and discover your movie preferences"
            theme={theme}
            action={
              <IconButton
                onClick={loadCriticalData}
                sx={{ color: 'primary.main' }}
                disabled={loading}
              >
                <RefreshIcon />
              </IconButton>
            }
          />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<MovieIcon />}
                value={userStats.total_ratings}
                label="Movies Rated"
                color={theme.palette.primary.main}
                progress={Math.min((userStats.total_ratings / 100) * 100, 100)}
                theme={theme}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<StarIcon />}
                value={userStats.avg_rating ? userStats.avg_rating.toFixed(1) : '0.0'}
                label="Average Rating"
                color={theme.palette.warning.main}
                progress={userStats.avg_rating ? (userStats.avg_rating / 5) * 100 : 0}
                theme={theme}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<FavoriteIcon />}
                value={userStats.rated_genres?.length || 0}
                label="Genres Explored"
                color={theme.palette.error.main}
                progress={Math.min(((userStats.rated_genres?.length || 0) / 20) * 100, 100)}
                theme={theme}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<RecommendIcon />}
                value={recommendations.length}
                label="New Recommendations"
                color={theme.palette.success.main}
                theme={theme}
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 4 }}
          action={
            <Button color="inherit" size="small" onClick={loadCriticalData}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Personal Recommendations */}
      <Box sx={{ mb: 6 }}>
        <SectionHeader
          icon={<MagicIcon />}
          title="Recommended For You"
          subtitle="Curated picks based on your taste and similar users' preferences"
          theme={theme}
          action={
            <Button
              variant="contained"
              onClick={() => navigate('/recommendations')}
              startIcon={<RecommendIcon />}
              sx={{
                borderRadius: 3,
                px: 3,
                py: 1.5,
              }}
            >
              View All
            </Button>
          }
        />

        {recommendations.length > 0 ? (
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
        ) : (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 3,
              }}
            >
              <MovieIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              No recommendations yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Rate some movies to unlock personalized AI recommendations!
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/movies')}
              startIcon={<MovieIcon />}
              sx={{ borderRadius: 3, px: 4, py: 1.5 }}
            >
              Browse Movies
            </Button>
          </Paper>
        )}
      </Box>

      {/* Popular Movies */}
      <Box sx={{ mb: 6 }}>
        <SectionHeader
          icon={<FireIcon />}
          title="Trending Now"
          subtitle="Popular movies with high ratings from our community"
          theme={theme}
          action={
            <Button
              variant="outlined"
              onClick={() => navigate('/movies?sort=popular')}
              startIcon={<TrendingIcon />}
              sx={{ borderRadius: 3, px: 3, py: 1.5 }}
            >
              View All
            </Button>
          }
        />

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
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="body1" color="text.secondary">
              No popular movies available at the moment.
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Quick Actions */}
      <Box>
        <SectionHeader
          icon={<PlayIcon />}
          title="Quick Actions"
          subtitle="Jump to your favorite sections and explore more content"
          theme={theme}
        />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <QuickActionCard
              icon={<MovieIcon />}
              title="Browse Movies"
              description="Explore our movie collection"
              onClick={() => navigate('/movies')}
              color={theme.palette.primary.main}
              theme={theme}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <QuickActionCard
              icon={<RecommendIcon />}
              title="Get Recommendations"
              description="Discover personalized picks"
              onClick={() => navigate('/recommendations')}
              color={theme.palette.secondary.main}
              theme={theme}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <QuickActionCard
              icon={<StarIcon />}
              title="My Ratings"
              description="View and manage ratings"
              onClick={() => navigate('/my-ratings')}
              color={theme.palette.warning.main}
              theme={theme}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <QuickActionCard
              icon={<InsightsIcon />}
              title="Profile & Stats"
              description="Check your movie insights"
              onClick={() => navigate('/profile')}
              color={theme.palette.success.main}
              theme={theme}
            />
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default HomePage;