import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardMedia
} from '@mui/material';
import { getContinueWatchingItems } from '../services/watchProgressService';
import { fetchMovieDetails, fetchTvSeriesDetails, fetchTvSeasonEpisodes } from '../services/movieService';

const ContinueWatchingCard = ({ item, onPlay }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        if (item.type === 'movie') {
          const movieDetails = await fetchMovieDetails(item.tmdbId);
          setDetails({
            ...movieDetails,
            type: 'movie',
            title: movieDetails.title,
            image: movieDetails.backdrop,
            progress: item.progress
          });
        } else if (item.type === 'tv') {
          const seriesDetails = await fetchTvSeriesDetails(item.tmdbId);
          const episodes = await fetchTvSeasonEpisodes(item.tmdbId, item.season);
          const episode = episodes.find(ep => ep.episodeNumber === item.episode);

          setDetails({
            ...seriesDetails,
            type: 'tv',
            title: seriesDetails.name,
            episodeTitle: episode?.name || `Episode ${item.episode}`,
            season: item.season,
            episode: item.episode,
            image: episode?.stillPath || seriesDetails.poster,
            rating: seriesDetails.voteAverage,
            progress: item.progress
          });
        }
      } catch (error) {
        console.error('Failed to load continue watching details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [item]);

  const handlePlay = () => {
    if (details && onPlay) {
      const streamData = {
        id: `${details.type}-${details.id}`,
        provider: 'movies',
        name: details.type === 'movie' ? details.title : details.title,
        tag: details.type === 'movie' ? 'Movie' : 'TV Show',
        poster: details.image,
        backdrop: details.backdrop,
        always_live: true,
        hideSchedule: true,
        startsAt: Date.now(),
        channels: [{ channel_id: 'vidking', channel_name: 'Play' }],
        selectedChannelId: 'vidking',
        movieMeta: {
          tmdbId: details.id,
          mediaType: details.type,
          title: details.title,
          releaseYear: details.releaseYear,
          overview: details.overview,
          ...(details.type === 'tv' && {
            seasonNumber: details.season,
            episodeNumber: details.episode,
            episodeTitle: details.episodeTitle
          })
        },
        overview: details.overview,
        rating: details.rating,
        savedProgress: item
      };
      onPlay(streamData);
    }
  };

  if (loading || !details) {
    return (
      <Card sx={{ minWidth: 200, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">Loading...</Typography>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        minWidth: 200,
        height: 120,
        display: 'flex',
        position: 'relative',
        cursor: 'pointer',
        '&:hover': { boxShadow: 3 }
      }}
      onClick={handlePlay}
    >
      <CardMedia
        component="img"
        image={details.image}
        alt={details.title}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
        onError={(e) => {
          e.target.src = '/placeholder-image.png'; // Fallback image
        }}
      />
      {/* Overlay with title information */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          p: 1
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2, mb: 0.5 }}>
          {details.type === 'movie' ? details.title : details.title}
        </Typography>
        {details.type === 'tv' && (
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            S{details.season}E{details.episode}
          </Typography>
        )}
      </Box>
    </Card>
  );
};

const ContinueWatching = ({ onPlay }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const continueWatchingItems = getContinueWatchingItems();
        setItems(continueWatchingItems);
      } catch (error) {
        console.error('Failed to load continue watching items:', error);
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, []);

  if (loading) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Continue Watching</Typography>
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
          {[...Array(3)].map((_, i) => (
            <Card key={i} sx={{ minWidth: 200, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">Loading...</Typography>
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

  if (items.length === 0) {
    return null; // Don't show if no items
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Continue Watching</Typography>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 1,
          '&::-webkit-scrollbar': {
            height: 6,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'action.hover',
            borderRadius: 3,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'action.selected',
            borderRadius: 3,
          }
        }}
      >
        {items.map((item) => (
          <ContinueWatchingCard
            key={`${item.type}-${item.tmdbId}${item.type === 'tv' ? `-${item.season}-${item.episode}` : ''}`}
            item={item}
            onPlay={onPlay}
          />
        ))}
      </Box>
    </Box>
  );
};

export default ContinueWatching;