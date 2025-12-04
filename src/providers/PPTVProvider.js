import { BaseProvider } from './BaseProvider';
import { CATEGORY_MAPPINGS, APP_CATEGORIES } from '../config/categoryMappings';
import { fetchJsonWithProxy } from '../utils/corsProxy';
import { isTimestampOnCurrentDay } from '../utils/dateUtils';

const EXCLUDED_24_7_STREAM_NAMES = new Set([
  '24/7 cows',
  'master stream test'
]);

/**
 * PPTV Provider Implementation
 */
export class PPTVProvider extends BaseProvider {
  constructor() {
    super('pptv');
    // Use proxy in development, direct URL in production
    this.apiUrl = import.meta.env.DEV
      ? '/api/pptv/streams'
      : 'https://old.ppv.to/api/streams';
  }

  async fetchSchedule() {
    try {
      // Try Vite proxy first (in dev), then CORS proxies
      const data = await fetchJsonWithProxy(this.apiUrl);
      return data;
    } catch (error) {
      console.error('Error fetching PPTV schedule:', error);
      throw error;
    }
  }

  getEmbedUrl(stream) {
    // Use iframe field if present, otherwise construct from uri_name
    if (stream.iframe) {
      return stream.iframe;
    }
    
    if (stream.uri_name) {
      // Construct URL from uri_name if needed
      return `https://old.ppv.to/stream/${stream.uri_name}`;
    }

    console.warn('No embed URL available for stream:', stream);
    return null;
  }

  normalizeCategories(rawData, { showEnded = false } = {}) {
    const normalized = {
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
    };

    try {
      if (!rawData.success || !Array.isArray(rawData.streams)) {
        return normalized;
      }

      const mappings = CATEGORY_MAPPINGS.pptv;

      const parseTimestamp = (value) => {
        if (!value) {
          return null;
        }

        if (typeof value === 'number') {
          return value > 1e12 ? Math.floor(value / 1000) : value;
        }

        const numeric = Number(value);
        if (!Number.isNaN(numeric)) {
          return numeric > 1e12 ? Math.floor(numeric / 1000) : Math.floor(numeric);
        }

        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
          return Math.floor(date.getTime() / 1000);
        }

        return null;
      };

      rawData.streams.forEach((categoryObj) => {
        const providerCategory = categoryObj.category || categoryObj.category_name;
        const appCategory = this.mapToAppCategory(providerCategory, mappings);

        if (appCategory && Array.isArray(categoryObj.streams)) {
          categoryObj.streams.forEach((stream) => {
            const normalizedStream = {
              id: stream.id,
              name: stream.name || 'Unknown Event',
              tag: stream.tag || 'PPTV',
              poster: stream.poster || '',
              startsAt: parseTimestamp(stream.starts_at),
              endsAt: parseTimestamp(stream.ends_at),
              category: appCategory,
              provider: 'pptv',
              iframe: stream.iframe,
              uri_name: stream.uri_name,
              always_live: stream.always_live === 1,
              allowpaststreams: stream.allowpaststreams === 1,
              rawStream: stream // Keep raw data for embed URL construction
            };

            const isExcluded24SevenStream =
              normalizedStream.category === APP_CATEGORIES.TWENTY_FOUR_SEVEN &&
              EXCLUDED_24_7_STREAM_NAMES.has((normalizedStream.name || '').trim().toLowerCase());

            if (isExcluded24SevenStream) {
              return;
            }

            // Allow always-live / 24/7 streams even if startsAt is falsy or not on current day
            if (
              !showEnded &&
              !normalizedStream.always_live &&
              !isTimestampOnCurrentDay(normalizedStream.startsAt)
            ) {
              return;
            }
            normalized[appCategory].push(normalizedStream);
          });
        }
      });

      return normalized;
    } catch (error) {
      console.error('Error normalizing PPTV data:', error);
      return normalized;
    }
  }
}
