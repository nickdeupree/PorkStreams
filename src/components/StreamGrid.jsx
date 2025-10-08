import React from 'react';
import { Grid, Alert, CircularProgress, Box, Typography } from '@mui/material';
import { useAppContext } from '../context/AppContext';
import StreamCard from './StreamCard';
import { getStreamStatus } from '../utils/streamStatus';

const StreamGrid = () => {
  const {
    streamData,
    selectedCategory,
    loading,
    error,
    setCurrentStream,
    showEnded
  } = useAppContext();

  const handleStreamClick = (stream) => {
    setCurrentStream(stream);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Loading streams...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  const streams = streamData[selectedCategory] || [];

  const streamsWithStatus = streams
    .map((stream) => ({
      stream,
      statusInfo: getStreamStatus(stream)
    }))
    .filter(({ statusInfo }) => showEnded || statusInfo.statusCategory !== 'ended');

  if (streamsWithStatus.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No streams available in {selectedCategory} at this time. Streams may be added up to an hour before they start, so check back soon.
        </Alert>
      </Box>
    );
  }

  const statusOrder = {
    live: 0,
    upcoming: 1,
    ended: 2
  };

  const sortedStreams = streamsWithStatus
    .sort((a, b) => {
      const statusRankA = statusOrder[a.statusInfo.statusCategory] ?? Number.MAX_SAFE_INTEGER;
      const statusRankB = statusOrder[b.statusInfo.statusCategory] ?? Number.MAX_SAFE_INTEGER;

      if (statusRankA !== statusRankB) {
        return statusRankA - statusRankB;
      }

      const aTime = a.statusInfo.startDate?.getTime();
      const bTime = b.statusInfo.startDate?.getTime();

      if (aTime == null && bTime == null) {
        return 0;
      }

      if (aTime == null) {
        return 1;
      }

      if (bTime == null) {
        return -1;
      }

      return aTime - bTime;
    })
    .map(({ stream }) => stream);

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        width: '100%',
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <Grid
        container
        spacing={{ xs: 2, sm: 3, md: 4 }}
        justifyContent="center"
        alignItems="stretch"
        sx={{ width: '100%', maxWidth: '1400px' }}
      >
        {sortedStreams.map((stream) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            lg={3}
            key={stream.id}
            sx={{ display: 'flex', justifyContent: 'center' }}
          >
            <StreamCard stream={stream} onClick={handleStreamClick} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default StreamGrid;
