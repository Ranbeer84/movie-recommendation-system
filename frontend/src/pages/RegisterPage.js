import React, { useState, useContext } from 'react';
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
import { 
  Visibility, 
  VisibilityOff, 
  Email, 
  Lock, 
  Movie, 
  AutoAwesome,
  Person,
  LockOpen
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import authService from '../services/authService';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
        
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await authService.register(
        formData.username.trim(),
        formData.email.trim().toLowerCase(),
        formData.password
      );

      // Auto-login after successful registration
      login(response.user, response.access_token);
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
            
      if (error.response?.data?.message) {
        if (error.response.data.message.includes('already exists')) {
          setErrors({ email: 'An account with this email already exists' });
        } else if (error.response.data.errors) {
          // Handle validation errors from backend
          const backendErrors = {};
          error.response.data.errors.forEach(err => {
            if (err.includes('username')) backendErrors.username = err;
            else if (err.includes('email')) backendErrors.email = err;
            else backendErrors.general = err;
          });
          setErrors(backendErrors);
        } else {
          setErrors({ general: error.response.data.message });
        }
      } else {
        setErrors({ general: 'Registration failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
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
              Join CineRecommend
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              <AutoAwesome sx={{ fontSize: 16, color: '#d1d5db' }} />
              <Typography
                variant="body1"
                sx={{ color: '#d1d5db' }}
              >
                Create your account for personalized recommendations
              </Typography>
            </Box>
          </Box>

          {/* Error Alert */}
          {errors.general && (
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
              {errors.general}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            {/* Username Field */}
            <Box sx={{ mb: 3 }}>
              <TextField
                required
                fullWidth
                id="username"
                name="username"
                autoComplete="username"
                autoFocus
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                error={!!errors.username}
                helperText={errors.username}
                disabled={isLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#9ca3af', fontSize: 20 }} />
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
                    border: errors.username ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
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

            {/* Email Field */}
            <Box sx={{ mb: 3 }}>
              <TextField
                required
                fullWidth
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                disabled={isLoading}
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
                    border: errors.email ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
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
                autoComplete="new-password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                disabled={isLoading}
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
                    border: errors.password ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
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

            {/* Confirm Password Field */}
            <Box sx={{ mb: 3 }}>
              <TextField
                required
                fullWidth
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                autoComplete="new-password"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                disabled={isLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOpen sx={{ color: '#9ca3af', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        sx={{
                          color: '#9ca3af',
                          '&:hover': {
                            color: 'white',
                            backgroundColor: 'transparent',
                          },
                        }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                    border: errors.confirmPassword ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
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

            {/* Create Account Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{
                py: 2,
                px: 3,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                boxShadow: '0 10px 25px rgba(168, 85, 247, 0.3)',
                transition: 'all 0.2s ease',
                mb: 4,
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
              {isLoading ? (
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
                  Creating Account...
                </Box>
              ) : (
                'Create Account'
              )}
            </Button>
          </Box>

          {/* Login Link */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#d1d5db' }}>
              Already have an account?{' '}
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/login')}
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
                Sign In
              </Link>
            </Typography>
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

export default RegisterPage;