/**
 * Cache Service for storing and retrieving stream data
 * Uses localStorage with TTL (Time To Live) support
 */

const CACHE_PREFIX = 'porkstreams_';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Get cache key with prefix
 */
const getCacheKey = (key) => `${CACHE_PREFIX}${key}`;

/**
 * Store data in cache with timestamp
 */
export const setCache = (key, data) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(getCacheKey(key), JSON.stringify(cacheData));
    return true;
  } catch (error) {
    console.error('Error setting cache:', error);
    return false;
  }
};

/**
 * Retrieve data from cache if not expired
 */
export const getCache = (key) => {
  try {
    const cachedItem = localStorage.getItem(getCacheKey(key));
    if (!cachedItem) {
      return null;
    }

    const { data, timestamp } = JSON.parse(cachedItem);
    const age = Date.now() - timestamp;

    // Check if cache is expired
    if (age > CACHE_TTL) {
      localStorage.removeItem(getCacheKey(key));
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting cache:', error);
    return null;
  }
};

/**
 * Clear specific cache item
 */
export const clearCache = (key) => {
  try {
    localStorage.removeItem(getCacheKey(key));
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
};

/**
 * Clear all cache items with the app prefix
 */
export const clearAllCache = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    return true;
  } catch (error) {
    console.error('Error clearing all cache:', error);
    return false;
  }
};

/**
 * Get cache age in milliseconds
 */
export const getCacheAge = (key) => {
  try {
    const cachedItem = localStorage.getItem(getCacheKey(key));
    if (!cachedItem) {
      return null;
    }

    const { timestamp } = JSON.parse(cachedItem);
    return Date.now() - timestamp;
  } catch (error) {
    console.error('Error getting cache age:', error);
    return null;
  }
};

/**
 * Check if cache is valid (not expired)
 */
export const isCacheValid = (key) => {
  const age = getCacheAge(key);
  return age !== null && age < CACHE_TTL;
};
