import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography
} from '@mui/material';
import {
  fetchTvSeasonEpisodes,
  fetchTvSeriesDetails
} from '../services/movieService';

const sortSeasons = (seasons = []) => {
  return [...seasons].sort((a, b) => (a.seasonNumber ?? 0) - (b.seasonNumber ?? 0));
};

const TvEpisodePickerDialog = ({ open, stream, onClose, onConfirm }) => {
  const [seriesDetails, setSeriesDetails] = useState(null);
  const [seasonEpisodes, setSeasonEpisodes] = useState({});
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedEpisode, setSelectedEpisode] = useState('');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [episodesError, setEpisodesError] = useState(null);

  useEffect(() => {
    if (!open) {
      setSeriesDetails(null);
      setSelectedSeason('');
      setSelectedEpisode('');
      setSeasonEpisodes({});
      setLoadingDetails(false);
      setLoadingEpisodes(false);
      setDetailsError(null);
      setEpisodesError(null);
      return;
    }

    if (!stream || !stream.movieMeta?.tmdbId) {
      setDetailsError('Missing TV show metadata.');
      return;
    }

    let isMounted = true;
    setLoadingDetails(true);
    setDetailsError(null);

    const loadDetails = async () => {
      try {
        const details = await fetchTvSeriesDetails(stream.movieMeta.tmdbId);
        if (!isMounted) {
          return;
        }

        setSeriesDetails(details);
        const sorted = sortSeasons(details.seasons);
        const preferredSeason =
          sorted.find((season) => season.episodeCount > 0)?.seasonNumber ||
          sorted[0]?.seasonNumber;

        setSelectedSeason(
          preferredSeason !== undefined && preferredSeason !== null
            ? preferredSeason.toString()
            : ''
        );
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
  }, [open, stream]);

  useEffect(() => {
    if (!open || !stream?.movieMeta?.tmdbId || !selectedSeason) {
      setSelectedEpisode('');
      setEpisodesError(null);
      setLoadingEpisodes(false);
      return;
    }

    if (seasonEpisodes[selectedSeason]) {
      const firstEpisode = seasonEpisodes[selectedSeason][0];
      setSelectedEpisode((prev) => (prev ? prev : firstEpisode ? firstEpisode.episodeNumber.toString() : ''));
      return;
    }

    let isMounted = true;
    setLoadingEpisodes(true);
    setEpisodesError(null);

    const loadEpisodes = async () => {
      try {
        const episodes = await fetchTvSeasonEpisodes(
          stream.movieMeta.tmdbId,
          Number(selectedSeason)
        );
        if (!isMounted) {
          return;
        }
        setSeasonEpisodes((prev) => ({
          ...prev,
          [selectedSeason]: episodes
        }));
        setSelectedEpisode(episodes[0] ? episodes[0].episodeNumber.toString() : '');
      } catch (err) {
        if (!isMounted) {
          return;
        }
        console.error('Failed to load TV season', err);
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
  }, [open, stream, selectedSeason, seasonEpisodes]);

  const seasonList = useMemo(() => sortSeasons(seriesDetails?.seasons || []), [seriesDetails]);
  const episodesForSeason = useMemo(
    () => seasonEpisodes[selectedSeason] || [],
    [seasonEpisodes, selectedSeason]
  );

  const handleConfirm = () => {
    if (!stream || !selectedSeason || !selectedEpisode) {
      return;
    }

    const selectedEpisodeData = episodesForSeason.find(
      (episode) => episode.episodeNumber === Number(selectedEpisode)
    );

    const updatedStream = {
      ...stream,
      movieMeta: {
        ...stream.movieMeta,
        seasonNumber: Number(selectedSeason),
        episodeNumber: Number(selectedEpisode),
        episodeTitle: selectedEpisodeData?.name
      }
    };

    onConfirm?.(updatedStream);
  };

  const disableConfirm =
    !selectedSeason || !selectedEpisode || loadingDetails || loadingEpisodes || !!detailsError;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Select Season & Episode</DialogTitle>
      <DialogContent dividers>
        {loadingDetails ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 160
            }}
          >
            <CircularProgress />
          </Box>
        ) : detailsError ? (
          <Alert severity="error">{detailsError}</Alert>
        ) : (
          <>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {stream?.name || stream?.movieMeta?.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select the season and episode you want to watch. Episode titles come directly from
              TMDB.
            </Typography>

            {seasonList.length === 0 ? (
              <Alert severity="info">No season information is available for this show.</Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <FormControl fullWidth>
                  <InputLabel id="season-select-label">Season</InputLabel>
                  <Select
                    labelId="season-select-label"
                    label="Season"
                    value={selectedSeason}
                    onChange={(event) => {
                      setSelectedSeason(event.target.value);
                      setSelectedEpisode('');
                      setEpisodesError(null);
                    }}
                  >
                    {seasonList.map((season) => (
                      <MenuItem key={season.id || season.seasonNumber} value={season.seasonNumber?.toString()}>
                        {season.name || `Season ${season.seasonNumber}`}
                        {season.episodeCount ? ` (${season.episodeCount} episodes)` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth disabled={!selectedSeason || loadingEpisodes}>
                  <InputLabel id="episode-select-label">Episode</InputLabel>
                  <Select
                    labelId="episode-select-label"
                    label="Episode"
                    value={selectedEpisode}
                    onChange={(event) => setSelectedEpisode(event.target.value)}
                  >
                    {episodesForSeason.map((episode) => (
                      <MenuItem
                        key={episode.id || episode.episodeNumber}
                        value={episode.episodeNumber?.toString()}
                      >
                        {`Episode ${episode.episodeNumber}: ${episode.name}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {loadingEpisodes && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                      Loading episodes...
                    </Typography>
                  </Box>
                )}

                {episodesError && <Alert severity="error">{episodesError}</Alert>}

                {!loadingEpisodes && !episodesError && selectedSeason && episodesForSeason.length === 0 && (
                  <Alert severity="warning">No episodes found for this season.</Alert>
                )}
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={disableConfirm}>
          Start Watching
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TvEpisodePickerDialog;
