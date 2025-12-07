import { BaseProvider } from './BaseProvider';
import { CATEGORY_MAPPINGS, APP_CATEGORIES } from '../config/categoryMappings';
import { fetchJsonWithProxy } from '../utils/corsProxy';
import { getTeamLogosForEvent, getTeamMatchDetails } from '../utils/teamLogos';
import { isTimestampOnCurrentDay } from '../utils/dateUtils';

const STREAMED_BASE_URL = 'https://streamed.pk';

const filterStreamsByLanguage = (streams, { allowAllStreams } = {}) => {
  if (!Array.isArray(streams)) {
    return [];
  }

  if (allowAllStreams) {
    return streams.filter((stream) => Boolean(stream?.embedUrl));
  }

  return streams.filter((stream) => {
    const language = stream?.language;
    if (typeof language !== 'string') {
      return false;
    }

    return language.trim().toLowerCase() === 'english';
  });
};

const isWomensBasketballEvent = (title = '') => {
  const normalized = title.toLowerCase();
  return (
    normalized.includes('wnba') ||
    normalized.includes("women's") ||
    normalized.includes('women ') ||
    normalized.includes('(w)') ||
    normalized.includes(' ladies') ||
    normalized.includes('woman')
  );
};

const normalizePoster = (poster) => {
  if (!poster) {
    return '';
  }

  if (poster.startsWith('http')) {
    return poster;
  }

  return `${STREAMED_BASE_URL}${poster}`;
};

export class StreamedProvider extends BaseProvider {
  constructor() {
    super('streamed');
    this.apiBase = import.meta.env.DEV ? '/api/streamed' : `${STREAMED_BASE_URL}/api`;
  }

  async fetchSchedule() {
    try {
      const endpoint = `${this.apiBase}/matches/all`;
      return await fetchJsonWithProxy(endpoint);
    } catch (error) {
      console.error('Error fetching Streamed schedule:', error);
      throw error;
    }
  }

  async getStreamDetails(source, streamId, { allowAllStreams = false } = {}) {
    if (!source || !streamId) {
      return null;
    }

    const endpoint = `${this.apiBase}/stream/${source}/${streamId}`;
    try {
      const details = await fetchJsonWithProxy(endpoint);

      if (!Array.isArray(details) || details.length === 0) {
        return [];
      }

      console.log(`Fetched ${details} streams from Streamed for source=${source}, streamId=${streamId}`);

      const filteredStreams = filterStreamsByLanguage(details, { allowAllStreams });

      if (filteredStreams.length === 0) {
        console.warn('No playable streams available for Streamed stream after filtering:', {
          source,
          streamId,
          allowAllStreams
        });
      }

      return filteredStreams;
    } catch (error) {
      console.error('Error fetching Streamed stream details:', error);
      throw error;
    }
  }

  async getStreamLanguage(streamId, source) {
    try {
      const endpoint = `${this.apiBase}/stream/${source}/${streamId}`;
      const data = await fetchJsonWithProxy(endpoint);
      return data[0]?.language || null;
    } catch (error) {
      console.warn(`Failed to fetch language for stream ${streamId}:`, error);
      return null;
    }
  }

  async getEmbedUrl(stream, { sourceOverride, allowAllStreams = false } = {}) {
    const sources = Array.isArray(stream?.sources) ? stream.sources : [];

    const dedupeByKey = (list) => {
      const seen = new Set();
      return list.filter((item) => {
        if (!item?.source || !item?.id) {
          return false;
        }

        const key = `${item.source}:${item.id}`;
        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      });
    };

    const sourceCandidates = dedupeByKey([
      sourceOverride,
      stream?.primarySource,
      ...sources
    ].filter(Boolean));

    if (sourceCandidates.length === 0) {
      console.warn('No source available for Streamed stream:', stream?.id);
      return null;
    }

    try {
      for (const candidate of sourceCandidates) {
        const details = await this.getStreamDetails(candidate.source, candidate.id, {
          allowAllStreams
        });

        if (Array.isArray(details) && details.length > 0) {
          const selectedStream = details[0];

          return {
            embedUrl: selectedStream.embedUrl,
            availableStreams: details,
            source: candidate
          };
        }
      }

      console.warn('Streamed stream returned no playable sources after filtering:', {
        streamId: stream?.id,
        allowAllStreams
      });
      return null;
    } catch (error) {
      console.error('Error fetching Streamed embed:', error);
      throw error;
    }
  }

