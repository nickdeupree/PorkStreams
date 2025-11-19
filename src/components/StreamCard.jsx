import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Box,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import { AccessTime, PlayArrow } from '@mui/icons-material';
import { getStreamStatus } from '../utils/streamStatus';
import { MOVIE_PROVIDER_ID } from '../services/movieService';
import { getMovieProgress, getTvProgress, getLastWatchedEpisode } from '../services/watchProgressService';

const StreamCard = ({ stream, onClick, onPlay }) => {
  const [selectedChannelId, setSelectedChannelId] = useState(() => {
    const initial = stream.selectedChannelId || stream.channelId || stream.channels?.[0]?.channel_id;
    return initial ? initial.toString() : '';
  });

  const [savedProgress, setSavedProgress] = useState(null);

  useEffect(() => {
    const initial = stream.selectedChannelId || stream.channelId || stream.channels?.[0]?.channel_id;
    setSelectedChannelId(initial ? initial.toString() : '');
  }, [stream]);

  // Load saved progress on mount or when stream changes
  useEffect(() => {
    if (!stream?.movieMeta?.tmdbId) {
      setSavedProgress(null);
      return;
    }

    let progress = null;
    if (stream.movieMeta.mediaType === 'movie') {
      progress = getMovieProgress(stream.movieMeta.tmdbId);
    } else if (stream.movieMeta.mediaType === 'tv') {
      progress = getLastWatchedEpisode(stream.movieMeta.tmdbId);
    }

    setSavedProgress(progress);
  }, [stream]);

  const selectedChannel = useMemo(() => {
    if (!Array.isArray(stream.channels) || stream.channels.length === 0) {
      return null;
    }

    return (
      stream.channels.find(
        (channel) => channel.channel_id?.toString() === selectedChannelId
      ) || stream.channels[0]
    );
  }, [stream.channels, selectedChannelId]);

  const teamLogos = Array.isArray(stream.teamLogos) ? stream.teamLogos : [];
  const showTeamBranding = teamLogos.length > 0;
  const teamNames = Array.isArray(stream.teamNames) ? stream.teamNames : [];
  const statusInfo = useMemo(() => getStreamStatus(stream), [stream]);
  const { statusLabel, statusColor, startDate } = statusInfo;

  const formatDate = (date) => {
    if (!date) return 'Date TBA';
    return date.toLocaleDateString('en-US', {
      weekday: 'short'
    });
  };

  const formatTime = (date) => {
    if (!date) return 'Time TBA';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleChannelChange = (event) => {
    event.stopPropagation();
    setSelectedChannelId(event.target.value);
  };

  const buildSelectedStream = () => {
    const channel = selectedChannel || stream.channels?.[0] || null;

    return {
      ...stream,
      channelId: channel?.channel_id || null,
      tag: channel?.channel_name || stream.tag,
      selectedChannelId: channel?.channel_id || null
    };
  };

  const handleCardClick = () => {
    if (!onClick) return;

    onClick(buildSelectedStream());
  };

  const handlePlayClick = (event) => {
    event.stopPropagation();
    event.preventDefault();
    if (!onPlay) {
      return;
    }
    const selectedStream = buildSelectedStream();
    
    // Attach saved progress info if available
    if (savedProgress) {
      selectedStream.savedProgress = savedProgress;
    }
    
    onPlay(selectedStream);
  };

  const showPlayButton =
    stream.provider === MOVIE_PROVIDER_ID && typeof onPlay === 'function' && stream.movieMeta;

  return (
    <Card
      onClick={handleCardClick}
      sx={{
        height: 300,
        width: 345,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}
      tabIndex={0}
      role="button"
      aria-label={`Watch ${stream.name} on ${stream.tag}`}
    >
      {showTeamBranding ? (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: teamLogos.length > 1 ? 'space-between' : 'center',
            gap: 2,
            px: 2,
            backgroundColor: 'action.hover'
          }}
        >
          {teamLogos.map((logo, index) => (
            <Box
              key={`${logo}-${index}`}
              component="img"
              src={logo}
              alt={teamNames[index] || stream.name}
              sx={{
                height: '100%',
                width: teamLogos.length > 1 ? '50%' : '100%',
                objectFit: 'cover',
                pointerEvents: 'none'
              }}
            />
          ))}
        </Box>
      ) : (
        stream.poster && (
          <CardMedia
            component="img"
            image={stream.poster}
            alt={stream.name}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              backgroundColor: 'action.hover'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )
      )}

      <CardContent sx={{ 
        flexGrow: 1, 
        pb: 1, 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end'
      }}>
        {showPlayButton && (
          <Tooltip title="Play now">
            <IconButton
              size="small"
              color="primary"
              onClick={handlePlayClick}
              sx={{
                position: 'absolute',
                bottom: 10,
                right: 10,
                backgroundColor: 'background.paper',
                boxShadow: 2,
                '&:hover': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText'
                }
              }}
              aria-label="Play now"
            >
              <PlayArrow fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="h6" component="h3" sx={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.3, color: 'white' }}>
            {stream.name.includes(':') ? stream.name.split(':').slice(1).join(':').trim() : stream.name}
            </Typography>
            {!showPlayButton ? (<Chip
            label={statusLabel}
            color={statusColor}
            size="small"  
            sx={{ ml: 1, flexShrink: 0 }}
            />) : null}
        </Box>

        {!stream.hideSchedule && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <AccessTime sx={{ fontSize: '1rem', color: 'white' }} />
            <Typography variant="body2" sx={{ color: 'white' }}>
              {startDate
                ? `${formatDate(startDate)} • ${formatTime(startDate)}`
                : 'Schedule TBA'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StreamCard;
