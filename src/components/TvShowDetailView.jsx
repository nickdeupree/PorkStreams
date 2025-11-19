import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardHeader,
  CardMedia,
  Collapse,
  IconButton,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { fetchTvSeasonEpisodes, fetchTvSeriesDetails } from '../services/movieService';
import { getTvProgress, clearTvProgress, getLastWatchedEpisode } from '../services/watchProgressService';

const sortSeasons = (seasons = []) => [...seasons].sort((a, b) => (a.seasonNumber ?? 0) - (b.seasonNumber ?? 0));

const formatDate = (value) => {
  if (!value) {
    return 'Unknown';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const TvShowDetailView = ({ stream, onBack, onEpisodeSelect }) => {
  const [seriesDetails, setSeriesDetails] = useState(null);
  const [seasonEpisodes, setSeasonEpisodes] = useState({});
  const [selectedSeason, setSelectedSeason] = useState('');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [episodesError, setEpisodesError] = useState(null);
  const [seasonDetailsOpen, setSeasonDetailsOpen] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);

  const showTitle = stream?.name || stream?.movieMeta?.title || 'TV Show';
  const scrollPositionRef = useRef(0);
  const pendingScrollRestoreRef = useRef(false);

  // Load saved progress when stream changes
  useEffect(() => {
    if (!stream?.movieMeta?.tmdbId) {
      setSavedProgress(null);
      return;
    }

    const lastEpisode = getLastWatchedEpisode(stream.movieMeta.tmdbId);
    setSavedProgress(lastEpisode);
  }, [stream?.movieMeta?.tmdbId]);

  useEffect(() => {
    if (!stream) {
      return;
    }
    if (!stream.movieMeta?.tmdbId) {
      setDetailsError('Missing TV show metadata.');
      return;
    }
    let isMounted = true;
    setLoadingDetails(true);
    setDetailsError(null);
    setSeriesDetails(null);
    setSeasonEpisodes({});
    setEpisodesError(null);

    const loadDetails = async () => {
      try {
        const details = await fetchTvSeriesDetails(stream.movieMeta.tmdbId);
        if (!isMounted) {
          return;
        }
        setSeriesDetails(details);
        const lastEpisode = getLastWatchedEpisode(stream.movieMeta.tmdbId);
        setSavedProgress(lastEpisode);
        const sortedSeasons = sortSeasons(details.seasons);
        const preferredSeason =
          sortedSeasons.find((season) => season.episodeCount > 0)?.seasonNumber ??
          sortedSeasons[0]?.seasonNumber;
        let initialSeason = '';
        if (lastEpisode?.season && sortedSeasons.some((s) => s.seasonNumber === lastEpisode.season)) {
          initialSeason = lastEpisode.season.toString();
        } else if (preferredSeason !== undefined && preferredSeason !== null) {
          initialSeason = preferredSeason.toString();
        }
        setSelectedSeason(initialSeason);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        console.error('Failed to load TV series details', err);
        setDetailsError(err.message || 'Failed to load series details.');
      } finally {
        if (isMounted) {
          setLoadingDetails(false);
        }
      }
    };

    loadDetails();

    return () => {
      isMounted = false;
    };
  }, [stream]);

  useEffect(() => {
    if (!stream?.movieMeta?.tmdbId || !selectedSeason) {
      setEpisodesError(null);
      setLoadingEpisodes(false);
      return;
    }

    if (seasonEpisodes[selectedSeason]) {
      return;
    }

    let isMounted = true;
    setLoadingEpisodes(true);
    setEpisodesError(null);

    const loadEpisodes = async () => {
      try {
        const episodes = await fetchTvSeasonEpisodes(stream.movieMeta.tmdbId, Number(selectedSeason));
        if (!isMounted) {
          return;
        }
        setSeasonEpisodes((prev) => ({
          ...prev,
          [selectedSeason]: episodes
        }));
      } catch (err) {
        if (!isMounted) {
          return;
        }
        console.error('Failed to load TV episode list', err);
        setEpisodesError(err.message || 'Failed to load episodes for this season.');
      } finally {
        if (isMounted) {
          setLoadingEpisodes(false);
        }
      }
    };

    loadEpisodes();

    return () => {
      isMounted = false;
    };
  }, [selectedSeason, stream, seasonEpisodes]);

  const sortedSeasons = useMemo(() => sortSeasons(seriesDetails?.seasons || []), [seriesDetails]);
  const selectedSeasonData = useMemo(
    () => sortedSeasons.find((season) => season.seasonNumber === Number(selectedSeason)),
    [sortedSeasons, selectedSeason]
  );
  const episodes = seasonEpisodes[selectedSeason] || [];

  // Reload saved progress when player closes
  useEffect(() => {
    const handlePlayerClosed = () => {
      if (stream?.movieMeta?.tmdbId) {
        const lastEpisode = getLastWatchedEpisode(stream.movieMeta.tmdbId);
        setSavedProgress(lastEpisode);
        // Update selected season if saved progress indicates a different season
        if (lastEpisode?.season && sortedSeasons.some((s) => s.seasonNumber === lastEpisode.season)) {
          setSelectedSeason(lastEpisode.season.toString());
        }
      }
    };

    document.addEventListener('streamPlayerClosed', handlePlayerClosed);
    return () => document.removeEventListener('streamPlayerClosed', handlePlayerClosed);
  }, [stream?.movieMeta?.tmdbId]);

  const handleSeasonChange = (event) => {
    const seasonNumber = event.target.value;
    if (typeof window !== 'undefined') {
      scrollPositionRef.current = window.scrollY;
      pendingScrollRestoreRef.current = true;
    }
    setSelectedSeason(seasonNumber);
  };

  useEffect(() => {
    if (loadingEpisodes || !pendingScrollRestoreRef.current) {
      return;
    }
    if (!seasonEpisodes[selectedSeason]) {
      return;
    }
    if (typeof window === 'undefined') {
      pendingScrollRestoreRef.current = false;
      return;
    }
    window.scrollTo({ top: scrollPositionRef.current, behavior: 'auto' });
    pendingScrollRestoreRef.current = false;
  }, [loadingEpisodes, seasonEpisodes, selectedSeason]);

  const handleEpisodeClick = (episode) => {
    if (!episode || !selectedSeason || !stream) {
      return;
    }

    const updatedStream = {
      ...stream,
      movieMeta: {
        ...stream.movieMeta,
        seasonNumber: Number(selectedSeason),
        episodeNumber: episode.episodeNumber,
        episodeTitle: episode.name
      }
    };

    onEpisodeSelect?.(updatedStream);
  };

  const handlePlayClick = () => {
    // Resume from saved progress if available
    if (!savedProgress || !stream?.movieMeta?.tmdbId) {
      return;
    }

    const updatedStream = {
      ...stream,
      movieMeta: {
        ...stream.movieMeta,
        seasonNumber: savedProgress.season,
        episodeNumber: savedProgress.episode,
        episodeTitle: `Season ${savedProgress.season} Episode ${savedProgress.episode}`
      },
      savedProgress
    };

    onEpisodeSelect?.(updatedStream);
  };

  const handlePlayFromBeginning = () => {
    // Clear all TV progress and start from season 1 episode 1
    if (stream?.movieMeta?.tmdbId) {
      clearTvProgress(stream.movieMeta.tmdbId);
    }

    // Set to first episode of first season
    const firstSeason = sortedSeasons[0]?.seasonNumber ?? 1;
    const updatedStream = {
      ...stream,
      movieMeta: {
        ...stream.movieMeta,
        seasonNumber: firstSeason,
        episodeNumber: 1,
        episodeTitle: 'Season 1 Episode 1'
      },
      savedProgress: null
    };

    onEpisodeSelect?.(updatedStream);
  };

  const toggleSeasonDetails = () => setSeasonDetailsOpen((open) => !open);

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        p: { xs: 2, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 3
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Button onClick={onBack} startIcon={<ArrowBackIcon />}>
          Back to search
        </Button>
      </Box>

      {loadingDetails ? (
        <Box
          sx={{
            minHeight: 320,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <CircularProgress />
        </Box>
      ) : detailsError ? (
        <Alert severity="error">{detailsError}</Alert>
      ) : (
        <>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 3,
              alignItems: { xs: 'flex-start', md: 'center' }
            }}
          >
            {seriesDetails?.poster && (
              <Box
                component="img"
                src={seriesDetails.poster}
                alt={seriesDetails.name}
                sx={{
                  width: { xs: '100%', sm: '280px', md: '220px' },
                  borderRadius: 2,
                  boxShadow: 3,
                  objectFit: 'cover'
                }}
              />
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {showTitle}
              </Typography>
              {seriesDetails?.tagline && (
                <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                  {seriesDetails.tagline}
                </Typography>
              )}
              {seriesDetails?.overview && (
                <Typography variant="body1" sx={{ mt: 2 }}>
                  {seriesDetails.overview}
                </Typography>
              )}
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {savedProgress && (
                  <Button
                    variant="contained"
                    size="medium"
                    startIcon={<PlayArrowIcon />}
                    onClick={handlePlayClick}
                  >
                    Resume (S{savedProgress.season}E{savedProgress.episode})
                  </Button>
                )}
                <Button
                  variant={savedProgress ? 'outlined' : 'contained'}
                  size="medium"
                  startIcon={savedProgress ? <RestartAltIcon /> : <PlayArrowIcon />}
                  onClick={handlePlayFromBeginning}
                >
                  {savedProgress ? 'Start from beginning' : 'Start watching'}
                </Button>
              </Stack>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3
            }}
          >
            {selectedSeasonData && (
              <Card sx={{ overflow: 'hidden' }}>
                <CardHeader
                  title={selectedSeasonData.name || `Season ${selectedSeasonData.seasonNumber}`}
                  subheader={`${selectedSeasonData.episodeCount || 0} episodes`}
                  onClick={toggleSeasonDetails}
                  sx={{ cursor: 'pointer' }}
                  action={
                    <IconButton
                      onClick={toggleSeasonDetails}
                      aria-expanded={seasonDetailsOpen}
                      aria-label={seasonDetailsOpen ? 'Collapse season details' : 'Expand season details'}
                    >
                      <ExpandMoreIcon
                        sx={{ transform: seasonDetailsOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                      />
                    </IconButton>
                  }
                />
                <Collapse in={seasonDetailsOpen} timeout="auto" unmountOnExit>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                    {selectedSeasonData.poster && (
                      <CardMedia
                        component="img"
                        image={selectedSeasonData.poster}
                        alt={selectedSeasonData.name}
                        sx={{ width: { xs: '100%', sm: 220 }, objectFit: 'cover' }}
                      />
                    )}
                    <CardContent sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Premiered {formatDate(selectedSeasonData.airDate)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedSeasonData.episodeCount || 0} episodes
                      </Typography>
                      {selectedSeasonData.overview && (
                        <Typography variant="body1" sx={{ mt: 2 }}>
                          {selectedSeasonData.overview}
                        </Typography>
                      )}
                    </CardContent>
                  </Box>
                </Collapse>
              </Card>
            )}
            <FormControl fullWidth>
              <InputLabel id="season-selector-label">Season</InputLabel>
              <Select
                labelId="season-selector-label"
                value={selectedSeason}
                label="Season"
                onChange={handleSeasonChange}
              >
                {sortedSeasons.map((season) => (
                  <MenuItem key={season.id || season.seasonNumber} value={season.seasonNumber?.toString()}>
                    {season.name || `Season ${season.seasonNumber}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Episodes
            </Typography>
            {loadingEpisodes && episodes.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Loading episodes...
                </Typography>
              </Box>
            ) : episodesError ? (
              <Alert severity="error">{episodesError}</Alert>
            ) : episodes.length === 0 ? (
              <Alert severity="info">No episode information is available for this season.</Alert>
            ) : (
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                {episodes.map((episode) => (
                  <Grid item xs={12} sm={6} md={4} key={episode.id || episode.episodeNumber}>
                    <Card
                      sx={{
                        width: 345,
                        height: 300,
                        display: 'flex'
                      }}
                    >
                      <CardActionArea
                        onClick={() => handleEpisodeClick(episode)}
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'stretch',
                          textAlign: 'left'
                        }}
                      >
                        <Box
                          sx={{
                            position: 'relative',
                            height: 140,
                            width: '100%',
                            backgroundColor: 'grey.900',
                            overflow: 'hidden'
                          }}
                        >
                          <Box
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              backgroundImage: episode.stillPath ? `url(${episode.stillPath})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              filter: episode.stillPath ? 'brightness(0.85)' : 'none'
                            }}
                          />
                          <Box
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.1))'
                            }}
                          />
                          <Box
                            sx={{
                              position: 'relative',
                              height: '100%',
                              width: '100%',
                              display: 'flex',
                              alignItems: 'flex-end',
                              p: 1.5
                            }}
                          >
                            <Typography variant="subtitle2" color="common.white" sx={{ fontWeight: 600 }}>
                              Episode {episode.episodeNumber}
                            </Typography>
                          </Box>
                        </Box>
                        <CardContent
                          sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.5,
                            p: 2
                          }}
                        >
                          <Typography variant="subtitle2" color="text.secondary">
                            {formatDate(episode.airDate)}
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              fontWeight: 600,
                              fontSize: '1rem'
                            }}
                          >
                            {episode.name}
                            <PlayArrowIcon fontSize="small" />
                          </Typography>
                          {episode.overview && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}
                            >
                              {episode.overview}
                            </Typography>
                          )}
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default TvShowDetailView;
