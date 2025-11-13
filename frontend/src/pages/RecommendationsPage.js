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
  // Tooltip,
  // ButtonGroup,
  // ToggleButton,
  // ToggleButtonGroup,
} from '@mui/material';
import {
  AutoAwesome as MagicIcon,
  // TrendingUp as TrendingIcon,
  Star as StarIcon,
  // Movie as MovieIcon,
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
  // Insights as InsightsIcon,
  // FilterList as FilterIcon,
  // Explore as ExploreIcon,
  CheckCircle as CheckIcon,
  // RadioButtonUnchecked as UncheckedIcon,
  Gradient as GradientIcon,
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import MovieCard from '../components/movies/MovieCard';
// import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  getMyRecommendations,
  getPopularMovies,
  getNewReleases
} from '../services/recommendationService';

const RecommendationsPage = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Initialize all arrays as empty arrays to prevent undefined errors
  const [personalRecs, setPersonalRecs] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [recType, setRecType] = useState('hybrid');
  const [loading, setLoading] = useState({
    personal: true,
    popular: true,
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
      const [popularData, releasesData] = await Promise.all([
        getPopularMovies({ limit: 12 }),
        getNewReleases({ limit: 8 })
      ]);

      // Add null checks and default to empty arrays
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
        popular: 'Failed to load popular movies',
        releases: 'Failed to load new releases'
      }));
      
      // Set arrays to empty on error to prevent undefined
      setPopularMovies([]);
      setNewReleases([]);
      
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
      
      // FOR DEBUGGING:
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

  // Enhanced Algorithm Card with better text visibility
  const EnhancedAlgorithmCard = ({ type, icon, title, description, features, isActive, onClick }) => {
    const getCardStyles = () => {
      const baseStyles = {
        cursor: 'pointer',
        position: 'relative',
        height: '100%',
        minHeight: '320px',
        overflow: 'hidden',
        border: isActive 
          ? `2px solid ${theme.palette.primary.main}` 
          : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 3,
        transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
        },
        '&::before': isActive ? {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          zIndex: 6,
        } : {},
      };
      return baseStyles;
    };

    const getBackgroundLayers = () => {
      const layers = {
        hybrid: {
          layer1: 'linear-gradient(135deg, #1e293b 0%, #334155 30%, #475569 70%, #64748b 100%)',
          layer2: {
            background: 'radial-gradient(ellipse 140% 100% at 70% 20%, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
            transform: isActive ? 'translate(20px, -25px) scale(1.1)' : 'translate(-30px, -40px) scale(0.7)',
            hoverTransform: 'translate(30px, -15px) scale(1.2)',
          },
          layer3: {
            background: 'radial-gradient(ellipse 120% 80% at 30% 80%, rgba(168, 85, 247, 0.2) 0%, transparent 60%)',
            transform: isActive ? 'translate(-10px, 40px) scale(1.2)' : 'translate(40px, 30px) scale(0.8)',
            hoverTransform: 'translate(-20px, 50px) scale(1.3)',
          },
        },
        collaborative: {
          layer1: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 30%, #1f2937 70%, #374151 100%)',
          layer2: {
            background: 'radial-gradient(ellipse 130% 90% at 60% 30%, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
            transform: isActive ? 'translate(15px, -30px) scale(1.05)' : 'translate(-25px, -35px) scale(0.8)',
            hoverTransform: 'translate(25px, -20px) scale(1.15)',
          },
          layer3: {
            background: 'radial-gradient(ellipse 110% 70% at 40% 70%, rgba(6, 182, 212, 0.2) 0%, transparent 65%)',
            transform: isActive ? 'translate(-5px, 35px) scale(1.15)' : 'translate(35px, 25px) scale(0.75)',
            hoverTransform: 'translate(-15px, 45px) scale(1.25)',
          },
        },
        content: {
          layer1: 'linear-gradient(135deg, #581c87 0%, #7c3aed 30%, #4c1d95 70%, #3730a3 100%)',
          layer2: {
            background: 'radial-gradient(ellipse 120% 85% at 70% 40%, rgba(168, 85, 247, 0.25) 0%, transparent 65%)',
            transform: isActive ? 'translate(10px, -20px) scale(1.0)' : 'translate(-20px, -30px) scale(0.85)',
            hoverTransform: 'translate(20px, -15px) scale(1.1)',
          },
          layer3: {
            background: 'radial-gradient(ellipse 100% 60% at 30% 80%, rgba(236, 72, 153, 0.2) 0%, transparent 60%)',
            transform: isActive ? 'translate(-5px, 30px) scale(1.1)' : 'translate(30px, 20px) scale(0.9)',
            hoverTransform: 'translate(-10px, 40px) scale(1.2)',
          },
        },
      };
      return layers[type] || layers.hybrid;
    };

    const bgLayers = getBackgroundLayers();

    return (
      <Card sx={getCardStyles()} onClick={() => onClick(type)}>
        {/* Animated background layers */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: bgLayers.layer1,
            borderRadius: 3,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: bgLayers.layer2.background,
            transform: bgLayers.layer2.transform,
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            borderRadius: 3,
            '.gradient-card:hover &': {
              transform: bgLayers.layer2.hoverTransform,
            },
          }}
          className="background-layer-2"
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: bgLayers.layer3.background,
            transform: bgLayers.layer3.transform,
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            borderRadius: 3,
            '.gradient-card:hover &': {
              transform: bgLayers.layer3.hoverTransform,
            },
          }}
          className="background-layer-3"
        />
        
        {/* Selection indicator */}
        {isActive && (
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 10,
            }}
          >
            <CheckIcon 
              sx={{ 
                color: 'white', // Changed from primary.main to white for better visibility
                fontSize: 32,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
              }} 
            />
          </Box>
        )}

        <CardContent sx={{ 
          position: 'relative', 
          zIndex: 5, 
          height: '100%', 
          p: 3, 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  bgcolor: isActive ? 'white' : alpha(theme.palette.primary.main, 0.1),
                  color: isActive ? theme.palette.primary.main : 'white',
                  width: 56,
                  height: 56,
                  mr: 2,
                  boxShadow: isActive ? `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}` : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                {icon}
              </Avatar>
            </Box>
            
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700, 
                mb: 1,
                color: 'white', // Fixed text color for better visibility
                transition: 'color 0.3s ease',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)', // Added text shadow for better readability
              }}
            >
              {title}
            </Typography>
            
            <Typography 
              variant="body2" 
              sx={{ 
                lineHeight: 1.6,
                color: alpha('#ffffff', 0.9), // Better visibility for description text
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              {description}
            </Typography>
          </Box>

          {/* Features */}
          <Stack spacing={1}>
            {features.map((feature, index) => (
              <Chip
                key={index}
                label={feature}
                size="small"
                variant={isActive ? "filled" : "outlined"}
                sx={{
                  fontSize: '0.75rem',
                  height: 28,
                  bgcolor: isActive ? alpha('#ffffff', 0.2) : alpha('#ffffff', 0.1),
                  color: 'white', // Fixed feature text color
                  borderColor: alpha('#ffffff', 0.4),
                  '& .MuiChip-label': {
                    px: 1.5,
                    fontWeight: 500,
                  },
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(10px)',
                }}
              />
            ))}
          </Stack>
        </CardContent>

        {/* CSS-in-JS for hover effects */}
        <style jsx>{`
          .gradient-card:hover .background-layer-2 {
            transform: ${bgLayers.layer2.hoverTransform} !important;
          }
          .gradient-card:hover .background-layer-3 {
            transform: ${bgLayers.layer3.hoverTransform} !important;
          }
        `}</style>
      </Card>
    );
  };

  const EmptyState = ({ icon, title, subtitle, actionLabel, actionPath, color = 'primary' }) => (
    <Paper
      sx={{
        p: 6,
        textAlign: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.05)} 0%, ${alpha(theme.palette[color].main, 0.02)} 100%)`,
        border: `1px solid ${alpha(theme.palette[color].main, 0.1)}`,
        borderRadius: 4,
        mb: 4, // Added margin bottom for proper spacing
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
              <Grid container spacing={3} sx={{ mb: 6 }}>
                {[...Array(8)].map((_, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card sx={{ height: '100%' }}> {/* Added height for consistent spacing */}
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
                      <Box sx={{ height: '100%' }}> {/* Fixed spacing wrapper */}
                        <MovieCard movie={movie} showRecommendationScore={true} />
                      </Box>
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
              <Grid container spacing={3} sx={{ mb: 6 }}>
                {[...Array(8)].map((_, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card sx={{ height: '100%' }}>
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
                      <Box sx={{ height: '100%' }}> {/* Fixed spacing wrapper */}
                        <MovieCard movie={movie} />
                      </Box>
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
            
            <Grid container spacing={4} sx={{ mb: 4 }} className="gradient-card">
              <Grid item xs={12} md={4}>
                <EnhancedAlgorithmCard
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
                <EnhancedAlgorithmCard
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
                <EnhancedAlgorithmCard
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
                      <Box sx={{ flexGrow: 1, display: 'flex', width: '100%' }}> {/* Fixed spacing */}
                        <MovieCard
                          movie={movie}
                          showRecommendationScore
                          recommendationSources={movie.recommendation_sources}
                        />
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
                  <Card sx={{ height: '100%' }}>
                    <Skeleton variant="rectangular" height={300} />
                    <CardContent>
                      <Skeleton variant="text" height={30} />
                      <Skeleton variant="text" height={20} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : errors.popular ? (
            <Alert
              severity="error"
              action={
                <Button color="inherit" onClick={fetchInitialData}>
                  Try Again
                </Button>
              }
              sx={{ mb: 4 }}
            >
              {errors.popular}
            </Alert>
          ) : Array.isArray(popularMovies) && popularMovies.length > 0 ? (
            <Grid container spacing={3} sx={{ mb: 6 }}>
              {popularMovies.map((movie, index) => (
                <Grid item xs={12} sm={6} md={3} key={movie.id}>
                  <Slide direction="up" in timeout={800 + index * 50}>
                    <Box sx={{ height: '100%' }}> {/* Fixed spacing wrapper */}
                      <MovieCard movie={movie} showRecommendationScore={true} />
                    </Box>
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
                  <Card sx={{ height: '100%' }}>
                    <Skeleton variant="rectangular" height={300} />
                    <CardContent>
                      <Skeleton variant="text" height={30} />
                      <Skeleton variant="text" height={20} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : errors.releases ? (
            <Alert
              severity="error"
              action={
                <Button color="inherit" onClick={fetchInitialData}>
                  Try Again
                </Button>
              }
              sx={{ mb: 4 }}
            >
              {errors.releases}
            </Alert>
          ) : Array.isArray(newReleases) && newReleases.length > 0 ? (
            <Grid container spacing={3} sx={{ mb: 6 }}>
              {newReleases.map((movie, index) => (
                <Grid item xs={12} sm={6} md={3} key={movie.id}>
                  <Slide direction="up" in timeout={1000 + index * 50}>
                    <Box sx={{ height: '100%' }}> {/* Fixed spacing wrapper */}
                      <MovieCard movie={movie} />
                    </Box>
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