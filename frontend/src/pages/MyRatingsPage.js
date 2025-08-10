import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const MyRatingsPage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Ratings
      </Typography>
      <Box sx={{ mt: 4 }}>
        <Typography variant="body1" color="text.secondary">
          Ratings page coming soon...
        </Typography>
      </Box>
    </Container>
  );
};

export default MyRatingsPage;