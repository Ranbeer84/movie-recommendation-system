import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Badge,
  Divider,
} from '@mui/material';
import {
  Movie as MovieIcon,
  Recommend as RecommendIcon,
  Person as PersonIcon,
  Star as StarIcon,
  Menu as MenuIcon,
  Home as HomeIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Helper function to get display name and initials
  const getDisplayName = () => {
    if (!user?.username || !user.username.trim()) {
      return 'Guest User';
    }
    return user.username.trim();
  };

  const getInitials = () => {
    const displayName = getDisplayName();
    if (displayName === 'Guest User') {
      return 'GU';
    }
    
    const words = displayName.split(' ').filter(word => word.length > 0);
    if (words.length >= 2) {
      return words[0].charAt(0).toUpperCase() + words[1].charAt(0).toUpperCase();
    } else if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return 'U';
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/login');
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navigationItems = [
    { label: 'Home', path: '/', icon: <HomeIcon /> },
    { label: 'Movies', path: '/movies', icon: <MovieIcon /> },
    { label: 'Recommendations', path: '/recommendations', icon: <RecommendIcon /> },
    { label: 'My Ratings', path: '/my-ratings', icon: <StarIcon /> },
  ];

  const drawer = (
    <Box 
      onClick={handleDrawerToggle} 
      sx={{ 
        width: 300,
        height: '100%',
        background: 'linear-gradient(145deg, #0f0f23 0%, #1a1a2e 30%, #16213e 70%, #0f3460 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 20%, rgba(255,107,107,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(102,126,234,0.15) 0%, transparent 50%)',
          pointerEvents: 'none'
        }
      }}
    >
      {/* Enhanced Mobile Header */}
      <Box sx={{ 
        p: 3, 
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        zIndex: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ffd93d 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 8px 32px rgba(255,107,107,0.3)',
            animation: 'pulse 2s infinite'
          }}>
            🎬
          </Box>
          <Box>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 800,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px'
              }}
            >
              MovieRec
            </Typography>
            <Typography variant="caption" sx={{ 
              opacity: 0.7, 
              fontWeight: 500,
              color: '#a0a0ff'
            }}>
              Discover • Rate • Enjoy
            </Typography>
          </Box>
        </Box>
      </Box>

      <List sx={{ px: 3, py: 3 }}>
        {navigationItems.map((item, index) => (
          <ListItem
            key={item.label}
            button
            onClick={() => navigate(item.path)}
            selected={location.pathname === item.path}
            sx={{
              borderRadius: 3,
              mb: 1.5,
              transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              position: 'relative',
              overflow: 'hidden',
              bgcolor: location.pathname === item.path ? 'rgba(102,126,234,0.15)' : 'transparent',
              border: location.pathname === item.path ? '1px solid rgba(102,126,234,0.3)' : '1px solid transparent',
              py: 1.5,
              animation: `slideInLeft 0.6s ease-out ${index * 0.1}s both`,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: location.pathname === item.path ? 0 : '-100%',
                width: '4px',
                height: '100%',
                background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
                transition: 'left 0.3s ease',
                borderRadius: '0 2px 2px 0'
              },
              '&:hover': {
                bgcolor: 'rgba(102,126,234,0.1)',
                transform: 'translateX(8px) scale(1.02)',
                border: '1px solid rgba(102,126,234,0.4)',
                boxShadow: '0 8px 32px rgba(102,126,234,0.2)',
                '&::before': {
                  left: 0
                }
              },
            }}
          >
            <ListItemIcon 
              sx={{ 
                color: location.pathname === item.path ? '#667eea' : 'rgba(255,255,255,0.7)',
                minWidth: 48,
                transition: 'all 0.3s ease',
                '& svg': {
                  fontSize: '22px',
                  filter: location.pathname === item.path ? 'drop-shadow(0 0 8px rgba(102,126,234,0.5))' : 'none'
                }
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              sx={{
                '& .MuiTypography-root': {
                  fontWeight: location.pathname === item.path ? 700 : 500,
                  color: location.pathname === item.path ? '#fff' : 'rgba(255,255,255,0.9)',
                  fontSize: '0.95rem',
                  letterSpacing: '0.25px'
                }
              }}
            />
            {location.pathname === item.path && (
              <Box sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 0 12px rgba(102,126,234,0.6)',
                animation: 'glow 2s ease-in-out infinite alternate'
              }} />
            )}
          </ListItem>
        ))}
      </List>

      {/* Add keyframe animations */}
      <style jsx>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes glow {
          from { box-shadow: 0 0 12px rgba(102,126,234,0.6); }
          to { box-shadow: 0 0 20px rgba(102,126,234,0.9), 0 0 30px rgba(102,126,234,0.4); }
        }
      `}</style>
    </Box>
  );

  if (!isAuthenticated) {
    return (
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
            animation: 'shimmer 3s ease-in-out infinite'
          }
        }}
      >
        <Toolbar sx={{ minHeight: 80 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <Box sx={{
              width: 56,
              height: 56,
              borderRadius: '18px',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              🎬
            </Box>
            <Typography
              variant="h4"
              component="div"
              sx={{ 
                fontWeight: 800,
                color: 'white',
                letterSpacing: '-1px',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              Movie Recommendations
            </Typography>
          </Box>
        </Toolbar>
        
        <style jsx>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </AppBar>
    );
  }

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background:
            "linear-gradient(135deg, rgba(15,15,35,0.85) 0%, rgba(26,26,46,0.85) 50%, rgba(22,33,62,0.85) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          // borderBottom: "1px solid rgba(255,255,255,0.08)",
          // boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          borderBottom: "none",
          boxShadow: "none",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(102,126,234,0.5) 50%, transparent 100%)",
          },
        }}
      >
        <Toolbar sx={{ minHeight: 80, px: { xs: 2, md: 4 } }}>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{
                mr: 2,
                width: 48,
                height: 48,
                background:
                  "linear-gradient(135deg, rgba(102,126,234,0.2) 0%, rgba(118,75,162,0.2) 100%)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(102,126,234,0.3)",
                borderRadius: 3,
                color: "#667eea",
                transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, rgba(102,126,234,0.3) 0%, rgba(118,75,162,0.3) 100%)",
                  transform: "scale(1.05) rotate(180deg)",
                  boxShadow: "0 8px 25px rgba(102,126,234,0.4)",
                  border: "1px solid rgba(102,126,234,0.5)",
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Enhanced Logo */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              cursor: "pointer",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "scale(1.02)",
              },
            }}
            onClick={() => navigate("/")}
          >
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: "16px",
                background:
                  "linear-gradient(135deg, #ff6b6b 0%, #ffd93d 50%, #ff8a80 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                boxShadow:
                  "0 8px 32px rgba(255,107,107,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.15)",
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: "-50%",
                  left: "-50%",
                  width: "200%",
                  height: "200%",
                  background:
                    "linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
                  transform: "rotate(45deg)",
                  animation: "shine 3s ease-in-out infinite",
                },
              }}
            >
              🎬
            </Box>
            <Typography
              variant="h5"
              component="div"
              sx={{
                fontWeight: 800,
                background:
                  "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.5px",
                fontSize: { xs: "1.5rem", md: "1.75rem" },
                textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                display: isMobile ? "none" : "block",
              }}
            >
              MovieRec
            </Typography>
          </Box>

          {!isMobile && (
            <Box
              sx={{
                flexGrow: 1,
                ml: 6,
                display: "flex",
                gap: 1,
                alignItems: "center",
              }}
            >
              {navigationItems.map((item, index) => (
                <Button
                  key={item.label}
                  startIcon={item.icon}
                  onClick={() => navigate(item.path)}
                  variant={
                    location.pathname === item.path ? "contained" : "text"
                  }
                  sx={{
                    borderRadius: 4,
                    px: 3,
                    py: 1.5,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    position: "relative",
                    overflow: "hidden",
                    transition: "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                    animation: `slideDown 0.6s ease-out ${index * 0.1}s both`,
                    ...(location.pathname === item.path
                      ? {
                          background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          boxShadow:
                            "0 8px 32px rgba(102,126,234,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                          color: "white",
                          border: "1px solid rgba(255,255,255,0.15)",
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background:
                              "linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
                            transform: "translateX(-100%)",
                            transition: "transform 0.6s ease",
                          },
                          "&:hover": {
                            background:
                              "linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)",
                            transform: "translateY(-3px) scale(1.02)",
                            boxShadow: "0 12px 40px rgba(102,126,234,0.5)",
                            "&::before": {
                              transform: "translateX(100%)",
                            },
                          },
                        }
                      : {
                          color: "rgba(255,255,255,0.9)",
                          bgcolor: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.05)",
                          "&:hover": {
                            bgcolor: "rgba(102,126,234,0.15)",
                            transform: "translateY(-2px)",
                            border: "1px solid rgba(102,126,234,0.3)",
                            boxShadow: "0 8px 25px rgba(102,126,234,0.2)",
                            color: "#667eea",
                          },
                        }),
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Enhanced Notification Bell */}
            <IconButton
              size="medium"
              sx={{
                width: 48,
                height: 48,
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 3,
                color: "rgba(255,255,255,0.8)",
                transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, rgba(255,107,107,0.2) 0%, rgba(102,126,234,0.2) 100%)",
                  transform: "scale(1.1) rotate(15deg)",
                  border: "1px solid rgba(255,107,107,0.3)",
                  boxShadow: "0 8px 25px rgba(255,107,107,0.3)",
                  color: "#ff6b6b",
                },
              }}
            >
              <Badge
                badgeContent={3}
                color="error"
                variant="dot"
                sx={{
                  "& .MuiBadge-dot": {
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(45deg, #ff4757 0%, #ff6b6b 100%)",
                    boxShadow: "0 0 12px rgba(255,71,87,0.8)",
                    animation: "pulse 2s infinite",
                  },
                }}
              >
                <NotificationsIcon fontSize="small" />
              </Badge>
            </IconButton>

            {/* Enhanced User Greeting */}
            <Box
              sx={{
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: 500,
                }}
              >
                Welcome back,
              </Typography>
              <Chip
                label={getDisplayName()}
                variant="outlined"
                size="small"
                sx={{
                  fontWeight: 700,
                  background:
                    "linear-gradient(135deg, rgba(102,126,234,0.15) 0%, rgba(118,75,162,0.15) 100%)",
                  backdropFilter: "blur(10px)",
                  borderColor: "rgba(102,126,234,0.4)",
                  color: "#667eea",
                  border: "1px solid rgba(102,126,234,0.3)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, rgba(102,126,234,0.25) 0%, rgba(118,75,162,0.25) 100%)",
                    transform: "scale(1.05)",
                    boxShadow: "0 4px 20px rgba(102,126,234,0.3)",
                  },
                }}
              />
            </Box>

            {/* Enhanced User Avatar with Ultra-Modern Design */}
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              sx={{
                p: 0,
                position: 'relative',
                transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                "&:hover": {
                  transform: "scale(1.15) rotate(5deg)",
                  filter: 'brightness(1.1)',
                },
                "&:active": {
                  transform: "scale(0.95)",
                },
                // Add a subtle outer glow ring
                "&::before": {
                  content: '""',
                  position: 'absolute',
                  top: '-4px',
                  left: '-4px',
                  right: '-4px',
                  bottom: '-4px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #667eea, #764ba2, #f093fb, #667eea)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                  zIndex: -1,
                  animation: 'rotate 3s linear infinite',
                },
                "&:hover::before": {
                  opacity: 0.7,
                },
              }}
            >
              <Avatar
                sx={{
                  // Enhanced gradient with more depth
                  background: `
                    linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #667eea 100%),
                    radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 60%)
                  `,
                  backgroundSize: '200% 200%, 100% 100%',
                  backgroundPosition: '0% 0%, 0% 0%',
                  width: 52,
                  height: 52,
                  fontWeight: 800,
                  fontSize: "1.3rem",
                  color: 'white',
                  
                  // Advanced shadow system for depth
                  boxShadow: `
                    0 8px 32px rgba(102,126,234,0.4),
                    0 2px 8px rgba(102,126,234,0.3),
                    inset 0 1px 0 rgba(255,255,255,0.3),
                    inset 0 -1px 0 rgba(0,0,0,0.1)
                  `,
                  
                  // Modern border with glassmorphism effect
                  border: "2px solid rgba(255,255,255,0.2)",
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  
                  position: "relative",
                  overflow: "hidden",
                  cursor: 'pointer',
                  
                  // Smooth transitions
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  
                  // Hover effects
                  "&:hover": {
                    backgroundPosition: '100% 100%, 0% 0%',
                    boxShadow: `
                      0 12px 48px rgba(102,126,234,0.6),
                      0 4px 16px rgba(102,126,234,0.4),
                      inset 0 1px 0 rgba(255,255,255,0.4),
                      inset 0 -1px 0 rgba(0,0,0,0.1)
                    `,
                    border: "2px solid rgba(255,255,255,0.4)",
                    transform: 'scale(1.05)',
                  },
                  
                  // Active state
                  "&:active": {
                    transform: 'scale(0.98)',
                    boxShadow: `
                      0 4px 16px rgba(102,126,234,0.3),
                      inset 0 2px 4px rgba(0,0,0,0.1)
                    `,
                  },
                  
                  // Modern shine effect overlay
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `
                      radial-gradient(circle at 30% 20%, rgba(255,255,255,0.4) 0%, transparent 50%),
                      linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%)
                    `,
                    pointerEvents: "none",
                    borderRadius: 'inherit',
                  },
                  
                  // Animated shimmer effect on hover
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: `
                      linear-gradient(45deg, 
                        transparent 30%, 
                        rgba(255,255,255,0.3) 50%, 
                        transparent 70%
                      )
                    `,
                    transform: 'rotate(45deg) translate(-100%, -100%)',
                    transition: 'transform 0.6s ease',
                    opacity: 0,
                    borderRadius: 'inherit',
                  },
                  
                  "&:hover::after": {
                    transform: 'rotate(45deg) translate(100%, 100%)',
                    opacity: 1,
                  },
                  
                  // Ensure text is properly centered and styled
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: 'center',
                  letterSpacing: '0.5px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  
                  // Modern focus states for accessibility
                  "&:focus-visible": {
                    outline: '3px solid rgba(102,126,234,0.5)',
                    outlineOffset: '2px',
                  },
                }}
              >
                {getInitials()}
              </Avatar>
            </IconButton>

            {/* Enhanced User Menu */}
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              sx={{
                mt: 1.5,
                "& .MuiPaper-root": {
                  borderRadius: 4,
                  minWidth: 240,
                  background:
                    "linear-gradient(135deg, rgba(15,15,35,0.95) 0%, rgba(26,26,46,0.95) 100%)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow:
                    "0 20px 60px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.2)",
                  color: "white",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                      "radial-gradient(circle at 20% 20%, rgba(102,126,234,0.1) 0%, transparent 50%)",
                    pointerEvents: "none",
                  },
                },
              }}
            >
              {/* Enhanced Menu Header */}
              <Box
                sx={{
                  p: 3,
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  background:
                    "linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)",
                  position: "relative",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar
                    sx={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      width: 40,
                      height: 40,
                      fontWeight: 700,
                      color: "white",
                      boxShadow: "0 4px 20px rgba(102,126,234,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "white"
                      }}
                    >
                      {getInitials()}
                    </Typography>
                  </Avatar>
                  <Box>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: "white",
                        letterSpacing: "0.25px",
                      }}
                    >
                      {getDisplayName()}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "rgba(255,255,255,0.6)",
                        fontWeight: 500,
                        background:
                          "linear-gradient(45deg, #667eea 0%, #764ba2 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      Movie Enthusiast ⭐
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <MenuItem
                onClick={() => {
                  navigate("/profile");
                  handleClose();
                }}
                sx={{
                  py: 2,
                  px: 3,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, rgba(102,126,234,0.15) 0%, rgba(118,75,162,0.15) 100%)",
                    transform: "translateX(8px)",
                    borderLeft: "3px solid #667eea",
                  },
                }}
              >
                <PersonIcon
                  sx={{
                    mr: 2,
                    color: "#667eea",
                    filter: "drop-shadow(0 0 8px rgba(102,126,234,0.3))",
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: "white",
                  }}
                >
                  My Profile
                </Typography>
              </MenuItem>

              <Divider
                sx={{
                  my: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                  mx: 2,
                }}
              />

              <MenuItem
                onClick={handleLogout}
                sx={{
                  py: 2,
                  px: 3,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, rgba(244,67,54,0.15) 0%, rgba(255,87,34,0.15) 100%)",
                    transform: "translateX(8px)",
                    borderLeft: "3px solid #f44336",
                  },
                }}
              >
                <LogoutIcon
                  sx={{
                    mr: 2,
                    color: "#f44336",
                    filter: "drop-shadow(0 0 8px rgba(244,67,54,0.3))",
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: "#f44336",
                  }}
                >
                  Sign Out
                </Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Enhanced Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 300,
            border: "none",
            boxShadow:
              "20px 0 60px rgba(0,0,0,0.3), 0 0 40px rgba(102,126,234,0.1)",
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Global Styles for All Animations */}
      <style jsx global>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes shine {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        @keyframes glow {
          from {
            box-shadow: 0 0 12px rgba(102, 126, 234, 0.6);
          }
          to {
            box-shadow: 0 0 20px rgba(102, 126, 234, 0.9),
              0 0 30px rgba(102, 126, 234, 0.4);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes avatarPulse {
          0%, 100% {
            transform: scale(1);
            filter: brightness(1);
          }
          50% {
            transform: scale(1.02);
            filter: brightness(1.05);
          }
        }
        
        @keyframes subtleGlow {
          0%, 100% {
            box-shadow: 
              0 8px 32px rgba(102,126,234,0.4),
              0 2px 8px rgba(102,126,234,0.3),
              inset 0 1px 0 rgba(255,255,255,0.3);
          }
          50% {
            box-shadow: 
              0 12px 40px rgba(102,126,234,0.5),
              0 4px 12px rgba(102,126,234,0.4),
              inset 0 1px 0 rgba(255,255,255,0.4);
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;