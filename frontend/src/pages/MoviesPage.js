import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
} from "@mui/material";
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
} from "@mui/icons-material";
import MovieCard from "../components/movies/MovieCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getMovies, getGenres, searchMovies } from "../services/movieService";

const MoviesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();

  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedGenre, setSelectedGenre] = useState(
    searchParams.get("genre") || ""
  );
  const [sortBy, setSortBy] = useState(
    searchParams.get("sort") || "avg_rating"
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  console.log("🎬 MoviesPage render - Current state:", {
    moviesLength: movies.length,
    loading,
    error,
    genresLength: genres.length,
    movies: movies.slice(0, 2),
  });

  // Genre icons mapping for modern look
  const getGenreIcon = (genreName) => {
    const iconMap = {
      Action: React.createElement(FlashOnIcon),
      Adventure: React.createElement(ExploreIcon),
      Animation: React.createElement(ChildCareIcon),
      Comedy: React.createElement(TheaterComedyIcon),
      Crime: React.createElement(MilitaryTechIcon),
      Documentary: React.createElement(SchoolIcon),
      Drama: React.createElement(AutoStoriesIcon),
      Family: React.createElement(FavoriteIcon),
      Fantasy: React.createElement(PsychologyIcon),
      History: React.createElement(HistoryIcon),
      Horror: React.createElement(MoodBadIcon),
      Music: React.createElement(PianoIcon),
      Mystery: React.createElement(ScienceIcon),
      Romance: React.createElement(FavoriteIcon),
      "Science Fiction": React.createElement(ScienceIcon),
      Thriller: React.createElement(WhatshotIcon),
      War: React.createElement(MilitaryTechIcon),
      Western: React.createElement(ElderlyIcon),
      Sport: React.createElement(SportsIcon),
      Biography: React.createElement(EmojiEventsIcon),
    };

    return iconMap[genreName] || React.createElement(CategoryIcon);
  };

  // Genre color mapping for modern chips
  const getGenreColor = (genreName) => {
    const colorMap = {
      Action: "#ff5722",
      Adventure: "#ff9800",
      Animation: "#e91e63",
      Comedy: "#ffeb3b",
      Crime: "#795548",
      Documentary: "#607d8b",
      Drama: "#9c27b0",
      Family: "#4caf50",
      Fantasy: "#673ab7",
      History: "#8bc34a",
      Horror: "#f44336",
      Music: "#3f51b5",
      Mystery: "#00bcd4",
      Romance: "#e91e63",
      "Science Fiction": "#2196f3",
      Thriller: "#ff5722",
      War: "#424242",
      Western: "#8d6e63",
      Sport: "#ff9800",
      Biography: "#009688",
    };

    return colorMap[genreName] || theme.palette.primary.main;
  };

  useEffect(() => {
    fetchGenres();
    setTimeout(() => setPageLoaded(true), 300);
  }, []);

  useEffect(() => {
    fetchMovies(true, 0);
  }, [selectedGenre, sortBy, searchQuery]);

  const fetchGenres = async () => {
    try {
      console.log("📞 Fetching genres...");
      const data = await getGenres();
      console.log("📊 Genres API Response:", data);

      if (Array.isArray(data)) {
        console.log("✅ Genres is array:", data);
        setGenres(data);
      } else if (data && Array.isArray(data.genres)) {
        console.log("✅ Genres in data.genres:", data.genres);
        setGenres(data.genres);
      } else if (data && data.data && Array.isArray(data.data)) {
        console.log("✅ Genres in data.data:", data.data);
        setGenres(data.data);
      } else {
        console.error("❌ Unexpected genres response format:", data);
        setGenres([]);
      }
    } catch (error) {
      console.error("💥 Error fetching genres:", error);
      setGenres([]);
    }
  };

  const fetchMovies = async (reset = false, retryCount = 0) => {
    if (!reset && !hasMore) return;

    console.log(
      "🚀 fetchMovies called with reset:",
      reset,
      "retry:",
      retryCount
    );

    setLoading(true);
    setError(null);

    // Minimum loading time for smooth UX
    const startTime = Date.now();
    const minLoadingTime = 800;

    try {
      let data;
      const currentPage = reset ? 1 : page;

      if (searchQuery.trim()) {
        console.log("📞 Calling searchMovies API...");
        data = await searchMovies(searchQuery, 20);
      } else {
        console.log("📞 Calling getMovies API with params:", {
          page: currentPage,
          limit: 20,
          genre: selectedGenre,
          sortBy,
        });
        data = await getMovies(currentPage, 20, selectedGenre, sortBy);
      }

      console.log("📊 Raw API Response:", data);

      if (data && data.movies && Array.isArray(data.movies)) {
        console.log("📊 Movies array:", data.movies);
        console.log("📊 Movies array length:", data.movies.length);

        setHasMore(data.movies.length === 20);

        if (reset) {
          console.log("🔄 Setting movies (reset):", data.movies);
          setMovies(data.movies);
          setPage(2);
        } else {
          console.log("➕ Adding movies to existing:", data.movies);
          setMovies((prev) => {
            const newMovies = [...prev, ...data.movies];
            console.log("➕ New total movies:", newMovies.length);
            return newMovies;
          });
          setPage((prev) => prev + 1);
        }

        // Ensure minimum loading time for smooth UX
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < minLoadingTime) {
          await new Promise((resolve) =>
            setTimeout(resolve, minLoadingTime - elapsedTime)
          );
        }

        // Success! Set loading to false
        console.log("✅ fetchMovies completed successfully");
        setLoading(false);
      } else {
        console.error("❌ Invalid API response structure:", data);
        throw new Error("Invalid data format from server");
      }
    } catch (error) {
      console.error("💥 fetchMovies error:", error);

      // Auto-retry up to 3 times with exponential backoff
      if (retryCount < 3) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        console.log(
          `🔄 Retrying in ${retryDelay}ms... (Attempt ${retryCount + 1}/3)`
        );

        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return fetchMovies(reset, retryCount + 1);
      }

      // After 3 retries, show error
      console.error("❌ All retry attempts failed");
      setError(
        "Unable to load movies. Please check your connection and try again."
      );

      if (reset) {
        setMovies([]);
      }

      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim() === searchParams.get("q")) return;

    setIsSearching(true);
    updateURLParams({ q: searchQuery.trim(), genre: "", page: 1 });
    setSelectedGenre("");
    await fetchMovies(true);
    setIsSearching(false);
  };

  const handleGenreChange = (genre) => {
    if (genre === selectedGenre) return;

    setSelectedGenre(genre);
    setSearchQuery("");
    updateURLParams({ genre, q: "", page: 1 });
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
    setSearchQuery("");
    setSelectedGenre("");
    setSortBy("avg_rating");
    setSearchParams({});
  };

  const loadMore = () => {
    fetchMovies(false);
  };

  const getSortIcon = (sortType) => {
    switch (sortType) {
      case "avg_rating":
        return React.createElement(StarIcon);
      case "year":
        return React.createElement(CalendarIcon);
      case "title":
        return React.createElement(TitleIcon);
      default:
        return React.createElement(SortIcon);
    }
  };

  const getSortLabel = (sortType) => {
    switch (sortType) {
      case "avg_rating":
        return "Rating";
      case "year":
        return "Year";
      case "title":
        return "Title";
      default:
        return "Rating";
    }
  };

  const activeFiltersCount = [
    searchQuery,
    selectedGenre,
    sortBy !== "avg_rating" ? sortBy : "",
  ].filter(Boolean).length;

  if (loading && movies.length === 0) {
    return React.createElement(
      Container,
      { maxWidth: "xl", sx: { py: 4, minHeight: "100vh" } },
      React.createElement(Skeleton, {
        variant: "text",
        width: "300px",
        height: 80,
        sx: { mb: 2, mx: "auto" },
      }),
      React.createElement(Skeleton, {
        variant: "text",
        width: "200px",
        height: 40,
        sx: { mb: 4, mx: "auto" },
      }),
      React.createElement(
        Paper,
        { sx: { p: 4, mb: 4, borderRadius: 4 } },
        React.createElement(Skeleton, {
          variant: "rectangular",
          height: 60,
          sx: { mb: 3, borderRadius: 2 },
        })
      ),

      React.createElement(
        Box,
        {
          sx: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 3,
            justifyItems: "center",
            mb: 4,
          },
        },
        [...Array(12)].map((_, index) =>
          React.createElement(
            Box,
            { key: index, sx: { width: 280, height: 520 } },
            React.createElement(Skeleton, {
              variant: "rectangular",
              height: 320,
              sx: { borderRadius: "20px 20px 0 0" },
            }),
            React.createElement(
              Box,
              {
                sx: {
                  p: 2,
                  bgcolor: "background.paper",
                  borderRadius: "0 0 20px 20px",
                },
              },
              React.createElement(Skeleton, { variant: "text", height: 30 }),
              React.createElement(Skeleton, { variant: "text", height: 20 }),
              React.createElement(Skeleton, { variant: "text", height: 20 })
            )
          )
        )
      )
    );
  }

  return React.createElement(
    Container,
    { maxWidth: "xl", sx: { py: 4, minHeight: "100vh" } },
    React.createElement(
      Fade,
      { in: pageLoaded, timeout: 800 },
      React.createElement(
        Box,
        null,
        // Header
        React.createElement(
          Box,
          { sx: { textAlign: "center", mb: 6 } },
          React.createElement(
            Typography,
            {
              variant: "h2",
              sx: {
                fontWeight: "bold",
                mb: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              },
            },
            "Browse Movies"
          ),
          React.createElement(
            Typography,
            { variant: "h5", color: "text.secondary" },
            "Discover your next favorite movie from our collection"
          )
        ),

        // Search and Filters
        React.createElement(
          Paper,
          {
            sx: {
              p: 4,
              mb: 4,
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.02
              )} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              borderRadius: 4,
            },
          },
          // Search Bar
          React.createElement(
            Box,
            { component: "form", onSubmit: handleSearch, sx: { mb: 4 } },
            React.createElement(TextField, {
              fullWidth: true,
              variant: "outlined",
              placeholder: "Search movies by title...",
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              InputProps: {
                startAdornment: React.createElement(
                  InputAdornment,
                  { position: "start" },
                  React.createElement(SearchIcon, { color: "primary" })
                ),
                endAdornment: React.createElement(
                  InputAdornment,
                  { position: "end" },
                  React.createElement(
                    Button,
                    {
                      type: "submit",
                      variant: "contained",
                      disabled: isSearching,
                      sx: {
                        minWidth: "auto",
                        px: 3,
                        py: 1,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      },
                    },
                    isSearching
                      ? React.createElement(RefreshIcon, { className: "spin" })
                      : React.createElement(SearchIcon)
                  )
                ),
                sx: {
                  borderRadius: 3,
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderWidth: 2,
                    },
                    "&:hover fieldset": {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                },
              },
              sx: { "& .MuiInputBase-input": { py: 2 } },
            })
          ),

          // Filter Toggle Button
          React.createElement(
            Box,
            { sx: { display: "flex", justifyContent: "center", mb: 3 } },
            React.createElement(
              Badge,
              { badgeContent: activeFiltersCount, color: "primary" },
              React.createElement(
                Button,
                {
                  variant: "outlined",
                  onClick: () => setShowFilters(!showFilters),
                  startIcon: React.createElement(TuneIcon),
                  endIcon: React.createElement(ArrowDownIcon, {
                    sx: {
                      transform: showFilters
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.3s ease",
                    },
                  }),
                  sx: {
                    borderRadius: 3,
                    px: 3,
                    py: 1.5,
                    borderWidth: 2,
                    "&:hover": { borderWidth: 2 },
                  },
                },
                "Filters & Sorting"
              )
            )
          ),

          // Filters Section
          React.createElement(
            Slide,
            {
              direction: "down",
              in: showFilters,
              mountOnEnter: true,
              unmountOnExit: true,
            },
            React.createElement(
              Box,
              null,
              React.createElement(Divider, { sx: { mb: 4 } }),

              // Modern Genre Selection
              React.createElement(
                Box,
                { sx: { mb: 4 } },
                React.createElement(
                  Typography,
                  {
                    variant: "h6",
                    sx: {
                      mb: 3,
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    },
                  },
                  React.createElement(CategoryIcon, { color: "primary" }),
                  "Choose Genre"
                ),

                // All Genres Button
                React.createElement(
                  Box,
                  { sx: { mb: 3 } },
                  React.createElement(Chip, {
                    icon:
                      selectedGenre === ""
                        ? React.createElement(CheckCircleIcon)
                        : React.createElement(LocalMoviesIcon),
                    label: "All Genres",
                    onClick: () => handleGenreChange(""),
                    variant: selectedGenre === "" ? "filled" : "outlined",
                    sx: {
                      px: 2,
                      py: 3,
                      fontSize: "1rem",
                      fontWeight: selectedGenre === "" ? "bold" : "medium",
                      height: "auto",
                      borderRadius: 4,
                      border:
                        selectedGenre === ""
                          ? "none"
                          : `2px solid ${alpha(
                              theme.palette.primary.main,
                              0.3
                            )}`,
                      background:
                        selectedGenre === ""
                          ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                          : alpha(theme.palette.primary.main, 0.05),
                      color:
                        selectedGenre === ""
                          ? "white"
                          : theme.palette.primary.main,
                      "&:hover": {
                        background:
                          selectedGenre === ""
                            ? `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
                            : alpha(theme.palette.primary.main, 0.1),
                        transform: "translateY(-2px)",
                        boxShadow: theme.shadows[4],
                      },
                      transition: "all 0.3s ease",
                    },
                  })
                ),

                // Genre Grid
                React.createElement(
                  Box,
                  {
                    sx: {
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: 2,
                      maxHeight: "300px",
                      overflowY: "auto",
                      pr: 1,
                      "&::-webkit-scrollbar": {
                        width: "8px",
                      },
                      "&::-webkit-scrollbar-track": {
                        background: alpha(theme.palette.grey[300], 0.3),
                        borderRadius: "10px",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        background: alpha(theme.palette.primary.main, 0.5),
                        borderRadius: "10px",
                        "&:hover": {
                          background: alpha(theme.palette.primary.main, 0.7),
                        },
                      },
                    },
                  },
                  genres &&
                    genres.length > 0 &&
                    genres.map((genre, index) => {
                      const genreName = genre.name || genre;
                      const isSelected = selectedGenre === genreName;
                      const genreColor = getGenreColor(genreName);

                      return React.createElement(
                        Zoom,
                        { key: genreName, in: true, timeout: 200 + index * 50 },
                        React.createElement(Chip, {
                          icon: isSelected
                            ? React.createElement(CheckCircleIcon)
                            : getGenreIcon(genreName),
                          label: genreName,
                          onClick: () => handleGenreChange(genreName),
                          variant: isSelected ? "filled" : "outlined",
                          sx: {
                            px: 2,
                            py: 2.5,
                            fontSize: "0.9rem",
                            fontWeight: isSelected ? "bold" : "medium",
                            height: "auto",
                            borderRadius: 3,
                            border: isSelected
                              ? "none"
                              : `2px solid ${alpha(genreColor, 0.3)}`,
                            background: isSelected
                              ? `linear-gradient(135deg, ${genreColor}, ${alpha(
                                  genreColor,
                                  0.8
                                )})`
                              : alpha(genreColor, 0.08),
                            color: isSelected ? "white" : genreColor,
                            "&:hover": {
                              background: isSelected
                                ? `linear-gradient(135deg, ${alpha(
                                    genreColor,
                                    0.9
                                  )}, ${genreColor})`
                                : alpha(genreColor, 0.15),
                              transform: "translateY(-2px)",
                              boxShadow: `0 6px 20px ${alpha(genreColor, 0.3)}`,
                              borderColor: alpha(genreColor, 0.6),
                            },
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            cursor: "pointer",
                            "& .MuiChip-icon": {
                              color: "inherit",
                              fontSize: "1.2rem",
                            },
                            "& .MuiChip-label": {
                              paddingLeft: 1,
                              paddingRight: 1,
                            },
                          },
                        })
                      );
                    })
                )
              ),

              // Sort and Clear Section
              React.createElement(
                Box,
                {
                  sx: {
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
                    gap: 3,
                    alignItems: "center",
                  },
                },
                React.createElement(
                  FormControl,
                  { fullWidth: true },
                  React.createElement(InputLabel, null, "Sort By"),
                  React.createElement(
                    Select,
                    {
                      value: sortBy,
                      onChange: (e) => handleSortChange(e.target.value),
                      label: "Sort By",
                      startAdornment: getSortIcon(sortBy),
                      sx: {
                        borderRadius: 2,
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": {
                            borderWidth: 2,
                          },
                        },
                      },
                    },
                    React.createElement(
                      MenuItem,
                      { value: "avg_rating" },
                      React.createElement(
                        Box,
                        {
                          sx: { display: "flex", alignItems: "center", gap: 1 },
                        },
                        React.createElement(StarIcon, { fontSize: "small" }),
                        "Rating (High to Low)"
                      )
                    ),
                    React.createElement(
                      MenuItem,
                      { value: "year" },
                      React.createElement(
                        Box,
                        {
                          sx: { display: "flex", alignItems: "center", gap: 1 },
                        },
                        React.createElement(CalendarIcon, {
                          fontSize: "small",
                        }),
                        "Year (New to Old)"
                      )
                    ),
                    React.createElement(
                      MenuItem,
                      { value: "title" },
                      React.createElement(
                        Box,
                        {
                          sx: { display: "flex", alignItems: "center", gap: 1 },
                        },
                        React.createElement(TitleIcon, { fontSize: "small" }),
                        "Title (A to Z)"
                      )
                    )
                  )
                ),

                React.createElement(
                  Button,
                  {
                    fullWidth: true,
                    variant: "outlined",
                    color: "error",
                    onClick: clearFilters,
                    startIcon: React.createElement(ClearIcon),
                    disabled: !activeFiltersCount,
                    sx: {
                      py: 2,
                      borderRadius: 3,
                      borderWidth: 2,
                      "&:hover": {
                        borderWidth: 2,
                        transform: "translateY(-2px)",
                        boxShadow: theme.shadows[4],
                      },
                      transition: "all 0.3s ease",
                    },
                  },
                  "Clear All Filters"
                )
              )
            )
          )
        ),

        // Active Filters Display
        (selectedGenre || searchQuery || sortBy !== "avg_rating") &&
          React.createElement(
            Zoom,
            { in: true, timeout: 400 },
            React.createElement(
              Paper,
              {
                sx: {
                  p: 3,
                  mb: 4,
                  background: alpha(theme.palette.info.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  borderRadius: 3,
                },
              },
              React.createElement(
                Stack,
                {
                  direction: "row",
                  spacing: 2,
                  alignItems: "center",
                  flexWrap: "wrap",
                },
                React.createElement(
                  Typography,
                  {
                    variant: "body1",
                    sx: { fontWeight: "bold", color: "text.primary" },
                  },
                  "Active Filters:"
                ),
                searchQuery &&
                  React.createElement(Chip, {
                    icon: React.createElement(SearchIcon),
                    label: `Search: "${searchQuery}"`,
                    onDelete: () => {
                      setSearchQuery("");
                      updateURLParams({ q: "" });
                    },
                    color: "primary",
                    variant: "filled",
                    sx: { borderRadius: 2 },
                  }),
                selectedGenre &&
                  React.createElement(Chip, {
                    icon: getGenreIcon(selectedGenre),
                    label: `Genre: ${selectedGenre}`,
                    onDelete: () => handleGenreChange(""),
                    variant: "filled",
                    sx: {
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${getGenreColor(
                        selectedGenre
                      )}, ${alpha(getGenreColor(selectedGenre), 0.8)})`,
                      color: "white",
                    },
                  }),
                sortBy !== "avg_rating" &&
                  React.createElement(Chip, {
                    icon: getSortIcon(sortBy),
                    label: `Sort: ${getSortLabel(sortBy)}`,
                    onDelete: () => handleSortChange("avg_rating"),
                    color: "info",
                    variant: "filled",
                    sx: { borderRadius: 2 },
                  })
              )
            )
          ),

        // Error Message
        error &&
          React.createElement(
            Alert,
            {
              severity: "error",
              sx: { mb: 4, borderRadius: 3 },
              action: React.createElement(
                Button,
                { color: "inherit", onClick: () => fetchMovies(true) },
                React.createElement(RefreshIcon, { sx: { mr: 1 } }),
                "Try Again"
              ),
            },
            error
          ),

        // Movies Grid
        movies.length > 0
          ? React.createElement(
              React.Fragment,
              null,
              React.createElement(
                Box,
                {
                  sx: {
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: { xs: 2, sm: 3, md: 4 },
                    justifyItems: "center",
                    mb: 4,
                    "& > *": {
                      maxWidth: "280px",
                      width: "100%",
                    },
                  },
                },
                movies.map((movie, index) =>
                  React.createElement(
                    Slide,
                    {
                      key: movie.id,
                      direction: "up",
                      in: true,
                      timeout: 400 + index * 50,
                      style: { width: "100%" },
                    },
                    React.createElement(
                      Box,
                      { sx: { width: "100%", maxWidth: "280px" } },
                      React.createElement(MovieCard, { movie: movie })
                    )
                  )
                )
              ),

              // Load More Button
              hasMore &&
                !searchQuery &&
                React.createElement(
                  Box,
                  { sx: { textAlign: "center", mb: 4 } },
                  React.createElement(
                    Button,
                    {
                      variant: "contained",
                      size: "large",
                      onClick: loadMore,
                      disabled: loading,
                      startIcon: loading
                        ? React.createElement(RefreshIcon, {
                            className: "spin",
                          })
                        : React.createElement(ViewIcon),
                      sx: {
                        borderRadius: 3,
                        px: 4,
                        py: 1.5,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        "&:hover": {
                          background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                          transform: "translateY(-2px)",
                          boxShadow: theme.shadows[8],
                        },
                      },
                    },
                    loading ? "Loading..." : "Load More Movies"
                  )
                ),

              // Results Summary
              React.createElement(
                Paper,
                {
                  sx: {
                    p: 2,
                    textAlign: "center",
                    background: alpha(theme.palette.primary.main, 0.1),
                    border: `1px solid ${alpha(
                      theme.palette.primary.main,
                      0.2
                    )}`,
                    borderRadius: 3,
                  },
                },
                React.createElement(
                  Typography,
                  { variant: "body1", color: "text.secondary" },
                  `Showing ${movies.length} movies${
                    searchQuery ? ` for "${searchQuery}"` : ""
                  }${selectedGenre ? ` in ${selectedGenre}` : ""}${
                    !hasMore && !searchQuery ? " (All results shown)" : ""
                  }`
                )
              )
            )
          : !loading &&
              React.createElement(
                Paper,
                {
                  sx: {
                    p: 8,
                    textAlign: "center",
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.grey[500],
                      0.05
                    )} 0%, ${alpha(theme.palette.grey[500], 0.02)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.grey[500], 0.1)}`,
                    borderRadius: 4,
                  },
                },
                React.createElement(
                  Avatar,
                  {
                    sx: {
                      bgcolor: alpha(theme.palette.grey[500], 0.15),
                      color: "text.secondary",
                      width: 80,
                      height: 80,
                      mx: "auto",
                      mb: 3,
                    },
                  },
                  React.createElement(MovieIcon, { sx: { fontSize: 40 } })
                ),
                React.createElement(
                  Typography,
                  {
                    variant: "h4",
                    gutterBottom: true,
                    sx: { fontWeight: "bold" },
                  },
                  "No movies found"
                ),
                React.createElement(
                  Typography,
                  { variant: "body1", color: "text.secondary", sx: { mb: 4 } },
                  searchQuery
                    ? `No movies match your search for "${searchQuery}"`
                    : selectedGenre
                    ? `No ${selectedGenre} movies found`
                    : "No movies available"
                ),
                (searchQuery || selectedGenre || sortBy !== "avg_rating") &&
                  React.createElement(
                    Button,
                    {
                      variant: "contained",
                      onClick: clearFilters,
                      startIcon: React.createElement(ClearIcon),
                      sx: {
                        borderRadius: 3,
                        px: 4,
                        py: 1.5,
                      },
                    },
                    "Clear All Filters"
                  )
              )
      )
    ),

    // CSS for spinner animation
    React.createElement("style", {
      dangerouslySetInnerHTML: {
        __html: `
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .spin {
              animation: spin 1s linear infinite;
            }
          `,
      },
    })
  );
};

export default MoviesPage;
