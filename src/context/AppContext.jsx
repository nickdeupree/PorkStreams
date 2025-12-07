import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { DaddyStreamsProvider } from '../providers/DaddyStreamsProvider';
import { PPTVProvider } from '../providers/PPTVProvider';
import { PPTVLegacyProvider } from '../providers/PPTVLegacyProvider';
import { SharkStreamsProvider } from '../providers/SharkStreamsProvider';
import { StreamedProvider } from '../providers/StreamedProvider';
import { getCache, setCache } from '../services/cacheService';
import { PROVIDER_IDS, APP_CATEGORIES } from '../config/categoryMappings';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const UI_SELECTION_CACHE_KEY = 'ui_selection';
  const UI_SETTINGS_CACHE_KEY = 'ui_settings';

  const cachedSelection = useMemo(() => {
    const stored = getCache(UI_SELECTION_CACHE_KEY);
    if (!stored) {
      return {};
    }

    const providerValues = Object.values(PROVIDER_IDS);
    const categoryValues = Object.values(APP_CATEGORIES);

    const validProvider = providerValues.includes(stored.provider) ? stored.provider : undefined;
    const validCategory = categoryValues.includes(stored.category) ? stored.category : undefined;

    return {
      provider: validProvider,
      category: validCategory
    };
  }, []);

  const cachedSettings = useMemo(() => {
    const stored = getCache(UI_SETTINGS_CACHE_KEY);

    if (!stored || typeof stored !== 'object') {
      return {};
    }

    const legacyShowTodayOnly =
      typeof stored.showTodayOnly === 'boolean' ? stored.showTodayOnly : undefined;

    return {
      allowAllStreams: Boolean(stored.allowAllStreams),
      showEnded:
        typeof stored.showEnded === 'boolean'
          ? stored.showEnded
          : legacyShowTodayOnly === undefined
            ? undefined
            : !legacyShowTodayOnly
    };
  }, []);

  const [provider, setProviderState] = useState(
    cachedSelection.provider || PROVIDER_IDS.PPTV
  );
  const [selectedCategory, setSelectedCategoryState] = useState(
    cachedSelection.category || APP_CATEGORIES.BASKETBALL
  );
  const [streamData, setStreamData] = useState({
    [APP_CATEGORIES.BASKETBALL]: [],
    [APP_CATEGORIES.WOMENS_BASKETBALL]: [],
    [APP_CATEGORIES.SOCCER]: [],
    [APP_CATEGORIES.FOOTBALL]: [],
    [APP_CATEGORIES.BASEBALL]: [],
    [APP_CATEGORIES.HOCKEY]: [],
    [APP_CATEGORIES.MOTORSPORTS]: [],
    [APP_CATEGORIES.FIGHTING]: [],
    [APP_CATEGORIES.TENNIS]: [],
    [APP_CATEGORIES.TWENTY_FOUR_SEVEN]: [],
    [APP_CATEGORIES.MOVIES]: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStream, setCurrentStream] = useState(null);
  const [allowAllStreams, setAllowAllStreams] = useState(
    Boolean(cachedSettings.allowAllStreams)
  );
  const [showEnded, setShowEnded] = useState(
    cachedSettings.showEnded === undefined ? false : cachedSettings.showEnded
  );
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('porkstreams_theme_mode');
    return saved || 'dark';
  });

  const userCategorySelectedRef = useRef(Boolean(cachedSelection.category));
  const initialCategorySetRef = useRef(Boolean(cachedSelection.category));
  const previousProviderRef = useRef(provider);
  const settingsInitializedRef = useRef(false);
  const settingsProviderRef = useRef(provider);

  const updateSelectionCache = (nextProvider = provider, nextCategory = selectedCategory) => {
    setCache(UI_SELECTION_CACHE_KEY, {
      provider: nextProvider,
      category: nextCategory
    });
  };

  const updateSettingsCache = (settings) => {
    setCache(UI_SETTINGS_CACHE_KEY, {
      allowAllStreams,
      showEnded,
      ...settings
    });
  };

  const toggleAllowAllStreams = () => {
    setAllowAllStreams((prev) => {
      const nextValue = !prev;
      updateSettingsCache({ allowAllStreams: nextValue });
      return nextValue;
    });
  };

  const toggleShowEnded = () => {
    setShowEnded((prev) => {
      const nextValue = !prev;
      updateSettingsCache({ showEnded: nextValue });
      return nextValue;
    });
  };

  const setSelectedCategory = (category) => {
    userCategorySelectedRef.current = true;
    setSelectedCategoryState(category);
    initialCategorySetRef.current = true;
    updateSelectionCache(provider, category);
  };

  const setProvider = (nextProvider) => {
    setProviderState((prevProvider) => {
      const resolvedProvider =
        typeof nextProvider === 'function' ? nextProvider(prevProvider) : nextProvider;

      const providerToPersist = resolvedProvider ?? prevProvider;
      updateSelectionCache(providerToPersist, selectedCategory);

      return providerToPersist;
    });
  };

  const ensureInitialCategory = (data) => {
    if (userCategorySelectedRef.current || initialCategorySetRef.current) {
      return;
    }

    const firstPopulatedCategory = Object.keys(data || {}).find((categoryKey) => {
      const streams = data[categoryKey];
      return Array.isArray(streams) && streams.length > 0;
    });

    if (firstPopulatedCategory) {
      setSelectedCategoryState(firstPopulatedCategory);
      userCategorySelectedRef.current = true;
      initialCategorySetRef.current = true;
      updateSelectionCache(provider, firstPopulatedCategory);
    }
  };

  // Initialize providers
  const providers = {
    [PROVIDER_IDS.DADDY_STREAMS]: new DaddyStreamsProvider(),
    [PROVIDER_IDS.PPTV]: new PPTVProvider(),
    [PROVIDER_IDS.PPTV_LEGACY]: new PPTVLegacyProvider(),
    [PROVIDER_IDS.SHARK_STREAMS]: new SharkStreamsProvider(),
    [PROVIDER_IDS.STREAMED]: new StreamedProvider()
  };

  // Save theme mode to localStorage
  useEffect(() => {
    localStorage.setItem('porkstreams_theme_mode', themeMode);
  }, [themeMode]);

  // Fetch stream data
  const fetchStreamData = async (providerId, { forceRefresh = false } = {}) => {
    setLoading(true);
    setError(null);
    const isStreamedProvider = providerId === PROVIDER_IDS.STREAMED;
    const sanitizeStreamedCache = (data) => {
      if (!data || typeof data !== 'object') {
        return data;
      }

      const sanitized = { ...data };
      delete sanitized.__allowAllStreams;
      delete sanitized.__showEnded;
      delete sanitized.__showTodayOnly;
      return sanitized;
    };

    try {
      const providerInstance = providers[providerId];
      const cacheKey = providerInstance.getCacheKey();

      // Try to get from cache first
      let cachedData = null;
      if (!forceRefresh) {
        cachedData = getCache(cacheKey);

        if (isStreamedProvider) {
          const cachedShowEnded =
            typeof cachedData?.__showEnded === 'boolean'
              ? cachedData.__showEnded
              : typeof cachedData?.__showTodayOnly === 'boolean'
                ? !cachedData.__showTodayOnly
                : undefined;
          const matchesFilter =
            cachedData?.__allowAllStreams === allowAllStreams &&
            (typeof cachedShowEnded === 'boolean'
              ? cachedShowEnded === showEnded
              : !showEnded);

          if (!matchesFilter) {
            cachedData = null;
          }
        }

        if (cachedData) {
          const normalizedCachedData = isStreamedProvider
            ? sanitizeStreamedCache(cachedData)
            : cachedData;
          // Print cached data to console for debugging
          setStreamData(normalizedCachedData);
          ensureInitialCategory(normalizedCachedData);
          setLoading(false);
          return;
        }
      }

      // Fetch fresh data
      const rawData = await providerInstance.fetchSchedule();
      // Log raw provider response for debugging
      console.log(`Raw data fetched from provider (${providerId}) for key=${cacheKey}:`, rawData);

      const normalizedData = await providerInstance.normalizeCategories(rawData, {
        allowAllStreams,
        showEnded
      });

      console.log('Fetched and normalized data:', normalizedData);

      // Cache the normalized data
      const cachePayload = isStreamedProvider
        ? {
            ...normalizedData,
            __allowAllStreams: allowAllStreams,
            __showEnded: showEnded
          }
        : normalizedData;

      setCache(cacheKey, cachePayload);
      setStreamData(normalizedData);
      ensureInitialCategory(normalizedData);
    } catch (err) {
      console.error('Error fetching stream data:', err);
      setError(err.message || 'Failed to load streams');

      // Try to use cached data even if expired in case of network error
      const providerInstance = providers[providerId];
      const cacheKey = providerInstance.getCacheKey();
      const cachedData = getCache(cacheKey);
      const isStreamedProvider = providerId === PROVIDER_IDS.STREAMED;
      const cachedShowEnded =
        typeof cachedData?.__showEnded === 'boolean'
          ? cachedData.__showEnded
          : typeof cachedData?.__showTodayOnly === 'boolean'
            ? !cachedData.__showTodayOnly
            : undefined;
      const matchesFilter =
        !isStreamedProvider ||
        (cachedData?.__allowAllStreams === allowAllStreams &&
          (typeof cachedShowEnded === 'boolean'
            ? cachedShowEnded === showEnded
            : !showEnded));

      if (cachedData && matchesFilter) {
        const normalizedCachedData = isStreamedProvider
          ? sanitizeStreamedCache(cachedData)
          : cachedData;
        // Log fallback cache usage
        console.log(
          `Using cached data as fallback for key=${cacheKey} after fetch error:`,
          cachedData
        );
        setStreamData(normalizedCachedData);
        ensureInitialCategory(normalizedCachedData);
        setError('Using cached data (network error)');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    const forceRefresh = previousProviderRef.current !== provider;
    fetchStreamData(provider, { forceRefresh });
    previousProviderRef.current = provider;
  }, [provider]);

  // Refresh data every 60 seconds when app is active
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStreamData(provider);
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [provider]);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    const providerChanged = settingsProviderRef.current !== provider;
    settingsProviderRef.current = provider;

    if (providerChanged) {
      return;
    }

    if (!settingsInitializedRef.current) {
      settingsInitializedRef.current = true;
      return;
    }

    fetchStreamData(provider, { forceRefresh: true });
  }, [allowAllStreams, showEnded, provider]);

  const value = {
    provider,
    setProvider,
    selectedCategory,
    setSelectedCategory,
    streamData,
    loading,
    error,
    currentStream,
    setCurrentStream,
    themeMode,
    toggleTheme,
    allowAllStreams,
    toggleAllowAllStreams,
    showEnded,
    toggleShowEnded,
    // refreshData forces a network fetch and bypasses cache — useful after clearing cache
    refreshData: () => fetchStreamData(provider, { forceRefresh: true }),
    providers: Object.keys(providers)
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
