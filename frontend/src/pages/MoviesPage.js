import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Alert,
  Skeleton,
  Chip,
  Paper,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Fade,
  Slide,
  useTheme,
  alpha,
  Stack,
  Divider,
  Badge,
  Zoom,
} from '@mui/material';
import {
  Search as SearchIcon,
  Movie as MovieIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
  Category as CategoryIcon,
  Star as StarIcon,
  CalendarToday as CalendarIcon,
  Title as TitleIcon,
  Refresh as RefreshIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Tune as TuneIcon,
  ViewModule as ViewIcon,
  LocalMovies as LocalMoviesIcon,
  Whatshot as WhatshotIcon,
  Psychology as PsychologyIcon,
  FavoriteOutlined as FavoriteIcon,
  FlashOn as FlashOnIcon,
  School as SchoolIcon,
  MoodBad as MoodBadIcon,
  EmojiEvents as EmojiEventsIcon,
  ChildCare as ChildCareIcon,
  Piano as PianoIcon,
  History as HistoryIcon,
  Science as ScienceIcon,
  MilitaryTech as MilitaryTechIcon,
  SportsEsports as SportsIcon,
  TheaterComedy as TheaterComedyIcon,
  Explore as ExploreIcon,
  AutoStories as AutoStoriesIcon,
  Elderly as ElderlyIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import MovieCard from '../components/movies/MovieCard';
import { getMovies, getGenres, searchMovies } from '../services/movieService';
import { useAuth } from '../context/AuthContext';

// Genre configuration
const GENRE_CONFIG = {
  'Action': { icon: FlashOnIcon, color: '#ff5722' },
  'Adventure': { icon: ExploreIcon, color: '#ff9800' },
  'Animation': { icon: ChildCareIcon, color: '#e91e63' },
  'Comedy': { icon: TheaterComedyIcon, color: '#ffeb3b' },
  'Crime': { icon: MilitaryTechIcon, color: '#795548' },
  'Documentary': { icon: SchoolIcon, color: '#607d8b' },
  'Drama': { icon: AutoStoriesIcon, color: '#9c27b0' },
  'Family': { icon: FavoriteIcon, color: '#4caf50' },
  'Fantasy': { icon: PsychologyIcon, color: '#673ab7' },
  'History': { icon: HistoryIcon, color: '#8bc34a' },
  'Horror': { icon: MoodBadIcon, color: '#f44336' },
  'Music': { icon: PianoIcon, color: '#3f51b5' },
  'Mystery': { icon: ScienceIcon, color: '#00bcd4' },
  'Romance': { icon: FavoriteIcon, color: '#e91e63' },
  'Science Fiction': { icon: ScienceIcon, color: '#2196f3' },
  'Thriller': { icon: WhatshotIcon, color: '#ff5722' },
  'War': { icon: MilitaryTechIcon, color: '#424242' },
  'Western': { icon: ElderlyIcon, color: '#8d6e63' },
  'Sport': { icon: SportsIcon, color: '#ff9800' },
  'Biography': { icon: EmojiEventsIcon, color: '#009688' },
};

const SORT_CONFIG = {
  'avg_rating': { icon: StarIcon, label: 'Rating (High to Low)' },
  'year': { icon: CalendarIcon, label: 'Year (New to Old)' },
  'title': { icon: TitleIcon, label: 'Title (A to Z)' },
};

const MoviesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const { user, loading: authLoading } = useAuth();
  const hasInitialFetch = useRef(false);
  
  // State management
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'avg_rating');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Helper functions
  const getGenreIcon = (genreName) => {
    const Icon = GENRE_CONFIG[genreName]?.icon || CategoryIcon;
    return <Icon />;
  };

  const getGenreColor = (genreName) => {
    return GENRE_CONFIG[genreName]?.color || theme.palette.primary.main;
  };

  const getSortIcon = (sortType) => {
    const Icon = SORT_CONFIG[sortType]?.icon || SortIcon;
    return <Icon />;
  };

  const getSortLabel = (sortType) => {
    return SORT_CONFIG[sortType]?.label || 'Rating';
  };

  // Initialize data fetch when auth is ready
  useEffect(() => {
    if (!authLoading && user && !hasInitialFetch.current) {
      const token = localStorage.getItem('token');
      if (token) {
        hasInitialFetch.current = true;
        fetchGenres();
        fetchMovies(true);
        setTimeout(() => setPageLoaded(true), 300);
      }
    }
  }, [authLoading, user]);

  // Handle filter changes
  useEffect(() => {
    if (hasInitialFetch.current && !authLoading && user) {
      fetchMovies(true);
    }
  }, [selectedGenre, sortBy, searchQuery]);

  // Fetch genres
  const fetchGenres = async () => {
    try {
      const data = await getGenres();
      
      if (Array.isArray(data)) {
        setGenres(data);
      } else if (data?.genres && Array.isArray(data.genres)) {
        setGenres(data.genres);
      } else if (data?.data && Array.isArray(data.data)) {
        setGenres(data.data);
      } else {
        console.error('Unexpected genres response format:', data);
        setGenres([]);
      }
    } catch (error) {
      console.error('Error fetching genres:', error);
      setGenres([]);
    }
  };

  // Fetch movies
  const fetchMovies = async (reset = false) => {
    if (!reset && !hasMore) return;
    
    const token = localStorage.getItem('token');
    if (!token || !user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      let data;
      const currentPage = reset ? 1 : page;
      
      if (searchQuery.trim()) {
        data = await searchMovies(searchQuery, 20);
      } else {
        data = await getMovies(currentPage, 20, selectedGenre, sortBy);
      }

      if (data?.movies && Array.isArray(data.movies)) {
        setHasMore(data.movies.length === 20);
        
        if (reset) {
          setMovies(data.movies);
          setPage(2);
        } else {
          setMovies(prev => [...prev, ...data.movies]);
          setPage(prev => prev + 1);
        }
      } else {
        setError('Invalid data format from server');
        setMovies([]);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
      if (error.response?.status !== 401) {
        setError('Failed to load movies. Please try again.');
      }
      if (reset) {
        setMovies([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Event handlers
  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim() === searchParams.get('q')) return;
    
    setIsSearching(true);
    updateURLParams({ q: searchQuery.trim(), genre: '', page: 1 });
    setSelectedGenre('');
    await fetchMovies(true);
    setIsSearching(false);
  };

  const handleGenreChange = (genre) => {
    if (genre === selectedGenre) return;
    
    setSelectedGenre(genre);
    setSearchQuery('');
    updateURLParams({ genre, q: '', page: 1 });
  };

  const handleSortChange = (sort) => {
    if (sort === sortBy) return;
    
    setSortBy(sort);
    updateURLParams({ sort });
  };

  const updateURLParams = (params) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });

    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenre('');
    setSortBy('avg_rating');
    setSearchParams({});
  };

  const loadMore = () => {
    fetchMovies(false);
  };

  const activeFiltersCount = [
    searchQuery, 
    selectedGenre, 
    sortBy !== 'avg_rating' ? sortBy : ''
  ].filter(Boolean).length;

  // Loading state
  if (authLoading || (loading && movies.length === 0 && !hasInitialFetch.current)) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh' }}>
        <Skeleton variant="text" width="300px" height={80} sx={{ mb: 2, mx: 'auto' }} />
        <Skeleton variant="text" width="200px" height={40} sx={{ mb: 4, mx: 'auto' }} />
        <Paper sx={{ p: 4, mb: 4, borderRadius: 4 }}>
          <Skeleton variant="rectangular" height={60} sx={{ mb: 3, borderRadius: 2 }} />
        </Paper>
        
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 3,
          justifyItems: 'center',
          mb: 4
        }}>
          {[...Array(12)].map((_, index) => (
            <Box key={index} sx={{ width: 280, height: 520 }}>
              <Skeleton variant="rectangular" height={320} sx={{ borderRadius: '20px 20px 0 0' }} />
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: '0 0 20px 20px' }}>
                <Skeleton variant="text" height={30} />
                <Skeleton variant="text" height={20} />
                <Skeleton variant="text" height={20} />
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh' }}>
      <Fade in={pageLoaded} timeout={800}>
        <Box>
          {/* Header */}
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
              Browse Movies
            </Typography>
            <Typography variant="h5" color="text.secondary">
              Discover your next favorite movie from our collection
            </Typography>
          </Box>

          {/* Search and Filters */}
          <Paper sx={{
            p: 4,
            mb: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            borderRadius: 4,
          }}>
            {/* Search Bar */}
            <Box component="form" onSubmit={handleSearch} sx={{ mb: 4 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search movies by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={isSearching}
                        sx={{
                          minWidth: 'auto',
                          px: 3,
                          py: 1,
                          borderRadius: 2,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        }}
                      >
                        {isSearching ? <RefreshIcon className="spin" /> : <SearchIcon />}
                      </Button>
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 3,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderWidth: 2,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
                sx={{ '& .MuiInputBase-input': { py: 2 } }}
              />
            </Box>

            {/* Filter Toggle Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Badge badgeContent={activeFiltersCount} color="primary">
                <Button
                  variant="outlined"
                  onClick={() => setShowFilters(!showFilters)}
                  startIcon={<TuneIcon />}
                  endIcon={
                    <ArrowDownIcon 
                      sx={{ 
                        transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                      }}
                    />
                  }
                  sx={{
                    borderRadius: 3,
                    px: 3,
                    py: 1.5,
                    borderWidth: 2,
                    '&:hover': { borderWidth: 2 },
                  }}
                >
                  Filters & Sorting
                </Button>
              </Badge>
            </Box>

            {/* Filters Section */}
            <Slide direction="down" in={showFilters} mountOnEnter unmountOnExit>
              <Box>
                <Divider sx={{ mb: 4 }} />
                
                {/* Genre Selection */}
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{ 
                      mb: 3, 
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <CategoryIcon color="primary" />
                    Choose Genre
                  </Typography>
                  
                  {/* All Genres Button */}
                  <Box sx={{ mb: 3 }}>
                    <Chip
                      icon={selectedGenre === '' ? <CheckCircleIcon /> : <LocalMoviesIcon />}
                      label="All Genres"
                      onClick={() => handleGenreChange('')}
                      variant={selectedGenre === '' ? "filled" : "outlined"}
                      sx={{
                        px: 2,
                        py: 3,
                        fontSize: '1rem',
                        fontWeight: selectedGenre === '' ? 'bold' : 'medium',
                        height: 'auto',
                        borderRadius: 4,
                        border: selectedGenre === '' ? 'none' : `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                        background: selectedGenre === '' 
                          ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                          : alpha(theme.palette.primary.main, 0.05),
                        color: selectedGenre === '' ? 'white' : theme.palette.primary.main,
                        '&:hover': {
                          background: selectedGenre === '' 
                            ? `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
                            : alpha(theme.palette.primary.main, 0.1),
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4],
                        },
                        transition: 'all 0.3s ease',
                      }}
                    />
                  </Box>

                  {/* Genre Grid */}
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 2,
                    maxHeight: '300px',
                    overflowY: 'auto',
                    pr: 1,
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: alpha(theme.palette.grey[300], 0.3),
                      borderRadius: '10px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: alpha(theme.palette.primary.main, 0.5),
                      borderRadius: '10px',
                      '&:hover': {
                        background: alpha(theme.palette.primary.main, 0.7),
                      },
                    },
                  }}>
                    {genres.map((genre, index) => {
                      const genreName = genre.name || genre;
                      const isSelected = selectedGenre === genreName;
                      const genreColor = getGenreColor(genreName);
                      
                      return (
                        <Zoom key={genreName} in timeout={200 + index * 50}>
                          <Chip
                            icon={isSelected ? <CheckCircleIcon /> : getGenreIcon(genreName)}
                            label={genreName}
                            onClick={() => handleGenreChange(genreName)}
                            variant={isSelected ? "filled" : "outlined"}
                            sx={{
                              px: 2,
                              py: 2.5,
                              fontSize: '0.9rem',
                              fontWeight: isSelected ? 'bold' : 'medium',
                              height: 'auto',
                              borderRadius: 3,
                              border: isSelected ? 'none' : `2px solid ${alpha(genreColor, 0.3)}`,
                              background: isSelected 
                                ? `linear-gradient(135deg, ${genreColor}, ${alpha(genreColor, 0.8)})`
                                : alpha(genreColor, 0.08),
                              color: isSelected ? 'white' : genreColor,
                              '&:hover': {
                                background: isSelected 
                                  ? `linear-gradient(135deg, ${alpha(genreColor, 0.9)}, ${genreColor})`
                                  : alpha(genreColor, 0.15),
                                transform: 'translateY(-2px)',
                                boxShadow: `0 6px 20px ${alpha(genreColor, 0.3)}`,
                                borderColor: alpha(genreColor, 0.6),
                              },
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              cursor: 'pointer',
                            }}
                          />
                        </Zoom>
                      );
                    })}
                  </Box>
                </Box>

                {/* Sort and Clear Section */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
                  gap: 3,
                  alignItems: 'center' 
                }}>
                  <FormControl fullWidth>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={sortBy}
                      onChange={(e) => handleSortChange(e.target.value)}
                      label="Sort By"
                      sx={{
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderWidth: 2,
                        },
                      }}
                    >
                      {Object.entries(SORT_CONFIG).map(([value, { icon: Icon, label }]) => (
                        <MenuItem key={value} value={value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Icon fontSize="small" />
                            {label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    onClick={clearFilters}
                    startIcon={<ClearIcon />}
                    disabled={!activeFiltersCount}
                    sx={{
                      py: 2,
                      borderRadius: 3,
                      borderWidth: 2,
                      '&:hover': { 
                        borderWidth: 2,
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[4],
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Clear All Filters
                  </Button>
                </Box>
              </Box>
            </Slide>
          </Paper>

          {/* Active Filters Display */}
          {(selectedGenre || searchQuery || sortBy !== 'avg_rating') && (
            <Zoom in timeout={400}>
              <Paper sx={{
                p: 3,
                mb: 4,
                background: alpha(theme.palette.info.main, 0.1),
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                borderRadius: 3,
              }}>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    Active Filters:
                  </Typography>
                  {searchQuery && (
                    <Chip
                      icon={<SearchIcon />}
                      label={`Search: "${searchQuery}"`}
                      onDelete={() => {
                        setSearchQuery('');
                        updateURLParams({ q: '' });
                      }}
                      color="primary"
                      variant="filled"
                      sx={{ borderRadius: 2 }}
                    />
                  )}
                  {selectedGenre && (
                    <Chip
                      icon={getGenreIcon(selectedGenre)}
                      label={`Genre: ${selectedGenre}`}
                      onDelete={() => handleGenreChange('')}
                      variant="filled"
                      sx={{ 
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${getGenreColor(selectedGenre)}, ${alpha(getGenreColor(selectedGenre), 0.8)})`,
                        color: 'white',
                      }}
                    />
                  )}
                  {sortBy !== 'avg_rating' && (
                    <Chip
                      icon={getSortIcon(sortBy)}
                      label={`Sort: ${getSortLabel(sortBy)}`}
                      onDelete={() => handleSortChange('avg_rating')}
                      color="info"
                      variant="filled"
                      sx={{ borderRadius: 2 }}
                    />
                  )}
                </Stack>
              </Paper>
            </Zoom>
          )}

          {/* Error Message */}
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 4, borderRadius: 3 }}
              action={
                <Button color="inherit" onClick={() => fetchMovies(true)}>
                  <RefreshIcon sx={{ mr: 1 }} />
                  Try Again
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          {/* Movies Grid */}
          {movies.length > 0 ? (
            <>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: { xs: 2, sm: 3, md: 4 },
                justifyItems: 'center',
                mb: 4,
                '& > *': {
                  maxWidth: '280px',
                  width: '100%'
                }
              }}>
                {movies.map((movie, index) => (
                  <Slide
                    key={movie.id}
                    direction="up"
                    in
                    timeout={400 + index * 50}
                    style={{ width: '100%' }}
                  >
                    <Box sx={{ width: '100%', maxWidth: '280px' }}>
                      <MovieCard movie={movie} />
                    </Box>
                  </Slide>
                ))}
              </Box>

              {/* Load More Button */}
              {hasMore && !searchQuery && (
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={loadMore}
                    disabled={loading}
                    startIcon={loading ? <RefreshIcon className="spin" /> : <ViewIcon />}
                    sx={{
                      borderRadius: 3,
                      px: 4,
                      py: 1.5,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[8],
                      },
                    }}
                  >
                    {loading ? 'Loading...' : 'Load More Movies'}
                  </Button>
                </Box>
              )}

              {/* Results Summary */}
              <Paper sx={{
                p: 2,
                textAlign: 'center',
                background: alpha(theme.palette.primary.main, 0.1),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                borderRadius: 3,
              }}>
                <Typography variant="body1" color="text.secondary">
                  {`Showing ${movies.length} movies${searchQuery ? ` for "${searchQuery}"` : ''}${selectedGenre ? ` in ${selectedGenre}` : ''}${!hasMore && !searchQuery ? ' (All results shown)' : ''}`}
                </Typography>
              </Paper>
            </>
          ) : !loading && (
            <Paper sx={{
              p: 8,
              textAlign: 'center',
              background: `linear-gradient(135deg, ${alpha(theme.palette.grey[500], 0.05)} 0%, ${alpha(theme.palette.grey[500], 0.02)} 100%)`,
              border: `1px solid ${alpha(theme.palette.grey[500], 0.1)}`,
              borderRadius: 4,
            }}>
              <Avatar sx={{
                bgcolor: alpha(theme.palette.grey[500], 0.15),
                color: 'text.secondary',
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 3,
              }}>
                <MovieIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                No movies found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                {searchQuery 
                  ? `No movies match your search for "${searchQuery}"`
                  : selectedGenre 
                    ? `No ${selectedGenre} movies found`
                    : 'No movies available'}
              </Typography>
              {(searchQuery || selectedGenre || sortBy !== 'avg_rating') && (
                <Button
                  variant="contained"
                  onClick={clearFilters}
                  startIcon={<ClearIcon />}
                  sx={{
                    borderRadius: 3,
                    px: 4,
                    py: 1.5,
                  }}
                >
                  Clear All Filters
                </Button>
              )}
            </Paper>
          )}
        </Box>
      </Fade>

      {/* CSS for spinner animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spin {
            animation: spin 1s linear infinite;
          }
        `
      }} />
    </Container>
  );
};

export default MoviesPage;