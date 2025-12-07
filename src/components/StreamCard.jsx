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

  const [selectedSource, setSelectedSource] = useState(() => {
    const initial = stream.selectedSource || stream.sources?.[0];
    return initial || null;
  });

  const [savedProgress, setSavedProgress] = useState(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const initial = stream.selectedChannelId || stream.channelId || stream.channels?.[0]?.channel_id;
    setSelectedChannelId(initial ? initial.toString() : '');
  }, [stream]);

  useEffect(() => {
    const initial = stream.selectedSource || stream.sources?.[0];
    setSelectedSource(initial || null);
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
  const showTeamBranding = teamLogos.length > 0 && !stream.poster;
  console.log("showTeamBranding:", showTeamBranding, teamLogos, stream.poster);
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

  const handleSourceChange = (event) => {
    event.stopPropagation();
    const sourceToSet = stream.sources.find(
      (source) => `${source.source}:${source.id}` === event.target.value
    );
    setSelectedSource(sourceToSet || null);
  };

  const buildSelectedStream = () => {
    const channel = selectedChannel || stream.channels?.[0] || null;

    return {
      ...stream,
      channelId: channel?.channel_id || null,
      tag: channel?.channel_name || stream.tag,
      selectedChannelId: channel?.channel_id || null,
      selectedSource: selectedSource || null
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
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
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
                objectFit: 'fill',
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
              objectFit: 'fill',
              backgroundColor: 'action.hover'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )
      )}

      <CardContent sx={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        p: 1
      }}>
        {showPlayButton && (
          <Tooltip title="Play now">
            <IconButton
              size="small"
              color="primary"
              onClick={handlePlayClick}
              sx={{
                position: 'absolute',
                top: 10,
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

        <Box />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {stream.provider === 'streamed' && Array.isArray(stream.sources) && stream.sources.length > 1 && (
            <FormControl size="small" sx={{ width: '100%', opacity: isHovering ? 1 : 0, maxHeight: isHovering ? '40px' : '0px', transition: 'all 0.2s ease-in-out', pointerEvents: isHovering ? 'auto' : 'none', overflow: 'hidden' }}>
              <Select
                value={selectedSource ? `${selectedSource.source}:${selectedSource.id}` : ''}
                onChange={handleSourceChange}
                onClick={(e) => e.stopPropagation()}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  color: 'black',
                  fontSize: '0.875rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.3)'
                  }
                }}
              >
                {stream.sources.map((source, index) => (
                  <MenuItem
                    key={`${source.source}:${source.id}`}
                    value={`${source.source}:${source.id}`}
                  >
                    Source {index + 1} ({source.source})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0 }}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTime sx={{ fontSize: '1rem', color: 'white' }} />
              <Typography variant="body2" sx={{ color: 'white' }}>
                {startDate
                  ? `${formatDate(startDate)} • ${formatTime(startDate)}`
                  : 'Schedule TBA'}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StreamCard;
