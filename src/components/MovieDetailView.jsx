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
  Chip,
  Collapse,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
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
import { fetchMovieDetails, fetchTvSeriesDetails, fetchTvSeasonEpisodes } from '../services/movieService';
import { getMovieProgress, clearMovieProgress, getTvProgress, clearTvProgress, getLastWatchedEpisode } from '../services/watchProgressService';

const formatRuntime = (runtime) => {
  if (!runtime || Number.isNaN(Number(runtime))) {
    return null;
  }
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  if (!hours) {
    return `${minutes}m`;
  }
  if (!minutes) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
};

const formatDate = (value) => {
  if (!value) {
    return 'Unknown';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  // For TV shows, use short format. For movies, use long format.
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatDateLong = (value) => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatCurrency = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return null;
  }
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
};

const sortSeasons = (seasons = []) => [...seasons].sort((a, b) => (a.seasonNumber ?? 0) - (b.seasonNumber ?? 0));

const MovieDetailView = ({ stream, onBack, onPlay, onEpisodeSelect }) => {
  // Movie state
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedProgress, setSavedProgress] = useState(null);

  // TV show state
  const [seriesDetails, setSeriesDetails] = useState(null);
  const [seasonEpisodes, setSeasonEpisodes] = useState({});
  const [selectedSeason, setSelectedSeason] = useState('');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [episodesError, setEpisodesError] = useState(null);
  const [seasonDetailsOpen, setSeasonDetailsOpen] = useState(false);

  const isTvShow = stream?.movieMeta?.mediaType === 'tv';
  const scrollPositionRef = useRef(0);
  const pendingScrollRestoreRef = useRef(false);

  // Load saved progress when stream changes
  useEffect(() => {
    if (!stream?.movieMeta?.tmdbId) {
      setSavedProgress(null);
      return;
    }

    if (isTvShow) {
      const lastEpisode = getLastWatchedEpisode(stream.movieMeta.tmdbId);
      setSavedProgress(lastEpisode);
    } else {
      const progress = getMovieProgress(stream.movieMeta.tmdbId);
      setSavedProgress(progress);
    }
  }, [stream?.movieMeta?.tmdbId, isTvShow]);

  useEffect(() => {
    if (!stream?.movieMeta?.tmdbId) {
      setError(isTvShow ? 'Missing TV show metadata.' : 'Missing movie metadata.');
      return;
    }
    console.log('Stream:', stream);
    let isMounted = true;
    setLoading(true);
    setError(null);
    setDetails(null);
    setLoadingDetails(true);
    setSeriesDetails(null);
    setSeasonEpisodes({});
    setEpisodesError(null);

    const loadDetails = async () => {
      try {
        if (isTvShow) {
          const tvDetails = await fetchTvSeriesDetails(stream.movieMeta.tmdbId);
          if (!isMounted) {
            return;
          }
          setSeriesDetails(tvDetails);
          console.log('Series details:', tvDetails);
          const lastEpisode = getLastWatchedEpisode(stream.movieMeta.tmdbId);
          setSavedProgress(lastEpisode);
          const sortedSeasons = sortSeasons(tvDetails.seasons);
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
        } else {
          const movieDetails = await fetchMovieDetails(stream.movieMeta.tmdbId);
          if (!isMounted) {
            return;
          }
          setDetails(movieDetails);
          console.log('Movie details:', movieDetails);
        }
      } catch (err) {
        if (!isMounted) {
          return;
        }
        console.error('Failed to load details', err);
        setError(err.message || (isTvShow ? 'Failed to load series details.' : 'Unable to load movie information.'));
      } finally {
        if (isMounted) {
          setLoading(false);
          setLoadingDetails(false);
        }
      }
    };

    loadDetails();

    return () => {
      isMounted = false;
    };
  }, [stream?.movieMeta?.tmdbId, isTvShow]);

  const releaseDate = useMemo(() => {
    if (isTvShow) {
      if (seriesDetails?.firstAirDate) {
        return formatDateLong(seriesDetails.firstAirDate);
      }
      if (stream?.movieMeta?.releaseYear) {
        return stream.movieMeta.releaseYear.toString();
      }
      return null;
    } else {
      if (details?.releaseDate) {
        return formatDateLong(details.releaseDate);
      }
      if (stream?.movieMeta?.releaseYear) {
        return stream.movieMeta.releaseYear.toString();
      }
      return null;
    }
  }, [details, stream, isTvShow, seriesDetails]);
  const runtime = useMemo(() => (!isTvShow ? formatRuntime(details?.runtime) : null), [details, isTvShow]);
  const rating = useMemo(() => (isTvShow ? seriesDetails?.voteAverage : details?.rating), [isTvShow, seriesDetails, details]);
  const genres = useMemo(() => (isTvShow ? seriesDetails?.genres : details?.genres), [isTvShow, seriesDetails, details]);

  // TV Show specific effects and handlers
  useEffect(() => {
    if (!isTvShow || !stream?.movieMeta?.tmdbId || !selectedSeason) {
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
  }, [selectedSeason, stream, seasonEpisodes, isTvShow]);

  const sortedSeasons = useMemo(() => (isTvShow ? sortSeasons(seriesDetails?.seasons || []) : []), [seriesDetails, isTvShow]);
  const selectedSeasonData = useMemo(
    () => (isTvShow ? sortedSeasons.find((season) => season.seasonNumber === Number(selectedSeason)) : null),
    [sortedSeasons, selectedSeason, isTvShow]
  );
  const episodes = isTvShow ? seasonEpisodes[selectedSeason] || [] : [];

  // Reload saved progress when player closes
  useEffect(() => {
    const handlePlayerClosed = () => {
      if (stream?.movieMeta?.tmdbId) {
        if (isTvShow) {
          const lastEpisode = getLastWatchedEpisode(stream.movieMeta.tmdbId);
          setSavedProgress(lastEpisode);
          // Update selected season if saved progress indicates a different season
          if (lastEpisode?.season && sortedSeasons.some((s) => s.seasonNumber === lastEpisode.season)) {
            setSelectedSeason(lastEpisode.season.toString());
          }
        } else {
          const progress = getMovieProgress(stream.movieMeta.tmdbId);
          setSavedProgress(progress);
        }
      }
    };

    document.addEventListener('streamPlayerClosed', handlePlayerClosed);
    return () => document.removeEventListener('streamPlayerClosed', handlePlayerClosed);
  }, [stream?.movieMeta?.tmdbId, sortedSeasons, isTvShow]);

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

  const toggleSeasonDetails = () => setSeasonDetailsOpen((open) => !open);

  const handlePlayClick = () => {
    if (isTvShow) {
      // Resume from saved progress if available, otherwise start from season 1 episode 1
      if (!stream?.movieMeta?.tmdbId) {
        return;
      }

      if (savedProgress) {
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
      } else {
        // Start from season 1 episode 1
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
      }
    } else {
      // Movie play
      const streamToPlay = { ...stream };
      if (savedProgress) {
        streamToPlay.savedProgress = savedProgress;
      }
      onPlay?.(streamToPlay);
    }
  };

  const handlePlayFromBeginning = () => {
    if (isTvShow) {
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
    } else {
      // Movie play from beginning
      if (stream?.movieMeta?.tmdbId) {
        clearMovieProgress(stream.movieMeta.tmdbId);
      }
      const streamToPlay = { ...stream };
      streamToPlay.savedProgress = null;
      onPlay?.(streamToPlay);
    }
  };

  if (!stream) {
    return null;
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        p: { xs: 2, sm: 3 }
      }}
    >
      <Button onClick={onBack} startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Back {isTvShow ? 'to search' : 'to results'}
      </Button>

      {loading || loadingDetails ? (
        <Box
          sx={{
            minHeight: 360,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <CircularProgress size={48} />
          <Typography variant="body1" color="text.secondary">
            {isTvShow ? 'Loading series details...' : 'Loading movie details...'}
          </Typography>
        </Box>
      ) : error || detailsError ? (
        <Alert severity="error">{error || detailsError}</Alert>
      ) : (
        <>
          <Box
            sx={{
              position: 'relative',
              borderRadius: 2,
              overflow: 'hidden',
              mb: 4,
              minHeight: { xs: 320, md: 420 },
              backgroundColor: 'grey.900'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${
                  isTvShow ? (seriesDetails?.backdrop || stream.backdrop || '') : (details?.backdrop || stream.backdrop || '')
                })`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.5)',
                opacity: (isTvShow ? (seriesDetails?.backdrop || stream.backdrop) : (details?.backdrop || stream.backdrop)) ? 1 : 0
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, rgba(0,0,0,0.85), rgba(0,0,0,0.55) 60%, rgba(0,0,0,0))'
              }}
            />

            <Grid container spacing={3} sx={{ position: 'relative', zIndex: 1, p: { xs: 3, md: 5 } }}>
              <Grid item xs={12} md={4}>
                {(isTvShow ? (seriesDetails?.poster || stream.poster) : (details?.poster || stream.poster)) && (
                  <CardMedia
                    component="img"
                    image={isTvShow ? (seriesDetails?.poster || stream.poster) : (details?.poster || stream.poster)}
                    alt={stream.name}
                    sx={{
                      borderRadius: 2,
                      width: '100%',
                      maxWidth: 300,
                      mx: 'auto',
                      display: 'block'
                    }}
                  />
                )}
              </Grid>
              <Grid item xs={12} md={8} sx={{ color: 'common.white' }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {isTvShow ? (seriesDetails?.name || stream.name) : (details?.title || stream.movieMeta?.title || stream.name)}
                    </Typography>
                    {(isTvShow ? seriesDetails?.tagline : details?.tagline) && (
                      <Typography variant="subtitle1" color="grey.300">
                        {isTvShow ? seriesDetails?.tagline : details?.tagline}
                      </Typography>
                    )}
                  </Box>

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {runtime && <Chip label={runtime} color="default" />}
                    {releaseDate && <Chip label={releaseDate} variant="outlined" />}
                    {rating && <Chip label={`${rating}/10 TMDB`} color="primary" />}
                  </Stack>

                  {genres?.length > 0 && (
                    <Typography variant="body1" color="grey.200">
                      {genres.join(' • ')}
                    </Typography>
                  )}

                  {(isTvShow ? seriesDetails?.overview : (details?.overview || stream.overview)) && (
                    <Typography variant="body1" color="grey.100">
                      {isTvShow ? seriesDetails?.overview : (details?.overview || stream.overview)}
                    </Typography>
                  )}

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Button
                      variant="contained"
                      size="medium"
                      startIcon={<PlayArrowIcon />}
                      onClick={handlePlayClick}
                    >
                      {isTvShow ? (savedProgress ? `Resume (S${savedProgress.season}E${savedProgress.episode})` : 'Start watching') : (savedProgress ? 'Resume' : 'Play movie')}
                    </Button>
                    {savedProgress && (
                      <Button
                        variant="outlined"
                        size="medium"
                        startIcon={<RestartAltIcon />}
                        onClick={handlePlayFromBeginning}
                      >
                        {isTvShow ? 'Start from beginning' : 'Start from beginning'}
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Grid>
            </Grid>
          </Box>

          {isTvShow ? (
            <>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  mb: 4
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
          ) : (
<>
  </>          )}
        </>
      )}
    </Box>
  );
};

export default MovieDetailView;
