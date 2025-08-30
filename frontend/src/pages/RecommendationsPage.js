import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fade,
  Slide,
  useTheme,
  alpha,
  CircularProgress,
  Divider,
  Stack,
  Tooltip,
  ButtonGroup,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  AutoAwesome as MagicIcon,
  TrendingUp as TrendingIcon,
  Star as StarIcon,
  Movie as MovieIcon,
  Psychology as BrainIcon,
  Group as GroupIcon,
  Category as CategoryIcon,
  LocalFireDepartment as FireIcon,
  NewReleases as NewIcon,
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
  Lightbulb as TipIcon,
  RateReview as ReviewIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowIcon,
  Insights as InsightsIcon,
  FilterList as FilterIcon,
  Explore as ExploreIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Gradient as GradientIcon,
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import MovieCard from '../components/movies/MovieCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  getMyRecommendations,
  getPopularMovies,
  getRecommendationsByGenre,
  getNewReleases
} from '../services/recommendationService';
import { getGenres } from '../services/movieService';

const RecommendationsPage = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Initialize all arrays as empty arrays to prevent undefined errors
  const [personalRecs, setPersonalRecs] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [genreRecs, setGenreRecs] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [recType, setRecType] = useState('hybrid');
  const [loading, setLoading] = useState({
    personal: true,
    popular: true,
    genre: false,
    releases: true
  });
  const [errors, setErrors] = useState({});
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    fetchInitialData();
    setTimeout(() => setPageLoaded(true), 300);
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPersonalRecommendations();
    }
  }, [recType, isAuthenticated]);

  useEffect(() => {
    if (selectedGenre) {
      fetchGenreRecommendations();
    }
  }, [selectedGenre]);

  // Add this useEffect to your RecommendationsPage
