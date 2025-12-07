import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Box,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Typography,
  ListItemButton,
  Switch
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Brightness4, 
  Brightness7,
  Settings,
  Refresh,
  Tv,
  VideoLibrary,
  Language,
  History
} from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';
import { APP_CATEGORIES, PROVIDER_IDS } from '../config/categoryMappings';

const Navigation = () => {
  const {
    selectedCategory,
    setSelectedCategory,
    provider,
    setProvider,
    refreshData,
    themeMode,
    toggleTheme,
    allowAllStreams,
    toggleAllowAllStreams,
    showEnded,
    toggleShowEnded
  } = useAppContext();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Build categories dynamically from the config so additions/ordering stay in sync
  const categories = Object.values(APP_CATEGORIES);

  const handleCategoryChange = (event, newValue) => {
    setSelectedCategory(newValue);
  };

  const handleProviderChange = (event) => {
    setProvider(event.target.value);
  };

  const handleResetCache = () => {
    // clear cache and refresh data
    try {
      // Importing clearAllCache directly here would cause a circular dependency; use window.localStorage
      // But we have service function; require it dynamically to avoid bundler issues
      import('../services/cacheService').then(({ clearAllCache }) => {
        clearAllCache();
        console.log('Cache cleared via Settings drawer');
        // Ask AppContext to fetch fresh data from the active provider
        if (typeof refreshData === 'function') {
          refreshData();
        } else {
          // Fallback: nudge provider to retrigger fetch if refreshData not available
          setProvider((prev) => prev);
        }
      });
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
  };

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  return (
    <>
      <AppBar position="sticky" color="primary" elevation={2}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            PorkStreams
          </Typography>

          {/* Category tabs - centered */}
          <Box sx={{ position: 'relative', width: '100%' }}>
              <Tabs
                value={selectedCategory}
                onChange={handleCategoryChange}
                variant={isMobile ? 'scrollable' : 'standard'}
                scrollButtons={isMobile ? 'auto' : false}
                textColor="inherit"
                indicatorColor="secondary"
                sx={{
                  '.MuiTab-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-selected': {
                      color: 'white',
                    },
                  },
                  left: isMobile ? 0 : '50%',
                }}

              >
                {categories.map((category) => (
                  <Tab
                    key={category}
                    label={category}
                    value={category}
                    sx={{ textTransform: 'uppercase' }}
                  />
                ))}
              </Tabs>
            </Box>

          {/* Settings button - right side */}
          <Tooltip title="Refresh">
            <IconButton
              color="inherit"
              aria-label="refresh"
              onClick={() => {
                if (typeof refreshData === 'function') {
                  refreshData();
                } else {
                  // fallback: nudge provider to retrigger fetch
                  setProvider((prev) => prev);
                }
              }}
              sx={{ mr: 1 }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton
              color="inherit"
              aria-label="open settings"
              onClick={toggleDrawer(true)}
              edge="end"
            >
              <MenuIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Settings Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 300,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box
          sx={{ width: 300 }}
          role="presentation"
        >
          <Box sx={{ p: 2, backgroundColor: 'primary.main', color: 'white' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Settings /> Settings
            </Typography>
          </Box>

          <List>
            {/* Provider Selection */}
            <ListItem>
              <FormControl fullWidth size="small">
                <InputLabel id="drawer-provider-label">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Tv fontSize="small" />
                    Provider
                  </Box>
                </InputLabel>
                <Select
                  labelId="drawer-provider-label"
                  value={provider}
                  label="Provider"
                  onChange={handleProviderChange}
                >
                  <MenuItem value={PROVIDER_IDS.SHARK_STREAMS}>
                    Shark Streams
                  </MenuItem>
                  <MenuItem value={PROVIDER_IDS.PPTV}>
                    PPTV
                  </MenuItem>
                  <MenuItem value={PROVIDER_IDS.PPTV_LEGACY}>
                    PPTV (Legacy)
                  </MenuItem>
                  <MenuItem value={PROVIDER_IDS.STREAMED}>
                    Streamed
                  </MenuItem>
                </Select>
              </FormControl>
            </ListItem>

            <Divider />

            {/* Show Ended Toggle */}
            <ListItem
              secondaryAction={
                <Switch
                  edge="end"
                  onChange={toggleShowEnded}
                  checked={showEnded}
                  inputProps={{ 'aria-label': 'show ended toggle' }}
                />
              }
            >
              <ListItemIcon>
                <History />
              </ListItemIcon>
              <ListItemText
                primary="Show Ended"
                secondary="Include events that already finished"
              />
            </ListItem>

            {/* Stream Filter Toggle */}
            <ListItem
              secondaryAction={
                <Switch
                  edge="end"
                  onChange={toggleAllowAllStreams}
                  checked={allowAllStreams}
                  inputProps={{ 'aria-label': 'allow all streams toggle' }}
                />
              }
            >
              <ListItemIcon>
                <Language />
              </ListItemIcon>
              <ListItemText
                primary="Allow All Streams"
                secondary="Show non-English or unrecognized teams"
              />
            </ListItem>

            <Divider />

            {/* Theme Toggle */}
            <ListItemButton onClick={toggleTheme}>
              <ListItemIcon>
                {themeMode === 'dark' ? <Brightness7 /> : <Brightness4 />}
              </ListItemIcon>
              <ListItemText 
                primary="Theme" 
                secondary={themeMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
              />
            </ListItemButton>

            <Divider />

            {/* Reset Cache */}
            <ListItemButton onClick={handleResetCache}>
              <ListItemIcon>
                <VideoLibrary />
              </ListItemIcon>
              <ListItemText primary="Reset Cache" secondary="Clear cached schedules and refresh" />
            </ListItemButton>

            <Divider />

            {/* Info Section */}
            <ListItem>
              <ListItemText 
                primary="About" 
                secondary="PorkStreams v1.0"
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Navigation;
