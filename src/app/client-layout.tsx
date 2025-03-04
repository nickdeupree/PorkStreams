'use client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ErrorBoundary } from '../components/ErrorBoundary';
import "./globals.css";

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
    error: {
      main: '#f44336', // Used for LIVE indicators
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.02)',
            boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
        colorError: {
          animation: 'pulse 2s infinite',
          '@keyframes pulse': {
            '0%': {
              opacity: 1,
            },
            '50%': {
              opacity: 0.7,
            },
            '100%': {
              opacity: 1,
            },
          },
        },
      },
    },
  },
  typography: {
    fontFamily: '"Geist", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
});

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </ThemeProvider>
  );
}