useEffect(() => {
  // Test direct API call from React
  const token = localStorage.getItem('token');
  
  fetch('/api/recommendations/for-me?type=hybrid&limit=15', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('Direct fetch from React:', data);
  })
  .catch(error => {
    console.error('Direct fetch error:', error);
  });
}, []);

  const fetchInitialData = async () => {
    try {
      const [genresData, popularData, releasesData] = await Promise.all([
        getGenres(),
        getPopularMovies({ limit: 12 }),
        getNewReleases({ limit: 8 })
      ]);

      // Add null checks and default to empty arrays
      setGenres(genresData?.genres || []);
      setPopularMovies(popularData?.movies || []);
      setNewReleases(releasesData?.movies || []);

      setLoading(prev => ({
        ...prev,
        popular: false,
        releases: false
      }));
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setErrors(prev => ({
        ...prev,
        popular: 'Failed to load popular movies'
      }));
      
      // Set arrays to empty on error to prevent undefined
      setPopularMovies([]);
      setNewReleases([]);
      setGenres([]);
      
      setLoading(prev => ({
        ...prev,
        popular: false,
        releases: false
      }));
    }
  };

  const fetchPersonalRecommendations = async () => {
    if (!isAuthenticated) return;

    setLoading(prev => ({ ...prev, personal: true }));
    setErrors(prev => ({ ...prev, personal: null }));

    try {
      const data = await getMyRecommendations({
        type: recType,
        limit: 15
      });
      
      // ADD THIS ONE LINE FOR DEBUGGING:
      console.log('DEBUG - API Response:', data);
      
      setPersonalRecs(data?.recommendations || []);
    } catch (error) {
      console.error('Error fetching personal recommendations:', error);
      setErrors(prev => ({
        ...prev,
        personal: 'Failed to load personalized recommendations'
      }));
      setPersonalRecs([]);
    } finally {
      setLoading(prev => ({ ...prev, personal: false }));
    }
  };

  const fetchGenreRecommendations = async () => {
    setLoading(prev => ({ ...prev, genre: true }));
    setErrors(prev => ({ ...prev, genre: null }));

    try {
      const data = await getRecommendationsByGenre(selectedGenre, { limit: 8 });
      setGenreRecs(data?.movies || []);
    } catch (error) {
      console.error('Error fetching genre recommendations:', error);
      setErrors(prev => ({
        ...prev,
        genre: 'Failed to load genre recommendations'
      }));
      setGenreRecs([]); // Set to empty array on error
    } finally {
      setLoading(prev => ({ ...prev, genre: false }));
    }
  };

  const SectionHeader = ({ icon, title, subtitle, action, color = 'primary' }) => (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            sx={{
              bgcolor: alpha(theme.palette[color].main, 0.15),
              color: `${color}.main`,
              mr: 2,
              width: 56,
              height: 56,
            }}
          >
            {icon}
          </Avatar>
          <Box>
            <Typography
              variant="h4"
              component="h2"
              sx={{
                fontWeight: 'bold',
                background: `linear-gradient(135deg, ${theme.palette[color].main}, ${theme.palette[color].dark})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 0.5,
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body1" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        {action}
      </Box>
    </Box>
  );

  // Modern Algorithm Card with glassmorphism effect
  const ModernAlgorithmCard = ({ type, icon, title, description, features, isActive, onClick }) => (
    <Card
      sx={{
        cursor: 'pointer',
        position: 'relative',
        height: '100%',
        background: isActive
          ? `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.2)})`
          : `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.4)})`,
        backdropFilter: 'blur(20px)',
        border: isActive 
          ? `2px solid ${theme.palette.primary.main}` 
          : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 4,
        overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: isActive 
            ? `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
            : 'transparent',
          transition: 'all 0.3s ease',
        },
        '&:hover': {
          transform: 'translateY(-8px) scale(1.02)',
          boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.2)}`,
          '&::before': {
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          },
        },
      }}
      onClick={() => onClick(type)}
    >
      <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            sx={{
              bgcolor: isActive ? 'primary.main' : alpha(theme.palette.primary.main, 0.1),
              color: isActive ? 'white' : 'primary.main',
              width: 56,
              height: 56,
              mr: 2,
              boxShadow: isActive ? `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}` : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            {icon}
          </Avatar>
          {isActive && (
            <CheckIcon 
              sx={{ 
                color: 'primary.main', 
                fontSize: 28,
                animation: 'fadeIn 0.3s ease-in',
              }} 
            />
          )}
        </Box>
        
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 700, 
            mb: 2,
            background: isActive 
              ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
              : 'none',
            backgroundClip: isActive ? 'text' : 'none',
            WebkitBackgroundClip: isActive ? 'text' : 'none',
            WebkitTextFillColor: isActive ? 'transparent' : 'inherit',
          }}
        >
          {title}
        </Typography>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ mb: 3, flexGrow: 1, lineHeight: 1.6 }}
        >
          {description}
        </Typography>

        <Stack spacing={1}>
          {features.map((feature, index) => (
            <Chip
              key={index}
              label={feature}
              size="small"
              variant={isActive ? "filled" : "outlined"}
              sx={{
                fontSize: '0.75rem',
                height: 24,
                bgcolor: isActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                color: isActive ? 'primary.main' : 'text.secondary',
                borderColor: isActive ? 'primary.main' : alpha(theme.palette.divider, 0.3),
                '& .MuiChip-label': {
                  px: 1.5,
                },
              }}
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );

  // Modern Genre Selector with interactive design
  const ModernGenreSelector = () => (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        mb: 4,
        background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.6)})`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 4,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.info.main})`,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Avatar
          sx={{
            bgcolor: alpha(theme.palette.secondary.main, 0.15),
            color: 'secondary.main',
            mr: 2,
            width: 48,
            height: 48,
          }}
        >
          <ExploreIcon />
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Explore by Genre
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Discover movies tailored to your favorite genres
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        <Chip
          label="All Genres"
          onClick={() => setSelectedGenre('')}
          variant={!selectedGenre ? 'filled' : 'outlined'}
          sx={{
            px: 2,
            py: 1,
            height: 40,
            fontSize: '0.9rem',
            fontWeight: 600,
            borderRadius: 3,
            bgcolor: !selectedGenre ? 'secondary.main' : 'transparent',
            color: !selectedGenre ? 'white' : 'text.primary',
            borderColor: !selectedGenre ? 'secondary.main' : alpha(theme.palette.divider, 0.3),
            boxShadow: !selectedGenre ? `0 4px 12px ${alpha(theme.palette.secondary.main, 0.3)}` : 'none',
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: `0 6px 16px ${alpha(theme.palette.secondary.main, 0.4)}`,
            },
          }}
        />
        {Array.isArray(genres) && genres.map((genre, index) => (
          <Chip
            key={genre.name}
            label={genre.name}
            onClick={() => setSelectedGenre(genre.name)}
            variant={selectedGenre === genre.name ? 'filled' : 'outlined'}
            sx={{
              px: 2,
              py: 1,
              height: 40,
              fontSize: '0.9rem',
              fontWeight: 600,
              borderRadius: 3,
              bgcolor: selectedGenre === genre.name ? 'secondary.main' : 'transparent',
              color: selectedGenre === genre.name ? 'white' : 'text.primary',
              borderColor: selectedGenre === genre.name ? 'secondary.main' : alpha(theme.palette.divider, 0.3),
              boxShadow: selectedGenre === genre.name ? `0 4px 12px ${alpha(theme.palette.secondary.main, 0.3)}` : 'none',
              transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
              animationDelay: `${index * 50}ms`,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 16px ${alpha(theme.palette.secondary.main, 0.4)}`,
                borderColor: 'secondary.main',
              },
            }}
          />
        ))}
      </Box>

      {selectedGenre && (
        <Fade in={true} timeout={500}>
          <Alert
            severity="info"
            sx={{
              mt: 3,
              background: alpha(theme.palette.info.main, 0.1),
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              borderRadius: 2,
              '& .MuiAlert-icon': {
                color: 'info.main',
              },
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              🎬 Showing recommendations for <strong>{selectedGenre}</strong> movies
            </Typography>
          </Alert>
        </Fade>
      )}
    </Paper>
  );

  const EmptyState = ({ icon, title, subtitle, actionLabel, actionPath, color = 'primary' }) => (
    <Paper
      sx={{
        p: 6,
        textAlign: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.05)} 0%, ${alpha(theme.palette[color].main, 0.02)} 100%)`,
        border: `1px solid ${alpha(theme.palette[color].main, 0.1)}`,
        borderRadius: 4,
      }}
    >
      <Avatar
        sx={{
          bgcolor: alpha(theme.palette[color].main, 0.15),
          color: `${color}.main`,
          width: 80,
          height: 80,
          mx: 'auto',
          mb: 3,
        }}
      >
        {icon}
      </Avatar>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {subtitle}
      </Typography>
      {actionLabel && actionPath && (
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate(actionPath)}
          sx={{
            borderRadius: 3,
            px: 4,
            py: 1.5,
            background: `linear-gradient(135deg, ${theme.palette[color].main}, ${theme.palette[color].dark})`,
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Paper>
  );

  const TipCard = ({ icon, title, description, actionLabel, actionPath, color }) => (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.3s ease',
        background: `linear-gradient(135deg, ${alpha(color, 0.05)} 0%, ${alpha(color, 0.02)} 100%)`,
        border: `1px solid ${alpha(color, 0.1)}`,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[12],
          border: `1px solid ${alpha(color, 0.3)}`,
        },
      }}
    >
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Avatar
          sx={{
            bgcolor: alpha(color, 0.2),
            color: color,
            mb: 2,
            width: 56,
            height: 56,
          }}
        >
          {icon}
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
          {description}
        </Typography>
        {actionLabel && actionPath && (
          <Button
            size="small"
            endIcon={<ArrowIcon />}
            onClick={() => navigate(actionPath)}
            sx={{ alignSelf: 'flex-start', color: color }}
          >
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (!isAuthenticated) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, minHeight: '100vh' }}>
        <Fade in={pageLoaded} timeout={800}>
          <Box>
            {/* Hero Section */}
            <Paper
              sx={{
                p: 8,
                textAlign: 'center',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                borderRadius: 4,
                mb: 6,
              }}
            >
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 100,
                  height: 100,
                  mx: 'auto',
                  mb: 4,
                }}
              >
                <MagicIcon sx={{ fontSize: 50 }} />
              </Avatar>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 'bold',
                  mb: 2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Personalized Recommendations
              </Typography>
              <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
                Discover your next favorite movie with AI-powered suggestions
              </Typography>
              
              <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 4 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<LoginIcon />}
                  onClick={() => navigate('/login')}
                  sx={{
                    borderRadius: 3,
                    px: 4,
                    py: 1.5,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  }}
                >
                  Sign In
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<RegisterIcon />}
                  onClick={() => navigate('/register')}
                  sx={{
                    borderRadius: 3,
                    px: 4,
                    py: 1.5,
                    borderWidth: 2,
                    '&:hover': { borderWidth: 2 },
                  }}
                >
                  Create Account
                </Button>
              </Stack>

              <Typography variant="body1" color="text.secondary">
                Join our community to get recommendations based on your taste and what similar users are watching
              </Typography>
            </Paper>

            {/* Popular Movies Section */}
            <SectionHeader
              icon={<FireIcon />}
              title="Popular Movies"
              subtitle="Trending movies with high ratings from our community"
              color="error"
            />
            
            {loading.popular ? (
              <Grid container spacing={3}>
                {[...Array(8)].map((_, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card>
                      <Skeleton variant="rectangular" height={300} />
                      <CardContent>
                        <Skeleton variant="text" height={30} />
                        <Skeleton variant="text" height={20} />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : Array.isArray(popularMovies) && popularMovies.length > 0 ? (
              <Grid container spacing={3} sx={{ mb: 6 }}>
                {popularMovies.map((movie, index) => (
                  <Grid item xs={12} sm={6} md={3} key={movie.id}>
                    <Slide direction="up" in timeout={600 + index * 50}>
                      <div>
                        <MovieCard movie={movie} showRecommendationScore={true} />
                      </div>
                    </Slide>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <EmptyState
                icon={<FireIcon />}
                title="No popular movies available"
                subtitle="Check back later for trending content"
                color="error"
              />
            )}

            {/* New Releases Section */}
            <SectionHeader
              icon={<NewIcon />}
              title="New Releases"
              subtitle="Latest movies added to our collection"
              color="success"
            />
            
            {loading.releases ? (
              <Grid container spacing={3}>
                {[...Array(8)].map((_, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card>
                      <Skeleton variant="rectangular" height={300} />
                      <CardContent>
                        <Skeleton variant="text" height={30} />
                        <Skeleton variant="text" height={20} />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : Array.isArray(newReleases) && newReleases.length > 0 ? (
              <Grid container spacing={3}>
                {newReleases.map((movie, index) => (
                  <Grid item xs={12} sm={6} md={3} key={movie.id}>
                    <Slide direction="up" in timeout={800 + index * 50}>
                      <div>
                        <MovieCard movie={movie} />
                      </div>
                    </Slide>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <EmptyState
                icon={<NewIcon />}
                title="No new releases available"
                subtitle="Check back later for the latest movies"
                color="success"
              />
            )}
          </Box>
        </Fade>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, minHeight: '100vh' }}>
      <Fade in={pageLoaded} timeout={800}>
        <Box>
          {/* Welcome Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Your Recommendations
            </Typography>
            <Typography variant="h5" color="text.secondary">
              Personalized movie suggestions just for you, {user?.username}!
            </Typography>
          </Box>

          {/* Personal Recommendations Section */}
          <Paper
            sx={{
              p: 4,
              mb: 6,
              background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.6)})`,
              backdropFilter: 'blur(20px)',
              border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              borderRadius: 4,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              },
            }}
          >
            <SectionHeader
              icon={<BrainIcon />}
              title="For You"
              subtitle="AI-powered recommendations based on your preferences"
              action={
                <IconButton 
                  onClick={fetchPersonalRecommendations} 
                  disabled={loading.personal}
                  sx={{
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.secondary.main, 0.2)})`,
                    },
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              }
            />

            {/* Modern Algorithm Selection */}
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700, 
                mb: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <GradientIcon sx={{ color: 'primary.main' }} />
              Choose Your Algorithm
            </Typography>
            
            <Grid container spacing={4} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <ModernAlgorithmCard
                  type="hybrid"
                  icon={<MagicIcon />}
                  title="Smart Fusion"
                  description="Advanced AI that combines your taste with community insights for the most accurate recommendations"
                  features={["AI-Powered", "Best Accuracy", "Personalized"]}
                  isActive={recType === 'hybrid'}
                  onClick={setRecType}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <ModernAlgorithmCard
                  type="collaborative"
                  icon={<GroupIcon />}
                  title="Community Wisdom"
                  description="Discover what users with similar taste are loving right now"
                  features={["Social Discovery", "Trend-Based", "User Similarity"]}
                  isActive={recType === 'collaborative'}
                  onClick={setRecType}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <ModernAlgorithmCard
                  type="content"
                  icon={<CategoryIcon />}
                  title="Pure Preference"
                  description="Tailored to your exact taste in genres, themes, and movie characteristics"
                  features={["Genre-Based", "Style Matching", "Content Analysis"]}
                  isActive={recType === 'content'}
                  onClick={setRecType}
                />
              </Grid>
            </Grid>

            <Divider sx={{ mb: 4 }} />

            {/* Algorithm Info */}
            <Alert
              severity="info"
              sx={{
                mb: 4,
                background: alpha(theme.palette.info.main, 0.1),
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                borderRadius: 3,
                '& .MuiAlert-icon': {
                  color: 'info.main',
                },
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {recType === 'hybrid' && '🧠 Using Smart Fusion: Combining your preferences with community insights for optimal recommendations'}
                {recType === 'collaborative' && '👥 Using Community Wisdom: Based on users with similar taste to yours'}
                {recType === 'content' && '🎭 Using Pure Preference: Based on genres and movies you\'ve enjoyed'}
              </Typography>
            </Alert>

            {/* Recommendations Grid */}
            {loading.personal ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Analyzing your preferences...
                </Typography>
              </Box>
            ) : errors.personal ? (
              <Alert
                severity="error"
                action={
                  <Button color="inherit" onClick={fetchPersonalRecommendations}>
                    Try Again
                  </Button>
                }
              >
                {errors.personal}
              </Alert>
            ) : Array.isArray(personalRecs) && personalRecs.length > 0 ? (
              <Grid container spacing={3} alignItems="stretch">
                {personalRecs.map((movie, index) => (
                  <Grid item xs={12} sm={6} md={3} key={movie.id} sx={{ display: 'flex' }}>
                    <Slide direction="up" in timeout={400 + index * 50}>
                      <Box sx={{ flexGrow: 1, display: 'flex' }}>
                        <div>
                          <MovieCard
                            movie={movie}
                            showRecommendationScore
                            recommendationSources={movie.recommendation_sources}
                          />
                        </div>
                      </Box>
                    </Slide>
                  </Grid>
                ))}
              </Grid>
            ) : (
                <Alert severity="info" sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    No {recType} recommendations available
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    To get personalized recommendations, you need to rate some movies first.
                    {recType === 'collaborative' && ' We need at least 5 ratings to find similar users.'}
                    {recType === 'content' && ' We need ratings across different genres.'}
                    {recType === 'hybrid' && ' We need at least 3-5 ratings to understand your taste.'}
                  </Typography>
                  <Button 
                    variant="contained" 
                    size="small" 
                    onClick={() => navigate('/movies')}
                    sx={{ mt: 2 }}
                  >
                    Start Rating Movies
                  </Button>
                </Alert>
            )}
          </Paper>

          {/* Modern Genre-Based Recommendations */}
          <ModernGenreSelector />

          {selectedGenre && (
            <>
              {loading.genre ? (
                <Grid container spacing={3} sx={{ mb: 6 }}>
                  {[...Array(8)].map((_, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                      <Card>
                        <Skeleton variant="rectangular" height={300} />
                        <CardContent>
                          <Skeleton variant="text" height={30} />
                          <Skeleton variant="text" height={20} />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : Array.isArray(genreRecs) && genreRecs.length > 0 ? (
                <Grid container spacing={3} sx={{ mb: 6 }}>
                  {genreRecs.map((movie, index) => (
                    <Grid item xs={12} sm={6} md={3} key={movie.id}>
                      <Slide direction="up" in timeout={600 + index * 50}>
                        <div>
                          <MovieCard movie={movie} />
                        </div>
                      </Slide>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <EmptyState
                  icon={<CategoryIcon />}
                  title={`No ${selectedGenre} recommendations found`}
                  subtitle="Try selecting a different genre"
                  color="secondary"
                />
              )}
            </>
          )}

          {/* Popular Movies */}
          <SectionHeader
            icon={<FireIcon />}
            title="Trending Now"
            subtitle="Popular movies with high ratings from our community"
            color="error"
          />
          
          {loading.popular ? (
            <Grid container spacing={3} sx={{ mb: 6 }}>
              {[...Array(8)].map((_, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card>
                    <Skeleton variant="rectangular" height={300} />
                    <CardContent>
                      <Skeleton variant="text" height={30} />
                      <Skeleton variant="text" height={20} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : Array.isArray(popularMovies) && popularMovies.length > 0 ? (
            <Grid container spacing={3} sx={{ mb: 6 }}>
              {popularMovies.map((movie, index) => (
                <Grid item xs={12} sm={6} md={3} key={movie.id}>
                  <Slide direction="up" in timeout={800 + index * 50}>
                    <div>
                      <MovieCard movie={movie} showRecommendationScore={true} />
                    </div>
                  </Slide>
                </Grid>
              ))}
            </Grid>
          ) : (
            <EmptyState
              icon={<FireIcon />}
              title="No popular movies available"
              subtitle="Check back later for trending content"
              color="error"
            />
          )}

          {/* New Releases */}
          <SectionHeader
            icon={<NewIcon />}
            title="New Releases"
            subtitle="Latest movies added to our collection"
            color="success"
          />
          
          {loading.releases ? (
            <Grid container spacing={3} sx={{ mb: 6 }}>
              {[...Array(8)].map((_, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card>
                    <Skeleton variant="rectangular" height={300} />
                    <CardContent>
                      <Skeleton variant="text" height={30} />
                      <Skeleton variant="text" height={20} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : Array.isArray(newReleases) && newReleases.length > 0 ? (
            <Grid container spacing={3} sx={{ mb: 6 }}>
              {newReleases.map((movie, index) => (
                <Grid item xs={12} sm={6} md={3} key={movie.id}>
                  <Slide direction="up" in timeout={1000 + index * 50}>
                    <div>
                      <MovieCard movie={movie} />
                    </div>
                  </Slide>
                </Grid>
              ))}
            </Grid>
          ) : (
            <EmptyState
              icon={<NewIcon />}
              title="No new releases available"
              subtitle="Check back later for the latest movies"
              color="success"
            />
          )}

          {/* Recommendation Tips */}
          <SectionHeader
            icon={<TipIcon />}
            title="Get Better Recommendations"
            subtitle="Tips to improve your personalized suggestions"
            color="warning"
          />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TipCard
                icon={<StarIcon />}
                title="Rate More Movies"
                description="The more movies you rate, the better our recommendations become"
                actionLabel="Browse Movies"
                actionPath="/movies"
                color={theme.palette.primary.main}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TipCard
                icon={<CategoryIcon />}
                title="Try Different Genres"
                description="Rate movies from various genres to discover new favorites"
                color={theme.palette.secondary.main}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TipCard
                icon={<ReviewIcon />}
                title="Write Reviews"
                description="Add reviews to your ratings to help the algorithm understand your taste"
                actionLabel="View Your Ratings"
                actionPath="/my-ratings"
                color={theme.palette.success.main}
              />
            </Grid>
          </Grid>
        </Box>
      </Fade>
    </Container>
  );
};

export default RecommendationsPage;