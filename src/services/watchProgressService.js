/**
 * Watch Progress Tracking Service
 * Manages localStorage for movie and TV show watch progress
 */

const STORAGE_PREFIX = 'porkstreams_watch_progress_';

/**
 * Generate a storage key for a movie
 * @param {number} tmdbId - TMDB movie ID
 * @returns {string}
 */
const getMovieKey = (tmdbId) => `${STORAGE_PREFIX}movie_${tmdbId}`;

/**
 * Generate a storage key for a TV episode
 * @param {number} tmdbId - TMDB series ID
 * @param {number} season - Season number
 * @param {number} episode - Episode number
 * @returns {string}
 */
const getTvKey = (tmdbId, season, episode) => 
  `${STORAGE_PREFIX}tv_${tmdbId}_s${season}_e${episode}`;

/**
 * Save movie watch progress
 * @param {number} tmdbId - TMDB movie ID
 * @param {number} currentTime - Current playback position in seconds
 * @param {number} duration - Total duration in seconds
 */
export const saveMovieProgress = (tmdbId, currentTime, duration) => {
  if (!tmdbId || currentTime === undefined || duration === undefined) {
    return;
  }

  const progress = {
    tmdbId,
    type: 'movie',
    currentTime: Math.round(currentTime),
    duration: Math.round(duration),
    progress: duration > 0 ? (currentTime / duration) * 100 : 0,
    timestamp: Date.now()
  };

  try {
    localStorage.setItem(getMovieKey(tmdbId), JSON.stringify(progress));
  } catch (e) {
    console.warn('Failed to save movie progress:', e);
  }
};

/**
 * Save TV episode watch progress
 * @param {number} tmdbId - TMDB series ID
 * @param {number} season - Season number
 * @param {number} episode - Episode number
 * @param {number} currentTime - Current playback position in seconds
 * @param {number} duration - Total duration in seconds
 */
export const saveTvProgress = (tmdbId, season, episode, currentTime, duration) => {
  if (!tmdbId || season === undefined || episode === undefined || 
      currentTime === undefined || duration === undefined) {
    return;
  }

  // Clear progress for all other episodes of this series
  try {
    const prefix = `${STORAGE_PREFIX}tv_${tmdbId}_`;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix) && key !== getTvKey(tmdbId, season, episode)) {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.warn('Failed to clear old TV progress:', e);
  }

  const progress = {
    tmdbId,
    type: 'tv',
    season: Number(season),
    episode: Number(episode),
    currentTime: Math.round(currentTime),
    duration: Math.round(duration),
    progress: duration > 0 ? (currentTime / duration) * 100 : 0,
    timestamp: Date.now()
  };

  try {
    localStorage.setItem(getTvKey(tmdbId, season, episode), JSON.stringify(progress));
  } catch (e) {
    console.warn('Failed to save TV progress:', e);
  }
};

/**
 * Get saved movie progress
 * @param {number} tmdbId - TMDB movie ID
 * @returns {Object|null} Progress object or null if not found
 */
export const getMovieProgress = (tmdbId) => {
  if (!tmdbId) {
    return null;
  }

  try {
    const stored = localStorage.getItem(getMovieKey(tmdbId));
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.warn('Failed to retrieve movie progress:', e);
    return null;
  }
};

/**
 * Get saved TV episode progress
 * @param {number} tmdbId - TMDB series ID
 * @param {number} season - Season number
 * @param {number} episode - Episode number
 * @returns {Object|null} Progress object or null if not found
 */
export const getTvProgress = (tmdbId, season, episode) => {
  if (!tmdbId || season === undefined || episode === undefined) {
    return null;
  }

  try {
    const stored = localStorage.getItem(getTvKey(tmdbId, season, episode));
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.warn('Failed to retrieve TV progress:', e);
    return null;
  }
};

/**
 * Clear movie watch progress
 * @param {number} tmdbId - TMDB movie ID
 */
export const clearMovieProgress = (tmdbId) => {
  if (!tmdbId) {
    return;
  }

  try {
    localStorage.removeItem(getMovieKey(tmdbId));
  } catch (e) {
    console.warn('Failed to clear movie progress:', e);
  }
};

/**
 * Clear TV episode watch progress
 * @param {number} tmdbId - TMDB series ID
 * @param {number} season - Season number (optional, clears all if not provided)
 * @param {number} episode - Episode number (optional, clears all if not provided)
 */
export const clearTvProgress = (tmdbId, season, episode) => {
  if (!tmdbId) {
    return;
  }

  try {
    if (season !== undefined && episode !== undefined) {
      localStorage.removeItem(getTvKey(tmdbId, season, episode));
    } else {
      // Clear all episodes for this series
      const prefix = `${STORAGE_PREFIX}tv_${tmdbId}_`;
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key.startsWith(prefix)) {
          localStorage.removeItem(key);
        }
      }
    }
  } catch (e) {
    console.warn('Failed to clear TV progress:', e);
  }
};

/**
 * Get the last watched episode for a TV series
 * @param {number} tmdbId - TMDB series ID
 * @returns {Object|null} Last watched episode or null
 */
export const getLastWatchedEpisode = (tmdbId) => {
  if (!tmdbId) {
    return null;
  }

  try {
    const prefix = `${STORAGE_PREFIX}tv_${tmdbId}_`;
    let lastEpisode = null;
    let lastTimestamp = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(prefix)) {
        const progress = JSON.parse(localStorage.getItem(key));
        if (progress && progress.timestamp > lastTimestamp) {
          lastTimestamp = progress.timestamp;
          lastEpisode = progress;
        }
      }
    }
    return lastEpisode;
  } catch (e) {
    console.warn('Failed to get last watched episode:', e);
    return null;
  }
};

/**
 * Get all continue watching items (movies and TV episodes with progress < 100%)
 * @returns {Array} Array of progress objects for items not fully watched
 */
export const getContinueWatchingItems = () => {
  const items = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(STORAGE_PREFIX)) {
        const progress = JSON.parse(localStorage.getItem(key));
        if (progress && progress.progress < 100) {
          items.push(progress);
        }
      }
    }

    // Sort by timestamp (most recent first)
    items.sort((a, b) => b.timestamp - a.timestamp);

    return items;
  } catch (e) {
    console.warn('Failed to get continue watching items:', e);
    return [];
  }
};
