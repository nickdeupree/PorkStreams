import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { RefreshRounded } from '@mui/icons-material';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            p: 3,
            textAlign: 'center'
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            We apologize for the inconvenience. Please try refreshing the page.
          </Typography>
          <Button
            variant="contained"
            startIcon={<RefreshRounded />}
            onClick={this.handleRefresh}
          >
            Refresh Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}