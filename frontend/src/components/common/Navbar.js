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
        width: 280,
        height: '100%',
        background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: 'white'
      }}
    >
      {/* Mobile Header */}
      <Box sx={{ 
        p: 3, 
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.05)'
      }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(45deg, #ff6b6b, #ffd93d)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          🎬 MovieRec
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.5 }}>
          Discover amazing movies
        </Typography>
      </Box>

      <List sx={{ px: 2, py: 2 }}>
        {navigationItems.map((item) => (
          <ListItem
            key={item.label}
            button
            onClick={() => navigate(item.path)}
            selected={location.pathname === item.path}
            sx={{
              borderRadius: 2,
              mb: 1,
              transition: 'all 0.3s ease',
              bgcolor: location.pathname === item.path ? 'rgba(255,107,107,0.2)' : 'transparent',
              border: location.pathname === item.path ? '1px solid rgba(255,107,107,0.3)' : '1px solid transparent',
              '&:hover': {
                bgcolor: 'rgba(255,107,107,0.1)',
                transform: 'translateX(4px)',
                border: '1px solid rgba(255,107,107,0.2)',
              },
            }}
          >
            <ListItemIcon 
              sx={{ 
                color: location.pathname === item.path ? '#ff6b6b' : 'rgba(255,255,255,0.7)',
                minWidth: 40
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              sx={{
                '& .MuiTypography-root': {
                  fontWeight: location.pathname === item.path ? 600 : 400,
                  color: location.pathname === item.path ? '#fff' : 'rgba(255,255,255,0.9)'
                }
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  if (!isAuthenticated) {
    return (
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0,0,0,0.08)'
        }}
      >
        <Toolbar sx={{ minHeight: 72 }}>
          <Typography
            variant="h5"
            component="div"
            sx={{ 
              flexGrow: 1, 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            🎬 Movie Recommendations
          </Typography>
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <>
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          background: 'linear-gradient(145deg, rgba(26,26,46,0.6) 0%, rgba(22,33,62,0.6) 50%, rgba(15,52,96,0.6) 100%)',
          color: 'white',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <Toolbar sx={{ minHeight: 72, px: { xs: 2, md: 4 } }}>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2, 
                color: 'primary.main',
                bgcolor: 'rgba(102,126,234,0.1)',
                borderRadius: 2,
                '&:hover': {
                  bgcolor: 'rgba(102,126,234,0.2)',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography
            variant="h5"
            component="div"
            sx={{ 
              flexGrow: isMobile ? 1 : 0, 
              fontWeight: 700,
              background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'scale(1.02)'
              }
            }}
            onClick={() => navigate('/')}
          >
            🎬 MovieRec
          </Typography>

          {!isMobile && (
            <Box sx={{ flexGrow: 1, ml: 6, display: 'flex', gap: 1 }}>
              {navigationItems.map((item) => (
                <Button
                  key={item.label}
                  startIcon={item.icon}
                  onClick={() => navigate(item.path)}
                  variant={location.pathname === item.path ? 'contained' : 'text'}
                  sx={{
                    borderRadius: 3,
                    px: 3,
                    py: 1,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    transition: 'all 0.3s ease',
                    ...(location.pathname === item.path ? {
                      background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 4px 15px rgba(102,126,234,0.3)',
                      color: 'white',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #5a67d8 0%, #6b46c1 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(102,126,234,0.4)',
                      }
                    } : {
                      color: 'text.primary',
                      bgcolor: 'transparent',
                      '&:hover': {
                        bgcolor: 'rgba(102,126,234,0.1)',
                        transform: 'translateY(-1px)',
                      }
                    })
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Notification Bell */}
            <IconButton
              size="medium"
              sx={{
                color: 'text.secondary',
                bgcolor: 'rgba(0,0,0,0.04)',
                borderRadius: 2,
                '&:hover': {
                  bgcolor: 'rgba(102,126,234,0.1)',
                  color: 'primary.main',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <Badge badgeContent={3} color="error" variant="dot">
                <NotificationsIcon fontSize="small" />
              </Badge>
            </IconButton>

            {/* User Greeting */}
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Welcome,
              </Typography>
              <Chip
                label={user?.username}
                variant="outlined"
                size="small"
                sx={{
                  fontWeight: 600,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'rgba(102,126,234,0.1)'
                  }
                }}
              />
            </Box>

            {/* User Avatar */}
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              sx={{
                p: 0,
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.1)'
                }
              }}
            >
              <Avatar 
                sx={{ 
                  background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                  width: 40, 
                  height: 40,
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(102,126,234,0.3)'
                }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>

            {/* User Menu */}
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              sx={{
                mt: 1,
                '& .MuiPaper-root': {
                  borderRadius: 3,
                  minWidth: 200,
                  background: 'rgba(30, 30, 50, 0.4)', // semi-transparent dark layer
                  backdropFilter: 'blur(12px)', // strong glass blur
                  WebkitBackdropFilter: 'blur(12px)', // Safari support
                  borderBottom: '1px solid rgba(255,255,255,0.15)',
                  color: 'white'
                }
              }}
            >
              <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {user?.username}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Movie Enthusiast
                </Typography>
              </Box>
              
              <MenuItem 
                onClick={() => { navigate('/profile'); handleClose(); }}
                sx={{
                  py: 1.5,
                  '&:hover': {
                    bgcolor: 'rgba(102,126,234,0.1)'
                  }
                }}
              >
                <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  My Profile
                </Typography>
              </MenuItem>
              
              <Divider sx={{ my: 0.5 }} />
              
              <MenuItem 
                onClick={handleLogout}
                sx={{
                  py: 1.5,
                  color: 'error.main',
                  '&:hover': {
                    bgcolor: 'rgba(244, 67, 54, 0.1)'
                  }
                }}
              >
                <LogoutIcon sx={{ mr: 2 }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Sign Out
                </Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Modern Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
            border: 'none',
            boxShadow: '20px 0 40px rgba(0,0,0,0.1)'
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;