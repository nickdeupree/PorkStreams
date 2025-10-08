import { BaseProvider } from './BaseProvider';
import { CATEGORY_MAPPINGS, APP_CATEGORIES } from '../config/categoryMappings';
import { fetchWithProxy } from '../utils/corsProxy';
import { getTeamLogosForEvent } from '../utils/teamLogos';
import { isTimestampOnCurrentDay } from '../utils/dateUtils';

/**
 * SharkStreams Provider Implementation
 */
export class SharkStreamsProvider extends BaseProvider {
  constructor() {
    super('sharkstreams');
    // Use Vite proxy in development, direct URL in production
    this.apiUrl = import.meta.env.DEV 
      ? '/api/shark/' 
      : 'https://sharkstreams.net/';
  }

  async fetchSchedule() {
    try {
      // Fetch the HTML page
      const response = await fetchWithProxy(this.apiUrl, {}, import.meta.env.DEV);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const html = await response.text();
      return this.parseHTML(html);
    } catch (error) {
      console.error('Error fetching SharkStreams schedule:', error);
      throw error;
    }
  }

  parseHTML(html) {
    // Create a temporary DOM to parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const rows = doc.querySelectorAll('.row');
    const streams = [];

    rows.forEach((row) => {
      try {
        const dateElement = row.querySelector('.ch-date');
        const categoryElement = row.querySelector('.ch-category');
        const nameElement = row.querySelector('.ch-name');
        const embedButton = row.querySelector('.hd-link.secondary');

        if (!dateElement || !categoryElement || !nameElement || !embedButton) {
          return;
        }

        const dateTime = dateElement.textContent.trim();
        const category = categoryElement.textContent.trim();
        const name = nameElement.textContent.trim();

        // Extract embed URL from onclick attribute
        const onclickAttr = embedButton.getAttribute('onclick');
        const embedUrlMatch = onclickAttr.match(/openEmbed\('([^']+)'\)/);
        const embedUrl = embedUrlMatch ? embedUrlMatch[1] : null;

        // Extract channel ID from embed URL
        const channelIdMatch = embedUrl ? embedUrl.match(/channel=(\d+)/) : null;
        const channelId = channelIdMatch ? channelIdMatch[1] : null;

        if (!embedUrl || !channelId) {
          return;
        }

        streams.push({
          dateTime,
          category,
          name,
          embedUrl,
          channelId
        });
      } catch (error) {
        console.error('Error parsing row:', error);
      }
    });

    return streams;
  }

  getEmbedUrl(streamId, channelId) {
    if (!channelId) {
      console.warn('Channel ID is required for SharkStreams');
      return null;
    }
    return `https://sharkstreams.net/player.php?channel=${channelId}`;
  }

  /**
   * Parse date/time string and convert to epoch timestamp
   * @param {string} dateTimeStr - Format: "2025-10-06 20:00:00"
   * @returns {number|null} - Epoch timestamp in seconds
   */
  parseDateTime(dateTimeStr) {
    if (!dateTimeStr) return null;

    try {
      // The time is already in local timezone (not UTC)
      // Parse as local time
      const [datePart, timePart] = dateTimeStr.split(' ');
      const [year, month, day] = datePart.split('-');
      const [hours, minutes, seconds] = timePart.split(':');

      // Create date object in local timezone
      const dateObj = new Date(
        parseInt(year),
        parseInt(month) - 1, // Month is 0-indexed
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
      );

      if (isNaN(dateObj.getTime())) {
        return null;
      }

      return Math.floor(dateObj.getTime() / 1000); // Return epoch seconds
    } catch (error) {
      console.error('Error parsing datetime:', dateTimeStr, error);
      return null;
    }
  }

  normalizeCategories(rawData) {
    const normalized = {
      [APP_CATEGORIES.BASKETBALL]: [],
      [APP_CATEGORIES.WOMENS_BASKETBALL]: [],
      [APP_CATEGORIES.FOOTBALL]: [],
      [APP_CATEGORIES.BASEBALL]: [],
      [APP_CATEGORIES.HOCKEY]: [],
      [APP_CATEGORIES.TWENTY_FOUR_SEVEN]: []
    };

    try {
      const mappings = CATEGORY_MAPPINGS.sharkstreams;

      rawData.forEach((event) => {
        const appCategory = this.mapToAppCategory(event.category, mappings);
        
        if (!appCategory) {
          // Skip categories we don't support
          return;
        }

        const startsAt = this.parseDateTime(event.dateTime);
        
        const stream = {
          id: `shark_${event.channelId}_${event.dateTime}`,
          name: event.name,
          tag: event.category,
          poster: '', // SharkStreams doesn't provide poster images
          startsAt: startsAt,
          endsAt: null, // SharkStreams doesn't provide end time
          category: appCategory,
          provider: 'sharkstreams',
          channelId: event.channelId,
          streamId: event.channelId,
          embedUrl: event.embedUrl
        };

        if (!isTimestampOnCurrentDay(stream.startsAt)) {
          return;
        }

        const branding = getTeamLogosForEvent(appCategory, event.name);
        stream.teamLogos = branding.logos;
        stream.teamNames = branding.teams;
        stream.leagueLogo = branding.leagueLogo;
        stream.hasMatchupLogos = branding.hasMatchup;

        normalized[appCategory].push(stream);
      });

      return normalized;
    } catch (error) {
      console.error('Error normalizing SharkStreams data:', error);
      return normalized;
    }
  }
}
