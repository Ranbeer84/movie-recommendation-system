import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const RecommendationsPage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Your Recommendations
      </Typography>
      <Box sx={{ mt: 4 }}>
        <Typography variant="body1" color="text.secondary">
          Recommendations page coming soon...
        </Typography>
      </Box>
    </Container>
  );
};

export default RecommendationsPage;