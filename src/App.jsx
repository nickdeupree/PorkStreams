import React, { useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import { AppProvider, useAppContext } from './context/AppContext';
import getTheme from './theme/muiTheme';
import Navigation from './components/Navigation';
import StreamGrid from './components/StreamGrid';
import StreamPlayer from './components/StreamPlayer';
import { useRemoteControl } from './hooks/useRemoteControl';

// Main content component that uses the context
const AppContent = () => {
  const { themeMode, currentStream } = useAppContext();
  const theme = useMemo(() => getTheme(themeMode), [themeMode]);

  // Enable remote control navigation (keyboard navigation removed)
  useRemoteControl(!currentStream);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: 'background.default',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Navigation />
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: 'auto'
          }}
        >
          <StreamGrid />
        </Box>
        <StreamPlayer />
      </Box>
    </ThemeProvider>
  );
};

// Root App component with provider
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
