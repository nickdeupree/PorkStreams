import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Typography
} from '@mui/material';
import { Clear, Search } from '@mui/icons-material';
import StreamCard from './StreamCard';
import { useAppContext } from '../context/AppContext';
import { fetchTrendingTitles, searchMoviesAndShows } from '../services/movieService';
import MovieDetailView from './MovieDetailView';
import ContinueWatching from './ContinueWatching';

const MovieCategoryView = () => {
  const { setCurrentStream } = useAppContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastQuery, setLastQuery] = useState('');
  const [mode, setMode] = useState('trending');
  const [selectedStream, setSelectedStream] = useState(null);

  const loadTitles = useCallback(
    async (term = '') => {
      const trimmed = term.trim();
      setLoading(true);
      setError(null);

      try {
        let items;
        if (trimmed) {
          items = await searchMoviesAndShows(trimmed);
          setMode('search');
          setLastQuery(trimmed);
        } else {
          items = await fetchTrendingTitles();
          setMode('trending');
          setLastQuery('');
        }

        setResults(items);
      } catch (err) {
        console.error('Movie search failed', err);
        setResults([]);
        setError(err.message || 'Failed to load titles. Please try again in a moment.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadTitles();
  }, [loadTitles]);

  const handleSubmit = (event) => {
    event.preventDefault();
    loadTitles(query);
  };

  const handleClear = () => {
    setQuery('');
    loadTitles('');
  };

  const sectionLabel = useMemo(() => {
    if (mode === 'search' && lastQuery) {
      return `Results for "${lastQuery}"`;
    }
    return 'Trending right now';
  }, [mode, lastQuery]);

  const handleStreamSelect = useCallback(
    (stream) => {
      if (stream?.movieMeta?.mediaType === 'tv' || stream?.movieMeta?.mediaType === 'movie') {
        setSelectedStream(stream);
        return;
      }
      setCurrentStream(stream);
    },
    [setCurrentStream]
  );

  const handlePlayRequest = useCallback(
    (stream) => {
      if (!stream) {
        return;
      }
      setCurrentStream(stream);
    },
    [setCurrentStream]
  );

  const handleBackToSearch = useCallback(() => {
    setSelectedStream(null);
  }, []);

  const handleStreamAction = useCallback(
    (updatedStream) => {
      if (!updatedStream) {
        return;
      }
      setSelectedStream(updatedStream);
      setCurrentStream(updatedStream);
    },
    [setCurrentStream]
  );

  if (selectedStream) {
    return (
      <MovieDetailView
        stream={selectedStream}
        onBack={handleBackToSearch}
        onPlay={handlePlayRequest}
        onEpisodeSelect={handleStreamAction}
      />
    );
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
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          mb: 3
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Search movies & shows
        </Typography>

        <TextField
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for a movie or TV show..."
          size="medium"
          autoComplete="off"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: query ? (
              <InputAdornment position="end">
                <IconButton aria-label="Clear search" onClick={handleClear} edge="end" size="small">
                  <Clear />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <ContinueWatching onPlay={handlePlayRequest} />

      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {sectionLabel}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {loading ? 'Updating...' : `${results.length} titles`}
        </Typography>
      </Box>

      {loading ? (
        <Box
          sx={{
            minHeight: 320,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Fetching titles...
            </Typography>
          </Box>
        </Box>
      ) : results.length === 0 ? (
        <Alert severity="info">
          {mode === 'search' && lastQuery
            ? `No matches for "${lastQuery}". Try another title or clear the search to see what's trending.`
            : 'No titles to show yet. Try searching for a favorite movie or series.'}
        </Alert>
      ) : (
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {results.map((stream) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={stream.id} sx={{ display: 'flex', justifyContent: 'center' }}>
              <StreamCard stream={stream} onClick={handleStreamSelect} onPlay={handlePlayRequest} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default MovieCategoryView;
