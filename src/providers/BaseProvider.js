/**
 * Base Provider Interface
 * All stream providers must implement these methods
 */

export class BaseProvider {
  constructor(providerId) {
    this.providerId = providerId;
  }

  /**
   * Fetch schedule data from provider API
   * @returns {Promise<Array>} Raw schedule data
   */
  async fetchSchedule() {
    throw new Error('fetchSchedule() must be implemented by provider');
  }

  /**
   * Get embed URL for a stream
   * @param {string} streamId - Stream identifier
   * @param {string} channelId - Optional channel identifier
   * @returns {string} Embed URL
   */
  getEmbedUrl() {
    throw new Error('getEmbedUrl() must be implemented by provider');
  }

  /**
   * Get cache key for this provider
   * @returns {string} Cache key
   */
  getCacheKey() {
    return `schedule_${this.providerId}`;
  }

  /**
   * Normalize raw data into common format
   * @param {any} rawData - Raw API response
   * @returns {Object} Normalized data with categories
   */
  normalizeCategories() {
    throw new Error('normalizeCategories() must be implemented by provider');
  }

  /**
   * Map provider category to app category
   * @param {string} providerCategory - Provider's category name
   * @param {Object} mappings - Category mappings
   * @returns {string|null} App category or null if not mapped
   */
  mapToAppCategory(providerCategory, mappings) {
    for (const [appCategory, providerCategories] of Object.entries(mappings)) {
      if (providerCategories.includes(providerCategory)) {
        return appCategory;
      }
    }
    return null;
  }
}
