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
  Avatar,
  IconButton,
  Fade,
  Slide,
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

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [recommendations, setRecommendations] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [welcomeVisible, setWelcomeVisible] = useState(false);

  useEffect(() => {
    loadHomePageData();
    // Trigger welcome animation
    setTimeout(() => setWelcomeVisible(true), 200);
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

  const StatCard = ({ icon, value, label, color, progress }) => (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
        border: `1px solid ${alpha(color, 0.2)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[8],
          border: `1px solid ${alpha(color, 0.3)}`,
        },
      }}
    >
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

  const SectionHeader = ({ icon, title, subtitle, action }) => (
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
          <Typography
            variant="h4"
            component="h2"
            sx={{
              fontWeight: 'bold',
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
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

  const QuickActionCard = ({ icon, title, description, onClick, color }) => (
    <Card
      sx={{
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
      }}
      onClick={onClick}
    >
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="text" width="400px" height={80} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="300px" height={40} sx={{ mb: 4 }} />
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {[...Array(4)].map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Skeleton variant="circular" width={56} height={56} sx={{ mx: 'auto', mb: 2 }} />
                  <Skeleton variant="text" height={40} sx={{ mb: 1 }} />
                  <Skeleton variant="text" height={20} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
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
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Welcome Header */}
      <Fade in={welcomeVisible} timeout={800}>
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 'bold',
              mb: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
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
      </Fade>

      {/* User Stats */}
      {userStats && (
        <Slide direction="up" in={!loading} timeout={600}>
          <Box sx={{ mb: 6 }}>
            <SectionHeader
              icon={<InsightsIcon />}
              title="Your Movie Journey"
              subtitle="Track your progress and discover your movie preferences"
              action={
                <IconButton
                  onClick={loadHomePageData}
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
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  icon={<StarIcon />}
                  value={userStats.avg_rating ? userStats.avg_rating.toFixed(1) : '0.0'}
                  label="Average Rating"
                  color={theme.palette.warning.main}
                  progress={userStats.avg_rating ? (userStats.avg_rating / 5) * 100 : 0}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  icon={<FavoriteIcon />}
                  value={userStats.rated_genres?.length || 0}
                  label="Genres Explored"
                  color={theme.palette.error.main}
                  progress={Math.min(((userStats.rated_genres?.length || 0) / 20) * 100, 100)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  icon={<RecommendIcon />}
                  value={recommendations.length}
                  label="New Recommendations"
                  color={theme.palette.success.main}
                />
              </Grid>
            </Grid>
          </Box>
        </Slide>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 4 }}
          action={
            <Button color="inherit" size="small" onClick={loadHomePageData}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Personal Recommendations */}
      <Slide direction="up" in={!loading} timeout={800}>
        <Box sx={{ mb: 6 }}>
          <SectionHeader
            icon={<MagicIcon />}
            title="Recommended For You"
            subtitle="Curated picks based on your taste and similar users' preferences"
            action={
              <Button
                variant="contained"
                onClick={() => navigate('/recommendations')}
                startIcon={<RecommendIcon />}
                sx={{
                  borderRadius: 3,
                  px: 3,
                  py: 1.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                View All
              </Button>
            }
          />

          {recommendations.length > 0 ? (
            <Grid container spacing={3}>
              {recommendations.map((movie, index) => (
                <Grid item xs={12} sm={6} md={3} key={movie.id}>
                  <Slide direction="up" in timeout={600 + index * 100}>
                    <div>
                      <MovieCard
                        movie={movie}
                        onRatingChange={handleMovieRated}
                        showRating={true}
                      />
                    </div>
                  </Slide>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                borderRadius: 3,
              }}
            >
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
                sx={{
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                }}
              >
                Browse Movies
              </Button>
            </Paper>
          )}
        </Box>
      </Slide>

      {/* Popular Movies */}
      <Slide direction="up" in={!loading} timeout={1000}>
        <Box sx={{ mb: 6 }}>
          <SectionHeader
            icon={<FireIcon />}
            title="Trending Now"
            subtitle="Popular movies with high ratings from our community"
            action={
              <Button
                variant="outlined"
                onClick={() => navigate('/movies?sort=popular')}
                startIcon={<TrendingIcon />}
                sx={{
                  borderRadius: 3,
                  px: 3,
                  py: 1.5,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4],
                  },
                }}
              >
                View All
              </Button>
            }
          />

          {popularMovies.length > 0 ? (
            <Grid container spacing={3}>
              {popularMovies.map((movie, index) => (
                <Grid item xs={12} sm={6} md={3} key={movie.id}>
                  <Slide direction="up" in timeout={800 + index * 100}>
                    <div>
                      <MovieCard
                        movie={movie}
                        onRatingChange={handleMovieRated}
                        showRating={true}
                      />
                    </div>
                  </Slide>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper
              sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: alpha(theme.palette.grey[500], 0.05),
                borderRadius: 3,
              }}
            >
              <Typography variant="body1" color="text.secondary">
                No popular movies available at the moment.
              </Typography>
            </Paper>
          )}
        </Box>
      </Slide>

      {/* Quick Actions */}
      <Slide direction="up" in={!loading} timeout={1200}>
        <Box>
          <SectionHeader
            icon={<PlayIcon />}
            title="Quick Actions"
            subtitle="Jump to your favorite sections and explore more content"
          />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <QuickActionCard
                icon={<MovieIcon />}
                title="Browse Movies"
                description="Explore our movie collection"
                onClick={() => navigate('/movies')}
                color={theme.palette.primary.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <QuickActionCard
                icon={<RecommendIcon />}
                title="Get Recommendations"
                description="Discover personalized picks"
                onClick={() => navigate('/recommendations')}
                color={theme.palette.secondary.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <QuickActionCard
                icon={<StarIcon />}
                title="My Ratings"
                description="View and manage ratings"
                onClick={() => navigate('/my-ratings')}
                color={theme.palette.warning.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <QuickActionCard
                icon={<InsightsIcon />}
                title="Profile & Stats"
                description="Check your movie insights"
                onClick={() => navigate('/profile')}
                color={theme.palette.success.main}
              />
            </Grid>
          </Grid>
        </Box>
      </Slide>
    </Container>
  );
};

export default HomePage;