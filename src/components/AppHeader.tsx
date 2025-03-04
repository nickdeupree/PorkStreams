import React from 'react';
import { AppBar, Toolbar, Typography, Box, useTheme, useMediaQuery, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';

interface AppHeaderProps {
  liveGamesCount: number;
  upcomingGamesCount: number;
}

const AppHeader: React.FC<AppHeaderProps> = ({ liveGamesCount, upcomingGamesCount }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <AppBar position="sticky" sx={{ background: 'rgba(18, 18, 18, 0.9)', backdropFilter: 'blur(10px)' }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5 }}>
          <img
            src="/logo.png"
            alt=""
            style={{
              width: isMobile ? 40 : 50,
              height: isMobile ? 40 : 50,
              borderRadius: '50%',
              marginRight: theme.spacing(1)
            }}
          />
        </Box>
        <Typography variant={isMobile ? "h6" : "h5"} component="h1" sx={{ flexGrow: 1 }}>
          PorkStreams
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {liveGamesCount > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'error.main',
                  mr: 1,
                  animation: 'pulse 2s infinite'
                }}
              />
              <Typography variant="body2">
                {liveGamesCount} Live
              </Typography>
            </Box>
          )}
          {upcomingGamesCount > 0 && (
            <Typography variant="body2" color="text.secondary">
              {upcomingGamesCount} Upcoming
            </Typography>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;