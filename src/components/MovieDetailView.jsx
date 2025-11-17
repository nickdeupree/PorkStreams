import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Typography
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { fetchMovieDetails } from '../services/movieService';

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

const MovieDetailView = ({ stream, onBack, onPlay }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!stream?.movieMeta?.tmdbId) {
      setError('Missing movie metadata.');
      return;
    }
    let isMounted = true;
    setLoading(true);
    setError(null);
    setDetails(null);

    const loadDetails = async () => {
      try {
        const movieDetails = await fetchMovieDetails(stream.movieMeta.tmdbId);
        if (!isMounted) {
          return;
        }
        setDetails(movieDetails);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        console.error('Failed to load movie details', err);
        setError(err.message || 'Unable to load movie information.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDetails();

    return () => {
      isMounted = false;
    };
  }, [stream]);

  const releaseDate = useMemo(() => {
    if (details?.releaseDate) {
      return formatDate(details.releaseDate);
    }
    if (stream?.movieMeta?.releaseYear) {
      return stream.movieMeta.releaseYear.toString();
    }
    return null;
  }, [details, stream]);
  const runtime = useMemo(() => formatRuntime(details?.runtime), [details]);

  const handlePlayClick = () => {
    onPlay?.(stream);
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
        Back to results
      </Button>

      {loading ? (
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
            Loading movie details...
          </Typography>
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
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
                backgroundImage: `url(${details?.backdrop || stream.backdrop || ''})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.5)',
                opacity: details?.backdrop || stream.backdrop ? 1 : 0
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
                {(details?.poster || stream.poster) && (
                  <CardMedia
                    component="img"
                    image={details?.poster || stream.poster}
                    alt={stream.name}
                    sx={{
                      borderRadius: 2,
                      width: '100%',
                      maxWidth: 320,
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
                      {details?.title || stream.movieMeta?.title || stream.name}
                    </Typography>
                    {details?.tagline && (
                      <Typography variant="subtitle1" color="grey.300">
                        {details.tagline}
                      </Typography>
                    )}
                  </Box>

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {runtime && <Chip label={runtime} color="default" />}
                    {releaseDate && <Chip label={releaseDate} variant="outlined" />}
                    {details?.rating && <Chip label={`${details.rating}/10 TMDB`} color="primary" />}
                  </Stack>

                  {details?.genres?.length > 0 && (
                    <Typography variant="body1" color="grey.200">
                      {details.genres.join(' • ')}
                    </Typography>
                  )}

                  {details?.overview || stream.overview ? (
                    <Typography variant="body1" color="grey.100">
                      {details?.overview || stream.overview}
                    </Typography>
                  ) : null}

                  <Button
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={handlePlayClick}
                    sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
                  >
                    Play movie
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Details
                  </Typography>
                  <Stack spacing={1.5}>
                    {releaseDate && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Release date
                        </Typography>
                        <Typography variant="body1">{releaseDate}</Typography>
                      </Box>
                    )}
                    {runtime && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Runtime
                        </Typography>
                        <Typography variant="body1">{runtime}</Typography>
                      </Box>
                    )}
                    {details?.status && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Status
                        </Typography>
                        <Typography variant="body1">{details.status}</Typography>
                      </Box>
                    )}
                    {details?.spokenLanguages?.length > 0 && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Languages
                        </Typography>
                        <Typography variant="body1">{details.spokenLanguages.join(', ')}</Typography>
                      </Box>
                    )}
                    {details?.homepage && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Official site
                        </Typography>
                        <Typography
                          variant="body1"
                          component="a"
                          href={details.homepage}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {details.homepage}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {(details?.budget || details?.revenue) ? (
              <Grid item xs={12} md={5}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Box office
                    </Typography>
                    <Stack spacing={1.5}>
                      {details?.budget ? (
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Budget
                          </Typography>
                          <Typography variant="body1">{formatCurrency(details.budget) || 'Unknown'}</Typography>
                        </Box>
                      ) : null}
                      {details?.revenue ? (
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Revenue
                          </Typography>
                          <Typography variant="body1">{formatCurrency(details.revenue) || 'Unknown'}</Typography>
                        </Box>
                      ) : null}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ) : null}
          </Grid>
        </>
      )}
    </Box>
  );
};

export default MovieDetailView;