  async normalizeCategories(rawData, { allowAllStreams = false, showEnded = false } = {}) {
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

    if (!Array.isArray(rawData)) {
      return normalized;
    }

    const mappings = CATEGORY_MAPPINGS.streamed;

    const SUPPORTED_TEAM_CATEGORIES = [
      APP_CATEGORIES.BASKETBALL,
      APP_CATEGORIES.WOMENS_BASKETBALL,
      APP_CATEGORIES.SOCCER,
      APP_CATEGORIES.FOOTBALL,
      APP_CATEGORIES.BASEBALL,
      APP_CATEGORIES.HOCKEY,
      APP_CATEGORIES.MOTORSPORTS,
      APP_CATEGORIES.FIGHTING,
      APP_CATEGORIES.TENNIS
    ];

    for (const match of rawData) {
      if (!match || !Array.isArray(match.sources) || match.sources.length === 0) {
        continue;
      }

      const title = match.title || 'Unknown Event';
      const hasVsKeyword = /\bvs\b/i.test(title);

      // FILTER RULE 1: Skip streams without "vs" in the title
      if (!hasVsKeyword) {
        continue;
      }

      const providerCategory = match.category;
      let appCategory = this.mapToAppCategory(providerCategory, mappings);

      const teamMatchCache = new Map();
      const getMatchDetailsForCategory = (category) => {
        if (!teamMatchCache.has(category)) {
          teamMatchCache.set(category, getTeamMatchDetails(category, title));
        }
        return teamMatchCache.get(category);
      };

      const findFirstMatchingCategory = () =>
        SUPPORTED_TEAM_CATEGORIES.find((category) => {
          const details = getMatchDetailsForCategory(category);
          return details?.matchedTeams?.length > 0;
        }) || null;

      if (!appCategory && hasVsKeyword) {
        appCategory = findFirstMatchingCategory();
      }

      if (!appCategory) {
        continue;
      }

      if (appCategory === APP_CATEGORIES.BASKETBALL && isWomensBasketballEvent(title)) {
        appCategory = APP_CATEGORIES.WOMENS_BASKETBALL;
      }

      // FILTER RULE 2: Skip streams with unrecognized teams
      // Exception: Soccer/Football don't require team matching since international leagues are hard to track
      const isSoccerOrFootball = appCategory === APP_CATEGORIES.SOCCER || appCategory === APP_CATEGORIES.FOOTBALL;
      let matchForCurrentCategory = getMatchDetailsForCategory(appCategory);
      if (!isSoccerOrFootball && (!matchForCurrentCategory || matchForCurrentCategory.matchedTeams.length === 0)) {
        const fallbackCategory = findFirstMatchingCategory();
        if (fallbackCategory) {
          appCategory = fallbackCategory;
          matchForCurrentCategory = getMatchDetailsForCategory(appCategory);
        } else if (!allowAllStreams) {
          // No supported team aliases detected across categories
          continue;
        }
      }

      if (!normalized[appCategory]) {
        normalized[appCategory] = [];
      }

      const startsAt = typeof match.date === 'number' ? Math.floor(match.date / 1000) : null;

      if (!showEnded && !isTimestampOnCurrentDay(startsAt)) {
        continue;
      }

      const teamMatchDetails = matchForCurrentCategory || {
        matchedTeams: []
      };

      // Final validation: Ensure we have recognized teams for this matchup unless overridden
      // Exception: Soccer/Football are allowed even without team matches since international leagues aren't tracked
      const isSoccerOrFootball2 = appCategory === APP_CATEGORIES.SOCCER || appCategory === APP_CATEGORIES.FOOTBALL;
      if (!allowAllStreams && !isSoccerOrFootball2 && teamMatchDetails.matchedTeams.length === 0) {
        continue;
      }

      // FILTER RULE 3: Check language from admin API
      if (!allowAllStreams) {
        const streamLanguage = await this.getStreamLanguage(match.sources[0].id, match.sources[0].source);
        if (streamLanguage && streamLanguage.trim().toLowerCase() !== 'english') {
          continue;
        }
      }

      const stream = {
        id: `streamed_${match.id}`,
        name: title,
        tag: 'Streamed',
        poster: normalizePoster(match.poster),
        startsAt,
        endsAt: null,
        category: appCategory,
        provider: 'streamed',
        sources: match.sources,
        primarySource: match.sources[0],
        rawMatch: match,
        teamLogos: [],
        teamNames: [],
        leagueLogo: null,
        hasMatchupLogos: false,
        hideSchedule: false
      };

      const branding = getTeamLogosForEvent(appCategory, title);
      stream.teamLogos = branding.logos;
      stream.teamNames = branding.teams;
      stream.leagueLogo = branding.leagueLogo;
      stream.hasMatchupLogos = branding.hasMatchup;

      normalized[appCategory].push(stream);
    }

    return normalized;
  }
}

export default StreamedProvider;
