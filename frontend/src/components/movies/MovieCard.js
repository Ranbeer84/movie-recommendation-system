import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  IconButton,
  Rating,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import {
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Info as InfoIcon,
  Play as PlayIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import movieService from '../../services/movieService';

const MovieCard = ({ movie, onRatingChange, showRating = true }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCardClick = () => {
    navigate(`/movies/${movie.id}`);
  };

  const handleRatingClick = (event) => {
    event.stopPropagation();
    setRatingDialogOpen(true);
  };

  const handleRatingSubmit = async () => {
    if (userRating === 0) return;

    setLoading(true);
    try {
      await movieService.rateMovie(movie.id, userRating, userReview);
      if (onRatingChange) {
        onRatingChange(movie.id, userRating, userReview);
      }
      setRatingDialogOpen(false);
      setUserRating(0);
      setUserReview('');
    } catch (error) {
      console.error('Failed to rate movie:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingCancel = () => {
    setRatingDialogOpen(false);
    setUserRating(0);
    setUserReview('');
  };

  const formatRating = (rating) => {
    return Number(rating).toFixed(1);
  };

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: (theme) => theme.shadows[8],
          },
        }}
        onClick={handleCardClick}
      >
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component="img"
            height="300"
            image={movie.poster_url || '/api/placeholder/300/450'}
            alt={movie.title}
            sx={{
              objectFit: 'cover',
              bgcolor: 'grey.900',
            }}
            onError={(e) => {
              e.target.src = '/api/placeholder/300/450';
            }}
          />
          
          {/* Rating badge */}
          {movie.avg_rating > 0 && (
            <Chip
              icon={<StarIcon />}
              label={formatRating(movie.avg_rating)}
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                bgcolor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                '& .MuiChip-icon': {
                  color: '#ffd700',
                },
              }}
            />
          )}

          {/* Action buttons */}
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {showRating && (
              <Tooltip title="Rate this movie">
                <IconButton
                  size="small"
                  sx={{
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.9)',
                    },
                  }}
                  onClick={handleRatingClick}
                >
                  <StarBorderIcon />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="View details">
              <IconButton
                size="small"
                sx={{
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.9)',
                  },
                }}
              >
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          <Typography
            gutterBottom
            variant="h6"
            component="h2"
            sx={{
              fontSize: '1.1rem',
              fontWeight: 600,
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {movie.title}
          </Typography>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            {movie.year}
          </Typography>

          {movie.plot && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                mb: 2,
              }}
            >
              {movie.plot}
            </Typography>
          )}

          {/* Genres */}
          {movie.genres && movie.genres.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {movie.genres.slice(0, 3).map((genre) => (
                <Chip
                  key={genre}
                  label={genre}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
              {movie.genres.length > 3 && (
                <Chip
                  label={`+${movie.genres.length - 3}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
            </Box>
          )}

          {/* Rating count */}
          {movie.rating_count > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {movie.rating_count} ratings
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onClose={handleRatingCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Rate "{movie.title}"</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body1" gutterBottom>
                How would you rate this movie?
              </Typography>
              <Rating
                name="user-rating"
                value={userRating}
                onChange={(event, newValue) => setUserRating(newValue)}
                size="large"
                precision={0.5}
                sx={{ fontSize: '2rem' }}
              />
            </Box>

            <TextField
              label="Review (optional)"
              multiline
              rows={3}
              value={userReview}
              onChange={(e) => setUserReview(e.target.value)}
              placeholder="Share your thoughts about this movie..."
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRatingCancel}>Cancel</Button>
          <Button
            onClick={handleRatingSubmit}
            variant="contained"
            disabled={userRating === 0 || loading}
          >
            {loading ? 'Saving...' : 'Rate Movie'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MovieCard;