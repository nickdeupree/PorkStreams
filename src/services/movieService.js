const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
const VIDKING_EMBED_BASE = 'https://www.vidking.net/embed';
const MOVIE_MEDIA_TYPES = new Set(['movie', 'tv']);
const FALLBACK_TMDB_KEY = 'a0b5fe2ca866e595c7d477885ba01602';

export const MOVIE_PROVIDER_ID = 'movies';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || FALLBACK_TMDB_KEY;

const ensureApiKey = () => {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB API key is not configured');
  }
  return TMDB_API_KEY;
};

const buildImageUrl = (path, size = 'w500') => {
  if (!path) {
    return null;
  }
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

const fetchFromTmdb = async (endpoint, params = {}) => {
  const apiKey = ensureApiKey();
  const url = new URL(`${TMDB_API_BASE}${endpoint}`);
  const search = new URLSearchParams({
    api_key: apiKey,
    language: 'en-US',
    include_adult: 'false',
    ...params
  });

  url.search = search.toString();
  const response = await fetch(url.toString());

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`TMDB request failed: ${response.status} ${response.statusText} - ${message}`);
  }

  return response.json();
};

const formatResultAsStream = (result) => {
  if (!result || !MOVIE_MEDIA_TYPES.has(result.media_type)) {
    return null;
  }

  const mediaType = result.media_type === 'tv' ? 'tv' : 'movie';
  const rawTitle = mediaType === 'movie' ? result.title : result.name;
  const releaseDate = mediaType === 'movie' ? result.release_date : result.first_air_date;
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : undefined;
  const displayTitle = rawTitle || 'Untitled';
  const overview = result.overview?.trim() || '';
  const voteAverage = typeof result.vote_average === 'number' ? Number(result.vote_average.toFixed(1)) : null;

  return {
    id: `${mediaType}-${result.id}`,
    provider: MOVIE_PROVIDER_ID,
    name: releaseYear ? `${displayTitle} (${releaseYear || ''})` : displayTitle,
    tag: mediaType === 'movie' ? 'Movie' : 'TV Show',
    poster: buildImageUrl(result.poster_path),
    backdrop: buildImageUrl(result.backdrop_path, 'w780'),
    always_live: true,
    hideSchedule: true,
    startsAt: Date.now(),
    channels: [
      {
        channel_id: 'vidking',
        channel_name: 'Play'
      }
    ],
    movieMeta: {
      tmdbId: result.id,
      mediaType,
      title: displayTitle,
      releaseYear,
      overview
    },
    overview,
    rating: voteAverage
  };
};

export const searchMoviesAndShows = async (query) => {
  const trimmed = query?.trim();
  if (!trimmed) {
    return [];
  }

  const data = await fetchFromTmdb('/search/multi', {
    query: trimmed,
    page: '1'
  });

  return (data.results || [])
    .map(formatResultAsStream)
    .filter(Boolean);
};

export const fetchTrendingTitles = async () => {
  const data = await fetchFromTmdb('/trending/all/day', {
    page: '1'
  });

  return (data.results || [])
    .map(formatResultAsStream)
    .filter(Boolean);
};

export const buildVidkingEmbedUrl = (movieMeta = {}, progress = null) => {
  if (!movieMeta.tmdbId) {
    return null;
  }

  const type = movieMeta.mediaType === 'tv' ? 'tv' : 'movie';
  const segments = [VIDKING_EMBED_BASE, type, movieMeta.tmdbId];

  if (type === 'tv' && movieMeta.seasonNumber && movieMeta.episodeNumber) {
    segments.push(movieMeta.seasonNumber, movieMeta.episodeNumber);
  }

  const baseUrl = segments.join('/');
  const featureParams = 'autoPlay=true&nextEpisode=true&episodeSelector=true';
  
  // Add progress parameter if available (for resuming from saved position)
  let progressParam = '';
  if (progress && progress.currentTime > 0) {
    progressParam = `&progress=${Math.round(progress.currentTime)}`;
  }

  return `${baseUrl}?${featureParams}${progressParam}`;
};

export const fetchMovieDetails = async (movieId) => {
  if (!movieId) {
    throw new Error('Movie ID is required');
  }

  const data = await fetchFromTmdb(`/movie/${movieId}`);

  return {
    id: data.id,
    title: data.title || data.original_title,
    tagline: data.tagline,
    overview: data.overview,
    releaseDate: data.release_date,
    runtime: data.runtime,
    poster: buildImageUrl(data.poster_path, 'w500'),
    backdrop: buildImageUrl(data.backdrop_path, 'w780'),
    genres: Array.isArray(data.genres) ? data.genres.map((genre) => genre.name) : [],
    rating: typeof data.vote_average === 'number' ? Number(data.vote_average.toFixed(1)) : null,
    status: data.status,
    budget: data.budget,
    revenue: data.revenue,
    spokenLanguages: Array.isArray(data.spoken_languages)
      ? data.spoken_languages.map((lang) => lang.english_name || lang.name)
      : [],
    homepage: data.homepage
  };
};

export const fetchTvSeriesDetails = async (seriesId) => {
  if (!seriesId) {
    throw new Error('TV series ID is required');
  }

  const data = await fetchFromTmdb(`/tv/${seriesId}`);

  return {
    id: data.id,
    name: data.name || data.original_name,
    tagline: data.tagline,
    poster: buildImageUrl(data.poster_path, 'w500'),
    backdrop: buildImageUrl(data.backdrop_path, 'w780'),
    overview: data.overview,
    firstAirDate: data.first_air_date,
    genres: Array.isArray(data.genres) ? data.genres.map((genre) => genre.name) : [],
    voteAverage: typeof data.vote_average === 'number' ? Number(data.vote_average.toFixed(1)) : null,
    status: data.status,
    spokenLanguages: Array.isArray(data.spoken_languages)
      ? data.spoken_languages.map((lang) => lang.english_name || lang.name)
      : [],
    homepage: data.homepage,
    seasons: Array.isArray(data.seasons)
      ? data.seasons
          .filter((season) => {
            const normalizedName = season.name?.toLowerCase() || '';
            const isSpecialNumber = season.season_number === 0;
            const isSpecialName = normalizedName.includes('special');
            return !(isSpecialNumber || isSpecialName);
          })
          .map((season) => ({
            id: season.id,
            name: season.name,
            seasonNumber: season.season_number,
            episodeCount: season.episode_count,
            airDate: season.air_date,
            overview: season.overview,
            poster: buildImageUrl(season.poster_path, 'w300')
          }))
      : []
  };
};

export const fetchTvSeasonEpisodes = async (seriesId, seasonNumber) => {
  if (!seriesId || seasonNumber == null) {
    throw new Error('Series ID and season number are required');
  }

  const data = await fetchFromTmdb(`/tv/${seriesId}/season/${seasonNumber}`);

  return Array.isArray(data.episodes)
    ? data.episodes.map((episode) => ({
        id: episode.id,
        name: episode.name || `Episode ${episode.episode_number}`,
        episodeNumber: episode.episode_number,
        overview: episode.overview,
        airDate: episode.air_date,
        stillPath: buildImageUrl(episode.still_path, 'w500')
      }))
    : [];
};
