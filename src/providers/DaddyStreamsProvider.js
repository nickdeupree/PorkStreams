import { BaseProvider } from './BaseProvider';
import { CATEGORY_MAPPINGS, APP_CATEGORIES } from '../config/categoryMappings';
import { fetchJsonWithProxy } from '../utils/corsProxy';
import { getTeamLogosForEvent } from '../utils/teamLogos';
import { isTimestampOnCurrentDay } from '../utils/dateUtils';

/**
 * Daddy Streams Provider Implementation
 */
export class DaddyStreamsProvider extends BaseProvider {
  constructor() {
    super('daddystreams');
    // Use proxy in development, direct URL in production
    this.apiUrl = 'https://daddylivestream.com/schedule/schedule-generated.php';
  }

  async fetchSchedule() {
    try {
      // Try Vite proxy first (in dev), then CORS proxies
      const data = await fetchJsonWithProxy(this.apiUrl);
      return data;
    } catch (error) {
      console.error('Error fetching Daddy Streams schedule:', error);
      throw error;
    }
  }

  getEmbedUrl(streamId, channelId) {
    if (!channelId) {
      console.warn('Channel ID is required for Daddy Streams');
      return null;
    }
    return `https://dlhd.dad/embed/stream-${channelId}.php`;
  }

  normalizeCategories(rawData, { showEnded = false } = {}) {
    const normalized = {
      [APP_CATEGORIES.BASKETBALL]: [],
      [APP_CATEGORIES.WOMENS_BASKETBALL]: [],
      [APP_CATEGORIES.SOCCER]: [],
      [APP_CATEGORIES.FOOTBALL]: [],
      [APP_CATEGORIES.BASEBALL]: [],
      [APP_CATEGORIES.HOCKEY]: [],
      [APP_CATEGORIES.TWENTY_FOUR_SEVEN]: [],
      [APP_CATEGORIES.MOVIES]: []
    };

    try {
      // Only process the first object (current day's schedule)
      const scheduleKeys = Object.keys(rawData);
      if (scheduleKeys.length === 0) {
        return normalized;
      }

      const todaySchedule = rawData[scheduleKeys[0]];
      const mappings = CATEGORY_MAPPINGS.daddystreams;

      const CHANNEL_EXCLUDE_KEYWORDS = [
        'uk',
        'ca',
        'deportes',
        'cz',
        'nl',
        'argentina',
        'mexico',
        'brazil',
        'israel',
        'serbia',
        'france',
        'russia',
        'ontario'
      ];

      const parseEventTimeToEpoch = (timeStr, dateStr) => {
        // timeStr is in "HH:MM" format (24-hour, UTC)
        // dateStr is in "YYYY-MM-DD" format (UTC)
        if (!timeStr || !dateStr) return null;

        const dateTimeStr = `${dateStr}T${timeStr}:00Z`; // Construct ISO string in UTC
        const dateObj = new Date(dateTimeStr);
        if (isNaN(dateObj.getTime())) {
          return null;
        }
        return Math.floor(dateObj.getTime() / 1000); // Return epoch seconds
      };


      // Determine schedule date (if top-level key is a date string).
      // If not present, fall back to today's date in UTC.
      const rawDateKey = scheduleKeys[0];
      console.log("Raw date key:", rawDateKey);
      let scheduleDate = null;

      // Daddy Streams provides a raw date key in the form:
      // "Monday 06th Oct 2025 - Schedule Time UK GMT"
      // We'll extract the day, month and year and build a YYYY-MM-DD UTC date.
      if (rawDateKey) {
        // Try to extract using a regex that captures day, month and year.
        const humanDateMatch = rawDateKey.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\s+(\d{4})/);
        if (humanDateMatch) {
          const day = humanDateMatch[1].padStart(2, '0');
          const monthName = humanDateMatch[2];
          const year = humanDateMatch[3];

          const monthMap = {
            jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
            jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
          };
          const mKey = monthName.slice(0,3).toLowerCase();
          const month = monthMap[mKey] || '01';
          scheduleDate = `${year}-${month}-${day}`;
        } else if (!Number.isNaN(Date.parse(rawDateKey))) {
          // If it's already a parseable date, use that.
          scheduleDate = new Date(rawDateKey).toISOString().slice(0, 10);
        }
      }

      // Fallback: use today's date in UTC
      if (!scheduleDate) {
        scheduleDate = new Date().toISOString().slice(0, 10);
      }

      // Iterate through sport categories
      Object.entries(todaySchedule).forEach(([sportCategory, events]) => {
        const appCategory = this.mapToAppCategory(sportCategory, mappings);
        
        if (appCategory && Array.isArray(events)) {
          events.forEach((event) => {
            console.log('Processing event:', event);
            const normalizedChannels = Array.isArray(event.channels)
              ? event.channels
                  .map((channel) => ({
                    ...channel,
                    channel_id: channel.channel_id?.toString() ?? channel.channel_id,
                    channel_name: channel.channel_name || 'Unknown Channel'
                  }))
                  .filter((channel) => {
                    const name = channel.channel_name?.toLowerCase() || '';
                    return !CHANNEL_EXCLUDE_KEYWORDS.some((keyword) => name.includes(keyword));
                  })
              : [];
            if (normalizedChannels.length === 0) {
              return;
            }
            const defaultChannel = normalizedChannels[0];
            // // Remove the colon and word before the colon in event.event, if present
            let eventName = event.event || event.name || 'Unknown Event';
            // if (eventName.includes(':')) {
            //   eventName = eventName.split(':').slice(1).join(':').trim();
            // }

            const stream = {
              id:
              event.id ||
              `${eventName}_${event.time || 'time'}_${scheduleDate}`,
              name: eventName,
              tag: defaultChannel.channel_name,
              poster: event.poster || '',
              // Daddy Streams times are provided in UTC as strings (e.g. "02:00").
              startsAt: parseEventTimeToEpoch(event.time, scheduleDate),
              endsAt: null, // Daddy Streams doesn't provide end time
              category: appCategory,
              provider: 'daddystreams',
              channelId: defaultChannel.channel_id,
              streamId: event.id || eventName,
              channels: normalizedChannels
            };

            if (!showEnded && !isTimestampOnCurrentDay(stream.startsAt)) {
              return;
            }

            const branding = getTeamLogosForEvent(appCategory, eventName);
            stream.teamLogos = branding.logos;
            stream.teamNames = branding.teams;
            stream.leagueLogo = branding.leagueLogo;
            stream.hasMatchupLogos = branding.hasMatchup;
            normalized[appCategory].push(stream);
          });
        }
      });

      return normalized;
    } catch (error) {
      console.error('Error normalizing Daddy Streams data:', error);
      return normalized;
    }
  }
}
