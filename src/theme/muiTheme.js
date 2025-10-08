import { createTheme } from '@mui/material/styles';

/**
 * Custom MUI theme optimized for TV viewing and dark mode
 */
const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#e33371',
      dark: '#9a0036',
    },
    background: {
      default: mode === 'dark' ? '#121212' : '#fafafa',
      paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
    },
    text: {
      primary: mode === 'dark' ? '#ffffff' : '#000000',
      secondary: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'scale(1.02)',
            boxShadow: mode === 'dark' 
              ? '0 8px 16px rgba(0, 0, 0, 0.4)' 
              : '0 8px 16px rgba(0, 0, 0, 0.15)',
          },
          '&:focus-visible': {
            outline: '3px solid #1976d2',
            outlineOffset: '2px',
            transform: 'scale(1.02)',
          },
          cursor: 'pointer',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          fontWeight: 600,
          minHeight: 64,
          '&:focus-visible': {
            outline: '3px solid #1976d2',
            outlineOffset: '2px',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          '&:focus-visible': {
            outline: '3px solid #1976d2',
            outlineOffset: '2px',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:focus-visible': {
            outline: '3px solid #1976d2',
            outlineOffset: '2px',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          '&:focus': {
            backgroundColor: 'transparent',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          margin: 0,
        },
      },
    },
  },
  spacing: 8,
});

export default getTheme;
