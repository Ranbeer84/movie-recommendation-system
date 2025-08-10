import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const MoviesPage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Browse Movies
      </Typography>
      <Box sx={{ mt: 4 }}>
        <Typography variant="body1" color="text.secondary">
          Movies page coming soon...
        </Typography>
      </Box>
    </Container>
  );
};

export default MoviesPage;