import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Navbar from './components/common/Navbar';
import LoadingSpinner from './components/common/LoadingSpinner';
import WaterWavesBackground from './components/common/WaterWavesBackground'; 

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MoviesPage from './pages/MoviesPage';
import MovieDetailsPage from './pages/MovieDetailsPage';
import RecommendationsPage from './pages/RecommendationsPage';
import ProfilePage from './pages/ProfilePage';
import MyRatingsPage from './pages/MyRatingsPage';

// Create Material-UI theme with transparent backgrounds to show the water waves
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: 'transparent', // Make default background transparent
      paper: 'rgba(19, 47, 76, 0.8)', // Semi-transparent paper background
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: 'rgba(19, 47, 76, 0.8)', // Semi-transparent cards
          backdropFilter: 'blur(10px)', // Add glassmorphism effect
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(19, 47, 76, 0.8)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/" />;
  }

  return children;
};

function AppContent() {
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      position: 'relative',
      overflow: 'hidden' // Prevent horizontal scroll from animations
    }}>
      {/* Water Waves Background - Fixed behind all content */}
      <Box sx={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: -1 
      }}>
        <WaterWavesBackground />
      </Box>
      
      {/* Main Content with transparent background */}
      <Box sx={{ 
        position: 'relative', 
        zIndex: 1,
        minHeight: '100vh',
        backgroundColor: 'transparent'
      }}>
        <Navbar />
        <Box component="main" sx={{ pt: 2 }}>
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              } 
            />

            {/* Protected Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/movies" 
              element={
                <ProtectedRoute>
                  <MoviesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/movies/:movieId" 
              element={
                <ProtectedRoute>
                  <MovieDetailsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/recommendations" 
              element={
                <ProtectedRoute>
                  <RecommendationsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-ratings" 
              element={
                <ProtectedRoute>
                  <MyRatingsPage />
                </ProtectedRoute>
              } 
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;