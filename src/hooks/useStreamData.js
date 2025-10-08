import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

/**
 * Custom hook to manage stream data loading and caching
 */
export const useStreamData = () => {
  const {
    streamData,
    loading,
    error,
    selectedCategory,
    provider,
    refreshData
  } = useAppContext();

  const [categoryStreams, setCategoryStreams] = useState([]);

  useEffect(() => {
    if (streamData && selectedCategory) {
      setCategoryStreams(streamData[selectedCategory] || []);
    }
  }, [streamData, selectedCategory]);

  return {
    streams: categoryStreams,
    loading,
    error,
    refreshData,
    provider
  };
};
