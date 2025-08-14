import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  TextField,
  InputAdornment,
  Fade,
  Slide,
  useTheme,
  alpha,
  Stack,
  Divider,
  Tooltip,
  Badge,
  Zoom,
} from '@mui/material';
import {
  Search as SearchIcon,
  Movie as MovieIcon,
  FilterList as FilterIcon,
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
} from '@mui/icons-material';
import MovieCard from '../components/movies/MovieCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getMovies, getGenres, searchMovies } from '../services/movieService';

const MoviesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  
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

  useEffect(() => {
    fetchGenres();
    setTimeout(() => setPageLoaded(true), 300);
  }, []);

  useEffect(() => {
    fetchMovies(true);
  }, [selectedGenre, sortBy, searchQuery]);

  const fetchGenres = async () => {
    try {
      const data = await getGenres();
      setGenres(data.genres);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  const fetchMovies = async (reset = false) => {
    if (!reset && !hasMore) return;
    
    setLoading(true);
    setError(null);

    try {
      let data;
      const currentPage = reset ? 1 : page;
      
      if (searchQuery.trim()) {
        data = await searchMovies(searchQuery, 20);
        setHasMore(false);
      } else {
        data = await getMovies({
          page: currentPage,
          limit: 20,
          genre: selectedGenre,
          sort_by: sortBy
        });
        setHasMore(data.movies.length === 20);
      }

      if (reset) {
        setMovies(data.movies);
        setPage(2);
      } else {
        setMovies(prev => [...prev, ...data.movies]);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
      setError('Failed to load movies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  const getSortIcon = (sortType) => {
    switch (sortType) {
      case 'avg_rating': return <StarIcon />;
      case 'year': return <CalendarIcon />;
      case 'title': return <TitleIcon />;
      default: return <SortIcon />;
    }
  };

  const getSortLabel = (sortType) => {
    switch (sortType) {
      case 'avg_rating': return 'Rating';
      case 'year': return 'Year';
      case 'title': return 'Title';
      default: return 'Rating';
    }
  };

  const activeFiltersCount = [searchQuery, selectedGenre, sortBy !== 'avg_rating' ? sortBy : ''].filter(Boolean).length;

  if (loading && movies.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, minHeight: '100vh' }}>
        <Skeleton variant="text" width="300px" height={80} sx={{ mb: 2, mx: 'auto' }} />
        <Skeleton variant="text" width="200px" height={40} sx={{ mb: 4, mx: 'auto' }} />
        <Paper sx={{ p: 4, mb: 4, borderRadius: 4 }}>
          <Skeleton variant="rectangular" height={60} sx={{ mb: 3, borderRadius: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2 }} />
            </Grid>
          </Grid>
        </Paper>
        <Grid container spacing={3}>
          {[...Array(12)].map((_, index) => (
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
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, minHeight: '100vh' }}>
      <Fade in={pageLoaded} timeout={800}>
        <Box>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 3,
              }}
            >
              <MovieIcon sx={{ fontSize: 40 }} />
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
              Browse Movies
            </Typography>
            <Typography variant="h5" color="text.secondary">
              Discover your next favorite movie from our collection
            </Typography>
          </Box>

          {/* Search and Filters */}
          <Paper
            sx={{
              p: 4,
              mb: 4,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              borderRadius: 4,
            }}
          >
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
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderWidth: 2,
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.primary.main,
                      },
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
                  endIcon={<ArrowDownIcon sx={{ 
                    transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease'
                  }} />}
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
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Genre</InputLabel>
                      <Select
                        value={selectedGenre}
                        onChange={(e) => handleGenreChange(e.target.value)}
                        label="Genre"
                        startAdornment={<CategoryIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                      >
                        <MenuItem value="">
                          <em>All Genres</em>
                        </MenuItem>
                        {genres.map(genre => (
                          <MenuItem key={genre.name} value={genre.name}>
                            {genre.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Sort By</InputLabel>
                      <Select
                        value={sortBy}
                        onChange={(e) => handleSortChange(e.target.value)}
                        label="Sort By"
                        startAdornment={getSortIcon(sortBy)}
                      >
                        <MenuItem value="avg_rating">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StarIcon fontSize="small" />
                            Rating (High to Low)
                          </Box>
                        </MenuItem>
                        <MenuItem value="year">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarIcon fontSize="small" />
                            Year (New to Old)
                          </Box>
                        </MenuItem>
                        <MenuItem value="title">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TitleIcon fontSize="small" />
                            Title (A to Z)
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={clearFilters}
                      startIcon={<ClearIcon />}
                      disabled={!activeFiltersCount}
                      sx={{
                        py: 2,
                        borderRadius: 2,
                        borderWidth: 2,
                        '&:hover': { borderWidth: 2 },
                      }}
                    >
                      Clear All Filters
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Slide>
          </Paper>

          {/* Active Filters Display */}
          {(selectedGenre || searchQuery || sortBy !== 'avg_rating') && (
            <Zoom in timeout={400}>
              <Paper
                sx={{
                  p: 3,
                  mb: 4,
                  background: alpha(theme.palette.info.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  borderRadius: 3,
                }}
              >
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
                      icon={<CategoryIcon />}
                      label={`Genre: ${selectedGenre}`}
                      onDelete={() => handleGenreChange('')}
                      color="secondary"
                      variant="filled"
                      sx={{ borderRadius: 2 }}
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
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {movies.map((movie, index) => (
                  <Grid item xs={12} sm={6} md={3} key={movie.id}>
                    <Slide direction="up" in timeout={400 + index * 50}>
                      <div>
                        <MovieCard movie={movie} />
                      </div>
                    </Slide>
                  </Grid>
                ))}
              </Grid>

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
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  background: alpha(theme.palette.primary.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  borderRadius: 3,
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  Showing {movies.length} movies
                  {searchQuery && ` for "${searchQuery}"`}
                  {selectedGenre && ` in ${selectedGenre}`}
                  {!hasMore && !searchQuery && ' (All results shown)'}
                </Typography>
              </Paper>
            </>
          ) : !loading && (
            <Paper
              sx={{
                p: 8,
                textAlign: 'center',
                background: `linear-gradient(135deg, ${alpha(theme.palette.grey[500], 0.05)} 0%, ${alpha(theme.palette.grey[500], 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.grey[500], 0.1)}`,
                borderRadius: 4,
              }}
            >
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.grey[500], 0.15),
                  color: 'text.secondary',
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 3,
                }}
              >
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
                    : 'No movies available'
                }
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
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </Container>
  );
};

export default MoviesPage;