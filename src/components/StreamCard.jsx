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

const StreamCard = ({ stream, onClick, onPlay }) => {
  const [selectedChannelId, setSelectedChannelId] = useState(() => {
    const initial = stream.selectedChannelId || stream.channelId || stream.channels?.[0]?.channel_id;
    return initial ? initial.toString() : '';
  });

  useEffect(() => {
    const initial = stream.selectedChannelId || stream.channelId || stream.channels?.[0]?.channel_id;
    setSelectedChannelId(initial ? initial.toString() : '');
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
    onPlay(buildSelectedStream());
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
        position: 'relative'
      }}
      tabIndex={0}
      role="button"
      aria-label={`Watch ${stream.name} on ${stream.tag}`}
    >
      {showTeamBranding ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: teamLogos.length > 1 ? 'space-between' : 'center',
            gap: 2,
            px: 2,
            pt: 2,
            pb: 1,
            backgroundColor: 'action.hover',
            minHeight: 140
          }}
        >
          {teamLogos.map((logo, index) => (
            <Box
              key={`${logo}-${index}`}
              component="img"
              src={logo}
              alt={teamNames[index] || stream.name}
              sx={{
                height: 90,
                width: 'auto',
                maxWidth: teamLogos.length > 1 ? '45%' : '70%',
                objectFit: 'contain',
                pointerEvents: 'none'
              }}
            />
          ))}
        </Box>
      ) : (
        stream.poster && (
          <CardMedia
            component="img"
            height="180"
            image={stream.poster}
            alt={stream.name}
            sx={{
              objectFit: 'cover',
              backgroundColor: 'action.hover'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )
      )}

      <CardContent sx={{ flexGrow: 1, pb: 1, position: 'relative' }}>
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
            <Typography variant="h6" component="h3" sx={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.3 }}>
            {stream.name.includes(':') ? stream.name.split(':').slice(1).join(':').trim() : stream.name}
            </Typography>
            <Chip
            label={statusLabel}
            color={statusColor}
            size="small"  
            sx={{ ml: 1, flexShrink: 0 }}
            />
        </Box>

        {!stream.hideSchedule && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <AccessTime sx={{ fontSize: '1rem', color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {startDate
                ? `${formatDate(startDate)} • ${formatTime(startDate)}`
                : 'Schedule TBA'}
            </Typography>
          </Box>
        )}

        {/* <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {stream.channels && stream.channels.length > 1 ? (
            <FormControl
              size="small"
              sx={{ minWidth: 140 }}
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              onTouchStart={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <Select
                value={selectedChannelId}
                displayEmpty
                onChange={handleChannelChange}
                renderValue={(value) => {
                  if (!value) {
                    return 'Select channel';
                  }

                  const channel = stream.channels.find(
                    (item) => item.channel_id?.toString() === value
                  );

                  return channel?.channel_name || 'Select channel';
                }}
                sx={{ fontSize: '0.8rem' }}
              >
                {stream.channels.map((channel) => (
                  <MenuItem key={channel.channel_id} value={channel.channel_id?.toString()}>
                    {channel.channel_name || `Channel ${channel.channel_id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Chip
              label={selectedChannel?.channel_name || stream.tag}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.75rem' }}
            />
          )}
        </Box> */}
      </CardContent>
    </Card>
  );
};

export default StreamCard;
