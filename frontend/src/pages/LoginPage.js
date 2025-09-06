import React, { useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Movie, AutoAwesome } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigate('/');
    }
  };

  const fillDemoCredentials = () => {
    setFormData({
      email: 'alice@demo.com',
      password: 'demo123',
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #7c3aed 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
        position: 'relative',
        overflow: 'hidden',
        // Animated background elements
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-160px',
          right: '-160px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'rgba(168, 85, 247, 0.2)',
          filter: 'blur(48px)',
          animation: 'pulse 2s ease-in-out infinite',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-160px',
          left: '-160px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'rgba(59, 130, 246, 0.2)',
          filter: 'blur(48px)',
          animation: 'pulse 2s ease-in-out infinite 1s',
        },
        '@keyframes pulse': {
          '0%, 100%': { opacity: 0.4, transform: 'scale(1)' },
          '50%': { opacity: 0.6, transform: 'scale(1.1)' },
        },
      }}
    >
      {/* Additional floating element */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '384px',
          height: '384px',
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.1)',
          filter: 'blur(48px)',
          animation: 'pulse 2s ease-in-out infinite 0.5s',
          zIndex: 0,
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            width: '100%',
            maxWidth: '28rem',
            margin: '0 auto',
            // Glassmorphism card
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '1.5rem',
            padding: 4,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative',
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                borderRadius: '1rem',
                mb: 2,
                boxShadow: '0 10px 25px rgba(168, 85, 247, 0.3)',
              }}
            >
              <Movie sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                color: 'white',
                mb: 1,
              }}
            >
              Welcome Back
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              <AutoAwesome sx={{ fontSize: 16, color: '#d1d5db' }} />
              <Typography
                variant="body1"
                sx={{ color: '#d1d5db' }}
              >
                Sign in for personalized recommendations
              </Typography>
            </Box>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '0.75rem',
                backdropFilter: 'blur(8px)',
                '& .MuiAlert-message': {
                  color: '#fca5a5',
                  fontSize: '0.875rem',
                },
                '& .MuiAlert-icon': {
                  color: '#f87171',
                },
              }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            {/* Email Field */}
            <Box sx={{ mb: 3 }}>
              <TextField
                required
                fullWidth
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#9ca3af', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    paddingLeft: '3rem',
                    paddingRight: '1rem',
                    paddingTop: '1rem',
                    paddingBottom: '1rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: formErrors.email ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.75rem',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.2s ease',
                    '& fieldset': {
                      border: 'none',
                    },
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.15)',
                    },
                    '&.Mui-focused': {
                      background: 'rgba(255, 255, 255, 0.15)',
                      boxShadow: '0 0 0 2px rgba(168, 85, 247, 0.5)',
                    },
                    '& input': {
                      color: 'white',
                      '&::placeholder': {
                        color: '#9ca3af',
                        opacity: 1,
                      },
                    },
                  },
                  '& .MuiFormHelperText-root': {
                    color: '#f87171',
                    fontSize: '0.875rem',
                    marginLeft: '0.25rem',
                  },
                }}
              />
            </Box>

            {/* Password Field */}
            <Box sx={{ mb: 3 }}>
              <TextField
                required
                fullWidth
                name="password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                error={!!formErrors.password}
                helperText={formErrors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#9ca3af', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{
                          color: '#9ca3af',
                          '&:hover': {
                            color: 'white',
                            backgroundColor: 'transparent',
                          },
                        }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    paddingLeft: '3rem',
                    paddingRight: '3rem',
                    paddingTop: '1rem',
                    paddingBottom: '1rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: formErrors.password ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.75rem',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.2s ease',
                    '& fieldset': {
                      border: 'none',
                    },
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.15)',
                    },
                    '&.Mui-focused': {
                      background: 'rgba(255, 255, 255, 0.15)',
                      boxShadow: '0 0 0 2px rgba(168, 85, 247, 0.5)',
                    },
                    '& input': {
                      color: 'white',
                      '&::placeholder': {
                        color: '#9ca3af',
                        opacity: 1,
                      },
                    },
                  },
                  '& .MuiFormHelperText-root': {
                    color: '#f87171',
                    fontSize: '0.875rem',
                    marginLeft: '0.25rem',
                  },
                }}
              />
            </Box>

            {/* Sign In Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 2,
                px: 3,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                boxShadow: '0 10px 25px rgba(168, 85, 247, 0.3)',
                transition: 'all 0.2s ease',
                mb: 3,
                '&:hover': {
                  background: 'linear-gradient(135deg, #9333ea 0%, #db2777 100%)',
                  boxShadow: '0 20px 40px rgba(168, 85, 247, 0.4)',
                  transform: 'scale(1.02)',
                },
                '&:disabled': {
                  opacity: 0.5,
                  transform: 'none',
                },
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress 
                    size={20} 
                    sx={{ 
                      color: 'white',
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round',
                      },
                    }} 
                  />
                  Signing in...
                </Box>
              ) : (
                'Sign In'
              )}
            </Button>

            {/* Demo Button */}
            <Button
              fullWidth
              variant="outlined"
              onClick={fillDemoCredentials}
              disabled={loading}
              sx={{
                py: 2,
                px: 3,
                fontWeight: 500,
                borderRadius: '0.75rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s ease',
                mb: 4,
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                },
                '&:disabled': {
                  opacity: 0.5,
                },
              }}
            >
              Try Demo Account
            </Button>
          </Box>

          {/* Register Link */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="body2" sx={{ color: '#d1d5db' }}>
              Don't have an account?{' '}
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/register')}
                sx={{
                  color: '#c084fc',
                  fontWeight: 500,
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px',
                  transition: 'color 0.2s ease',
                  '&:hover': {
                    color: '#d8b4fe',
                  },
                }}
              >
                Sign up here
              </Link>
            </Typography>
          </Box>

          {/* Demo Info */}
          <Box
            sx={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0.75rem',
              p: 2,
              backdropFilter: 'blur(8px)',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: 'white',
                fontWeight: 500,
                textAlign: 'center',
                mb: 1,
              }}
            >
              Demo Accounts
            </Typography>
            <Box sx={{ textAlign: 'center', color: '#d1d5db', fontSize: '0.875rem' }}>
              <Box>alice@demo.com / demo123</Box>
              <Box>bob@demo.com / demo123</Box>
              <Box>charlie@demo.com / demo123</Box>
            </Box>
          </Box>

          {/* Decorative elements */}
          <Box
            sx={{
              position: 'absolute',
              top: '-1rem',
              left: '-1rem',
              width: '6rem',
              height: '6rem',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
              borderRadius: '50%',
              filter: 'blur(24px)',
              zIndex: -1,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: '-1rem',
              right: '-1rem',
              width: '8rem',
              height: '8rem',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
              borderRadius: '50%',
              filter: 'blur(24px)',
              zIndex: -1,
            }}
          />
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;