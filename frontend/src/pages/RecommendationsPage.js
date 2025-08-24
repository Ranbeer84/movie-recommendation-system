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
      setPersonalRecs(data?.recommendations || []);
    } catch (error) {
      console.error('Error fetching personal recommendations:', error);
      setErrors(prev => ({
        ...prev,
        personal: 'Failed to load personalized recommendations'
      }));
      setPersonalRecs([]); // Set to empty array on error
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

  const AlgorithmCard = ({ type, icon, title, description, isActive, onClick }) => (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: isActive 
          ? `2px solid ${theme.palette.primary.main}` 
          : '2px solid transparent',
        background: isActive
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`
          : 'background.paper',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[8],
          border: `2px solid ${alpha(theme.palette.primary.main, 0.5)}`,
        },
      }}
      onClick={() => onClick(type)}
    >
      <CardContent sx={{ p: 3, textAlign: 'center' }}>
        <Avatar
          sx={{
            bgcolor: isActive ? 'primary.main' : alpha(theme.palette.primary.main, 0.1),
            color: isActive ? 'white' : 'primary.main',
            width: 48,
            height: 48,
            mx: 'auto',
            mb: 2,
          }}
        >
          {icon}
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
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
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
              border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              borderRadius: 4,
            }}
          >
            <SectionHeader
              icon={<BrainIcon />}
              title="For You"
              subtitle="AI-powered recommendations based on your preferences"
              action={
                <IconButton onClick={fetchPersonalRecommendations} disabled={loading.personal}>
                  <RefreshIcon />
                </IconButton>
              }
            />

            {/* Algorithm Selection */}
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Choose Algorithm:
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <AlgorithmCard
                  type="hybrid"
                  icon={<MagicIcon />}
                  title="Smart Mix"
                  description="Combines your preferences with similar users' choices"
                  isActive={recType === 'hybrid'}
                  onClick={setRecType}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <AlgorithmCard
                  type="collaborative"
                  icon={<GroupIcon />}
                  title="Similar Users"
                  description="Based on users with similar taste to yours"
                  isActive={recType === 'collaborative'}
                  onClick={setRecType}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <AlgorithmCard
                  type="content"
                  icon={<CategoryIcon />}
                  title="Your Preferences"
                  description="Based on genres and movies you've enjoyed"
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
              }}
            >
              {recType === 'hybrid' && '🧠 Using a combination of your preferences and similar users\' choices'}
              {recType === 'collaborative' && '👥 Based on users with similar taste to yours'}
              {recType === 'content' && '🎭 Based on genres and movies you\'ve enjoyed'}
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
              <EmptyState
                icon={<BrainIcon />}
                title="No recommendations yet"
                subtitle="Rate some movies to get personalized recommendations!"
                actionLabel="Browse & Rate Movies"
                actionPath="/movies"
              />
            )}
          </Paper>

          {/* Genre-Based Recommendations */}
          <SectionHeader
            icon={<CategoryIcon />}
            title="By Genre"
            subtitle="Discover movies in your favorite genres"
            color="secondary"
          />

          <FormControl fullWidth sx={{ mb: 4, maxWidth: 300 }}>
            <InputLabel>Choose a genre</InputLabel>
            <Select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              label="Choose a genre"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {Array.isArray(genres) && genres.map(genre => (
                <MenuItem key={genre.name} value={genre.name}>
                  {genre.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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