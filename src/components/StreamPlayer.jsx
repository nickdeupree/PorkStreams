import React, { useEffect, useState } from 'react';
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import { ArrowBack, Fullscreen, Refresh, Pause, PlayArrow } from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';
import { PROVIDER_IDS } from '../config/categoryMappings';
import { DaddyStreamsProvider } from '../providers/DaddyStreamsProvider';
import { PPTVProvider } from '../providers/PPTVProvider';
import { StreamedProvider } from '../providers/StreamedProvider';
import { SharkStreamsProvider } from '../providers/SharkStreamsProvider';
import { MOVIE_PROVIDER_ID, buildVidkingEmbedUrl } from '../services/movieService';
import { saveMovieProgress, saveTvProgress } from '../services/watchProgressService';

const StreamPlayer = () => {
  const { currentStream, setCurrentStream, allowAllStreams } = useAppContext();
  const [embedUrl, setEmbedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const iframeRef = React.useRef(null);
  // Try to focus the iframe reliably once it's loaded. Some embeds or browsers
  // may not allow immediate focus, so retry briefly using requestAnimationFrame
  // and a short timeout.
  const focusIframe = () => {
    try {
      const tryFocus = () => {
        if (iframeRef.current && typeof iframeRef.current.focus === 'function') {
          iframeRef.current.focus();
        }
      };

      // Try on the next paint and again shortly after to increase reliability
      requestAnimationFrame(() => {
        tryFocus();
        setTimeout(tryFocus, 50);
      });
    } catch (e) {
      // ignore focus errors
    }
  };

  // Handle watch progress events from Vidking player
  const handlePlayerMessage = (event) => {
    try {
      let data = event.data;
      
      // Parse if it's a string
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          // Not JSON, ignore
          return;
        }
      }

      // Look for PLAYER_EVENT type or just data with event field
      const eventData = data.data || data;
      if (!eventData || !eventData.event) {
        return;
      }

      // Handle timeupdate, play, pause, ended, seeked events
      const { event: eventType, currentTime, duration, id, mediaType, season, episode } = eventData;
      
      if (!currentStream || !id) {
        return;
      }

      // Only track time-based events (timeupdate, pause, seeked)
      if (['timeupdate', 'pause', 'seeked'].includes(eventType) && currentTime !== undefined && duration !== undefined) {
        if (mediaType === 'movie' || currentStream.movieMeta?.mediaType === 'movie') {
          saveMovieProgress(id, currentTime, duration);
        } else if (mediaType === 'tv' || currentStream.movieMeta?.mediaType === 'tv') {
          if (season !== undefined && episode !== undefined) {
            saveTvProgress(id, season, episode, currentTime, duration);
          }
        }
      }
    } catch (err) {
      console.warn('Error handling player message:', err);
    }
  };

  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [availableChannels, setAvailableChannels] = useState([]);
  const [selectedSource, setSelectedSource] = useState('provider');
  const [availableSources, setAvailableSources] = useState([]);

  // Add listener for player progress messages
  useEffect(() => {
    window.addEventListener('message', handlePlayerMessage);
    return () => {
      window.removeEventListener('message', handlePlayerMessage);
    };
  }, [currentStream]);

  // useEffect(() => {
  //   if (!currentStream) return;

  //   // Suppress HLS.js console warnings for subtitle errors
  //   const originalConsoleWarn = console.warn;
  //   const originalConsoleError = console.error;
    
  //   console.warn = function(...args) {
  //     const message = args.join(' ');
  //     // Suppress HLS.js subtitle/track errors
  //     if (message.includes('hlsjs') || 
  //         message.includes('.vtt') || 
  //         message.includes('.webvtt') ||
  //         message.includes('trying to recover from network error')) {
  //       return; // Suppress these warnings
  //     }
  //     originalConsoleWarn.apply(console, args);
  //   };

  //   console.error = function(...args) {
  //     const message = args.join(' ');
  //     // Suppress 404 errors for subtitle files
  //     if (message.includes('.vtt') || message.includes('.webvtt')) {
  //       return; // Suppress these errors
  //     }
  //     originalConsoleError.apply(console, args);
  //   };
  //   return () => {
  //     console.warn = originalConsoleWarn;
  //     console.error = originalConsoleError;
  //   };
  // }, [currentStream]);

  useEffect(() => {
    if (!currentStream) {
      setEmbedUrl(null);
      setLoading(false);
      setAvailableChannels([]);
      setSelectedChannelId(null);
      setError(null);
      return;
    }

    // Handle channel selection for Daddy Streams
    if (currentStream.provider === PROVIDER_IDS.DADDY_STREAMS) {
      const channels = Array.isArray(currentStream.channels)
        ? currentStream.channels
        : [];

      setAvailableChannels(channels);

      const initialChannelId =
        currentStream.selectedChannelId ||
        currentStream.channelId ||
        channels[0]?.channel_id ||
        null;

      setSelectedChannelId(initialChannelId ? initialChannelId.toString() : null);
    } else {
      setAvailableChannels([]);
      setSelectedChannelId(null);
    }

    // Handle source selection for GSW streams
    if (currentStream.isGSWStream) {
      if (currentStream.provider === PROVIDER_IDS.STREAMED) {
        // For Streamed, sources are already in the stream object
        const sources = currentStream.sources || [];
        setAvailableSources(sources);
        // Set the primary source (not GSW local) as default
        setSelectedSource(currentStream.primarySource || sources[0] || null);
      } else {
        // For other providers, use provider and gsw-local
        setAvailableSources(['provider', 'gsw-local']);
        setSelectedSource('provider');
      }
    } else {
      setAvailableSources([]);
      setSelectedSource('provider');
    }
  }, [currentStream]);

  useEffect(() => {
    if (!currentStream) {
      return;
    }

    let isActive = true;
    setLoading(true);
    setError(null);

    const loadStream = async () => {
      try {
        let url = null;

        if (currentStream.provider === PROVIDER_IDS.DADDY_STREAMS) {
          if (!Array.isArray(availableChannels) || availableChannels.length === 0) {
            if (!isActive) return;
            setError('No channels available for this stream');
            setLoading(false);
            setEmbedUrl(null);
            return;
          }

          const channelId = selectedChannelId || availableChannels[0]?.channel_id;

          if (!channelId) {
            if (!isActive) return;
            setError('No channel available for this stream');
            setLoading(false);
            setEmbedUrl(null);
            return;
          }

          const providerInstance = new DaddyStreamsProvider();
          url = await providerInstance.getEmbedUrl(currentStream.streamId, channelId, currentStream, selectedSource);
        } else if (currentStream.provider === PROVIDER_IDS.PPTV) {
          const providerInstance = new PPTVProvider();
          url = await providerInstance.getEmbedUrl(currentStream, selectedSource);
        } else if (currentStream.provider === PROVIDER_IDS.SHARK_STREAMS) {
          const providerInstance = new SharkStreamsProvider();
          url = providerInstance.getEmbedUrl(currentStream.streamId, currentStream.channelId, currentStream, selectedSource);
        } else if (currentStream.provider === PROVIDER_IDS.STREAMED) {
          const providerInstance = new StreamedProvider();
          const result = await providerInstance.getEmbedUrl(currentStream, {
            allowAllStreams,
            sourceOverride: selectedSource && typeof selectedSource === 'object' ? selectedSource : undefined
          });
          url = result?.embedUrl || null;
        } else if (currentStream.provider === MOVIE_PROVIDER_ID) {
          url = buildVidkingEmbedUrl(currentStream.movieMeta, currentStream.savedProgress);
        }

        console.log('Resolved embed URL:', { url, stream: currentStream, channelId: selectedChannelId });

        if (!url) {
          if (!isActive) return;
          setError('Unable to load stream URL');
          setLoading(false);
          setEmbedUrl(null);
          return;
        }

        if (!isActive) {
          return;
        }

        setEmbedUrl(url);

        // Rely on the iframe's onLoad to clear the loading state so the player
        // becomes visible as soon as the embed is ready.
        // (Do not use a fixed timeout here.)
      } catch (err) {
        console.error('Error loading stream:', err);
        if (!isActive) {
          return;
        }
        setError('Failed to load stream');
        setLoading(false);
        setEmbedUrl(null);
      }
    };

    loadStream();

    return () => {
      isActive = false;
    };
  }, [currentStream, selectedChannelId, availableChannels, selectedSource]);

  const handleClose = () => {
    setCurrentStream(null);
    setSelectedChannelId(null);
    setAvailableChannels([]);
    setSelectedSource('provider');
    setAvailableSources([]);
    // Dispatch event to notify other components that player closed
    document.dispatchEvent(new CustomEvent('streamPlayerClosed'));
  };

  const handleChannelChange = (event) => {
    setSelectedChannelId(event.target.value);
  };

  const handleSourceChange = (event) => {
    const value = event.target.value;
    
    if (currentStream.provider === PROVIDER_IDS.STREAMED) {
      // For Streamed provider, find the source object
      const source = currentStream.sources?.find(s => 
        s.source === value || (typeof s === 'object' && JSON.stringify(s) === value)
      );
      setSelectedSource(source || value);
    } else {
      // For other providers, use the string value
      setSelectedSource(value);
    }
  };

  const showChannelSelector =
    currentStream?.provider === PROVIDER_IDS.DADDY_STREAMS &&
    availableChannels.length > 1;
  
  const showSourceSelector = currentStream?.isGSWStream && availableSources.length > 1;

  // current selected channel will be derived inline where needed

  if (!currentStream) {
    return null;
  }

  return (
    <Dialog
      fullScreen
      open={Boolean(currentStream)}
      onClose={handleClose}
      sx={{
        '.MuiDialog-paper': {
          backgroundColor: 'background.default'
        }
      }}
    >
      <AppBar position="relative" color="primary">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1, mr: 2 }}>
            {currentStream.name}
          </Typography>
          
          {/* <Chip
            label={currentSelectedChannel?.channel_name || currentStream.tag}
            size="small"
            sx={{ mr: 2, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
          /> */}
          {/* Player controls: fullscreen, play/pause, reload */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              size="small"
              onClick={() => {
                // request fullscreen on the iframe container
                const el = iframeRef.current?.parentElement || iframeRef.current;
                if (el && el.requestFullscreen) {
                  el.requestFullscreen().catch((e) => console.warn('Fullscreen failed', e));
                }
              }}
            >
              <Fullscreen fontSize="small" />
            </IconButton>

            <IconButton
              color="inherit"
              size="small"
              onClick={() => {
                // Toggle visual pause overlay. Many embeds don't expose pause APIs via postMessage.
                // We avoid swapping the iframe src to 'about:blank' which can cause PDF.js or other
                // unintended behaviors. Instead we keep the iframe loaded and show an overlay.
                if (isPlaying) {
                  // attempt to send a pause message (providers may ignore)
                  try {
                    iframeRef.current?.contentWindow?.postMessage({ type: 'pause' }, '*');
                  } catch {
                    /* ignore */
                  }
                  setIsPlaying(false);
                } else {
                  // attempt to send a play message then clear overlay
                  try {
                    iframeRef.current?.contentWindow?.postMessage({ type: 'play' }, '*');
                  } catch {
                    /* ignore */
                  }
                  setIsPlaying(true);
                }
              }}
            >
              {isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
            </IconButton>
          </Box>
          
          {showSourceSelector && (
            <FormControl size="small" sx={{ minWidth: 150, ml: 1 }}>
              <InputLabel sx={{ color: 'white' }}>Source</InputLabel>
              <Select
                value={
                  currentStream.provider === PROVIDER_IDS.STREAMED
                    ? selectedSource?.source || (typeof selectedSource === 'object' ? JSON.stringify(selectedSource) : selectedSource)
                    : selectedSource
                }
                label="Source"
                onChange={handleSourceChange}
                sx={{
                  color: 'white',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.8)',
                  },
                  '.MuiSvgIcon-root': {
                    color: 'white',
                  }
                }}
              >
                {currentStream.provider === PROVIDER_IDS.STREAMED ? (
                  // For Streamed provider, show all sources
                  availableSources.map((source, idx) => (
                    <MenuItem
                      key={`${source.source}-${source.id}-${idx}`}
                      value={source.source || JSON.stringify(source)}
                    >
                      {source.source === 'gsw-local' ? 'GSW Local' : source.source || `Source ${idx + 1}`}
                    </MenuItem>
                  ))
                ) : (
                  // For other providers, show simple source names
                  availableSources.map((source) => (
                    <MenuItem key={source} value={source}>
                      {source === 'provider' ? currentStream.provider.toUpperCase() : 'GSW Local'}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          )}

          {showChannelSelector && (
            <FormControl size="small" sx={{ minWidth: 150, ml: 1 }}>
              <InputLabel sx={{ color: 'white' }}>Channel</InputLabel>
              <Select
                value={selectedChannelId || ''}
                label="Channel"
                onChange={handleChannelChange}
                sx={{
                  color: 'white',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.8)',
                  },
                  '.MuiSvgIcon-root': {
                    color: 'white',
                  }
                }}
              >
                {availableChannels.map((channel) => (
                  <MenuItem
                    key={channel.channel_id}
                    value={channel.channel_id?.toString()}
                  >
                    {channel.channel_name || `Channel ${channel.channel_id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'black',
          position: 'relative',
          width: '100%',
          height: 'calc(100vh - 64px)'
        }}
      >
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2
            }}
          >
            <CircularProgress size={60} />
            <Typography variant="h6" color="white">
              Loading stream...
            </Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ p: 3, maxWidth: 600 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {embedUrl && !error && (
          <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
            <iframe
              ref={iframeRef}
              key={embedUrl}
              src={embedUrl}
              title={currentStream.name}
              tabIndex={0}
              style={{
                width: '100%',
                height: '100%',
                border: 0,
                display: loading ? 'none' : 'block'
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => {
                setLoading(false);
                focusIframe();
              }}
            />

            {/* Pause overlay */}
            {!isPlaying && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  zIndex: 10,
                  pointerEvents: 'none'
                }}
              >
                <Typography variant="h6">Paused</Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Dialog>
  );
};

export default StreamPlayer;
